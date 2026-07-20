from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

import io
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import PIL.Image

# Disable PIL limit for huge industrial blueprints
PIL.Image.MAX_IMAGE_PIXELS = None

from .models import Comparison
from .serializers import ComparisonSerializer
from .tasks import process_comparison_task

class ComparisonUploadView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ComparisonSerializer(data=request.data)
        
        if serializer.is_valid():
            comparison = serializer.save()
            process_comparison_task.delay(comparison.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- LA CLASSE QUI MANQUAIT ---
class ComparisonListView(APIView):
    def get(self, request, *args, **kwargs):
        # Fetch all comparisons, newest first
        comparisons = Comparison.objects.all().order_by('-created_at')
        serializer = ComparisonSerializer(comparisons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def delete(self, request, *args, **kwargs):
        Comparison.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ComparisonDetailView(APIView):
    def get(self, request, pk, *args, **kwargs):
        # On cherche la comparaison par son ID (UUID)
        comparison = get_object_or_404(Comparison, id=pk)
        # On la traduit en JSON
        serializer = ComparisonSerializer(comparison)
        # On renvoie le résultat
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        comparison = get_object_or_404(Comparison, id=pk)
        comparison.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ComparisonExportView(APIView):
    def get(self, request, pk, *args, **kwargs):
        comparison = get_object_or_404(Comparison, id=pk)
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_analyse_{comparison.id}.pdf"'
        
        if comparison.output_image and comparison.output_image.path:
            img_path = comparison.output_image.path
            try:
                # Open the image to get its original size
                with PIL.Image.open(img_path) as im:
                    w, h = im.size
                
                # PDF maximum dimension limit is 14400 points (Adobe Acrobat limit)
                # We use a safe maximum of 14000
                MAX_PDF_DIM = 14000
                if max(w, h) > MAX_PDF_DIM:
                    scale = MAX_PDF_DIM / float(max(w, h))
                    w = int(w * scale)
                    h = int(h * scale)
                
                # Create a PDF page with the exact dimensions of the image (or scaled down)
                c = canvas.Canvas(response, pagesize=(w, h))
                c.drawImage(img_path, 0, 0, width=w, height=h)
                c.showPage()
                c.save()
            except Exception as e:
                c = canvas.Canvas(response, pagesize=A4)
                c.drawString(100, 800, f"Erreur de chargement de l'image: {e}")
                c.showPage()
                c.save()
        else:
            c = canvas.Canvas(response, pagesize=A4)
            c.drawString(100, 800, "Aucune image de résultat disponible.")
            c.showPage()
            c.save()
            
        return response