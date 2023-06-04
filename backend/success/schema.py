import strawberry
from strawberry_django import mutations

from typing import List
from .types import Link, LinkInput

@strawberry.type
class Query:
    links: List[Link] = strawberry.django.field()

@strawberry.type
class Mutation:
    createLink: Link = mutations.create(LinkInput)
    # createFruits: List[Fruit] = mutations.create(FruitInput)
    # updateFruits: List[Fruit] = mutations.update(FruitPartialInput)
    # deleteFruits: List[Fruit] = mutations.delete()

schema = strawberry.Schema(query=Query, mutation=Mutation)