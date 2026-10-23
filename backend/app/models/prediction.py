from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    region = Column(String(100), index=True, nullable=False)
    model_name = Column(String(50), index=True, nullable=False)
    horizon_days = Column(Integer, nullable=False)
    scenario = Column(String(50), default="baseline", nullable=False)
    r2_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    input_parameters = Column(Text, nullable=False)  # JSON serialized
    forecast_output = Column(Text, nullable=False)   # JSON serialized

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "region": self.region,
            "model_name": self.model_name,
            "horizon_days": self.horizon_days,
            "scenario": self.scenario,
            "r2_score": self.r2_score,
            "rmse": self.rmse,
            "mae": self.mae,
            "input_parameters": json.loads(self.input_parameters) if self.input_parameters else {},
            "forecast_output": json.loads(self.forecast_output) if self.forecast_output else [],
        }
