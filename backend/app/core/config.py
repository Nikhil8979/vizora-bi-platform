from pydantic_settings import BaseSettings,SettingsConfigDict
from functools import lru_cache
class AppConfig(BaseSettings):
    app_name:str = "Vizora BI Platform API"
    app_env:str = "development"
    db_url:str
    alembic_db_url:str
    secret_key:str
    algorithm:str
    access_token_expire_minutes:int
    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_app_config():
    return AppConfig()