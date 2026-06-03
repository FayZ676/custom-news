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


class PublicGlobalArticleTopics(BaseModel):
    article_id: uuid.UUID = Field(alias="article_id")
    topic_id: str = Field(alias="topic_id")
    topic_name: str = Field(alias="topic_name")


class PublicGlobalArticleTopicsInsert(TypedDict):
    article_id: Annotated[uuid.UUID, Field(alias="article_id")]
    topic_id: Annotated[str, Field(alias="topic_id")]
    topic_name: Annotated[str, Field(alias="topic_name")]


class PublicGlobalArticleTopicsUpdate(TypedDict):
    article_id: NotRequired[Annotated[uuid.UUID, Field(alias="article_id")]]
    topic_id: NotRequired[Annotated[str, Field(alias="topic_id")]]
    topic_name: NotRequired[Annotated[str, Field(alias="topic_name")]]


class PublicGlobalArticles(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    feed_title: str = Field(alias="feed_title")
    id: uuid.UUID = Field(alias="id")
    image_url: Optional[str] = Field(alias="image_url")
    published_at: datetime.datetime = Field(alias="published_at")
    significance_score: float = Field(alias="significance_score")
    summary: Optional[str] = Field(alias="summary")
    summary_embeddings: Optional[list[Any]] = Field(alias="summary_embeddings")
    summary_entities: List[str] = Field(alias="summary_entities")
    title: str = Field(alias="title")
    url: str = Field(alias="url")


class PublicGlobalArticlesInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    feed_title: Annotated[str, Field(alias="feed_title")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    image_url: NotRequired[Annotated[Optional[str], Field(alias="image_url")]]
    published_at: Annotated[datetime.datetime, Field(alias="published_at")]
    significance_score: Annotated[float, Field(alias="significance_score")]
    summary: NotRequired[Annotated[Optional[str], Field(alias="summary")]]
    summary_embeddings: NotRequired[
        Annotated[Optional[list[Any]], Field(alias="summary_embeddings")]
    ]
    summary_entities: NotRequired[Annotated[List[str], Field(alias="summary_entities")]]
    title: Annotated[str, Field(alias="title")]
    url: Annotated[str, Field(alias="url")]


class PublicGlobalArticlesUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    feed_title: NotRequired[Annotated[str, Field(alias="feed_title")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    image_url: NotRequired[Annotated[Optional[str], Field(alias="image_url")]]
    published_at: NotRequired[Annotated[datetime.datetime, Field(alias="published_at")]]
    significance_score: NotRequired[Annotated[float, Field(alias="significance_score")]]
    summary: NotRequired[Annotated[Optional[str], Field(alias="summary")]]
    summary_embeddings: NotRequired[
        Annotated[Optional[list[Any]], Field(alias="summary_embeddings")]
    ]
    summary_entities: NotRequired[Annotated[List[str], Field(alias="summary_entities")]]
    title: NotRequired[Annotated[str, Field(alias="title")]]
    url: NotRequired[Annotated[str, Field(alias="url")]]


class PublicGlobalEmails(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    email_text: str = Field(alias="email_text")
    id: uuid.UUID = Field(alias="id")


class PublicGlobalEmailsInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    email_text: Annotated[str, Field(alias="email_text")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]


class PublicGlobalEmailsUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    email_text: NotRequired[Annotated[str, Field(alias="email_text")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]


class PublicGlobalFeeds(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    description: str = Field(alias="description")
    id: uuid.UUID = Field(alias="id")
    title: str = Field(alias="title")
    url: str = Field(alias="url")


class PublicGlobalFeedsInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    description: Annotated[str, Field(alias="description")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    title: Annotated[str, Field(alias="title")]
    url: Annotated[str, Field(alias="url")]


class PublicGlobalFeedsUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    description: NotRequired[Annotated[str, Field(alias="description")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    title: NotRequired[Annotated[str, Field(alias="title")]]
    url: NotRequired[Annotated[str, Field(alias="url")]]


class PublicGlobalSettings(BaseModel):
    article_ttl: str = Field(alias="article_ttl")
    cluster_significance_threshold: float = Field(
        alias="cluster_significance_threshold"
    )
    clustering_window_hours: int = Field(alias="clustering_window_hours")
    id: uuid.UUID = Field(alias="id")
    max_match_count: int = Field(alias="max_match_count")
    min_similarity_threshold: float = Field(alias="min_similarity_threshold")
    notification_hours: List[int] = Field(alias="notification_hours")
    singleton: bool = Field(alias="singleton")


class PublicGlobalSettingsInsert(TypedDict):
    article_ttl: Annotated[str, Field(alias="article_ttl")]
    cluster_significance_threshold: NotRequired[
        Annotated[float, Field(alias="cluster_significance_threshold")]
    ]
    clustering_window_hours: NotRequired[
        Annotated[int, Field(alias="clustering_window_hours")]
    ]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    max_match_count: Annotated[int, Field(alias="max_match_count")]
    min_similarity_threshold: Annotated[float, Field(alias="min_similarity_threshold")]
    notification_hours: Annotated[List[int], Field(alias="notification_hours")]
    singleton: NotRequired[Annotated[bool, Field(alias="singleton")]]


class PublicGlobalSettingsUpdate(TypedDict):
    article_ttl: NotRequired[Annotated[str, Field(alias="article_ttl")]]
    cluster_significance_threshold: NotRequired[
        Annotated[float, Field(alias="cluster_significance_threshold")]
    ]
    clustering_window_hours: NotRequired[
        Annotated[int, Field(alias="clustering_window_hours")]
    ]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    max_match_count: NotRequired[Annotated[int, Field(alias="max_match_count")]]
    min_similarity_threshold: NotRequired[
        Annotated[float, Field(alias="min_similarity_threshold")]
    ]
    notification_hours: NotRequired[
        Annotated[List[int], Field(alias="notification_hours")]
    ]
    singleton: NotRequired[Annotated[bool, Field(alias="singleton")]]


class PublicGlobalShareLinks(BaseModel):
    content_id: str = Field(alias="content_id")
    content_type: str = Field(alias="content_type")
    created_at: Optional[datetime.datetime] = Field(alias="created_at")
    created_by: Optional[uuid.UUID] = Field(alias="created_by")
    expires_at: datetime.datetime = Field(alias="expires_at")
    token: uuid.UUID = Field(alias="token")


class PublicGlobalShareLinksInsert(TypedDict):
    content_id: Annotated[str, Field(alias="content_id")]
    content_type: Annotated[str, Field(alias="content_type")]
    created_at: NotRequired[
        Annotated[Optional[datetime.datetime], Field(alias="created_at")]
    ]
    created_by: NotRequired[Annotated[Optional[uuid.UUID], Field(alias="created_by")]]
    expires_at: NotRequired[Annotated[datetime.datetime, Field(alias="expires_at")]]
    token: NotRequired[Annotated[uuid.UUID, Field(alias="token")]]


class PublicGlobalShareLinksUpdate(TypedDict):
    content_id: NotRequired[Annotated[str, Field(alias="content_id")]]
    content_type: NotRequired[Annotated[str, Field(alias="content_type")]]
    created_at: NotRequired[
        Annotated[Optional[datetime.datetime], Field(alias="created_at")]
    ]
    created_by: NotRequired[Annotated[Optional[uuid.UUID], Field(alias="created_by")]]
    expires_at: NotRequired[Annotated[datetime.datetime, Field(alias="expires_at")]]
    token: NotRequired[Annotated[uuid.UUID, Field(alias="token")]]


class PublicGlobalStories(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    headline: str = Field(alias="headline")
    id: uuid.UUID = Field(alias="id")
    image_url: Optional[str] = Field(alias="image_url")
    related_articles_urls: List[str] = Field(alias="related_articles_urls")
    score: float = Field(alias="score")
    summary: str = Field(alias="summary")
    summary_embeddings: Optional[list[Any]] = Field(alias="summary_embeddings")
    velocity: float = Field(alias="velocity")


class PublicGlobalStoriesInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    headline: Annotated[str, Field(alias="headline")]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    image_url: NotRequired[Annotated[Optional[str], Field(alias="image_url")]]
    related_articles_urls: NotRequired[
        Annotated[List[str], Field(alias="related_articles_urls")]
    ]
    score: Annotated[float, Field(alias="score")]
    summary: Annotated[str, Field(alias="summary")]
    summary_embeddings: NotRequired[
        Annotated[Optional[list[Any]], Field(alias="summary_embeddings")]
    ]
    velocity: Annotated[float, Field(alias="velocity")]


class PublicGlobalStoriesUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    headline: NotRequired[Annotated[str, Field(alias="headline")]]
    id: NotRequired[Annotated[uuid.UUID, Field(alias="id")]]
    image_url: NotRequired[Annotated[Optional[str], Field(alias="image_url")]]
    related_articles_urls: NotRequired[
        Annotated[List[str], Field(alias="related_articles_urls")]
    ]
    score: NotRequired[Annotated[float, Field(alias="score")]]
    summary: NotRequired[Annotated[str, Field(alias="summary")]]
    summary_embeddings: NotRequired[
        Annotated[Optional[list[Any]], Field(alias="summary_embeddings")]
    ]
    velocity: NotRequired[Annotated[float, Field(alias="velocity")]]


class PublicGlobalStoryTopics(BaseModel):
    story_id: uuid.UUID = Field(alias="story_id")
    topic_id: str = Field(alias="topic_id")
    topic_name: str = Field(alias="topic_name")


class PublicGlobalStoryTopicsInsert(TypedDict):
    story_id: Annotated[uuid.UUID, Field(alias="story_id")]
    topic_id: Annotated[str, Field(alias="topic_id")]
    topic_name: Annotated[str, Field(alias="topic_name")]


class PublicGlobalStoryTopicsUpdate(TypedDict):
    story_id: NotRequired[Annotated[uuid.UUID, Field(alias="story_id")]]
    topic_id: NotRequired[Annotated[str, Field(alias="topic_id")]]
    topic_name: NotRequired[Annotated[str, Field(alias="topic_name")]]


class PublicGlobalTopics(BaseModel):
    description: str = Field(alias="description")
    id: str = Field(alias="id")
    name: str = Field(alias="name")
    significance_score: float = Field(alias="significance_score")


class PublicGlobalTopicsInsert(TypedDict):
    description: Annotated[str, Field(alias="description")]
    id: Annotated[str, Field(alias="id")]
    name: Annotated[str, Field(alias="name")]
    significance_score: Annotated[float, Field(alias="significance_score")]


class PublicGlobalTopicsUpdate(TypedDict):
    description: NotRequired[Annotated[str, Field(alias="description")]]
    id: NotRequired[Annotated[str, Field(alias="id")]]
    name: NotRequired[Annotated[str, Field(alias="name")]]
    significance_score: NotRequired[Annotated[float, Field(alias="significance_score")]]


class PublicUserKeywords(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    keywords: str = Field(alias="keywords")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserKeywordsInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    keywords: Annotated[str, Field(alias="keywords")]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserKeywordsUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    keywords: NotRequired[Annotated[str, Field(alias="keywords")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]


class PublicUserSettings(BaseModel):
    color_theme: str = Field(alias="color_theme")
    email_notification: bool = Field(alias="email_notification")
    timezone: str = Field(alias="timezone")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserSettingsInsert(TypedDict):
    color_theme: NotRequired[Annotated[str, Field(alias="color_theme")]]
    email_notification: NotRequired[Annotated[bool, Field(alias="email_notification")]]
    timezone: NotRequired[Annotated[str, Field(alias="timezone")]]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserSettingsUpdate(TypedDict):
    color_theme: NotRequired[Annotated[str, Field(alias="color_theme")]]
    email_notification: NotRequired[Annotated[bool, Field(alias="email_notification")]]
    timezone: NotRequired[Annotated[str, Field(alias="timezone")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]


class PublicUserTopics(BaseModel):
    created_at: datetime.datetime = Field(alias="created_at")
    topic_id: str = Field(alias="topic_id")
    user_id: uuid.UUID = Field(alias="user_id")


class PublicUserTopicsInsert(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    topic_id: Annotated[str, Field(alias="topic_id")]
    user_id: Annotated[uuid.UUID, Field(alias="user_id")]


class PublicUserTopicsUpdate(TypedDict):
    created_at: NotRequired[Annotated[datetime.datetime, Field(alias="created_at")]]
    topic_id: NotRequired[Annotated[str, Field(alias="topic_id")]]
    user_id: NotRequired[Annotated[uuid.UUID, Field(alias="user_id")]]
