import strawberry
import strawberry_django

from strawberry_django import mutations

from typing import List, Union, Optional, Dict
from .types import Link, LinkInput, Person, PersonInput, PersonLog, PersonLogInput, Project, ProjectInput, AssistantAnswer, ScratchPad, ProjectPartialInput, PromptTemplate, PromptTemplateInput, SystemLog, SearchOrder
from . import models
from . import assistant
import uuid

@strawberry.type
class Query:
    link: Link = strawberry_django.field()
    links: List[Link] = strawberry.django.field()
    
    person: Person = strawberry_django.field()
    people: List[Person] = strawberry.django.field()

    project: Project = strawberry_django.field()
    projects: List[Project] = strawberry_django.field()

    promptTemplate: PromptTemplate = strawberry_django.field()
    promptTemplates: List[PromptTemplate] = strawberry_django.field()

    assistantAnswer: AssistantAnswer = strawberry_django.field()
    assistantAnswers: List[AssistantAnswer] = strawberry_django.field()
    
    system_logs: List[SystemLog] = strawberry_django.field()

    @strawberry_django.field
    def tags(self) -> List[str]:
        return models.Link.objects.unique_tags()
    
    @strawberry_django.field
    def search(self, query: str, order: Optional[SearchOrder] = None, type: Optional[str] = None) -> List[Union[Link,Person]]:
        return models.SearchIndex.objects.search(query, type, order)
    
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
    
    @strawberry_django.field
    def scratchpad(self) -> ScratchPad:
        return models.ScratchPad.get_solo()

@strawberry.type
class Mutation:
    createLink: Link = mutations.create(LinkInput)
    updateLinks: List[Link] = mutations.update(LinkInput)
    deleteLinks: List[Link] = mutations.delete()

    createPerson: Person = mutations.create(PersonInput)
    updatePeople: List[Person] = mutations.update(PersonInput)
    deletePeople: List[Person] = mutations.delete()

    createPersonLog: PersonLog = mutations.create(PersonLogInput)
    updatePersonLog: List[PersonLog] = mutations.update(PersonLogInput)

    createProject: Project = mutations.create(ProjectInput)
    updateProject: List[Project] = mutations.update(ProjectPartialInput)

    createPromptTemplate: PromptTemplate = mutations.create(PromptTemplateInput)
    # updateProject: List[Project] = mutations.update(ProjectPartialInput)

    @strawberry_django.mutation
    def reorder_project(self, projectID: uuid.UUID, order: int) -> Project:
        project = models.Project.objects.get(pk=projectID)
        project.to(order)
        return project

    @strawberry_django.mutation
    def assistant(self, system: str, request: str, promptID: Optional[uuid.UUID] = None) -> AssistantAnswer:
        if promptID:
            prompt = models.PromptTemplate.objects.get(pk=promptID)
            system = prompt.system_message
        return assistant.predict(system, request)

    @strawberry_django.mutation
    def updateScratchPad(self, body: str) -> ScratchPad:
        scratch_pad = models.ScratchPad.get_solo()
        scratch_pad.body = body
        scratch_pad.save()
        return scratch_pad

    @strawberry_django.mutation
    def clickLink(self, linkId: uuid.UUID) -> Link:
        link = models.Link.objects.get(pk=linkId)
        link.click_count += 1
        link.save()
        return link


schema = strawberry.Schema(query=Query, mutation=Mutation)