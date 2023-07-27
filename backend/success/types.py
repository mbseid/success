# types.py
import strawberry
from strawberry import auto
from typing import List, Optional

from . import models

@strawberry.django.filters.filter(models.Link, lookups=True)
class LinkFilter:
    id: auto
    url: auto

@strawberry.django.type(models.Link, filters=LinkFilter)
class Link:
    id: auto
    title: auto
    url: auto
    tags: List[str]

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

@strawberry.django.input(models.Project)
class ProjectInput:
    name: auto
    description: auto
    due: auto

@strawberry.django.order(models.Person)
class ProjectOrder:
    order: auto
    date: auto

@strawberry.django.type(models.Project, order=ProjectOrder)
class Project:
    id: auto
    name: auto
    description: auto
    due: auto
    complete: auto
    notes: auto
    order: auto