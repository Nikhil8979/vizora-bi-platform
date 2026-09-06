from app.database.db import Base
from sqlalchemy.orm import Mapped,mapped_column,relationship
from sqlalchemy import UUID,ForeignKey,String,DateTime,func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .organizations import Organization
    from .data_sources import DataSource
    from .user import User
import uuid
class Question(Base):
    __tablename__ = "questions"
    id:Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    organization_id:Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"),nullable=False)
    data_source_id:Mapped[uuid.UUID] = mapped_column(ForeignKey("data_sources.id"),nullable=False)
    title:Mapped[str] = mapped_column(String(255),nullable=False)
    description:Mapped[str | None] = mapped_column(nullable=True)
    query_definition:Mapped[dict] = mapped_column(JSONB,nullable=False)
    visualization:Mapped[dict] = mapped_column(JSONB,nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False,index=True)
    created_at: Mapped[datetime] = mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False
        )
    updated_at: Mapped[datetime] = mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False
        )
    organisation:Mapped[Organization] = relationship("Organization",back_populates="saved_questions")
    data_source:Mapped[DataSource] = relationship("DataSource",back_populates="saved_questions")
    user: Mapped["User"] = relationship("User", back_populates="saved_questions")
