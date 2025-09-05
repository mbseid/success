from django.core.management.base import BaseCommand
from cryptography.fernet import Fernet


class Command(BaseCommand):
    help = 'Generate a new encryption key for calendar credentials'

    def handle(self, *args, **options):
        key = Fernet.generate_key()
        key_str = key.decode()
        
        self.stdout.write(
            self.style.SUCCESS(f'Generated encryption key: {key_str}')
        )
        self.stdout.write(
            'Add this to your .env file:'
        )
        self.stdout.write(
            f'CALENDAR_ENCRYPTION_KEY={key_str}'
        )