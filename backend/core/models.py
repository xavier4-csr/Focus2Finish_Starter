from django.db import models

class Goal(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Task(models.Model):
    STATUS_CHOICES = [
        ("todo", "To do"),
        ("in_progress", "In progress"),
        ("done", "Done"),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    expected_output = models.CharField(max_length=240, blank=True)
    estimated_minutes = models.PositiveIntegerField(default=25)
    scheduled_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["status", "scheduled_date", "-created_at"]

    def __str__(self):
        return self.title

class LearningResource(models.Model):
    CONTENT_CHOICES = [
        ("article", "Article"),
        ("video", "Video"),
        ("course", "Course"),
        ("notes", "Notes"),
        ("exercise", "Exercise"),
        ("other", "Other"),
    ]
    title = models.CharField(max_length=200)
    url = models.URLField(blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_CHOICES, default="article")
    estimated_minutes = models.PositiveIntegerField(default=20)
    goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, related_name="resources")
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["completed", "-created_at"]

    def __str__(self):
        return self.title

class FocusSession(models.Model):
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    intended_minutes = models.PositiveIntegerField(default=25)
    outcome = models.CharField(max_length=20, choices=[
        ("started", "Started"),
        ("completed", "Completed"),
        ("partial", "Partially completed"),
        ("abandoned", "Abandoned"),
    ], default="started")
    reflection = models.TextField(blank=True)

    @property
    def is_active(self):
        return self.ended_at is None
