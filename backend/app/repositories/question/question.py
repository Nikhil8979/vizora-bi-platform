from sqlalchemy import select
import uuid
from app.core.pagination import DEFAULT_PAGE_SIZE
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.question import Question
import uuid
class QuestionRepository:
    def __init__(self,db:AsyncSession):
        self.db = db

    async def create_question(self, data: Question):
        self.db.add(data)
        await self.db.commit()
        await self.db.refresh(data)
        return data

    async def get_question_by_id(self, question_id:uuid.UUID):
        return await self.db.get(Question, question_id)

    async def list_questions(self, organization_id:uuid.UUID, limit:int=DEFAULT_PAGE_SIZE, offset:int=0):
        result = await self.db.execute(
            select(Question)
            .where(Question.organization_id == organization_id)
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_question(self, question_id:uuid.UUID):
        question = await self.get_question_by_id(question_id=question_id)
        if question:
            await self.db.delete(question)
            await self.db.commit()
        return question

    async def update_question(self, question:Question):
        self.db.add(question)
        await self.db.commit()
        await self.db.refresh(question)
        return question