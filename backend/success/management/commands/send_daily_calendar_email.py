"""
Django management command to send daily calendar email summaries.

This command should be run via cron job daily at the user's preferred time.

Example cron job (runs at 7:00 AM daily):
0 7 * * * cd /path/to/project && python manage.py send_daily_calendar_email

"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from success.calendar_service import CalendarService
from success.models import NotificationSettings


class Command(BaseCommand):
    help = 'Send daily calendar email summary if enabled'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force send email even if already sent today',
        )
        parser.add_argument(
            '--test',
            action='store_true',
            help='Send test email for today (ignores normal scheduling)',
        )

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

            # Initialize calendar service
            calendar_service = CalendarService()

            if options['test']:
                # Send test email for today's events
                self.stdout.write('Sending test email...')
                events, date = calendar_service.get_tomorrow_events()
                
                # For test, use today's events instead
                import datetime
                import pytz
                local_timezone = pytz.timezone(notification_settings.timezone)
                today = datetime.datetime.now(local_timezone).date()
                
                # Override the date for test
                events, _ = calendar_service.get_tomorrow_events()
                text_summary = calendar_service.create_text_summary(events, today)
                self.stdout.write(f'Found {len(events)} events for {today}')
                
                if calendar_service.send_daily_email():
                    self.stdout.write(
                        self.style.SUCCESS('Test email sent successfully!')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR('Failed to send test email')
                    )
                return

            # Normal daily email flow
            if options['force']:
                self.stdout.write('Forcing email send (ignoring previous sends)...')
                # Temporarily remove existing log to force send
                events, tomorrow_date = calendar_service.get_tomorrow_events()
                from success.models import CalendarEmailLog
                CalendarEmailLog.objects.filter(
                    email_date=tomorrow_date,
                    email_address=notification_settings.email_address
                ).delete()

            # Send daily email
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