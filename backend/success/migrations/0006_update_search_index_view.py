from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVector
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('success', '0005_add_unique_index_to_view'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
DROP MATERIALIZED VIEW success_search_index;
CREATE MATERIALIZED VIEW success_search_index as (
   SELECT 'link' as item_type, id as item_id, 
   "title" || ' ' || "url" || array_to_string("tags", ' ') as body,
   to_tsvector('english', "title" || ' ' || "url" || ' ' || array_to_string("tags", ' ')) as body_vector
   FROM success_link
   UNION 
   SELECT 'person' as item_type, id as item_id, 
   "name" || ' ' || "email" || ' ' || "team" || ' ' || "role" as body,
   to_tsvector('english', "name" || ' ' || "email" || ' ' || "team" || ' ' || "role") as body_vector
   FROM success_person
   UNION 
   SELECT 'project' as item_type, id as item_id, 
   "name" || ' ' || "description" as body,
   to_tsvector('english', "name" || ' ' || "description") as body_vector
   FROM success_project
 );
            """,
            reverse_sql="""
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
            """
        ),
        migrations.RunSQL(
            sql="""CREATE INDEX success_search_body_index ON success_search_index USING GIN (body_vector);""",
            reverse_sql="DROP INDEX success_search_body_index;"
        ),
        migrations.RunSQL(
            sql="""CREATE UNIQUE INDEX ON success_search_index (item_id);""",
            reverse_sql="DROP INDEX success_search_index_item_id_idx;"
        )
    ]
