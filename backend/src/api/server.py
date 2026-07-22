import os
import uuid
import logging
import sqlite3
import secrets
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from backend.src.api.telemetry import setup_telemetry
from backend.src.graph.workflow import app as compliance_graph

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")

setup_telemetry()

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_FILE = "audit_sessions.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            reset_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Audit Sessions Table mapped via user_email
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_sessions (
            session_id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            video_url TEXT NOT NULL,
            status TEXT NOT NULL,
            final_report TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    conn.commit()
    conn.close()

init_db()

app = FastAPI(title="Brand Guardian AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class SignUpRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class AuditRequest(BaseModel):
    email: EmailStr
    video_url: str

# --- Authentication Endpoints ---

@app.post("/auth/signup")
async def signup(req: SignUpRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
    
    user_id = str(uuid.uuid4())
    hashed_pwd = pwd_context.hash(req.password)
    
    cursor.execute(
        "INSERT INTO users (id, full_name, email, hashed_password) VALUES (?, ?, ?, ?)",
        (user_id, req.full_name, req.email.lower(), hashed_pwd)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Account created successfully!", "email": req.email.lower(), "full_name": req.full_name}

@app.post("/auth/login")
async def login(req: LoginRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, full_name, hashed_password FROM users WHERE email = ?", (req.email.lower(),))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not pwd_context.verify(req.password, user[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return {
        "message": "Login successful",
        "user": {
            "id": user[0],
            "full_name": user[1],
            "email": req.email.lower()
        }
    }

@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        # Return success anyway to avoid account enumeration
        return {"message": "If an account exists, a reset code was generated."}
    
    reset_token = secrets.token_hex(3) # 6-character code
    cursor.execute("UPDATE users SET reset_token = ? WHERE email = ?", (reset_token, req.email.lower()))
    conn.commit()
    conn.close()
    
    logger.info(f"[PASSWORD RESET TOKEN GENERATED] Email: {req.email.lower()} -> Code: {reset_token}")
    return {"message": "Reset code generated successfully.", "demo_reset_code": reset_token}

@app.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, reset_token FROM users WHERE email = ?", (req.email.lower(),))
    user = cursor.fetchone()
    
    if not user or user[1] != req.token:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid reset token or email.")
    
    new_hashed_pwd = pwd_context.hash(req.new_password)
    cursor.execute("UPDATE users SET hashed_password = ?, reset_token = NULL WHERE email = ?", (new_hashed_pwd, req.email.lower()))
    conn.commit()
    conn.close()
    
    return {"message": "Password updated successfully! Please login."}

# --- User History & Audit Endpoints ---

@app.get("/sessions")
async def get_user_sessions(email: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT session_id, video_url, status, final_report, created_at FROM audit_sessions WHERE user_email = ? ORDER BY created_at DESC",
        (email.lower(),)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/audit")
async def audit_video(request: AuditRequest):
    session_id = str(uuid.uuid4())
    video_id_short = f"vid_{session_id[:8]}"

    initial_inputs = {
        "video_url": request.video_url,
        "video_id": video_id_short,
        "compliance_results": [],
        "errors": []
    }

    try:
        final_state = compliance_graph.invoke(initial_inputs)
        status = final_state.get("final_status", "COMPLETED")
        final_report = final_state.get("final_report", "No report generated.")

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_sessions (session_id, user_email, video_url, status, final_report) VALUES (?, ?, ?, ?, ?)",
            (session_id, request.email.lower(), request.video_url, status, final_report)
        )
        conn.commit()
        conn.close()

        return {
            "session_id": session_id,
            "user_email": request.email.lower(),
            "video_id": video_id_short,
            "status": status,
            "final_report": final_report,
            "compliance_results": final_state.get("compliance_results", [])
        }
    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))