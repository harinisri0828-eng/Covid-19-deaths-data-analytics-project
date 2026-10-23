from sqlalchemy import Column, Integer, String, BigInteger, Date, UniqueConstraint, Index
from app.database import Base

class IndiaStateRecord(Base):
    __tablename__ = "india_state_records"

    id = Column(Integer, primary_key=True, index=True)
    state_name = Column(String(100), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    
    confirmed = Column(BigInteger, nullable=True)
    active = Column(BigInteger, nullable=True)
    recovered = Column(BigInteger, nullable=True)
    deaths = Column(BigInteger, nullable=True)
    
    confirmed_delta = Column(BigInteger, nullable=True)
    recovered_delta = Column(BigInteger, nullable=True)
    deaths_delta = Column(BigInteger, nullable=True)
    
    tested = Column(BigInteger, nullable=True)
    vaccinated_dose1 = Column(BigInteger, nullable=True)
    vaccinated_dose2 = Column(BigInteger, nullable=True)

    __table_args__ = (
        UniqueConstraint("state_name", "date", name="uq_india_state_date"),
        Index("ix_india_state_date", "state_name", "date"),
    )

    def to_dict(self):
        return {
            "state_name": self.state_name,
            "date": self.date.isoformat() if self.date else None,
            "confirmed": self.confirmed,
            "active": self.active,
            "recovered": self.recovered,
            "deaths": self.deaths,
            "confirmed_delta": self.confirmed_delta,
            "recovered_delta": self.recovered_delta,
            "deaths_delta": self.deaths_delta,
            "tested": self.tested,
            "vaccinated_dose1": self.vaccinated_dose1,
            "vaccinated_dose2": self.vaccinated_dose2,
        }
