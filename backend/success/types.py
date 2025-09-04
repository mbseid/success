# types.py
import strawberry
from strawberry import auto
from typing import List, Optional

from . import models

@strawberry.django.order(models.Link)
class LinkOrder:
    created_at: auto

@strawberry.django.filters.filter(models.Link, lookups=True)
class LinkFilter:
    id: auto
    url: auto

@strawberry.django.type(models.Link, filters=LinkFilter, order=LinkOrder)
class Link:
    id: auto
    title: auto
    url: auto
    tags: List[str]
    click_count: auto
    created_at: auto

@strawberry.django.input(models.Link)
class LinkInput:
    title: auto
    url: auto
    tags: List[str]

@strawberry.django.filters.filter(models.Person, lookups=True)
class PersonFilter:
    id: auto
    name: auto

@strawberry.django.type(models.Person, filters=PersonFilter)
class Person:
    id: auto
    name: auto
    email: auto
    team: auto
    role: auto
    logs: List['PersonLog']

@strawberry.django.order(models.PersonLog)
class PersonLogOrder:
    date: auto

@strawberry.django.filters.filter(models.PersonLog, lookups=True)
class PersonLogFilter:
    id: auto

@strawberry.django.type(models.PersonLog, filters=PersonLogFilter, order=PersonLogOrder, pagination=True)
class PersonLog:
    id: auto
    date: auto
    note: auto
    person: Person

@strawberry.django.input(models.Person)
class PersonInput:
    name: auto
    email: auto
    team: auto
    role: auto

@strawberry.django.input(models.PersonLog)
class PersonLogInput:
    date: auto
    note: auto
    person: auto

@strawberry.django.filters.filter(models.Project, lookups=True)
class ProjectFilter:
    id: auto
    name: auto
    complete: auto

@strawberry.django.input(models.Project)
class ProjectInput:
    name: auto
    description: auto
    due: auto

@strawberry.django.input(models.Project, partial=True)
class ProjectPartialInput:
    name: auto
    description: auto
    notes: auto
    due: auto
    complete: auto

@strawberry.django.order(models.Person)
class ProjectOrder:
    order: auto
    date: auto

@strawberry.django.type(models.Project, order=ProjectOrder, filters=ProjectFilter)
class Project:
    id: auto
    name: auto
    description: auto
    due: auto
    complete: auto
    notes: auto
    order: auto

@strawberry.django.input(models.PromptTemplate)
class PromptTemplateInput:
    name: auto
    system_message: auto
    request_template: auto

@strawberry.input
class SearchOrder:
    field: str
    direction: Optional[str] = "asc"

    def sort_order(self):
        return self.direction == "desc"

@strawberry.django.type(models.PromptTemplate)
class PromptTemplate:
    id: auto
    name: auto
    system_message: auto
    request_template: auto

@strawberry.django.type(models.AssistantConversation)
class AssistantConversation:
    id: auto
    system_message: auto
    description: auto
    created_at: auto
    updated_at: auto
    messages: List['AssistantMessage']
    latest_message: Optional['AssistantMessage']
    preview_text: str

@strawberry.django.type(models.AssistantMessage)
class AssistantMessage:
    id: auto
    role: auto
    content: auto
    created_at: auto
    conversation: AssistantConversation


@strawberry.django.type(models.ScratchPad)
class ScratchPad:
    id: auto
    body: auto


### Calendar and Notification Types

@strawberry.django.type(models.GoogleCredentials)
class GoogleCredentials:
    id: auto
    account_id: auto
    account_name: auto
    is_active: auto
    last_used: auto
    created_at: auto

@strawberry.django.type(models.CalendarSettings)
class CalendarSettings:
    id: auto
    calendar_id: auto
    calendar_name: auto
    is_enabled: auto
    google_credentials: GoogleCredentials

@strawberry.django.type(models.NotificationSettings)
class NotificationSettings:
    id: auto
    daily_email_enabled: auto
    email_address: auto
    email_time: auto
    timezone: auto

@strawberry.django.type(models.CalendarEmailLog)
class CalendarEmailLog:
    id: auto
    email_date: auto
    sent_at: auto
    email_address: auto
    subject: auto
    success: auto
    error_message: auto

@strawberry.django.input(models.NotificationSettings, partial=True)
class NotificationSettingsInput:
    daily_email_enabled: auto
    email_address: auto
    email_time: auto
    timezone: auto

@strawberry.django.input(models.CalendarSettings, partial=True)
class CalendarSettingsInput:
    is_enabled: auto

@strawberry.input
class GoogleOAuthInput:
    account_id: str
    account_name: str
    credentials_json: str
    auth_code: Optional[str] = None

### System Stuff

@strawberry.django.order(models.SystemLog)
class SystemLogOrder:
    create_datetime: auto

@strawberry.django.type(models.SystemLog, order=SystemLogOrder, pagination=True)
class SystemLog:
    id: auto
    level: auto
    msg: auto
    trace: auto
    create_datetime: auto