import strawberry
import strawberry_django

from strawberry_django import mutations

from typing import List, Union, Optional, Dict
from .types import Link, LinkInput, Person, PersonInput, PersonLog, PersonLogInput, Project, ProjectInput, AssistantConversation, AssistantMessage, ScratchPad, ProjectPartialInput, PromptTemplate, PromptTemplateInput, SystemLog, SearchOrder, GoogleCredentials, CalendarSettings, NotificationSettings, CalendarEmailLog, NotificationSettingsInput, CalendarSettingsInput, GoogleOAuthInput
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

    assistantConversation: AssistantConversation = strawberry_django.field()
    assistantConversations: List[AssistantConversation] = strawberry_django.field()
    
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
    
    # Calendar and notification queries
    googleCredentials: List[GoogleCredentials] = strawberry_django.field()
    calendarSettings: List[CalendarSettings] = strawberry_django.field()
    
    @strawberry_django.field
    def notificationSettings(self) -> NotificationSettings:
        return models.NotificationSettings.get_solo()
    
    calendarEmailLogs: List[CalendarEmailLog] = strawberry_django.field()

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
    def startConversation(self, system: str, request: str, promptID: Optional[uuid.UUID] = None) -> AssistantConversation:
        if promptID:
            prompt = models.PromptTemplate.objects.get(pk=promptID)
            system = prompt.system_message
        return assistant.start_conversation(system, request)
    
    @strawberry_django.mutation
    def sendMessage(self, conversationID: uuid.UUID, request: str) -> AssistantMessage:
        conversation = models.AssistantConversation.objects.get(pk=conversationID)
        return assistant.send_message(conversation, request)

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

    @strawberry_django.mutation
    def copyEdit(self, text: str, editorType: Optional[str] = "spotify") -> str:
        return assistant.copy_edit(text, editorType)
    
    # Calendar and notification mutations
    updateNotificationSettings: List[NotificationSettings] = mutations.update(NotificationSettingsInput)
    updateCalendarSettings: List[CalendarSettings] = mutations.update(CalendarSettingsInput)
    
    @strawberry_django.mutation
    def validateGoogleCredentials(self, input: GoogleOAuthInput) -> GoogleCredentials:
        """Validate Google user credentials and store them"""
        from .calendar_service import CalendarService
        import json
        
        calendar_service = CalendarService()
        credentials_json = json.loads(input.credentials_json)
        
        google_creds = calendar_service.validate_and_store_credentials(
            input.account_id,
            input.account_name,
            credentials_json
        )
        return google_creds
    
    @strawberry_django.mutation
    def removeGoogleCredentials(self, credentialsId: uuid.UUID) -> bool:
        """Remove Google credentials and associated calendar settings"""
        try:
            google_creds = models.GoogleCredentials.objects.get(pk=credentialsId)
            google_creds.delete()
            return True
        except models.GoogleCredentials.DoesNotExist:
            return False
    
    @strawberry_django.mutation
    def toggleCalendarSetting(self, calendarId: uuid.UUID, isEnabled: bool) -> CalendarSettings:
        """Toggle calendar enabled/disabled state"""
        calendar_setting = models.CalendarSettings.objects.get(pk=calendarId)
        calendar_setting.is_enabled = isEnabled
        calendar_setting.save()
        return calendar_setting
    
    @strawberry_django.mutation
    def sendTestCalendarEmail(self) -> bool:
        """Send a test calendar email"""
        from .calendar_service import CalendarService
        
        calendar_service = CalendarService()
        return calendar_service.send_daily_email(force_send=True)


schema = strawberry.Schema(query=Query, mutation=Mutation)