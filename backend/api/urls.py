from django.urls import path
# pyrefly: ignore [missing-import]
from .views import ComparisonUploadView, ComparisonDetailView, ComparisonExportView, ComparisonListView

urlpatterns = [
    path('upload/', ComparisonUploadView.as_view(), name='comparison-upload'),
    path('comparisons/', ComparisonListView.as_view(), name='comparison-list'),
    path('comparisons/<uuid:pk>/', ComparisonDetailView.as_view(), name='comparison-detail'),
    path('comparisons/<uuid:pk>/export/', ComparisonExportView.as_view(), name='comparison-export'),
]