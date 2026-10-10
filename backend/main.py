from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import os
import time
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import models
from database import engine, get_db
from jose import jwt


load_dotenv(dotenv_path=Path(__file__).parent / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

models.Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    return user


# --- Pydantic Request/Response Models ---
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    profession: Optional[str] = None
    monthly_income: Optional[float] = None

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None

class ExpenseResponse(ExpenseCreate):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class AIPlanRequest(BaseModel):
    monthly_income: float
    financial_goals: Optional[str] = "Save 20% and balance lifestyle expenses"

class ExpenseItem(BaseModel):
    amount: float
    category: str

class InsightRequest(BaseModel):
    expenses: List[ExpenseItem]
    budget: float


# --- Routes ---
@app.get("/")
def read_root():
    return {"message": "Budget Tracker API is running"}

@app.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        return {"error": "Email already registered!"}

    hashed_password = pwd_context.hash(data.password)
    new_user = models.User(name=data.name, email=data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Account created", "user_id": new_user.id}

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        return {"error": "Invalid email or password"}

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": user.email, "user_id": user.id, "exp": expire}
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "monthly_income": current_user.monthly_income,
        "profession": current_user.profession,
    }

@app.patch("/users/me")
def update_profile(
    data: UpdateProfileRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.profession is not None:
        current_user.profession = data.profession
    if data.monthly_income is not None:
        current_user.monthly_income = data.monthly_income

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "monthly_income": current_user.monthly_income,
        "profession": current_user.profession,
    }

@app.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_expense = models.Expense(**expense.model_dump(), user_id=current_user.id)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()

# --- DELETE EXPENSE ---
@app.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found or unauthorized")

    db.delete(expense)
    db.commit()
    return None

# --- EDIT (UPDATE) EXPENSE ---
@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseCreate,  # Reusing your Pydantic schema (amount, category, description)
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found")

    expense.amount = payload.amount
    expense.category = payload.category
    expense.description = payload.description

    db.commit()
    db.refresh(expense)
    return expense

@app.post("/ai/plan")
def generate_spending_and_savings_plan(
    payload: AIPlanRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
    total_spent = sum(e.amount for e in expenses)

    prompt = f"""
    The user earns ₦{payload.monthly_income} monthly and has spent ₦{total_spent} recently.
    Their goal: {payload.financial_goals}.

    Create an empathetic, structured financial breakdown for them in JSON format with these key fields:
    1. "needs": Target amount for essentials.
    2. "wants": Target amount for personal enjoyment.
    3. "savings_and_investments": Target amount for future security.
    4. "coaching_message": A reassuring, 2-sentence note encouraging good money habits without judgment.
    """

    
      # Retry mechanism for 503 errors
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )
            return {"plan": response.text}
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                time.sleep(2)  # Wait 2 seconds before retrying
                continue
            
            # Return clean error message instead of 500 server crash
            raise HTTPException(
                status_code=503, 
                detail="Gemini API is currently overloaded. Please try again in a few moments."
            )

@app.post("/insight")
def get_insight(data: InsightRequest):
    expense_summary = ", ".join([f"{e.category}: ₦{e.amount}" for e in data.expenses])

    prompt = f"""You are a friendly budget advisor. A user has a monthly budget of ₦{data.budget}.
Their expenses so far: {expense_summary}.
Give one short, encouraging tip (2-3 sentences max) about their spending."""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return {"plan": response.text}