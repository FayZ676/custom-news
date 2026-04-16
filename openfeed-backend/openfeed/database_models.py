from __future__ import annotations

import datetime
import uuid
from typing import (
    Annotated,
    Any,
    List,
    Literal,
    NotRequired,
    Optional,
    TypeAlias,
    TypedDict,
)

from pydantic import BaseModel, Field, Json

NetRequestStatus: TypeAlias = Literal["PENDING", "SUCCESS", "ERROR"]

RealtimeEqualityOp: TypeAlias = Literal["eq", "neq", "lt", "lte", "gt", "gte", "in"]

RealtimeAction: TypeAlias = Literal["INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR"]

StorageBuckettype: TypeAlias = Literal["STANDARD", "ANALYTICS", "VECTOR"]

AuthFactorType: TypeAlias = Literal["totp", "webauthn", "phone"]

AuthFactorStatus: TypeAlias = Literal["unverified", "verified"]

AuthAalLevel: TypeAlias = Literal["aal1", "aal2", "aal3"]

AuthCodeChallengeMethod: TypeAlias = Literal["s256", "plain"]

AuthOneTimeTokenType: TypeAlias = Literal[
    "confirmation_token",
    "reauthentication_token",
    "recovery_token",
    "email_change_token_new",
    "email_change_token_current",
    "phone_change_token",
]

AuthOauthRegistrationType: TypeAlias = Literal["dynamic", "manual"]

AuthOauthAuthorizationStatus: TypeAlias = Literal[
    "pending", "approved", "denied", "expired"
]

AuthOauthResponseType: TypeAlias = Literal["code"]

AuthOauthClientType: TypeAlias = Literal["public", "confidential"]


class PublicGlobalArticles(BaseModel):
    content: Optional[str] = Field(alias="content")
    created_at: datetime.datetime = Field(alias="created_at")
    embeddings: Optional[list[Any]] = Field(alias="embeddings")
    feed_title: str = Field(alias="feed_title")
    id: uuid.UUID = Field(alias="id")
    published_at: datetime.datetime = Field(alias="published_at")
    summary: Optional[str] = Field(alias="summary")
    title: str = Field(alias="title")
    title_embeddings: Optional[list[Any]] = Field(alias="title_embeddings")
    url: str = Field(alias="url")


class PublicGlobalArticlesInsert(TypedDict):
    content: NotRequired[Annotated[str, Field(alias="content")]]
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    embeddings: NotRequired[Annotated[list[Any], Field(alias="embeddings")]]
    feed_title: Annotated[str, Field(alias="feed_title")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    published_at: Annotated[datetime.datetime, Field(alias="published_at")]
    summary: NotRequired[Annotated[str, Field(alias="summary")]]
    title: Annotated[str, Field(alias="title")]
    title_embeddings: NotRequired[Annotated[list[Any], Field(alias="title_embeddings")]]
    url: Annotated[str, Field(alias="url")]


class PublicGlobalArticlesUpdate(TypedDict):
    content: NotRequired[Annotated[str, Field(alias="content")]]
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    embeddings: NotRequired[Annotated[list[Any], Field(alias="embeddings")]]
    feed_title: NotRequired[Annotated[str, Field(alias="feed_title")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    published_at: NotRequired[Annotated[datetime.datetime, Field(alias="published_at")]]
    summary: NotRequired[Annotated[str, Field(alias="summary")]]
    title: NotRequired[Annotated[str, Field(alias="title")]]
    title_embeddings: NotRequired[Annotated[list[Any], Field(alias="title_embeddings")]]
    url: NotRequired[Annotated[str, Field(alias="url")]]


class PublicGlobalCategories(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    id: uuid.UUID = Field(alias="id")
    interest_suggestions: Json[Any] = Field(alias="interest_suggestions")
    name: str = Field(alias="name")


class PublicGlobalCategoriesInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    interest_suggestions: NotRequired[
        Annotated[Json[Any], Field(alias="interest_suggestions")]
    ]
    name: Annotated[str, Field(alias="name")]


class PublicGlobalCategoriesUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    interest_suggestions: NotRequired[
        Annotated[Json[Any], Field(alias="interest_suggestions")]
    ]
    name: NotRequired[Annotated[str, Field(alias="name")]]


class PublicGlobalFeeds(BaseModel):
    category_id: Optional[uuid.UUID] = Field(alias="category_id")
    created_at: datetime.datetime = Field(alias="created_at")
    description: str = Field(alias="description")
    id: uuid.UUID = Field(alias="id")
    title: str = Field(alias="title")
    url: str = Field(alias="url")


class PublicGlobalFeedsInsert(TypedDict):
    category_id: NotRequired[Annotated[uuid.UUID, Field(alias="category_id")]]
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    description: Annotated[str, Field(alias="description")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    title: Annotated[str, Field(alias="title")]
    url: Annotated[str, Field(alias="url")]


class PublicGlobalFeedsUpdate(TypedDict):
    category_id: NotRequired[Annotated[uuid.UUID, Field(alias="category_id")]]
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    description: NotRequired[Annotated[str, Field(alias="description")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    title: NotRequired[Annotated[str, Field(alias="title")]]
    url: NotRequired[Annotated[str, Field(alias="url")]]


class PublicGlobalSettings(BaseModel):
    article_ttl: str = Field(alias="article_ttl")
    id: uuid.UUID = Field(alias="id")
    max_match_count: int = Field(alias="max_match_count")
    min_similarity_threshold: float = Field(alias="min_similarity_threshold")
    notification_hours: List[int] = Field(alias="notification_hours")
    singleton: bool = Field(alias="singleton")


class PublicGlobalSettingsInsert(TypedDict):
    article_ttl: Annotated[str, Field(alias="article_ttl")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    max_match_count: Annotated[int, Field(alias="max_match_count")]
    min_similarity_threshold: Annotated[float, Field(alias="min_similarity_threshold")]
    notification_hours: Annotated[List[int], Field(alias="notification_hours")]
    singleton: NotRequired[Annotated[bool, Field(alias="singleton")]]


class PublicGlobalSettingsUpdate(TypedDict):
    article_ttl: NotRequired[Annotated[str, Field(alias="article_ttl")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    max_match_count: NotRequired[Annotated[int, Field(alias="max_match_count")]]
    min_similarity_threshold: NotRequired[
        Annotated[float, Field(alias="min_similarity_threshold")]
    ]
    notification_hours: NotRequired[
        Annotated[List[int], Field(alias="notification_hours")]
    ]
    singleton: NotRequired[Annotated[bool, Field(alias="singleton")]]


class PublicGlobalStories(BaseModel):
    headline: str = Field(alias="headline")
    id: uuid.UUID = Field(alias="id")
    related_articles_urls: List[str] = Field(alias="related_articles_urls")
    summary: str = Field(alias="summary")


class PublicGlobalStoriesInsert(TypedDict):
    headline: Annotated[str, Field(alias="headline")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    related_articles_urls: NotRequired[
        Annotated[List[str], Field(alias="related_articles_urls")]
    ]
    summary: Annotated[str, Field(alias="summary")]


class PublicGlobalStoriesUpdate(TypedDict):
    headline: NotRequired[Annotated[str, Field(alias="headline")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    related_articles_urls: NotRequired[
        Annotated[List[str], Field(alias="related_articles_urls")]
    ]
    summary: NotRequired[Annotated[str, Field(alias="summary")]]


class PublicUserArticles(BaseModel):
    article_id: uuid.UUID = Field(alias="article_id")
    interest_id: uuid.UUID = Field(alias="interest_id")
    is_read: bool = Field(alias="is_read")
    score: float = Field(alias="score")
    updated_at: datetime.datetime = Field(alias="updated_at")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserArticlesInsert(TypedDict):
    article_id: Annotated[uuid.UUID, Field(alias="article_id")]
    interest_id: Annotated[uuid.UUID, Field(alias="interest_id")]
    is_read: NotRequired[Annotated[bool, Field(alias="is_read")]]
    score: Annotated[float, Field(alias="score")]
    updated_at: NotRequired[Annotated[datetime.datetime, Field(alias="updated_at")]]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserArticlesUpdate(TypedDict):
    article_id: NotRequired[Annotated[uuid.UUID, Field(alias="article_id")]]
    interest_id: NotRequired[Annotated[uuid.UUID, Field(alias="interest_id")]]
    is_read: NotRequired[Annotated[bool, Field(alias="is_read")]]
    score: NotRequired[Annotated[float, Field(alias="score")]]
    updated_at: NotRequired[Annotated[datetime.datetime, Field(alias="updated_at")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]


class PublicUserInterests(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    embeddings: list[Any] = Field(alias="embeddings")
    id: uuid.UUID = Field(alias="id")
    query: str = Field(alias="query")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserInterestsInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    embeddings: Annotated[list[Any], Field(alias="embeddings")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    query: Annotated[str, Field(alias="query")]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserInterestsUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    embeddings: NotRequired[Annotated[list[Any], Field(alias="embeddings")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    query: NotRequired[Annotated[str, Field(alias="query")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]


class PublicUserSettings(BaseModel):
    email_notification: bool = Field(alias="email_notification")
    timezone: str = Field(alias="timezone")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserSettingsInsert(TypedDict):
    email_notification: NotRequired[Annotated[bool, Field(alias="email_notification")]]
    timezone: NotRequired[Annotated[str, Field(alias="timezone")]]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserSettingsUpdate(TypedDict):
    email_notification: NotRequired[Annotated[bool, Field(alias="email_notification")]]
    timezone: NotRequired[Annotated[str, Field(alias="timezone")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]
