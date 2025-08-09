from django.contrib import admin
from django.urls import path
from core.views import HealthView, EventDetail, SKUDetail
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from ledger.views import EventListCreate, SKUListCreate, SaleListCreate, AnalyticsTopBottom, AnalyticsSummary, AnalyticsHypo

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthView.as_view()),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/events/", EventListCreate.as_view()),
    path("api/events/<str:pk>/", EventDetail.as_view()),
    path("api/skus/", SKUListCreate.as_view()),
    path("api/skus/<str:pk>/", SKUDetail.as_view()),
    path("api/sales/", SaleListCreate.as_view()),

    path("api/analytics/top-bottom", AnalyticsTopBottom.as_view()),
    path("api/analytics/summary", AnalyticsSummary.as_view()),
    
    path("api/analytics/hypo", AnalyticsHypo.as_view()),
]
