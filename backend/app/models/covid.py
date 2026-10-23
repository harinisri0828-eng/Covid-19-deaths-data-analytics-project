from sqlalchemy import Column, Integer, String, Float, Date, UniqueConstraint, Index
from app.database import Base

class CovidRecord(Base):
    __tablename__ = "covid_records"

    id = Column(Integer, primary_key=True, index=True)
    iso_code = Column(String(10), index=True, nullable=False)
    location = Column(String(100), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    
    total_cases = Column(Float, nullable=True)
    new_cases = Column(Float, nullable=True)
    new_cases_smoothed = Column(Float, nullable=True)
    total_deaths = Column(Float, nullable=True)
    new_deaths = Column(Float, nullable=True)
    new_deaths_smoothed = Column(Float, nullable=True)
    
    total_cases_per_million = Column(Float, nullable=True)
    new_cases_per_million = Column(Float, nullable=True)
    total_deaths_per_million = Column(Float, nullable=True)
    new_deaths_per_million = Column(Float, nullable=True)
    
    reproduction_rate = Column(Float, nullable=True)
    total_tests = Column(Float, nullable=True)
    new_tests = Column(Float, nullable=True)
    positive_rate = Column(Float, nullable=True)
    tests_per_case = Column(Float, nullable=True)
    
    total_vaccinations = Column(Float, nullable=True)
    people_vaccinated = Column(Float, nullable=True)
    people_fully_vaccinated = Column(Float, nullable=True)
    new_vaccinations = Column(Float, nullable=True)
    stringency_index = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("iso_code", "date", name="uq_covid_iso_date"),
        Index("ix_covid_location_date", "location", "date"),
    )

    def to_dict(self):
        return {
            "iso_code": self.iso_code,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "total_cases": self.total_cases,
            "new_cases": self.new_cases,
            "new_cases_smoothed": self.new_cases_smoothed,
            "total_deaths": self.total_deaths,
            "new_deaths": self.new_deaths,
            "new_deaths_smoothed": self.new_deaths_smoothed,
            "total_cases_per_million": self.total_cases_per_million,
            "new_cases_per_million": self.new_cases_per_million,
            "total_deaths_per_million": self.total_deaths_per_million,
            "new_deaths_per_million": self.new_deaths_per_million,
            "reproduction_rate": self.reproduction_rate,
            "total_tests": self.total_tests,
            "new_tests": self.new_tests,
            "positive_rate": self.positive_rate,
            "tests_per_case": self.tests_per_case,
            "total_vaccinations": self.total_vaccinations,
            "people_vaccinated": self.people_vaccinated,
            "people_fully_vaccinated": self.people_fully_vaccinated,
            "new_vaccinations": self.new_vaccinations,
            "stringency_index": self.stringency_index,
        }
