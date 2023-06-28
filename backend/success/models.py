import uuid

from django.db import models, connection, transaction
from django.db.models import Count, F, Func
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField

class SuccessModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hidden = models.BooleanField(default=False)

    class Meta:
        abstract = True


class LinkManager(models.Manager):
    def unique_tags(self):
        return self.annotate(elems=Func(F('tags'), function='unnest')).values_list('elems', flat=True).distinct()

class Link(SuccessModel):
    url = models.CharField()
    title = models.CharField()
    description = models.CharField(blank=True)
    tags = ArrayField(models.CharField())

    objects = LinkManager()

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
    person = models.ForeignKey(
        Person,
        related_name='logs',
        on_delete=models.CASCADE
    )

class Project(SuccessModel):
    name = models.CharField()
    description = models.CharField()
    due = models.DateField()
    complete = models.BooleanField(default=False)
    notes = models.TextField()

class SearchIndex(models.Model):
    item_type = models.CharField(max_length=200)
    item_id = models.DateField(null=True, default=None) 
    body = SearchVectorField()
    
    class Meta:
        managed = False
        db_table = 'success_search_index'


@receiver(post_save, sender=Link)
@receiver(post_save, sender=Person)
@receiver(post_save, sender=Project)
def update_view(sender, **kwargs):
    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY success_search_index;")
