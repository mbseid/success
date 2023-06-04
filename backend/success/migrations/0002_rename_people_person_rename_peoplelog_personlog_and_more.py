# Generated by Django 4.2.1 on 2023-05-30 02:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('success', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='People',
            new_name='Person',
        ),
        migrations.RenameModel(
            old_name='PeopleLog',
            new_name='PersonLog',
        ),
        migrations.AlterModelOptions(
            name='person',
            options={'verbose_name_plural': 'people'},
        ),
        migrations.AlterField(
            model_name='link',
            name='description',
            field=models.CharField(blank=True),
        ),
    ]
