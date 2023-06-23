import strawberry
import strawberry_django

from strawberry_django import mutations

from typing import List
from .types import Link, LinkInput, Person, PersonInput
from . import models

@strawberry.type
class Query:
    link: Link = strawberry_django.field()
    links: List[Link] = strawberry.django.field()
    
    person: Person = strawberry_django.field()
    people: List[Person] = strawberry.django.field()
    
    @strawberry_django.field
    def tags(self) -> List[str]:
        return models.Link.objects.unique_tags()

@strawberry.type
class Mutation:
    createLink: Link = mutations.create(LinkInput)
    updateLinks: List[Link] = mutations.update(LinkInput)
    deleteLinks: List[Link] = mutations.delete()

    createPerson: Person = mutations.create(PersonInput)
    updatePeople: List[Person] = mutations.update(PersonInput)

schema = strawberry.Schema(query=Query, mutation=Mutation)