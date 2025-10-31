# 🧬 **Compliance Counsel**

### _Automating Indian Corporate Legal & Regulatory Compliance_

**Compliance Counsel** is an intelligent LegalTech SaaS platform that automates **compliance tracking, draft generation, and legal document understanding** for Indian companies — powered by **FastAPI, PostgreSQL, React, and LLaMA-based AI assistants**.

---

## 🚀 **Overview**

Modern Indian companies face complex compliance under **Companies Act, SEBI, FEMA, GST**, and numerous other regulations.
Compliance Counsel helps **Company Secretaries, CFOs, and Legal Teams** by providing:

- 📚 **Automated compliance extraction** from Acts and circulars (PDFs)
- 🗂️ **Centralized compliance database** (Acts, Sections, Rules, Forms, Penalties)
- 🧠 **AI-powered Assistant** for answering legal/compliance queries
- 🧳 **Auto Draft Generator** that generates _CS-grade drafts_ (Resolutions, Notices, Filings)
- 🏢 **Company Dashboard** for managing entity-specific compliances
- 💬 **Role-based access (Admin / User / Viewer)** with JWT authentication
- 🟣 **Fully containerized with Docker** for easy deployment

---

## 🎗️ **System Architecture**

```
Frontend (React + TypeScript)
        │
        ▼
FastAPI Backend (Python)
 ├── /compliances       → CRUD & tracking
 ├── /drafts/generate   → AI-powered draft generation (LLaMA)
 ├── /assistant/ask     → Legal assistant (vector + LLaMA + web fallback)
 ├── /assistant/ingest  → PDF ingestion to database
 ├── /extract/run       → Batch extraction pipeline
 │
PostgreSQL (pgvector)
 ├── acts, rules, forms, compliances, users, companies
 │
Ollama (LLaMA 3) for local inference
pgAdmin for DB GUI
Docker Compose for orchestration
```

---

## 🧩 **Key Features**

### ⚖️ Compliance Management

- Structured relational database for all Acts, Rules, Forms, and Companies.
- Automatic compliance extraction from statutory PDFs using NLP pipelines.

### 🧳 Draft Generation

- On click “**Generate Draft**” creates pre-formatted board resolutions, filings, or notices.
- Powered by **LLaMA-3** with context-aware prompt engineering.

### 🧠 Assistant AI

- `/assistant/ask` endpoint uses:

  - Embedding search (`sentence-transformers/all-MiniLM-L6-v2`)
  - `pgvector` similarity search for compliance documents
  - LLaMA-3 generation for final answers
  - Web fallback via **DuckDuckGo Search API**

### 🧱 Tech Stack

| Layer             | Technology                                |
| ----------------- | ----------------------------------------- |
| **Frontend**      | React + TypeScript + Tailwind + ShadCN/UI |
| **Backend**       | FastAPI + SQLAlchemy + Alembic            |
| **Database**      | PostgreSQL + pgvector                     |
| **AI / ML**       | Ollama (LLaMA 3), SentenceTransformers    |
| **DevOps**        | Docker, Docker Compose                    |
| **Auth**          | JWT Tokens                                |
| **Visualization** | pgAdmin (port 5050)                       |

---

## 🔾️ **Database Schema (simplified)**

**Core Tables**

- `acts (id, name, year, ministry, category)`
- `sections (id, act_id, title, description)`
- `rules, forms, compliances, penalties`
- `companies (id, name, industry_type, status)`
- `users (id, name, email, role, password_hash)`

**Vector & Document Tables**

- `cs_documents (id, title, authority, content, metadata)`
- `cs_vectors (id, document_id, chunk_text, embedding)`

---

## ⚙️ **Setup Instructions**

### 🧱 1️⃣ Prerequisites

- Docker Desktop
- Python 3.10+
- Node.js 18+

---

### 🐳 2️⃣ Run via Docker Compose

```bash
git clone https://github.com/<your-username>/compliance_counsel.git
cd compliance_counsel

docker compose up --build
```

This spins up:

- 🗄️ PostgreSQL (`localhost:5432`)
- ⚙️ FastAPI backend (`localhost:8000`)
- 💾 pgAdmin (`localhost:5050`)
- 🌐 React frontend (`localhost:5173` or configured port)

---

### 🔑 3️⃣ Environment Configuration (`.env`)

```env
# Database
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/compliance_counsel

# JWT
SECRET_KEY=replace_this_with_a_long_random_string_please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Ollama (local LLaMA endpoint)
OLLAMA_URL=http://host.docker.internal:11434/api/generate
```

---

### 📄 4️⃣ Data Ingestion & Extraction

#### Upload Acts / Circulars:

```bash
POST /assistant/ingest_document
file=@CompaniesAct2013.pdf
```

#### Run Automated Extraction:

```bash
POST /extract/run
```

Extracts compliances → normalizes → inserts into DB.

---

### 🪮 5️⃣ Draft Generation

**Endpoint:**

```bash
POST /drafts/generate
{
  "compliance_id": 1,
  "compliance_title": "Annual Return Filing"
}
```

🛡️ Returns a **ready-to-file draft text** (Board Resolution, Notice, or Form).

---

### 💬 6️⃣ AI Assistant Endpoint

**Endpoint:**

```bash
POST /assistant/ask
{
  "question": "What is the due date for CSR compliance under Section 135?"
}
```

🛡️ Returns a structured AI answer (vector + LLaMA + web fallback).

---

## 🧠 **Frontend Highlights**

- Role-based dashboard (Admin/User/Viewer)
- Company-wise compliance tracking table
- One-click draft generation (with loader + modal download)
- AI assistant chat on Help Page
- React hooks for search, pagination, and status badges

---

## 🧰 **Useful Developer Commands**

### Restart backend

```bash
docker compose restart backend
```

### Run extraction manually

```bash
curl -X POST http://localhost:8000/extract/run
```

### Test Assistant

```bash
curl -X POST http://localhost:8000/assistant/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain Form MGT-7A filing timeline"}'
```

---

## 🗰 **Sample SQL Commands**

### Update Compliance Status by Company

```sql
UPDATE compliances
SET status = CASE
    WHEN c.name IN ('Reliance Industries Limited','Tata Consultancy Services Limited','Infosys Limited')
      THEN 'PENDING'::compliance_status_enum
    ELSE 'ACTIVE'::compliance_status_enum
END
FROM companies c
WHERE compliances.company_id = c.id;
```

---

## 👥 **Roles & Authentication**

| Role       | Capabilities                             |
| ---------- | ---------------------------------------- |
| **Admin**  | Manage companies, compliances, and users |
| **User**   | View company dashboard, generate drafts  |
| **Viewer** | Read-only compliance access              |

JWT-protected endpoints ensure secure access to sensitive data.

---

## 💡 **Future Roadmap**

- 🧹 SEBI / FEMA / RBI module integration
- 🔍 Advanced search by Act / Section / Due Date
- 🧠 Fine-tuned legal language model for Indian compliance
- 📈 Analytics dashboard for compliance health monitoring
- 🗕 Auto-reminders for due dates via email / WhatsApp

---

## 👩‍💻 **Developed by**

**Jubi Ranka and Nishtha Jagtap** — MSc Data Science
_(LegalTech • AI • Compliance Automation)_
Built as part of MSc Academic + Industry Integration Project.

---

## 📄 **License**

MIT License © 2025 Compliance Counsel
