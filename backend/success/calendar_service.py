import os
import json
import datetime
import pytz
from dateutil import parser
from collections import defaultdict
from typing import List, Dict, Any, Optional, Tuple
from cryptography.fernet import Fernet
from django.conf import settings
from django.utils import timezone

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage

from .models import GoogleCredentials, CalendarSettings, NotificationSettings, CalendarEmailLog

# If modifying these scopes, delete the existing credentials
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

# Initialize Anthropic for calendar summaries
calendar_llm = ChatAnthropic(model_name="claude-sonnet-4-20250514")


class CalendarService:
    """Service for Google Calendar integration and email summaries"""
    
    def __init__(self):
        self.encryption_key = self._get_encryption_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_encryption_key(self) -> bytes:
        """Get encryption key for storing credentials"""
        key = getattr(settings, 'CALENDAR_ENCRYPTION_KEY', None)
        if not key:
            raise ValueError("CALENDAR_ENCRYPTION_KEY environment variable is required. Generate one using: python manage.py generate_encryption_key")
        
        key = key.encode() if isinstance(key, str) else key
        return key
    
    def encrypt_credentials(self, credentials: dict) -> str:
        """Encrypt Google OAuth credentials"""
        json_str = json.dumps(credentials)
        encrypted = self.fernet.encrypt(json_str.encode())
        return encrypted.decode()
    
    def decrypt_credentials(self, encrypted_credentials: str) -> dict:
        """Decrypt Google OAuth credentials"""
        decrypted = self.fernet.decrypt(encrypted_credentials.encode())
        return json.loads(decrypted.decode())
    
    def validate_and_store_credentials(self, account_id: str, account_name: str, 
                                     credentials_json: dict) -> GoogleCredentials:
        """
        Validate user account credentials and store them
        
        Args:
            account_id: Unique identifier for the account
            account_name: Display name for the account
            credentials_json: Google user account credentials JSON (from credentials.json file)
            
        Returns:
            GoogleCredentials object if successful
            
        Raises:
            ValueError: If credentials are invalid or missing required fields
        """
        try:
            # Validate that we have the required fields for user credentials
            required_fields = ['client_id', 'client_secret', 'refresh_token']
            for field in required_fields:
                if field not in credentials_json:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create credentials object
            credentials = Credentials(
                token=credentials_json.get('token'),
                refresh_token=credentials_json['refresh_token'],
                token_uri=credentials_json.get('token_uri', 'https://oauth2.googleapis.com/token'),
                client_id=credentials_json['client_id'],
                client_secret=credentials_json['client_secret'],
                scopes=SCOPES
            )
            
            # Test the credentials by making a simple API call
            service = build('calendar', 'v3', credentials=credentials)
            # Try to list calendars to verify access
            calendar_list = service.calendarList().list().execute()
            
            # If we get here, credentials are valid
            # Store credentials in our format
            cred_dict = {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes or SCOPES
            }
            
            encrypted_creds = self.encrypt_credentials(cred_dict)
            
            # Save to database
            google_creds, created = GoogleCredentials.objects.update_or_create(
                account_id=account_id,
                defaults={
                    'account_name': account_name,
                    'encrypted_credentials': encrypted_creds,
                    'is_active': True,
                    'last_used': timezone.now()
                }
            )
            
            # Auto-discover and save calendars
            self._discover_calendars_from_service(google_creds, service)
            
            return google_creds
            
        except Exception as e:
            raise ValueError(f"Invalid credentials or unable to access Google Calendar: {str(e)}")
    
    def _discover_calendars(self, google_creds: GoogleCredentials):
        """Discover and save available calendars for an account"""
        try:
            service = self._get_calendar_service(google_creds)
            calendar_list = service.calendarList().list().execute()
            
            for calendar_item in calendar_list.get('items', []):
                calendar_id = calendar_item['id']
                calendar_name = calendar_item.get('summary', calendar_id)
                
                CalendarSettings.objects.update_or_create(
                    google_credentials=google_creds,
                    calendar_id=calendar_id,
                    defaults={
                        'calendar_name': calendar_name,
                        'is_enabled': True
                    }
                )
        except Exception as e:
            print(f"Error discovering calendars for {google_creds.account_name}: {e}")
    
    def _discover_calendars_from_service(self, google_creds: GoogleCredentials, service):
        """Discover and save available calendars for an account using existing service"""
        try:
            calendar_list = service.calendarList().list().execute()
            
            for calendar_item in calendar_list.get('items', []):
                calendar_id = calendar_item['id']
                calendar_name = calendar_item.get('summary', calendar_id)
                
                CalendarSettings.objects.update_or_create(
                    google_credentials=google_creds,
                    calendar_id=calendar_id,
                    defaults={
                        'calendar_name': calendar_name,
                        'is_enabled': True
                    }
                )
        except Exception as e:
            print(f"Error discovering calendars for {google_creds.account_name}: {e}")
    
    def _get_calendar_service(self, google_creds: GoogleCredentials):
        """Get authenticated Google Calendar service"""
        cred_dict = self.decrypt_credentials(google_creds.encrypted_credentials)
        
        credentials = Credentials(
            token=cred_dict['token'],
            refresh_token=cred_dict['refresh_token'],
            token_uri=cred_dict['token_uri'],
            client_id=cred_dict['client_id'],
            client_secret=cred_dict['client_secret'],
            scopes=cred_dict['scopes']
        )
        
        # Refresh if needed
        if not credentials.valid:
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Update stored credentials
                updated_dict = {
                    'token': credentials.token,
                    'refresh_token': credentials.refresh_token,
                    'token_uri': credentials.token_uri,
                    'client_id': credentials.client_id,
                    'client_secret': credentials.client_secret,
                    'scopes': credentials.scopes
                }
                google_creds.encrypted_credentials = self.encrypt_credentials(updated_dict)
                google_creds.last_used = timezone.now()
                google_creds.save()
        
        return build('calendar', 'v3', credentials=credentials)
    
    def get_tomorrow_events(self) -> Tuple[List[Dict], datetime.date]:
        """Get events for tomorrow from all enabled calendars"""
        # Get notification settings for timezone
        notification_settings = NotificationSettings.get_solo()
        local_timezone = pytz.timezone(notification_settings.timezone)
        
        # Calculate tomorrow's date
        now = datetime.datetime.now(local_timezone)
        tomorrow_start = (now + datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_end = tomorrow_start + datetime.timedelta(days=1)
        
        # Convert to ISO format for API
        time_min = tomorrow_start.isoformat()
        time_max = tomorrow_end.isoformat()
        
        all_events = []
        
        # Get all active Google credentials
        for google_creds in GoogleCredentials.objects.filter(is_active=True):
            try:
                print(f"Fetching events for account: {google_creds}")
                service = self._get_calendar_service(google_creds)
                # Get events from all enabled calendars for this account
                for calendar_setting in google_creds.calendar_settings.filter(is_enabled=True):
                    try:
                        events_result = service.events().list(
                            calendarId=calendar_setting.calendar_id,
                            timeMin=time_min,
                            timeMax=time_max,
                            singleEvents=True,
                            orderBy='startTime'
                        ).execute()
                        
                        events = events_result.get('items', [])
                        
                        # Add metadata to each event
                        for event in events:
                            # Skip working location events
                            if event.get('eventType') == 'workingLocation':
                                continue
                                
                            event['calendarId'] = calendar_setting.calendar_id
                            event['calendarName'] = calendar_setting.calendar_name
                            event['accountName'] = google_creds.account_name
                            
                            # Determine response status
                            response_status = None
                            if 'attendees' in event:
                                for attendee in event['attendees']:
                                    if (attendee.get('email') == calendar_setting.calendar_id or 
                                        attendee.get('self', False)):
                                        response_status = attendee.get('responseStatus')
                                        break
                            
                            # If no response status found and user is organizer, assume accepted
                            if response_status is None and 'organizer' in event:
                                if event['organizer'].get('email') == calendar_setting.calendar_id:
                                    response_status = 'accepted'
                            
                            event['responseStatus'] = response_status
                            all_events.append(event)
                            
                    except HttpError as error:
                        print(f'Error fetching events from {calendar_setting.calendar_name}: {error}')
                        
            except Exception as e:
                print(f'Error with account {google_creds.account_name}: {e}')
        
        return all_events, tomorrow_start.date()
    
    def format_time(self, dt_str: str, timezone_str: str = 'America/New_York') -> str:
        """Format datetime string to readable time format"""
        dt = parser.parse(dt_str)
        local_timezone = pytz.timezone(timezone_str)
        local_dt = dt.astimezone(local_timezone)
        return local_dt.strftime("%I:%M %p")  # e.g., "09:30 AM"
    
    def create_text_summary(self, events: List[Dict], date: datetime.date) -> str:
        """Create human-readable text summary of events"""
        if not events:
            return f"No events scheduled for {date.strftime('%A, %B %d, %Y')}."
        
        # Sort events by start time
        events.sort(key=lambda x: x['start'].get('dateTime', x['start'].get('date', '')))
        
        summary = [f"Summary for {date.strftime('%A, %B %d, %Y')}:"]
        summary.append("=" * 50)
        
        # Group events by account and calendar
        events_by_account_calendar = defaultdict(lambda: defaultdict(list))
        for event in events:
            account_name = event.get('accountName', 'Unknown Account')
            calendar_name = event.get('calendarName', event['calendarId'])
            events_by_account_calendar[account_name][calendar_name].append(event)
        
        # Format the events
        notification_settings = NotificationSettings.get_solo()
        for account_name, calendars in events_by_account_calendar.items():
            summary.append(f"\n🔑 {account_name}:")
            
            for calendar_name, cal_events in calendars.items():
                summary.append(f"\n  📅 {calendar_name}:")
                
                for i, event in enumerate(cal_events, 1):
                    title = event.get('summary', 'Untitled Event')
                    
                    # Handle all-day events
                    if 'date' in event['start']:
                        time_str = "All day"
                    else:
                        start_time = self.format_time(event['start']['dateTime'], notification_settings.timezone)
                        end_time = self.format_time(event['end']['dateTime'], notification_settings.timezone)
                        time_str = f"{start_time} - {end_time}"
                    
                    location = event.get('location', '')
                    location_str = f" | Location: {location}" if location else ""
                    
                    # Add response status indicator
                    response_status = event.get('responseStatus')
                    status_indicator = ""
                    if response_status:
                        if response_status == 'accepted':
                            status_indicator = " ✅"
                        elif response_status == 'tentative':
                            status_indicator = " ❓"
                        elif response_status == 'declined':
                            status_indicator = " ❌"
                        elif response_status == 'needsAction':
                            status_indicator = " ⚠️"
                    
                    summary.append(f"    {i}. {title}{status_indicator} ({time_str}){location_str}")
        
        summary.append("\n" + "=" * 50)
        return "\n".join(summary)
    
    def generate_ai_summary(self, events: List[Dict], date: datetime.date) -> Optional[Dict[str, str]]:
        """Generate AI summary using Anthropic Claude"""
        try:
            # Format events for AI
            event_descriptions = []
            for event in events:
                title = event.get('summary', 'Untitled Event')
                
                # Format time
                if 'date' in event['start']:
                    time_str = "All day"
                else:
                    time_str = f"{event['start']['dateTime']} - {event['end']['dateTime']}"
                
                location = event.get('location', '')
                description = event.get('description', '')
                response_status = event.get('responseStatus')
                event_type = event.get('eventType')
                
                event_info = {
                    "title": title,
                    "time": time_str,
                    "location": location,
                    "description": description,
                    "responseStatus": response_status,
                    "eventType": event_type
                }
                event_descriptions.append(event_info)
            
            # Create prompt
            day_of_week = date.strftime('%A')
            date_str = date.strftime('%B %d, %Y')
            
            prompt = f"""
            You are a friendly, warm, and humorous personal assistant. Output the summary in JSON format with the
            keys "subject" (string) and "body" (string). Output raw JSON and not markdown.
            The body field should be formatted as HTML.
            
            Create a morning email summary for my day on {day_of_week}, {date_str}.
            
            The tone should be:
            - Funny and lighthearted, not corny
            - Warm and encouraging  
            - Perfect for someone who just woke up
            
            Here are the events on my calendar:
            {json.dumps(event_descriptions, indent=2)}
            
            For each event, the "responseStatus" field indicates whether I've accepted it:
            - "accepted" means I'll definitely attend
            - "tentative" means I might attend
            - "needsAction" means I haven't responded yet
            - "declined" means I won't attend
            - null means no response data is available (treat as if I'm attending)
            
            Don't highlight events that have the eventType "focusTime". Those events are for me to know and
            aren't as important to prepare for. Also don't mention the Walk and Talk events, those happen
            every day and require any preparation.
            
            Please create:
            1. A cheerful greeting that mentions the day of the week
            2. A brief summary highlighting the 2-3 most important events
            3. A note about any events I haven't responded to yet ("needsAction")
            4. A funny observation or joke related to my schedule
            5. A warm closing that encourages me to have a great day
            
            Keep it concise (about 150-200 words total).
            """
            
            system_message = "You are a friendly personal assistant that creates warm, funny, and encouraging calendar summaries for mornings."
            
            messages = [
                SystemMessage(content=system_message),
                HumanMessage(content=prompt)
            ]
            
            response = calendar_llm.invoke(messages)
            
            # Parse JSON response
            try:
                ai_summary = json.loads(response.content)
                if 'subject' in ai_summary and 'body' in ai_summary:
                    return ai_summary
                else:
                    print("Warning: AI response missing required fields")
                    return None
            except json.JSONDecodeError:
                print(f"Warning: Could not parse AI response as JSON: {response.content}")
                return None
                
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return None
    
    def should_send_email(self, date: datetime.date) -> bool:
        """Check if email should be sent for the given date"""
        notification_settings = NotificationSettings.get_solo()
        
        if not notification_settings.daily_email_enabled:
            return False
            
        if not notification_settings.email_address:
            return False
        
        # Check if already sent today
        existing_log = CalendarEmailLog.objects.filter(
            email_date=date,
            email_address=notification_settings.email_address
        ).first()
        
        return existing_log is None
    
    def send_daily_email(self, force_send: bool = False) -> bool:
        """Send daily calendar email if enabled and not already sent"""
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        
        events, tomorrow_date = self.get_tomorrow_events()
        
        if not force_send and not self.should_send_email(tomorrow_date):
            print(f"Email already sent for {tomorrow_date} or email disabled")
            return False
        
        notification_settings = NotificationSettings.get_solo()
        
        # Generate summaries
        text_summary = self.create_text_summary(events, tomorrow_date)
        ai_summary = self.generate_ai_summary(events, tomorrow_date)
        
        if ai_summary:
            subject = ai_summary['subject']
            # Combine AI and text summaries
            html_body = f"""
            <html>
            <body>
                <div>
                    {ai_summary['body']}
                </div>
                <hr style="border: 1px solid #ccc; margin: 20px 0;">
                <div style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">
                    {text_summary.replace('<', '&lt;').replace('>', '&gt;')}
                </div>
            </body>
            </html>
            """
        else:
            subject = f"Calendar Summary for {tomorrow_date.strftime('%A, %B %d, %Y')}"
            html_body = f"""
            <html>
            <body>
                <div style="white-space: pre-wrap; font-family: monospace;">
                    {text_summary.replace('<', '&lt;').replace('>', '&gt;')}
                </div>
            </body>
            </html>
            """
        
        try:
            # Send email
            send_mail(
                subject=subject,
                message=text_summary,  # Plain text fallback
                html_message=html_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification_settings.email_address],
                fail_silently=False,
            )
            
            # Log success
            CalendarEmailLog.objects.create(
                email_date=tomorrow_date,
                email_address=notification_settings.email_address,
                subject=subject,
                success=True
            )
            
            print(f"Calendar email sent successfully to {notification_settings.email_address}")
            return True
            
        except Exception as e:
            # Log failure
            CalendarEmailLog.objects.create(
                email_date=tomorrow_date,
                email_address=notification_settings.email_address,
                subject=subject,
                success=False,
                error_message=str(e)
            )
            
            print(f"Failed to send calendar email: {e}")
            return False