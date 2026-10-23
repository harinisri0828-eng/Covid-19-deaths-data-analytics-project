from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from app.database import Base

class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(100), unique=True, index=True, nullable=False)
    source_url = Column(String(255), nullable=False)
    records_count = Column(Integer, default=0, nullable=False)
    min_date = Column(Date, nullable=True)
    max_date = Column(Date, nullable=True)
    geographic_coverage = Column(String(255), nullable=True)
    last_imported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), default="success", nullable=False)
    notes = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "dataset_name": self.dataset_name,
            "source_url": self.source_url,
            "records_count": self.records_count,
            "min_date": self.min_date.isoformat() if self.min_date else None,
            "max_date": self.max_date.isoformat() if self.max_date else None,
            "geographic_coverage": self.geographic_coverage,
            "last_imported_at": self.last_imported_at.isoformat() if self.last_imported_at else None,
            "status": self.status,
            "notes": self.notes,
        }
