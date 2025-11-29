# Budget App

En självhostad webbapp för att spåra hushållets ekonomi. Importera kontoutdrag från SEB (CSV), få automatisk kategorisering och visualisering av budget per löneperiod.

## Funktioner

- **CSV-import**: Drag-and-drop import från SEB-kontoutdrag
- **Automatisk kategorisering**: Lär sig från dina kategoriseringar och föreslår kategorier
- **Dubbletthantering**: Automatisk detektering av dubbletter
- **Löneperioder**: Budgetvy baserad på 25:e till 24:e (konfigurerbart)
- **Visualisering**: Dashboard med grafer och sammanfattningar
- **Kategorihantering**: Skapa egna kategorier med budgetgränser
- **Historisk data**: Stöd för import av flera CSV-filer

## Teknisk Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM för databashantering
- **SQLite** - Enkel fil-baserad databas
- **Pandas** - CSV-parsning och datamanipulering

### Frontend
- **React** - UI-bibliotek
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Grafbibliotek
- **Vite** - Snabb build-tool

## Installation och körning

### Med Docker Compose (Rekommenderat)

```bash
# Klona repo
git clone <repo-url>
cd budget

# Starta med Docker Compose
docker-compose up -d

# Appen är nu tillgänglig på:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Utan Docker (Utveckling)

#### Backend

```bash
cd backend

# Skapa virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installera dependencies
pip install -r requirements.txt

# Starta server
python main.py
# Eller med uvicorn:
uvicorn main:app --reload --port 8000
```

Backend körs på http://localhost:8000

#### Frontend

```bash
cd frontend

# Installera dependencies
npm install

# Starta dev server
npm run dev
```

Frontend körs på http://localhost:5173

## Användning

### 1. Importera transaktioner

1. Ladda ner kontoutdrag från SEB i CSV-format
2. Gå till "Importera"-sidan
3. Dra och släpp CSV-filen eller klicka för att välja
4. Klicka "Importera"

Transaktioner kategoriseras automatiskt baserat på:
- Befintliga regler
- Tidigare manuella kategoriseringar

### 2. Kategorisera transaktioner

1. Gå till "Transaktioner"-sidan
2. Klicka på kategorin för en transaktion
3. Välj ny kategori från dropdown
4. Systemet lär sig och skapar automatiskt en regel

### 3. Hantera kategorier

1. Gå till "Kategorier"-sidan
2. Skapa nya kategorier med:
   - Namn
   - Typ (Inkomst, Fast utgift, Rörlig utgift)
   - Färg
   - Budgetgräns (valfritt)

### 4. Visa översikt

Dashboard visar för aktuell löneperiod (25:e-24:e):
- Totala inkomster
- Totala utgifter
- Netto
- Fördelning fasta vs rörliga utgifter
- Cirkeldiagram per kategori
- Lista med alla kategorier och deras belopp

## SEB CSV-format

Appen stöder SEB:s standard CSV-export med följande kolumner:

```
Bokföringsdatum;Valutadatum;Verifikationsnummer;Text/Beteckning;Belopp;Saldo
2024-01-15;2024-01-15;123456;ICA SUPERMARKET;-456,50;12345,67
```

Appen detekterar automatiskt:
- Avgränsare (semikolon, tab, komma)
- Decimaltecken (komma, punkt)
- Kolumnnamn (olika varianter från SEB)

## Datastruktur

Data lagras i en SQLite-databas (`budget.db`) med följande tabeller:

- **transactions**: Alla transaktioner
- **categories**: Kategorier (Mat, Transport, etc.)
- **category_rules**: Regler för automatisk kategorisering
- **periods**: Cache för period-summering

## API-dokumentation

Backend exponerar ett RESTful API. Fullständig dokumentation finns på:

http://localhost:8000/docs (när servern körs)

### Viktigaste endpoints:

- `POST /api/transactions/import` - Importera CSV
- `GET /api/transactions/` - Hämta transaktioner
- `GET /api/transactions/current-period` - Aktuell periods transaktioner
- `PUT /api/transactions/{id}` - Uppdatera transaktion
- `GET /api/categories/` - Hämta kategorier
- `POST /api/categories/` - Skapa kategori
- `GET /api/periods/current` - Aktuell period-summering
- `GET /api/periods/list` - Lista perioder

## Utveckling

### Projekt-struktur

```
budget/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # Database setup
│   ├── models/
│   │   ├── database.py      # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   ├── routers/
│   │   ├── transactions.py  # Transaction endpoints
│   │   ├── categories.py    # Category endpoints
│   │   └── periods.py       # Period endpoints
│   └── services/
│       ├── csv_parser.py    # CSV parsing logic
│       ├── categorizer.py   # Auto-categorization
│       └── period_calculator.py  # Period calculations
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml
```

### Lägg till nya funktioner

**Backend:**
1. Lägg till/uppdatera modeller i `models/database.py`
2. Skapa/uppdatera Pydantic schemas i `models/schemas.py`
3. Implementera business logic i `services/`
4. Skapa API endpoints i `routers/`

**Frontend:**
1. Uppdatera types i `src/types/`
2. Lägg till API-anrop i `src/api/client.ts`
3. Skapa komponenter i `src/components/`
4. Skapa sidor i `src/pages/`

## Framtida funktioner (Fas 2-4)

### Fas 2 - Förbättrad automatisering
- [ ] Avancerad regelhantering (regex, prioritet)
- [ ] Bulk-kategorisering
- [ ] Smart lärande från mönster

### Fas 3 - Utökad visualisering
- [ ] Trend-grafer över tid
- [ ] Period-jämförelser
- [ ] Export till CSV/Excel
- [ ] Budgetprognoser

### Fas 4 - Extra funktioner
- [ ] Budgetvarningar (när 80%/100% av budget används)
- [ ] Sparmål med progress
- [ ] Multi-användare (separata konton)
- [ ] Mobilanpassning/PWA
- [ ] Stöd för flera bankkonton

## Licens

MIT

## Support

För buggar och feature requests, skapa ett issue på GitHub.
