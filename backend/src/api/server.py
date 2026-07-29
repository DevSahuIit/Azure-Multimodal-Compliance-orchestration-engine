import os
import re
import json
import uuid
import time
import logging
import asyncio
import requests
import traceback
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

import bcrypt
import libsql_experimental as libsql
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, HttpUrl

from backend.src.api.telemetry import setup_telemetry
from backend.src.graph.workflow import app as compliance_graph
from backend.src.services.video_indexer import VideoIndexerService

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")


def extract_youtube_id(url: str) -> Optional[str]:
    match = re.search(r"(?:v=|youtu\.be/|embed/)([\w-]{11})", url)
    return match.group(1) if match else None


def get_youtube_title(video_url: str) -> str:
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={video_url}&format=json"
        res = requests.get(oembed_url, timeout=3)
        if res.status_code == 200:
            return res.json().get("title", video_url)
    except Exception as e:
        logger.warning(f"Failed to fetch YouTube title via oEmbed: {str(e)}")
    return video_url


def get_db_connection():
    turso_url = os.getenv("TURSO_DATABASE_URL")
    turso_token = os.getenv("TURSO_AUTH_TOKEN")

    if turso_url and turso_token:
        return libsql.connect(database=turso_url, auth_token=turso_token)
    else:
        is_vercel = os.getenv("VERCEL") == "1"
        db_file = "/tmp/audit_sessions.db" if is_vercel else "audit_sessions.db"
        # Set busy timeout to prevent concurrent lock failures
        return libsql.connect(db_file, timeout=30.0)


def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

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

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_sessions (
                session_id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                video_url TEXT NOT NULL,
                video_title TEXT DEFAULT 'YouTube Asset',
                status TEXT NOT NULL,
                final_report TEXT,
                compliance_score INTEGER DEFAULT 100,
                latency_sec REAL DEFAULT 0.0,
                violations_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users (email)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_cache (
                youtube_id TEXT PRIMARY KEY,
                transcript TEXT,
                ocr_text TEXT,
                video_metadata TEXT,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")


def compute_evaluation_metrics(compliance_results: list) -> dict:
    total_checks = len(compliance_results)
    if total_checks == 0:
        return {"compliance_score": 100, "violations_count": 0}

    violations = [c for c in compliance_results if str(c.get("status", "")).upper() in ["FAIL", "FAILED", "VIOLATION"]]
    critical_breaches = [c for c in violations if str(c.get("severity", "")).capitalize() == "Critical"]

    score = 100 - (len(violations) * 15) - (len(critical_breaches) * 10)
    score = max(0, min(100, score))

    return {"compliance_score": score, "violations_count": len(violations)}


def invoke_compliance_graph(initial_inputs: dict) -> dict:
    logger.info(f"Executing compliance graph for video_id: {initial_inputs.get('video_id')}")
    return compliance_graph.invoke(initial_inputs)


def read_video_cache(youtube_id: str) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT transcript, ocr_text, video_metadata FROM video_cache WHERE youtube_id = ?",
        (youtube_id,),
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "transcript": row[0] or "",
        "ocr_text": json.loads(row[1]) if row[1] else [],
        "video_metadata": json.loads(row[2]) if row[2] else {},
    }


def write_video_cache(youtube_id: str, transcript: str, ocr_text: list, video_metadata: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO video_cache (youtube_id, transcript, ocr_text, video_metadata)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(youtube_id) DO UPDATE SET
               transcript=excluded.transcript,
               ocr_text=excluded.ocr_text,
               video_metadata=excluded.video_metadata""",
        (youtube_id, transcript, json.dumps(ocr_text), json.dumps(video_metadata)),
    )
    conn.commit()
    conn.close()


# -------------------------------------------------------------------
# FASTAPI LIFESPAN & APP INIT
# -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_telemetry()
    await asyncio.to_thread(init_db)

    try:
        vi_service = VideoIndexerService()
        await asyncio.to_thread(vi_service.check_cookie_health)
    except Exception as check_err:
        logger.warning(f"Startup cookie health check encountered an issue: {str(check_err)}")

    logger.info("Application startup sequence complete.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title="Brand Guardian AI API",
    version="2.0.0",
    lifespan=lifespan,
)

# Parsed allowed origins from ENV or fallbacks
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://azure-multimodal-compliance-orchest.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------------

class UserSignUp(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogIn(BaseModel):
    email: EmailStr
    password: str

class AuditRequest(BaseModel):
    email: EmailStr
    video_url: str

# -------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# -------------------------------------------------------------------

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignUp):
    email_clean = user.email.lower().strip()
    hashed_pwd = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_id = str(uuid.uuid4())

    def _execute_signup():
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO users (id, full_name, email, hashed_password) VALUES (?, ?, ?, ?)",
                (user_id, user.full_name, email_clean, hashed_pwd)
            )
            conn.commit()
        except Exception as e:
            conn.close()
            raise e
        conn.close()

    try:
        await asyncio.to_thread(_execute_signup)
    except Exception as e:
        if "UNIQUE" in str(e).upper() or "INTEGRITY" in str(e).upper():
            raise HTTPException(status_code=400, detail="User with this email already exists.")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "message": "User created successfully",
        "user": {"id": user_id, "email": email_clean, "full_name": user.full_name}
    }


@app.post("/auth/login")
async def login(credentials: UserLogIn):
    email_clean = credentials.email.lower().strip()

    def _fetch_user():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, email, hashed_password FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()
        conn.close()
        return row

    row = await asyncio.to_thread(_fetch_user)

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id, full_name, email, hashed_password = row[0], row[1], row[2], row[3]

    if not bcrypt.checkpw(credentials.password.encode('utf-8'), hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Login successful",
        "user": {"id": user_id, "email": email, "full_name": full_name}
    }

# -------------------------------------------------------------------
# CORE APP ENDPOINTS
# -------------------------------------------------------------------

@app.get("/sessions")
async def get_user_sessions(email: str):
    email_clean = email.lower().strip()

    def _fetch_sessions():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT session_id, video_url, video_title, status, final_report,
                      compliance_score, latency_sec, violations_count, created_at
               FROM audit_sessions
               WHERE user_email = ?
               ORDER BY created_at DESC""",
            (email_clean,)
        )
        rows = cursor.fetchall()
        conn.close()
        return rows

    rows = await asyncio.to_thread(_fetch_sessions)

    sessions = []
    for row in rows:
        sessions.append({
            "session_id": row[0],
            "video_url": row[1],
            "video_title": row[2],
            "status": row[3],
            "final_report": row[4],
            "compliance_score": row[5],
            "latency_sec": row[6],
            "violations_count": row[7],
            "created_at": str(row[8])
        })
    return sessions


@app.post("/audit")
async def audit_video(request: AuditRequest):
    session_id = str(uuid.uuid4())
    video_id_short = f"vid_{session_id[:8]}"
    email_clean = request.email.lower().strip()
    video_url_str = str(request.video_url).strip()

    video_title = await asyncio.to_thread(get_youtube_title, video_url_str)
    youtube_id = extract_youtube_id(video_url_str)

    initial_inputs = {
        "video_url": video_url_str,
        "video_id": video_id_short,
        "compliance_results": [],
        "errors": []
    }

    if youtube_id:
        cached = await asyncio.to_thread(read_video_cache, youtube_id)
        if cached:
            logger.info(f"[Session: {session_id}] Cache hit for YouTube ID {youtube_id}.")
            initial_inputs.update(cached)

    start_time = time.time()
    try:
        final_state = await asyncio.to_thread(invoke_compliance_graph, initial_inputs)
        execution_latency = round(time.time() - start_time, 2)

        status_val = final_state.get("final_status", "COMPLETED")
        final_report = final_state.get("final_report", "No report generated.")
        compliance_results = final_state.get("compliance_results", [])

        if youtube_id and final_state.get("transcript") and status_val != "fail":
            await asyncio.to_thread(
                write_video_cache,
                youtube_id,
                final_state.get("transcript", ""),
                final_state.get("ocr_text", []),
                final_state.get("video_metadata", {}),
            )

        metrics = compute_evaluation_metrics(compliance_results)

        def _record_session():
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO audit_sessions
                   (session_id, user_email, video_url, video_title, status, final_report, compliance_score, latency_sec, violations_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (session_id, email_clean, video_url_str, video_title, status_val, final_report, metrics["compliance_score"], execution_latency, metrics["violations_count"])
            )
            conn.commit()
            conn.close()

        await asyncio.to_thread(_record_session)

        return {
            "session_id": session_id,
            "user_email": email_clean,
            "video_id": video_id_short,
            "video_title": video_title,
            "status": status_val,
            "final_report": final_report,
            "compliance_score": metrics["compliance_score"],
            "latency_sec": execution_latency,
            "violations_count": metrics["violations_count"],
            "compliance_results": compliance_results
        }

    except Exception as e:
        execution_latency = round(time.time() - start_time, 2)
        error_details = traceback.format_exc()
        logger.error(f"[Session: {session_id}] Workflow execution failed:\n{error_details}")

        error_msg = f"Audit skipped: {str(e)}"

        def _record_failed_session():
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """INSERT INTO audit_sessions
                       (session_id, user_email, video_url, video_title, status, final_report, compliance_score, latency_sec, violations_count)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (session_id, email_clean, video_url_str, video_title, "FAILED", error_msg, 0, execution_latency, 0)
                )
                conn.commit()
                conn.close()
            except Exception as db_err:
                logger.error(f"Failed to record audit failure in DB: {str(db_err)}")

        await asyncio.to_thread(_record_failed_session)

        return {
            "session_id": session_id,
            "errors": [str(e)],
            "final_status": "fail",
            "final_report": error_msg,
            "transcript": "",
            "ocr_text": []
        }