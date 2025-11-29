# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budget App - A self-hosted web application for tracking household finances with automatic transaction categorization. Imports SEB bank CSV statements, learns from manual categorization, and provides budget visualization based on salary periods (25th to 24th of each month).

**Tech Stack:**
- Backend: FastAPI + SQLAlchemy + SQLite + Pandas
- Frontend: React + TypeScript + Tailwind CSS + Vite + Recharts
- Testing: Playwright (E2E)
- Deployment: Docker Compose

## Development Commands

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend runs on http://localhost:8000, API docs at http://localhost:8000/docs

### Frontend (React/TypeScript)
```bash
cd frontend
npm install
npm run dev        # Dev server on http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

### Docker (Production)
```bash
docker-compose up -d                    # Start containers
docker-compose down                     # Stop containers
docker restart budget-backend           # Restart backend
docker restart budget-frontend          # Restart frontend
docker logs budget-backend --tail 50    # View backend logs

# Deploy code changes to running containers:
cd frontend && npm run build && docker cp dist/. budget-frontend:/usr/share/nginx/html/ && docker restart budget-frontend
docker cp backend/file.py budget-backend:/app/file.py && docker restart budget-backend
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Testing
```bash
cd frontend
npx playwright install                  # First time only
npx playwright test                     # Run all E2E tests
npx playwright test categorization.spec.ts  # Run specific test
npx playwright test --headed            # Run with visible browser
npx playwright show-report              # View test report
```

## Architecture & Key Patterns

### Database Schema (SQLite)
Four main tables with relationships:
- `transactions`: All bank transactions with `import_hash` for duplicate detection
- `categories`: User-defined categories (income/fixed/variable) with optional `budget_limit`
- `category_rules`: Auto-categorization patterns (substring/regex) with priority
- `periods`: Cached period summaries (25th-24th) for performance

**Critical relationships:**
- Transaction → Category (many-to-one, nullable)
- CategoryRule → Category (many-to-one, cascading delete)
- Categories have `type` field: "income", "fixed", or "variable"

### Auto-Categorization System
Located in `backend/services/categorizer.py`:

**TransactionCategorizer** class:
- `categorize(description)`: Matches transaction against rules (priority-ordered)
- `learn_from_manual_categorization()`: Creates new rule from user action
- `_extract_pattern()`: Intelligently extracts company name from description
  - "ICA SUPERMARKET STOCKHOLM" → "ICA"
  - "SBAB BANK AB" → "SBAB"

**Pattern matching:**
1. Rules loaded once at init, sorted by priority (desc)
2. Two types: "substring" (case-insensitive) and "regex"
3. First match wins
4. When user categorizes, system auto-creates rule from first word of description

**Learning flow:**
1. User manually categorizes transaction → `PUT /api/transactions/{id}?learn=true`
2. Backend extracts pattern (e.g., "ICA" from "ICA SUPERMARKET")
3. Creates CategoryRule if not exists
4. Future imports auto-categorize matching transactions

### Period Calculation
Periods run from 25th of month to 24th of next month (Swedish salary period).

**PeriodCalculator** (`backend/services/period_calculator.py`):
- `get_current_period()`: Returns (start_date, end_date) for current period
- `get_period_for_date(date)`: Returns period containing given date
- Handles month boundaries correctly

### CSV Import Flow
`backend/services/csv_parser.py` handles SEB-specific format:

1. **Auto-detection**: Delimiter (`;`, `,`, `\t`), decimal separator (`,`, `.`)
2. **Column mapping**: Flexible - handles different SEB export variants
3. **Hash generation**: Creates `import_hash` from date+amount+description for duplicate detection
4. **Auto-categorization**: Optional (default enabled) - applies rules during import

**Expected SEB format:**
```
Bokföringsdatum;Valutadatum;Verifikationsnummer;Text/Beteckning;Belopp;Saldo
2024-01-15;2024-01-15;123456;ICA SUPERMARKET;-456,50;12345,67
```

### Frontend Architecture

**API Client Pattern** (`frontend/src/api/client.ts`):
- Centralized axios instance with base URL `/api`
- Exported APIs: `transactionApi`, `categoryApi`, `periodApi`
- All endpoints return typed data using interfaces from `src/types/`

**Page Components** (`frontend/src/pages/`):
- **Dashboard**: Period summary, charts (Recharts pie/bar charts)
- **Transactions**: Table with period navigation, bulk operations, filtering
- **Categories**: CRUD for categories with color picker
- **Import**: Drag-and-drop CSV upload with progress feedback

**Key Frontend Patterns:**
- State management: React hooks (useState, useEffect)
- Period navigation: Dropdown + prev/next buttons (newest first, index 0)
- Bulk selection: Set<number> of transaction IDs, highlighted rows (bg-blue-50)
- Swedish locale: date-fns with `sv` locale for date formatting

### Critical Backend Patterns

**Endpoint Structure:**
- Routers in `backend/routers/` map to `/api/{resource}/`
- Use Pydantic schemas from `models/schemas.py` for request/response validation
- Business logic in `services/`, not in routers

**Transaction Endpoints:**
- `GET /api/transactions/` supports filters: `uncategorized`, `category_id`, `start_date`, `end_date`, `search`
- `POST /api/transactions/bulk-categorize` requires `BulkCategorizeRequest` Pydantic model (not query params!)
- `PUT /api/transactions/{id}?learn=true` triggers auto-rule creation
- `POST /api/transactions/auto-categorize` can filter by date range or process all

**Database Sessions:**
- Use `Depends(get_db)` for dependency injection
- Always `db.commit()` after mutations
- Always `db.refresh(obj)` before returning updated objects

## Adding New Features

### Backend Flow
1. **Database Model** (`models/database.py`): Add SQLAlchemy model with relationships
2. **Pydantic Schema** (`models/schemas.py`): Create request/response models
3. **Service Layer** (`services/`): Implement business logic
4. **Router** (`routers/`): Create endpoint using service + schemas
5. **Register Router** (`main.py`): `app.include_router(new_router.router)`

**Example - Adding bulk operations:**
```python
# models/schemas.py
class BulkCategorizeRequest(BaseModel):
    transaction_ids: list[int]
    category_id: Optional[int] = None

# routers/transactions.py
@router.post("/bulk-categorize")
def bulk_categorize(request: BulkCategorizeRequest, db: Session = Depends(get_db)):
    # Use request.transaction_ids, request.category_id
```

### Frontend Flow
1. **Types** (`src/types/`): Define TypeScript interfaces
2. **API Client** (`src/api/client.ts`): Add endpoint method
3. **Component/Page**: Use API, manage state, render UI
4. **Add to Routes** (`App.tsx`): If new page

**Important:** When deploying frontend changes to Docker, rebuild and copy dist:
```bash
npm run build
docker cp dist/. budget-frontend:/usr/share/nginx/html/
docker restart budget-frontend
```

## Categorization Features (Fas 2)

**Three categorization methods:**

1. **Manual**: Click category → select from dropdown → learns pattern
2. **Bulk**: Check multiple → select category in blue bar → categorize all
3. **Auto**: Click "Auto-kategorisera" → apply all rules to uncategorized

**UI Components:**
- Filter button: Toggle `uncategorized=true` query param
- Checkboxes: `Set<number>` state, "Select All" in header
- Bulk bar: Only visible when `selectedTransactions.size > 0`
- Auto button: Two-step confirm (all transactions vs. current period)

**Learning behavior:**
- Manual categorization: Creates rule immediately
- Bulk categorization: Creates rule from **first** transaction only
- Rule already exists: No duplicate created (checked in `categorizer.py`)

## Common Issues & Solutions

### Docker Hot Reload
Backend has volume mount (`./backend:/app`), so Python changes reflect immediately with `--reload`.
Frontend is built into image, so changes require rebuild + copy (see commands above).

### CORS
Backend allows origins: `http://localhost:5173` (dev) and `http://localhost:3000` (Docker).
Update in `main.py` if adding new origins.

### TypeScript Build Errors
Frontend uses strict mode. Common issues:
- Unused imports cause build failures (not just warnings)
- Props must be typed in components
- API responses should match `src/types/` interfaces

### Database Migrations
No migration system (Alembic) yet. Schema changes:
1. Update `models/database.py`
2. Delete `budget.db` (or `data/budget.db` in Docker)
3. Restart app (recreates tables via `init_db()`)
4. Re-import CSV to restore data

**Production alternative:** Backup DB, manually ALTER TABLE, restore on failure.

### Default Categories
Created on first startup in `main.py:create_default_categories()`.
Includes income (Lön), fixed expenses (Hyra, El), and variable expenses (Mat, Transport, etc.).

## SEB CSV Format Notes

Auto-detection handles variations, but expects:
- Semicolon-delimited (most common)
- Swedish decimal comma (`,`) or international period (`.`)
- Columns: date, date, verification, description, amount, balance
- Header row with Swedish names (Bokföringsdatum, Text/Beteckning, etc.)

**Test import:** `backend/data/` directory for sample CSVs (if exists).
