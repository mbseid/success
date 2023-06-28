import django.contrib.postgres.search
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('success', '0003_searchindex_alter_personlog_person'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
 CREATE MATERIALIZED VIEW success_search_index as (
   SELECT 'link' as item_type, id as item_id, 
   to_tsvector('english', "title" || ' ' || "url") as body
   FROM success_link
   UNION 
   SELECT 'person' as item_type, id as item_id, 
   to_tsvector('english', "name" || ' ' || "email" || ' ' || "team" || ' ' || "role") as body
   FROM success_person
   UNION 
   SELECT 'project' as item_type, id as item_id, 
   to_tsvector('english', "name" || ' ' || "description") as body
   FROM success_project
 );
            """,
            reverse_sql="DROP VIEW success_search_index;"
        )
    ]
