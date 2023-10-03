import logging

from django.conf import settings
from asgiref.sync import sync_to_async

MSG_STYLE_SIMPLE = 'Simple'
MSG_STYLE_FULL = 'Full'

DJANGO_DB_LOGGER_ADMIN_LIST_PER_PAGE = getattr(settings, 'DJANGO_DB_LOGGER_ADMIN_LIST_PER_PAGE', 10)

DJANGO_DB_LOGGER_ENABLE_FORMATTER = getattr(settings, 'DJANGO_DB_LOGGER_ENABLE_FORMATTER', False)

db_default_formatter = logging.Formatter()


class DatabaseErrorHandler(logging.Handler):
    
    def emit(self, record):
        from .models import SystemLog
        
        trace = None

        if record.exc_info:
            trace = db_default_formatter.formatException(record.exc_info)

        if DJANGO_DB_LOGGER_ENABLE_FORMATTER:
            msg = self.format(record)
        else:
            msg = record.getMessage()

        kwargs = {
            'logger_name': record.name,
            'level': record.levelno,
            'msg': msg,
            'trace': trace
        }

        SystemLog.objects.create(**kwargs)

    def format(self, record):
        if self.formatter:
            fmt = self.formatter
        else:
            fmt = db_default_formatter

        if type(fmt) == logging.Formatter:
            record.message = record.getMessage()

            if fmt.usesTime():
                record.asctime = fmt.formatTime(record, fmt.datefmt)

            # ignore exception traceback and stack info

            return fmt.formatMessage(record)
        else:
            return fmt.format(record)
