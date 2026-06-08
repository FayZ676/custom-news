from collections import defaultdict

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query


class GlobalArticleMetadataOption(BaseModel):
    description: str
    field: str
    name: str

    @property
    def label(self) -> str:
        return self.name


def get_global_article_metadata_options(
    db: Client,
) -> dict[str, list[GlobalArticleMetadataOption]]:
    options = [
        GlobalArticleMetadataOption.model_validate(row)
        for page in paginated_query(
            db,
            "global_article_metadata_options",
            select="field, name, description",
        )
        for row in page
    ]
    grouped_options: dict[str, list[GlobalArticleMetadataOption]] = defaultdict(list)
    for option in sorted(
        options,
        key=lambda option: (
            option.field,
            option.name,
        ),
    ):
        grouped_options[option.field].append(option)
    return dict(grouped_options)


def get_global_topics(db: Client) -> list[GlobalArticleMetadataOption]:
    return get_global_article_metadata_options(db).get("topic", [])
