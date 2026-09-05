import logging
from sqlalchemy.orm import Session
from app.db.database import Base, engine, SessionLocal
from app.models.flight import RouteWeight, FlightObservation
from app.adapters.scraper import scraper_instance

logger = logging.getLogger(__name__)

def initialize_database():
    """Create tables if they don't exist and seed initial data."""
    if engine is None:
        logger.warning("Database engine is not available. Skipping DB initialization.")
        return

    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Seed RouteWeights if empty
        if db.query(RouteWeight).count() == 0:
            logger.info("Seeding initial RouteWeights...")
            weights = [
                RouteWeight(origin="DEL", destination="BOM", passenger_volume=650000, weight_percentage=45.5),
                RouteWeight(origin="BOM", destination="BLR", passenger_volume=450000, weight_percentage=31.5),
                RouteWeight(origin="DEL", destination="BLR", passenger_volume=330000, weight_percentage=23.0),
            ]
            db.add_all(weights)
            db.commit()

        # Seed some initial FlightObservations if empty so the index has a base
        if db.query(FlightObservation).count() == 0:
            logger.info("Seeding initial FlightObservations...")
            import asyncio
            from datetime import datetime, timedelta
            
            # Using the scraper's simulation method to generate seed data synchronously
            for origin, dest in [("DEL", "BOM"), ("BOM", "BLR"), ("DEL", "BLR")]:
                for days_out in [0, 7, 15]:
                    target_date = (datetime.now() + timedelta(days=days_out)).strftime("%Y-%m-%d")
                    mock_results = scraper_instance._simulate_successful_scrape(origin, dest, target_date)
                    for r in mock_results:
                        obs = FlightObservation(
                            observation_id=r["observation_id"],
                            timestamp=r["timestamp"],
                            source=r["source"],
                            origin=r["origin"],
                            destination=r["destination"],
                            departure_date=r["departure_date"],
                            airline=r["airline"],
                            flight_number=r["flight_number"],
                            price_inr=r["price_inr"],
                            lead_time_days=r["lead_time_days"],
                            is_sold_out=r["is_sold_out"],
                            is_anomaly=r["is_anomaly"]
                        )
                        db.add(obs)
            db.commit()
    except Exception as e:
        logger.error(f"Failed to seed database: {e}")
        db.rollback()
    finally:
        db.close()
