from typing import List
import uuid
import math

from django.utils.translation import gettext_lazy as _
from django.db import models, connection, transaction
from django.db.models import Count, F, Func, Q, Case, When, Value, IntegerField
from django.db.models.functions import Ln, Coalesce
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField, SearchVector, SearchQuery, SearchRank
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
        search_query = SearchQuery(query, search_type='websearch')
        objects = SearchIndex.objects.filter(Q(body_vector=search_query) | Q(body__icontains=query))
        
        if item_type:
            objects = objects.filter(item_type=item_type)

        # Default ranking with click count boost
        objects = objects.annotate(
            search_rank=SearchRank(F('body_vector'), search_query),
            # Logarithmic click count boost for links only (NULL for others becomes 0)
            click_boost=Case(
                When(item_type='link', then=Ln(F('click_count') + Value(1)) * Value(0.1)),
                default=Value(0),
                output_field=models.FloatField()
            )
        )

        # Create balanced ordering
        if order:
            # Primary: explicit order, Secondary: search quality as tie-breakers  
            order_direction = '-' if order.sort_order() else ''
            objects = objects.order_by(f'{order_direction}{order.field}', '-search_rank', '-click_boost')
        else:
            # Default: search quality first
            objects = objects.order_by('-search_rank', '-click_boost')
            
        # Database query happens here, raising the lazy search query.
        search_results = list(objects) 


        # Sort objects into type to query
        grouped_objects = defaultdict(list)
        for obj in search_results:
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
        
        enriched_objects = list(map(find_by_id, search_results))

        return enriched_objects

class SearchIndex(models.Model):
    item_type = models.CharField(max_length=200)
    item_id = models.UUIDField(primary_key=True) 
    body = models.TextField()
    body_vector = SearchVectorField()
    click_count = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField()

    objects = SearchIndexManager()
    
    class Meta:
        managed = False
        db_table = 'success_search_index'

class PromptTemplate(SuccessModel):
    name = models.CharField()
    system_message = models.TextField()
    request_template = models.TextField()

class AssistantConversation(SuccessModel):
    system_message = models.TextField(blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    @property
    def messages(self):
        return self.assistant_messages.all().order_by('created_at')
    
    @property
    def latest_message(self):
        return self.assistant_messages.order_by('-created_at').first()
    
    @property
    def preview_text(self):
        first_user_message = self.assistant_messages.filter(role='user').first()
        return first_user_message.content[:50] + '...' if first_user_message and len(first_user_message.content) > 50 else first_user_message.content if first_user_message else 'Empty conversation'

class AssistantMessage(SuccessModel):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('streaming', 'Streaming'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]
    
    conversation = models.ForeignKey(
        AssistantConversation,
        related_name='assistant_messages',
        on_delete=models.CASCADE
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    class Meta:
        ordering = ['created_at']
    
    @property
    def is_streaming(self):
        return self.status == 'streaming'
    
    @property
    def is_completed(self):
        return self.status == 'completed'


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
