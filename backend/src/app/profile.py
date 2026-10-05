import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db, UserFitnessProfile
from app.schemas import FitnessProfileUpdate, FitnessProfileResponse

