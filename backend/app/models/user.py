from sqlalchemy import String,Integer,DateTime,func
from sqlalchemy.orm import Mapped,mapped_column,relationship
from app.database.db import Base
from datetime import datetime
from typing import List
from app.models.organization_members import OrganizationMembers
class User(Base):
    __tablename__ = "users"
    
    id:Mapped[int] = mapped_column(Integer,primary_key=True,index=True)
    name:Mapped[str] = mapped_column(String(100),nullable=False)
    email:Mapped[str] = mapped_column(String(255),unique=True,index=True,nullable=False)
    password:Mapped[str] = mapped_column(String(255),nullable=False)
    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    organization_members: Mapped[List["OrganizationMembers"]] = relationship("OrganizationMembers", back_populates="user")
