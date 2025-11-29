from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from routers import transactions, categories, periods
from models.database import Category
from sqlalchemy.orm import Session

app = FastAPI(
    title="Budget App API",
    description="API för hushållsekonomi-app",
    version="1.0.0"
)

# CORS för att tillåta frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inkludera routers
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(periods.router)


@app.on_event("startup")
def startup_event():
    """Kör vid start av applikationen"""
    # Skapa databas och tabeller
    init_db()

    # Skapa default-kategorier om de inte finns
    db = next(get_db())
    create_default_categories(db)
    db.close()


@app.get("/")
def root():
    return {
        "message": "Budget App API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


def create_default_categories(db: Session):
    """Skapa default-kategorier om databasen är tom"""
    existing = db.query(Category).count()
    if existing > 0:
        return  # Kategorier finns redan

    default_categories = [
        # Inkomster
        {"name": "Lön", "type": "income", "color": "#22c55e"},
        {"name": "Övrigt (Inkomst)", "type": "income", "color": "#10b981"},

        # Fasta utgifter
        {"name": "Hyra/Boende", "type": "fixed", "color": "#ef4444"},
        {"name": "El", "type": "fixed", "color": "#f97316"},
        {"name": "Internet", "type": "fixed", "color": "#f59e0b"},
        {"name": "Försäkringar", "type": "fixed", "color": "#eab308"},
        {"name": "Bolån", "type": "fixed", "color": "#dc2626"},

        # Rörliga utgifter
        {"name": "Mat", "type": "variable", "color": "#3b82f6"},
        {"name": "Transport", "type": "variable", "color": "#6366f1"},
        {"name": "Shopping", "type": "variable", "color": "#8b5cf6"},
        {"name": "Nöje", "type": "variable", "color": "#a855f7"},
        {"name": "Restaurang", "type": "variable", "color": "#ec4899"},
        {"name": "Hälsa", "type": "variable", "color": "#14b8a6"},
        {"name": "Övrigt", "type": "variable", "color": "#64748b"},
    ]

    for cat_data in default_categories:
        category = Category(**cat_data)
        db.add(category)

    db.commit()
    print(f"Skapade {len(default_categories)} default-kategorier")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
