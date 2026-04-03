from supabase import create_client, Client

from openfeed.config import settings


def client() -> Client:
    url: str = settings.supabase_project_url
    key: str = settings.supabase_service_role_key
    return create_client(url, key)
