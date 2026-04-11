from openfeed.db.client import Client
from openfeed.database_models import PublicGlobalSettings


def get_global_settings(db: Client) -> PublicGlobalSettings:
    data = (
        db.table("global_settings")
        .select("*")
        .eq("singleton", True)
        .single()
        .execute()
        .data
    )
    return PublicGlobalSettings.model_validate(data)
