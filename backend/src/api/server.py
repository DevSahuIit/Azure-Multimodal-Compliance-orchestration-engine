import os
import uuid
import time
import logging
import sqlite3
import secrets
import requests  # <-- Ensure requests is imported
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.src.api.telemetry import setup_telemetry
from backend.src.graph.workflow import app as compliance_graph

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")

setup_telemetry()

# Helper to fetch YouTube Video Title fast via oEmbed
def get_youtube_title(video_url: str) -> str:
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={video_url}&format=json"
        res = requests.get(oembed_url, timeout=3)
        if res.status_code == 200:
            return res.json().get("title", video_url)
    except Exception:
        pass
    return video_url  # Fallback to URL if title fetch fails

DB_FILE = "audit_sessions.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
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
    conn.commit()
    conn.close()

init_db()

def compute_evaluation_metrics(compliance_results: list) -> dict:
    total_checks = len(compliance_results)
    if total_checks == 0:
        return {"compliance_score": 100, "violations_count": 0}

    violations = [c for c in compliance_results if str(c.get("status", "")).upper() in ["FAIL", "FAILED", "VIOLATION"]]
    critical_breaches = [c for c in violations if str(c.get("severity", "")).capitalize() == "Critical"]
    
    score = 100 - (len(violations) * 15) - (len(critical_breaches) * 10)
    score = max(0, min(100, score))

    return {
        "compliance_score": score,
        "violations_count": len(violations)
    }

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
def invoke_compliance_graph_with_retry(initial_inputs: dict) -> dict:
    logger.info(f"Executing compliance graph for video_id: {initial_inputs.get('video_id')}")
    return compliance_graph.invoke(initial_inputs)

app = FastAPI(title="Brand Guardian AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    email: EmailStr
    video_url: str

@app.get("/sessions")
async def get_user_sessions(email: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT session_id, video_url, video_title, status, final_report, compliance_score, latency_sec, violations_count, created_at FROM audit_sessions WHERE user_email = ? ORDER BY created_at DESC",
        (email.lower(),)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/audit")
async def audit_video(request: AuditRequest):
    session_id = str(uuid.uuid4())
    video_id_short = f"vid_{session_id[:8]}"
    video_title = get_youtube_title(request.video_url)

    initial_inputs = {
        "video_url": request.video_url,
        "video_id": video_id_short,
        "compliance_results": [],
        "errors": []
    }

    start_time = time.time()
    try:
        final_state = invoke_compliance_graph_with_retry(initial_inputs)
        execution_latency = round(time.time() - start_time, 2)
        
        status = final_state.get("final_status", "COMPLETED")
        final_report = final_state.get("final_report", "No report generated.")
        compliance_results = final_state.get("compliance_results", [])

        metrics = compute_evaluation_metrics(compliance_results)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO audit_sessions 
               (session_id, user_email, video_url, video_title, status, final_report, compliance_score, latency_sec, violations_count) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (session_id, request.email.lower(), request.video_url, video_title, status, final_report, metrics["compliance_score"], execution_latency, metrics["violations_count"])
        )
        conn.commit()
        conn.close()

        return {
            "session_id": session_id,
            "user_email": request.email.lower(),
            "video_id": video_id_short,
            "video_title": video_title,
            "status": status,
            "final_report": final_report,
            "compliance_score": metrics["compliance_score"],
            "latency_sec": execution_latency,
            "violations_count": metrics["violations_count"],
            "compliance_results": compliance_results
        }
    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))