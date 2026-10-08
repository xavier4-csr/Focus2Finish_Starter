from rest_framework import serializers
from .models import Goal, Task, LearningResource, FocusSession

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = "__all__"
        read_only_fields = ("created_at",)

class TaskSerializer(serializers.ModelSerializer):
    goal_title = serializers.CharField(source="goal.title", read_only=True)

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_at",)

class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = "__all__"
        read_only_fields = ("created_at",)

class FocusSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = FocusSession
        fields = "__all__"
        read_only_fields = ("started_at",)
