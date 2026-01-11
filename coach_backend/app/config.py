from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str

    strava_client_id: str
    strava_client_secret: str
    strava_redirect_uri: str

    jwt_secret: str
    jwt_alg: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30

settings = Settings()
