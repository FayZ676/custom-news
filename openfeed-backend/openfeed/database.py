import os

from supabase import create_client, Client

from openfeed.models import ArticleEmbeddings


def client() -> Client:
    url: str = os.getenv("SUPABASE_URL", "")
    key: str = os.getenv("SUPABASE_KEY", "")
    return create_client(url, key)


def insert_articles(client: Client, table_name: str, articles: list[ArticleEmbeddings]):
    client.table(table_name).insert([a.model_dump_json() for a in articles]).execute()
