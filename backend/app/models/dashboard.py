
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid
from app.database.db import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, DateTime, func, UUID

if TYPE_CHECKING:
    from app.models.organizations import Organization
class Dashboard(Base):
    __tablename__ = "dashboards"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
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
    organization: Mapped[Organization] = relationship("Organization", back_populates="dashboards")

