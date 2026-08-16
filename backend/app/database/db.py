from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from app.core.config import get_app_config
config = get_app_config()

engine = create_async_engine(config.db_url,echo=True)

AsyncSessionLocal = sessionmaker(bind=engine,class_=AsyncSession,expire_on_commit=False)
Base = declarative_base()