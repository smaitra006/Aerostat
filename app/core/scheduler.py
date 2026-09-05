import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.adapters.scraper import scraper_instance
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

from app.db.database import SessionLocal
from app.models.flight import FlightObservation

async def scheduled_scraping_job():
    """
    Automated background job to scrape major routes for advance booking windows.
    Runs periodically via APScheduler.
    """
    routes = [("DEL", "BOM"), ("BOM", "BLR"), ("DEL", "BLR")]
    lead_times_days = [0, 7, 15]
    
    logger.info("Starting high-frequency scraping cycle...")
    
    db = SessionLocal()
    try:
        for origin, dest in routes:
            for days_out in lead_times_days:
                target_date = (datetime.now() + timedelta(days=days_out)).strftime("%Y-%m-%d")
                try:
                    results = await scraper_instance.scrape_route(origin, dest, target_date)
                    logger.info(f"Successfully scraped {len(results)} fares for {origin}-{dest} on {target_date}")
                    
                    for r in results:
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
                    logger.error(f"Failed to scrape {origin}-{dest} on {target_date}: {e}")
                    db.rollback()
    finally:
        db.close()

def start_scheduler():
    """Initializes and starts the APScheduler."""
    # Run every 15 minutes to keep local dashboard fresh with live scraped data
    scheduler.add_job(scheduled_scraping_job, 'interval', minutes=15, id='scrape_job_15m')
    scheduler.start()
    logger.info("APScheduler started successfully. Live scraper will run every 15 minutes.")
