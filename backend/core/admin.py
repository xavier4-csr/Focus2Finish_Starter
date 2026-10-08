from django.contrib import admin
from .models import Goal, Task, LearningResource, FocusSession

admin.site.register(Goal)
admin.site.register(Task)
admin.site.register(LearningResource)
admin.site.register(FocusSession)
