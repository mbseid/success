# Generated by Django 4.2.3 on 2025-07-30 14:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('success', '0013_assistantanswer_created_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='link',
            name='click_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
