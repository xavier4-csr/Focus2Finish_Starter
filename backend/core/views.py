from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Goal, Task, LearningResource, FocusSession
from .serializers import GoalSerializer, TaskSerializer, LearningResourceSerializer, FocusSessionSerializer

class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("goal").all()
    serializer_class = TaskSerializer

class LearningResourceViewSet(viewsets.ModelViewSet):
    queryset = LearningResource.objects.select_related("goal").all()
    serializer_class = LearningResourceSerializer

class FocusSessionViewSet(viewsets.ModelViewSet):
    queryset = FocusSession.objects.select_related("task").all()
    serializer_class = FocusSessionSerializer

@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "app": "Focus2Finish"})


@api_view(["GET"])
def next_activity(request):
    # Check whether a redirect has been requested.
    # For now, this is a test parameter; Android will supply
    # real usage information later.
    threshold_reached = (
        request.query_params.get("threshold_reached", "false").lower()
        == "true"
    )

    # If the threshold has not been reached, do not prompt the user.
    if not threshold_reached:
        return Response({
            "should_redirect": False,
            "reason": "threshold_not_reached",
            "message": "You're all good. No redirect is needed right now."
        })

    # Prefer an unfinished task.
    task = (
        Task.objects
        .filter(status__in=["todo", "in_progress"])
        .order_by("scheduled_date", "created_at")
        .first()
    )

    if task:
        return Response({
            "should_redirect": True,
            "reason": "recreational_limit_reached",
            "type": "task",
            "title": task.title,
            "description": task.description,
            "expected_output": task.expected_output,
            "estimated_minutes": task.estimated_minutes,
            "task_id": task.id,
            "url": None,
            "message": (
                "You've reached your recreational-use limit. "
                "Ready to make progress on your planned task?"
            )
        })

    # If there are no unfinished tasks, look for a learning resource.
    resource = LearningResource.objects.filter(
        completed=False
    ).order_by("id").first()

    if resource:
        return Response({
            "should_redirect": True,
            "reason": "recreational_limit_reached",
            "type": "resource",
            "title": resource.title,
            "estimated_minutes": resource.estimated_minutes,
            "url": resource.url,
            "resource_id": resource.id,
            "message": (
                "You've reached your recreational-use limit. "
                "Would you like to continue learning?"
            )
        })

    # Nothing is planned, so do not force a redirect.
    return Response({
        "should_redirect": False,
        "reason": "no_planned_activity",
        "type": "empty",
        "title": "Nothing planned right now",
        "message": (
            "You have no queued activities. You can relax or "
            "add a task for your next focus session."
        )
    })

@api_view(["POST"])
def finish_session(request, pk):
    try:
        session = FocusSession.objects.get(pk=pk)
    except FocusSession.DoesNotExist:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    if session.ended_at is not None:
        return Response({"detail": "This session has already been finished."}, status=status.HTTP_400_BAD_REQUEST)

    outcome = request.data.get("outcome", "completed")
    allowed = {"completed", "partial", "abandoned"}
    if outcome not in allowed:
        return Response({"detail": "Outcome must be completed, partial, or abandoned."}, status=status.HTTP_400_BAD_REQUEST)

    session.ended_at = timezone.now()
    session.outcome = outcome
    session.reflection = str(request.data.get("reflection", ""))[:2000]
    session.save(update_fields=["ended_at", "outcome", "reflection"])

    if outcome == "completed" and session.task:
        session.task.status = "done"
        session.task.save(update_fields=["status"])

    return Response(FocusSessionSerializer(session).data)
