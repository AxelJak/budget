from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Tuple


class PeriodCalculator:
    """Beräknar löneperioder (25:e till 24:e)"""

    def __init__(self, period_start_day: int = 25):
        self.period_start_day = period_start_day

    def get_current_period(self) -> Tuple[datetime, datetime]:
        """Returnerar start och slut för aktuell löneperiod"""
        now = datetime.now()
        return self.get_period_for_date(now)

    def get_period_for_date(self, date: datetime) -> Tuple[datetime, datetime]:
        """Returnerar start och slut för perioden som innehåller given datum"""
        # Om vi är innan period_start_day denna månad, tillhör vi föregående period
        if date.day < self.period_start_day:
            # Period startade föregående månad
            start_date = datetime(date.year, date.month, self.period_start_day) - relativedelta(months=1)
            end_date = datetime(date.year, date.month, self.period_start_day - 1)
        else:
            # Period startade denna månad
            start_date = datetime(date.year, date.month, self.period_start_day)
            end_date = datetime(date.year, date.month, self.period_start_day - 1) + relativedelta(months=1)

        # Sätt tid till start/slut av dagen
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        return start_date, end_date

    def get_previous_period(self, start_date: datetime) -> Tuple[datetime, datetime]:
        """Returnerar föregående period givet en startdatum"""
        prev_start = start_date - relativedelta(months=1)
        return self.get_period_for_date(prev_start)

    def get_next_period(self, start_date: datetime) -> Tuple[datetime, datetime]:
        """Returnerar nästa period givet en startdatum"""
        next_start = start_date + relativedelta(months=1)
        return self.get_period_for_date(next_start)

    def format_period(self, start_date: datetime, end_date: datetime) -> str:
        """Formatera period för visning, t.ex. '25 jan - 24 feb 2024'"""
        months_sv = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun',
                     'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

        start_month = months_sv[start_date.month - 1]
        end_month = months_sv[end_date.month - 1]

        return f"{start_date.day} {start_month} - {end_date.day} {end_month} {end_date.year}"
