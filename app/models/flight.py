from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.database import Base

class FlightObservation(Base):
    __tablename__ = "flight_observations"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    source = Column(String, nullable=False)
    
    origin = Column(String(3), index=True, nullable=False)
    destination = Column(String(3), index=True, nullable=False)
    departure_date = Column(String, nullable=False) # Format: YYYY-MM-DD
    
    airline = Column(String, nullable=False)
    flight_number = Column(String, nullable=False)
    
    price_inr = Column(Float, nullable=False)
    lead_time_days = Column(Integer, index=True, nullable=False)
    
    is_sold_out = Column(Boolean, default=False)
    is_anomaly = Column(Boolean, default=False)

class RouteWeight(Base):
    __tablename__ = "route_weights"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String(3), index=True, nullable=False)
    destination = Column(String(3), index=True, nullable=False)
    passenger_volume = Column(Integer, nullable=False)
    weight_percentage = Column(Float, nullable=False)
