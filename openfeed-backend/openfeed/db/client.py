import os

from supabase import create_client, Client


def client() -> Client:
    url: str = os.getenv("SUPABASE_PROJECT_URL", "")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)
