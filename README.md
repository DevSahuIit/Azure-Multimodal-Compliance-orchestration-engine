# 🛡️ Vigilant Agent

> **Autonomous Agentic AI Platform for Multi-Modal Regulatory & Brand Compliance Auditing**

Vigilant Agent is an enterprise-grade AI compliance platform that automatically audits YouTube videos against regulatory policies and brand guidelines. It combines **Azure Video Indexer**, **LangGraph**, **Retrieval-Augmented Generation (RAG)**, and **Groq Llama-3** to analyze speech, OCR text, and video metadata before generating a detailed compliance report with violation evidence, audit metrics, and executive insights.

---

# ✨ Features

- 🎥 Automated YouTube video compliance auditing
- 🤖 Autonomous LangGraph agent orchestration
- 🧠 Retrieval-Augmented Generation (RAG) policy engine
- 🔍 OCR and speech transcript analysis using Azure Video Indexer
- ⚡ Groq Llama-3 reasoning with Tenacity exponential retry mechanism
- 📊 Compliance score generation (0–100)
- 📈 Latency tracking and audit analytics
- 💾 SQLite-based audit history and persistence
- 🔐 User authentication and audit session management
- 📄 Executive compliance reports with policy violations

---

# 🏗️ System Architecture

```text
                        Client (React + Tailwind)
                                  │
             ┌────────────────────┴─────────────────────┐
             │                                          │
      User Authentication                      Audit Request
      (/signup, /login)                     (YouTube Video URL)
             │                                          │
             └────────────────────┬─────────────────────┘
                                  │
                                  ▼
                 ┌───────────────────────────────────┐
                 │        FastAPI Backend            │
                 └───────────────────────────────────┘
                                  │
        ┌────────────────────────────────────────────────────┐
        │                                                    │
        │ 1. YouTube Metadata Retrieval (oEmbed API)         │
        │ 2. Media Download (yt-dlp)                         │
        │ 3. Azure Video Indexer Processing                  │
        │ 4. LangGraph Agent Workflow                        │
        │ 5. Compliance Metric Engine                        │
        │ 6. SQLite Audit Database                           │
        │                                                    │
        └────────────────────────────────────────────────────┘
                                  │
                                  ▼
                  Executive Compliance Report
```

---

# 🤖 Agent Workflow

```text
                 ┌──────────────────────────────┐
                 │  Audio + OCR Extraction      │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Policy Retrieval (Vector DB) │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Groq Llama-3 Reasoning Agent │
                 └──────────────┬───────────────┘
                                │
                    ┌───────────┴────────────┐
                    │ Rate Limit Encountered?│
                    └───────┬─────────┬──────┘
                            │         │
                          Yes         No
                            │         │
                            ▼         ▼
                Exponential Retry    Compliance Metrics
                 (2s → 4s → 8s)      Report Generation
```

---

# 📂 Project Structure

```text
Vigilant-Agent/
│
├── backend/
│   ├── api/
│   ├── agents/
│   ├── services/
│   ├── database/
│   ├── utils/
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── assets/
│
├── knowledge_base/
├── requirements.txt
├── package.json
└── README.md
```

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine.git

cd Azure-Multimodal-Compliance-orchestration-engine
```

---

## Create Virtual Environment

### Windows

```bash
python -m venv .venv

.\.venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv .venv

source .venv/bin/activate
```

---

## Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## Install Frontend Dependencies

```bash
npm install
```

---

# 🗄️ Database Initialization

Run the following command once to create the SQLite database.

```bash
python -c "import sqlite3; conn=sqlite3.connect('audit_sessions.db'); cursor=conn.cursor(); cursor.execute('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, hashed_password TEXT NOT NULL, reset_token TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'); cursor.execute('CREATE TABLE IF NOT EXISTS audit_sessions (session_id TEXT PRIMARY KEY, user_email TEXT NOT NULL, video_url TEXT NOT NULL, video_title TEXT DEFAULT ''YouTube Asset'', status TEXT NOT NULL, final_report TEXT, compliance_score INTEGER DEFAULT 100, latency_sec REAL DEFAULT 0.0, violations_count INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'); conn.commit(); conn.close(); print('Database Initialized')"
```

---

# 🔑 Environment Variables

Create a **.env** file inside the project root.

```env
# Groq API
GROQ_API_KEY=your_groq_api_key

# Azure Video Indexer
AZURE_VI_ACCOUNT_ID=your_account_id
AZURE_VI_LOCATION=eastus
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_RESOURCE_GROUP=your_resource_group
AZURE_VI_NAME=your_video_indexer_name

# Azure Application Insights (Optional)
APPLICATIONINSIGHTS_CONNECTION_STRING=your_connection_string
```

---

# 🚀 Running the Project

## Start Backend

```bash
uvicorn backend.src.api.server:app --reload --port 8000
```

---

## Start Frontend

```bash
npm run dev
```

---

Open your browser and visit

```text
http://localhost:5173
```

---

# 📡 API Reference

## Submit Compliance Audit

```http
POST /audit
```

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Registered user email |
| video_url | string | Yes | YouTube Video URL |

---

### Sample Response

```json
{
  "session_id": "c6e35b4e-8577-11f1-b716-8cf8c554299a",
  "video_id": "vid_c6e35b4e",
  "video_title": "Product Promotional Media",
  "status": "COMPLETED",
  "compliance_score": 85,
  "latency_sec": 4.2,
  "violations_count": 1,
  "final_report": "FAIL: Breach of RULE-003 at 00:12 due to unsubstantiated financial claim."
}
```

---

# 📊 Evaluation Metrics

| Metric | Formula | Target |
|----------|----------|----------|
| Compliance Score | max(0,100−15×Breaches−10×CriticalBreaches) | ≥ 80 |
| Audit Latency | Completion Time − Submission Time | < 15 sec |
| Violation Count | Total Verified Violations | 0 Preferred |

---

# 🛠️ Tech Stack

## Frontend

- React 18
- Vite
- Tailwind CSS
- Lucide React
- Zod

## Backend

- Python 3.11
- FastAPI
- Uvicorn
- SQLite
- Tenacity

## AI & Agentic Framework

- LangGraph
- LangChain
- Groq Llama-3
- Retrieval-Augmented Generation (RAG)

## Cloud Services

- Azure Video Indexer
- Azure Resource Manager
- Azure Application Insights
- Vercel

---

# 🔄 End-to-End Pipeline

```text
YouTube URL
      │
      ▼
Metadata Collection
      │
      ▼
Video Download
      │
      ▼
Azure Video Indexer
      │
      ▼
Speech + OCR Extraction
      │
      ▼
Policy Retrieval (RAG)
      │
      ▼
Groq Llama-3 Compliance Agent
      │
      ▼
Compliance Metrics
      │
      ▼
SQLite Storage
      │
      ▼
Executive Audit Dashboard
```

---

# 🚀 Future Improvements

- Multi-Agent Compliance Validation
- PostgreSQL Support
- Docker Deployment
- Kubernetes Scaling
- CI/CD Pipeline
- Azure Blob Storage
- Real-Time Streaming Compliance
- Multi-language Video Auditing
- PDF Report Export
- Admin Analytics Dashboard

---

# 🤝 Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Dev Sahu**

B.Tech Mathematics & Computing • IIT Jammu

Interested in Agentic AI • Cloud AI • LLM Systems • Multi-Agent Workflows