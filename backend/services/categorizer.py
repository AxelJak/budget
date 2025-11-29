import re
from typing import Optional, List
from sqlalchemy.orm import Session
from models.database import CategoryRule, Category


class TransactionCategorizer:
    """Automatisk kategorisering av transaktioner baserat på regler"""

    def __init__(self, db: Session):
        self.db = db
        self._load_rules()

    def _load_rules(self):
        """Ladda alla kategoriseringsregler sorterade efter prioritet"""
        self.rules = (
            self.db.query(CategoryRule)
            .order_by(CategoryRule.priority.desc())
            .all()
        )

    def categorize(self, description: str) -> Optional[int]:
        """
        Kategorisera en transaktion baserat på beskrivning
        Returnerar category_id eller None
        """
        description_lower = description.lower()

        for rule in self.rules:
            if rule.pattern_type == "substring":
                if rule.pattern.lower() in description_lower:
                    return rule.category_id

            elif rule.pattern_type == "regex":
                if re.search(rule.pattern, description, re.IGNORECASE):
                    return rule.category_id

        return None

    def learn_from_manual_categorization(
        self,
        description: str,
        category_id: int,
        priority: int = 0
    ) -> CategoryRule:
        """
        Skapa en ny regel baserat på manuell kategorisering
        Extraherar den mest signifikanta delen av beskrivningen
        """
        # Extrahera nyckelord (förenklade exempel)
        # Ta bort vanliga prefixer och extrahera kärnord
        pattern = self._extract_pattern(description)

        # Kolla om regeln redan finns
        existing_rule = (
            self.db.query(CategoryRule)
            .filter(
                CategoryRule.pattern == pattern,
                CategoryRule.category_id == category_id
            )
            .first()
        )

        if existing_rule:
            return existing_rule

        # Skapa ny regel
        new_rule = CategoryRule(
            category_id=category_id,
            pattern=pattern,
            pattern_type="substring",
            priority=priority
        )

        self.db.add(new_rule)
        self.db.commit()
        self.db.refresh(new_rule)

        # Uppdatera regelcache
        self._load_rules()

        return new_rule

    def _extract_pattern(self, description: str) -> str:
        """
        Extrahera mönster från beskrivning
        Exempel:
        - "ICA SUPERMARKET STOCKHOLM" -> "ICA"
        - "SBAB BANK AB" -> "SBAB"
        - "Spotify Premium" -> "Spotify"
        """
        # Ta bort vanliga suffix
        description = re.sub(r'\s+(AB|LTD|INC|CORP|STOCKHOLM|GÖTEBORG|MALMÖ).*$', '', description, flags=re.IGNORECASE)

        # Ta första ordet (vanligtvis företagsnamn)
        words = description.strip().split()
        if words:
            return words[0].upper()

        return description.strip().upper()
