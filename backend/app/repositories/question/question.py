import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.question import Question
class QuestionRepository:
    def __init__(self,db:AsyncSession):
        self.db = db

    async def create_question(self, data: Question):
        self.db.add(data)
        await self.db.commit()
        await self.db.refresh(data)
        return data