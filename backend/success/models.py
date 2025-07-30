from typing import List
import uuid
import math

from django.utils.translation import gettext_lazy as _
from django.db import models, connection, transaction
from django.db.models import Count, F, Func, Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField, SearchVector, SearchQuery
from ordered_model.models import OrderedModel
from solo.models import SingletonModel
import logging

from collections import defaultdict

import itertools

class SuccessModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hidden = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class LinkManager(models.Manager):
    def unique_tags(self):
        return self.annotate(elems=Func(F('tags'), function='unnest')).values_list('elems', flat=True).distinct()

class Link(SuccessModel):
    url = models.CharField()
    title = models.CharField()
    description = models.CharField(blank=True)
    tags = ArrayField(models.CharField(), blank=True)
    click_count = models.PositiveIntegerField(default=0)

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

class Project(SuccessModel, OrderedModel):
    name = models.CharField()
    description = models.CharField(blank=True)
    due = models.DateField()
    complete = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['order']

class SearchIndexManager(models.Manager):
    def search(self, query, item_type = None, order = None):
        objects = SearchIndex.objects.filter(Q(body_vector=SearchQuery(query, search_type='websearch')) | Q(body__icontains=query))
        if item_type:
            objects = objects.filter(item_type=item_type)
        # Sort objects into type to query
        
        grouped_objects = defaultdict(list)
        for obj in objects:
            grouped_objects[obj.item_type].append(obj)
        
        # get the full objects
        def find_objects(items: List[SearchIndex], model_class):
            item_ids = map(lambda x: x.item_id, items)

            return model_class.objects.filter(pk__in=list(item_ids))
        
        # Join the 3 search types together
        retrieved_objects = itertools.chain(find_objects(grouped_objects['link'], Link), find_objects(grouped_objects['person'], Person), find_objects(grouped_objects['project'], Project))
        
        retrieved_objects = list(retrieved_objects)
        
        
        # return in the order of the search results
        def find_by_id(object):
            return next(x for x in retrieved_objects if x.id == object.item_id)
        
        enriched_objects = list(map(find_by_id, objects))

        if order:
            enriched_objects = sorted(enriched_objects, key=lambda x: getattr(x, order.field), reverse=order.sort_order())
        
        return enriched_objects

class SearchIndex(models.Model):
    item_type = models.CharField(max_length=200)
    item_id = models.UUIDField(primary_key=True) 
    body = models.TextField()
    body_vector = SearchVectorField()

    objects = SearchIndexManager()
    
    class Meta:
        managed = False
        db_table = 'success_search_index'

class PromptTemplate(SuccessModel):
    name = models.CharField()
    system_message = models.TextField()
    request_template = models.TextField()

class AssistantAnswer(SuccessModel):
    system = models.TextField()
    request = models.TextField()
    response = models.TextField()
    datetime = models.DateTimeField(auto_now_add=True)

class ScratchPad(SingletonModel):
    body = models.TextField()

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Link)
@receiver(post_save, sender=Person)
@receiver(post_save, sender=Project)
def update_view(sender, **kwargs):
    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY success_search_index;")
    logger.info("Reindexed the database.")

# System Stuff ----

LOG_LEVELS = (
    (logging.NOTSET, _('NotSet')),
    (logging.INFO, _('Info')),
    (logging.WARNING, _('Warning')),
    (logging.DEBUG, _('Debug')),
    (logging.ERROR, _('Error')),
    (logging.FATAL, _('Fatal')),
)

class SystemLog(models.Model):
    logger_name = models.CharField(max_length=100)
    level = models.PositiveSmallIntegerField(choices=LOG_LEVELS, default=logging.ERROR, db_index=True)
    msg = models.TextField()
    trace = models.TextField(blank=True, null=True)
    create_datetime = models.DateTimeField(auto_now_add=True, verbose_name='Created at')

    def __str__(self):
        return self.msg
