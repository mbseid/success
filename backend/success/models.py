import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField

class SuccessModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hidden = models.BinaryField(default=False)

    class Meta:
        abstract = True


class Link(SuccessModel):
    url = models.CharField()
    title = models.CharField()
    description = models.CharField()
    tags = ArrayField(models.CharField())

class Person(SuccessModel):
    name = models.CharField()
    email = models.CharField()
    team = models.CharField()
    role = models.CharField()

    class Meta:
        verbose_name_plural = "people"

class PersonLog(SuccessModel):
    date = models.DateField()
    note = models.TextField()
    person = models.ForeignKey(Person, on_delete=models.CASCADE)

class Project(SuccessModel):
    name = models.CharField()
    description = models.CharField()
    due = models.DateField()
    complete = models.BooleanField(default=False)
    notes = models.TextField()