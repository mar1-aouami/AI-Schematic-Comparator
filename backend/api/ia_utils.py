import math
from ultralytics import YOLO

def extraire_objets_yolo(image, model_path='yolov8n.pt'):
    """
    Charge le modèle YOLO, scanne l'image et retourne une liste standardisée d'objets.
    """
    # 1. Chargement du modèle (le cerveau)
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Erreur de chargement du modèle YOLO : {e}")
        return []

    # 2. Inférence (L'IA regarde l'image)
    try:
        results = model(image)
    except Exception as e:
        print(f"Erreur lors de l'inférence YOLO : {e}")
        return []
    
    objets_detectes = []
    
    # 3. Extraction et formatage des résultats
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            # Coordonnées du rectangle (x_min, y_min, x_max, y_max)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            # Niveau de confiance
            confiance = float(box.conf[0])
            
            # Nom de la classe
            class_id = int(box.cls[0])
            nom_classe = model.names[class_id]
            
            # On ne garde que les détections avec une bonne certitude (> 50%)
            if confiance > 0.5:
                objets_detectes.append({
                    "classe": nom_classe,
                    "x": int(x1),
                    "y": int(y1),
                    "w": int(x2 - x1),
                    "h": int(y2 - y1),
                    "confiance": round(confiance * 100, 2)
                })
                
    return objets_detectes

def calculer_centre(obj):
    return (obj['x'] + obj['w'] / 2, obj['y'] + obj['h'] / 2)

def distance(c1, c2):
    return math.hypot(c1[0] - c2[0], c1[1] - c2[1])

def comparer_objets_yolo(objets_A, objets_B, distance_tolerance=100):
    """
    Compare deux listes d'objets pour trouver les ajouts et les suppressions.
    Retourne une liste d'anomalies sémantiques.
    """
    anomalies = []
    
    # Copie de B pour pouvoir retirer les objets associés (match)
    b_restants = list(objets_B)
    
    # Étape 1 : Vérifier chaque objet de A pour trouver s'il a été supprimé
    for obj_a in objets_A:
        centre_a = calculer_centre(obj_a)
        meilleur_match = None
        min_dist = float('inf')
        
        for obj_b in b_restants:
            if obj_a['classe'] == obj_b['classe']:
                centre_b = calculer_centre(obj_b)
                dist = distance(centre_a, centre_b)
                if dist < distance_tolerance and dist < min_dist:
                    min_dist = dist
                    meilleur_match = obj_b
                    
        if meilleur_match is not None:
            # L'objet existe dans B, ce n'est pas une anomalie. On le retire des restants
            b_restants.remove(meilleur_match)
        else:
            # Aucun match trouvé dans B : L'objet a été supprimé !
            anomalies.append({
                "type": "suppression",
                "classe": obj_a['classe'],
                "desc": f"Suppression ({obj_a['classe']})",
                "x": obj_a['x'],
                "y": obj_a['y'],
                "w": obj_a['w'],
                "h": obj_a['h']
            })
            
    # Étape 2 : Les objets restants dans B n'ont pas d'équivalent dans A -> Ajouts
    for obj_b in b_restants:
        anomalies.append({
            "type": "ajout",
            "classe": obj_b['classe'],
            "desc": f"Ajout ({obj_b['classe']})",
            "x": obj_b['x'],
            "y": obj_b['y'],
            "w": obj_b['w'],
            "h": obj_b['h']
        })
        
    return anomalies
