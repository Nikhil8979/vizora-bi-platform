from app.database.db import Base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime, ForeignKey, func
from datetime import datetime
from typing import TYPE_CHECKING
from enum import Enum
from sqlalchemy import Enum as SQLEnum
if TYPE_CHECKING:
    from app.models.organizations import Organization
    from app.models.user import User



class DataSourceType(str, Enum):
    BIGQUERY = "bigquery"
    POSTGRES = "postgres"
    MYSQL = "mysql"
    SNOWFLAKE = "snowflake"
    REDSHIFT = "redshift"

class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False,index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(nullable=True)
    type: Mapped[DataSourceType] = mapped_column(
    SQLEnum(DataSourceType, name="data_source_type"),
    nullable=False
    )
    configuration: Mapped[dict] = mapped_column(JSONB, nullable=False)
    credential_secret_id:Mapped[str | None] = mapped_column(nullable=True)
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
    user: Mapped["User"] = relationship("User", back_populates="data_sources")
    organization: Mapped["Organization"] = relationship("Organization", back_populates="data_sources")



