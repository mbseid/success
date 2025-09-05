"""
Django management command to send daily calendar email summaries.

This command checks if it's the user's preferred time (within 1 minute window) 
before sending emails. It respects the email_time and timezone settings from
NotificationSettings.

This should be run via cron job every minute, and it will only send emails
at the user's configured preferred time:
* * * * * cd /path/to/project && python manage.py send_daily_calendar_email

"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from success.calendar_service import CalendarService
from success.models import NotificationSettings
import datetime
import pytz


class Command(BaseCommand):
    help = 'Send daily calendar email summary if enabled'


    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting daily calendar email task at {timezone.now()}'
            )
        )

        try:
            # Get notification settings
            notification_settings = NotificationSettings.get_solo()
            
            if not notification_settings.daily_email_enabled:
                self.stdout.write(
                    self.style.WARNING('Daily email is disabled in settings.')
                )
                return

            if not notification_settings.email_address:
                self.stdout.write(
                    self.style.ERROR('No email address configured in settings.')
                )
                return

            # Check if it's the preferred time to send email
            local_timezone = pytz.timezone(notification_settings.timezone)
            current_time = datetime.datetime.now(local_timezone).time()
            preferred_time = notification_settings.email_time
            
            # Allow a 1-minute window around the preferred time
            preferred_datetime = datetime.datetime.combine(datetime.date.today(), preferred_time)
            current_datetime = datetime.datetime.combine(datetime.date.today(), current_time)
            time_diff = abs((current_datetime - preferred_datetime).total_seconds())
            
            if time_diff > 60:  # More than 1 minute difference
                self.stdout.write(
                    self.style.WARNING(
                        f'Current time ({current_time.strftime("%H:%M")}) is not within 1 minute of preferred time ({preferred_time.strftime("%H:%M")}). Skipping email send.'
                    )
                )
                return

            # Initialize calendar service and send daily email
            calendar_service = CalendarService()
            success = calendar_service.send_daily_email()

            if success:
                self.stdout.write(
                    self.style.SUCCESS('Daily calendar email sent successfully!')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Daily calendar email was not sent (already sent today or other issue)')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error sending daily calendar email: {e}')
            )
            # Re-raise for proper exit code
            raise