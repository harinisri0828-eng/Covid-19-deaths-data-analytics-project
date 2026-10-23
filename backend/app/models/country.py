from sqlalchemy import Column, Integer, String, Float, BigInteger
from app.database import Base

class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    iso_code = Column(String(10), unique=True, index=True, nullable=False)
    continent = Column(String(50), index=True, nullable=True)
    location = Column(String(100), unique=True, index=True, nullable=False)
    population = Column(BigInteger, nullable=True)
    population_density = Column(Float, nullable=True)
    median_age = Column(Float, nullable=True)
    gdp_per_capita = Column(Float, nullable=True)
    life_expectancy = Column(Float, nullable=True)
    human_development_index = Column(Float, nullable=True)

    def to_dict(self):
        return {
            "iso_code": self.iso_code,
            "continent": self.continent,
            "location": self.location,
            "population": self.population,
            "population_density": self.population_density,
            "median_age": self.median_age,
            "gdp_per_capita": self.gdp_per_capita,
            "life_expectancy": self.life_expectancy,
            "human_development_index": self.human_development_index,
        }
