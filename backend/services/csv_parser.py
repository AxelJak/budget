import pandas as pd
import hashlib
from datetime import datetime
from typing import List, Dict, Any
from io import StringIO


def parse_seb_csv(file_content: str) -> List[Dict[str, Any]]:
    """
    Parsar SEB CSV-fil och returnerar lista med transaktioner

    SEB format (vanligtvis):
    - Avgränsare: semikolon (;) eller tab
    - Datum format: YYYY-MM-DD
    - Kolumner: Bokföringsdatum, Valutadatum, Verifikationsnummer, Text/Beteckning, Belopp, Saldo

    Exempel:
    Bokföringsdatum;Valutadatum;Verifikationsnummer;Text/Beteckning;Belopp;Saldo
    2024-01-15;2024-01-15;123456;ICA SUPERMARKET;-456.50;12345.67
    """
    try:
        # Försök detektera avgränsare
        delimiter = detect_delimiter(file_content)

        # Läs CSV med pandas
        df = pd.read_csv(
            StringIO(file_content),
            delimiter=delimiter,
            encoding='utf-8',
            thousands=' ',  # SEB använder mellanslag för tusentals
            decimal=','      # SEB använder komma som decimaltecken
        )

        # Normalisera kolumnnamn (ta bort whitespace, lowercase)
        df.columns = df.columns.str.strip().str.lower()

        # Detektera kolumnnamn (olika varianter från SEB)
        date_col = find_column(df, ['bokföringsdatum', 'datum', 'date', 'bokforingsdatum'])
        desc_col = find_column(df, ['text/beteckning', 'text', 'beskrivning', 'description', 'beteckning'])
        amount_col = find_column(df, ['belopp', 'amount'])
        balance_col = find_column(df, ['saldo', 'balance'])

        if not all([date_col, desc_col, amount_col]):
            raise ValueError("Kunde inte hitta nödvändiga kolumner i CSV-filen")

        transactions = []

        for _, row in df.iterrows():
            # Skippa tomma rader
            if pd.isna(row[date_col]) or pd.isna(row[amount_col]):
                continue

            # Parsa datum
            try:
                date = pd.to_datetime(row[date_col])
            except:
                continue  # Skippa rader med ogiltigt datum

            # Hämta värden
            description = str(row[desc_col]).strip()
            amount = float(str(row[amount_col]).replace(' ', '').replace(',', '.'))
            balance = None

            if balance_col and not pd.isna(row[balance_col]):
                try:
                    balance = float(str(row[balance_col]).replace(' ', '').replace(',', '.'))
                except:
                    pass

            # Skapa import hash för dubblettdetektering
            import_hash = create_import_hash(date, amount, description)

            transactions.append({
                'date': date,
                'description': description,
                'amount': amount,
                'balance': balance,
                'import_hash': import_hash,
                'account_name': 'SEB'
            })

        return transactions

    except Exception as e:
        raise ValueError(f"Fel vid parsning av CSV: {str(e)}")


def detect_delimiter(content: str) -> str:
    """Detektera avgränsare i CSV-fil"""
    first_line = content.split('\n')[0]

    # Räkna förekomster av olika avgränsare
    delimiters = {
        ';': first_line.count(';'),
        '\t': first_line.count('\t'),
        ',': first_line.count(',')
    }

    # Returnera den vanligaste
    return max(delimiters, key=delimiters.get)


def find_column(df: pd.DataFrame, possible_names: List[str]) -> str:
    """Hitta kolumnnamn från lista av möjliga namn"""
    for name in possible_names:
        if name in df.columns:
            return name
    return None


def create_import_hash(date: datetime, amount: float, description: str) -> str:
    """Skapa unik hash för dubblettdetektering"""
    hash_string = f"{date.isoformat()}_{amount}_{description}"
    return hashlib.md5(hash_string.encode()).hexdigest()
