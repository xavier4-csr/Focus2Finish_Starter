from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, TaskViewSet, LearningResourceViewSet, FocusSessionViewSet, health, next_activity, finish_session

router = DefaultRouter()
router.register("goals", GoalViewSet)
router.register("tasks", TaskViewSet)
router.register("resources", LearningResourceViewSet)
router.register("sessions", FocusSessionViewSet)

urlpatterns = [
    path("health/", health),
    path("next-activity/", next_activity),
    path("sessions/<int:pk>/finish/", finish_session),
    path("", include(router.urls)),
]
