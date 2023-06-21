import strawberry
import strawberry_django

from strawberry_django import mutations

from typing import List
from .types import Link, LinkInput
from . import models

@strawberry.type
class Query:
    link: Link = strawberry_django.field()
    links: List[Link] = strawberry.django.field()
    
    @strawberry_django.field
    def tags(self) -> List[str]:
        return models.Link.objects.unique_tags()

@strawberry.type
class Mutation:
    createLink: Link = mutations.create(LinkInput)
    updateLinks: List[Link] = mutations.update(LinkInput)
    deleteLinks: List[Link] = mutations.delete()
    # createFruits: List[Fruit] = mutations.create(FruitInput)
    # updateFruits: List[Fruit] = mutations.update(FruitPartialInput)

schema = strawberry.Schema(query=Query, mutation=Mutation)