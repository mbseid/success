import strawberry
import strawberry_django

from strawberry_django import mutations

from typing import List, Union, Optional
from .types import Link, LinkInput, Person, PersonInput, PersonLog, PersonLogInput
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
    
    @strawberry_django.field
    def search(self, query: str, type: Optional[str] = None) -> List[Union[Link,Person]]:
        return models.SearchIndex.objects.search(query, type)
    
    @strawberry.type
    class Count:

        @strawberry_django.field
        def link(self) -> int:
            return models.Link.objects.count()
        
        @strawberry_django.field
        def people(self) -> int:
            return models.Person.objects.count()
    
    @strawberry.field
    def count(self) -> Count:
        return Query.Count()

@strawberry.type
class Mutation:
    createLink: Link = mutations.create(LinkInput)
    updateLinks: List[Link] = mutations.update(LinkInput)
    deleteLinks: List[Link] = mutations.delete()

    createPerson: Person = mutations.create(PersonInput)
    updatePeople: List[Person] = mutations.update(PersonInput)

    createPersonLog: PersonLog = mutations.create(PersonLogInput)
    updatePersonLog: List[PersonLog] = mutations.update(PersonLogInput)


schema = strawberry.Schema(query=Query, mutation=Mutation)