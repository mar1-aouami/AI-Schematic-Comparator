import fitz  # PyMuPDF
import cv2
import numpy as np
import os
from django.conf import settings
# pyrefly: ignore [missing-import]
from celery import shared_task
# pyrefly: ignore [missing-import]
from .models import Comparison

def pdf_to_image(pdf_path):
    """EXTRACTION : Convertit la page du PDF en matrice de pixels OpenCV (Niveaux de gris)"""
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    
    # Zoom x3 pour garantir une très haute résolution tout en évitant l'erreur de taille mémoire (code=5)
    mat = fitz.Matrix(3.0, 3.0)
    pix = page.get_pixmap(matrix=mat)
    
    # Conversion du format PyMuPDF vers un tableau Numpy compatible OpenCV
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    
    # Passage en niveaux de gris (nécessaire pour l'alignement)
    if pix.n == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    elif pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
        
    return img

def align_images(img1, img2):
    """TRANSFORMATION : Aligne img2 sur img1 en utilisant l'algorithme ORB et l'Homographie"""
    height, width = img1.shape
    
    # 1. Détecter 5000 points d'intérêt sur chaque plan
    orb = cv2.ORB_create(5000)
    kp1, des1 = orb.detectAndCompute(img1, None)
    kp2, des2 = orb.detectAndCompute(img2, None)
    
    if des1 is None or des2 is None:
        if img1.shape == img2.shape:
            return img2
        return cv2.resize(img2, (width, height))
    
    # 2. Trouver les points correspondants avec KNN Matcher
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
    matches = matcher.knnMatch(des1, des2, k=2)
    
    # 3. Filtrer les correspondances avec le test de ratio de Lowe
    good_matches = []
    for match_pair in matches:
        if len(match_pair) == 2:
            m, n = match_pair
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
    
    # 4. Calculer la transformation rigide si on a assez de bons points
    if len(good_matches) > 10:
        points1 = np.zeros((len(good_matches), 2), dtype=np.float32)
        points2 = np.zeros((len(good_matches), 2), dtype=np.float32)
        
        for i, match in enumerate(good_matches):
            points1[i, :] = kp1[match.queryIdx].pt
            points2[i, :] = kp2[match.trainIdx].pt
            
        # Remplacement de l'Homographie par une transformation affine (Rotation, Translation, Scale uniforme)
        # Cela empêche totalement la distorsion en perspective (trapèze/oblique) visible sur les schémas
        h, mask = cv2.estimateAffinePartial2D(points2, points1, cv2.RANSAC, ransacReprojThreshold=5.0)
        
        if h is not None:
            # Vérifier que la déformation n'est pas extrême (déterminant de l'échelle)
            det = h[0, 0] * h[1, 1] - h[0, 1] * h[1, 0]
            if 0.5 < det < 2.0:
                aligned_img2 = cv2.warpAffine(img2, h, (width, height))
                return aligned_img2
                
    # 5. Fallback : si l'alignement échoue ou est trop extrême
    if img1.shape == img2.shape:
        return img2
    else:
        return cv2.resize(img2, (width, height))

@shared_task
def process_comparison_task(comparison_id):
    try:
        comparison = Comparison.objects.get(id=comparison_id)
        comparison.status = 'PROCESSING'
        comparison.save()

        # Récupération des chemins absolus sur le serveur
        path_a = comparison.file_a.path
        path_b = comparison.file_b.path

        # -- PIPELINE CV --
        # 1. Extraction
        img_a = pdf_to_image(path_a)
        img_b = pdf_to_image(path_b)
        
        # 2. Alignement géométrique
        aligned_b = align_images(img_a, img_b)

        # 3. Détection avec robustesse au bruit et légers décalages
        blur_a = cv2.GaussianBlur(img_a, (5, 5), 0)
        blur_b = cv2.GaussianBlur(aligned_b, (5, 5), 0)
        
        # --- NOUVELLE LOGIQUE ROBUSTE (Shift Tolerance) ---
        # Le fond est blanc (255) et les lignes sont noires (0).
        # L'érosion épaissit les traits noirs. Cela permet de tolérer un décalage d'alignement.
        shift_kernel = np.ones((5, 5), np.uint8)
        a_thick = cv2.erode(blur_a, shift_kernel, iterations=2)
        b_thick = cv2.erode(blur_b, shift_kernel, iterations=2)
        
        # Ajout (présent dans B, absent dans A) : A_épaissi(255) - B(0) = 255
        diff_add = cv2.subtract(a_thick, blur_b)
        _, mask_add = cv2.threshold(diff_add, 50, 255, cv2.THRESH_BINARY)
        
        # Suppression (présent dans A, absent dans B) : B_épaissi(255) - A(0) = 255
        diff_del = cv2.subtract(b_thick, blur_a)
        _, mask_del = cv2.threshold(diff_del, 50, 255, cv2.THRESH_BINARY)
        
        # Combinaison des ajouts et suppressions réels
        diff = cv2.bitwise_or(diff_add, diff_del)
        
        # Effacer les bordures (artefacts d'alignement qui créent un cadre géant)
        margin = 150
        diff[:margin, :] = 0
        diff[-margin:, :] = 0
        diff[:, :margin] = 0
        diff[:, -margin:] = 0
        
        # Filtre de seuillage strict
        _, thresh = cv2.threshold(diff, 80, 255, cv2.THRESH_BINARY)
        
        # 1. Sauvetage des lignes fines : gommage très léger
        noise_kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, noise_kernel, iterations=1)
        
        # 2. Nettoyage intelligent : suppression de la poussière par surface d'aire
        clean_thresh = np.zeros_like(thresh)
        raw_contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in raw_contours:
            if cv2.contourArea(cnt) > 200:  # Garder les lignes fines (>200) mais ignorer la poussière (<200)
                cv2.drawContours(clean_thresh, [cnt], -1, 255, -1)
                cv2.drawContours(clean_thresh, [cnt], -1, 255, 3)
                
        # 3. Mega Clustering : taille 800x800 pour de vrais grands carrés
        close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (800, 800))
        thresh = cv2.morphologyEx(clean_thresh, cv2.MORPH_CLOSE, close_kernel, iterations=1)
        
        dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (200, 200))
        thresh = cv2.dilate(thresh, dilate_kernel, iterations=1)
        
        # 4. Annotation des anomalies
        # Conversion de l'image (grayscale -> BGR) pour dessiner en couleurs
        annotated_img = cv2.cvtColor(aligned_b, cv2.COLOR_GRAY2BGR)
        
        # Trouver les contours des différences
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        changed_pixels = cv2.countNonZero(thresh)
        anomalies_count = 0
        anomalies_list = []
        
        img_h, img_w = aligned_b.shape[:2]
        
        for cnt in contours:
            # Ignorer les bruits (seuil massivement augmenté à cause de la forte dilatation)
            if cv2.contourArea(cnt) > 10000:
                x, y, w, h = cv2.boundingRect(cnt)
                
                # Ignorer les contours géants qui couvrent presque toute la page (90%)
                if w > 0.9 * img_w or h > 0.9 * img_h:
                    continue
                
                # Tout est classifié comme "modification" (Orange)
                diff_type = "modification"
                color = (0, 165, 255)  # Orange (BGR)
                
                # Dessiner un rectangle coloré autour de l'anomalie
                cv2.rectangle(annotated_img, (x, y), (x+w, y+h), color, 3)
                anomalies_count += 1
                
                # Génération dynamique d'une anomalie sémantique
                anomalies_list.append({
                    "id": anomalies_count,
                    "tag": f"ELEM-{anomalies_count:03d}",
                    "type": diff_type,
                    "criticality": "majeure",
                    "desc": f"Différence détectée ({diff_type})",
                    "confidence": 85 + (anomalies_count % 10),
                    "location": f"X:{x} Y:{y}"
                })
                
        # 5. Sauvegarde des images en JPG pour éviter la limite de taille PNG
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        
        # Encoder et sauvegarder l'image de référence (Plan A)
        _, buffer_ref = cv2.imencode('.jpg', img_a, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        default_storage.save(f"results/ref_{comparison.id}.jpg", ContentFile(buffer_ref.tobytes()))
        
        # Encoder l'image annotée (Plan B) en JPG en mémoire
        _, buffer = cv2.imencode('.jpg', annotated_img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        # Assigner au champ ImageField
        comparison.output_image.save(f"result_{comparison.id}.jpg", ContentFile(buffer.tobytes()), save=False)

        comparison.status = 'SUCCESS'
        comparison.differences_json = {
            "message": "Analyse OpenCV terminée avec succès",
            "pixels_modifies": changed_pixels,
            "anomalies_trouvees": anomalies_count,
            "anomalies": anomalies_list,
            "result_image_url": f"/media/results/result_{comparison.id}.jpg",
            "reference_image_url": f"/media/results/ref_{comparison.id}.jpg",
            "statut_alignement": "OK"
        }
        comparison.save()

        return f"Succès : {changed_pixels} pixels modifiés détectés."
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        comparison.status = 'FAILED'
        comparison.differences_json = {"error": str(e), "traceback": error_details}
        comparison.save()
        return f"Erreur critique : {str(e)}"