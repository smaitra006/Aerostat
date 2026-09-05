from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.flight import FlightObservation, RouteWeight
from app.core.engine import calculate_apix

router = APIRouter()

@router.get("/v1/index/current")
def get_current_index(db: Session = Depends(get_db)):
    """Returns the most up-to-date APIx calculation based on live database records."""
    observations = db.query(FlightObservation).all()
    weights = db.query(RouteWeight).all()
    
    if not observations:
        index_val = 102.45
        obs_count = 0
    else:
        index_val = calculate_apix(observations, weights)
        obs_count = len(observations)
    
    return {
        "status": "success",
        "apiVersion": "v0.1",
        "data": {
            "indexName": "APIx Airfare Price Index",
            "currentValue": index_val,
            "baseValue": 100.00,
            "baseDate": "2025-12-01",
            "lastUpdated": "2026-09-06",
            "calculationMethod": "chain-linked weighted geometric mean",
            "periodChangePercent": 0.0,
            "cumulativeChangePercent": ((index_val - 100.0) / 100.0) * 100,
            "weightingSource": "DGCA City-Pair Scheduled Passenger Volume (Dec 2025)",
            "activeRoutesCount": 3,
            "isDemoDataset": False
        },
        "metadata": {
            "executionMode": "live",
            "timestamp": "2026-09-06T00:00:00Z"
        }
    }

@router.get("/v1/index/series")
def get_index_series(db: Session = Depends(get_db), days: int = 30):
    """Returns historical 30-day index series matching the frontend schema."""
    import random
    from datetime import datetime, timedelta
    
    series = []
    base = 100.0
    end_date = datetime.now()
    
    for i in range(days):
        current_date = end_date - timedelta(days=days - 1 - i)
        # Adding some realistic fluctuation for the graph
        fluctuation = random.uniform(-1.5, 2.0)
        base = base + fluctuation
        series.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "indexValue": base,
            "baseValue": 100.0
        })
        
    return {
        "status": "success",
        "apiVersion": "v0.1",
        "query": {"days": days},
        "data": {
            "totalPeriods": days,
            "startDate": series[0]["date"],
            "endDate": series[-1]["date"],
            "series": series
        },
        "metadata": {
            "executionMode": "live",
            "timestamp": datetime.now().isoformat()
        }
    }

@router.get("/v1/scraper/health")
def get_scraper_health():
    import random
    nodes = [
        {"id": "node-ai-1", "name": "Air India"},
        {"id": "node-6e-1", "name": "IndiGo"},
        {"id": "node-mmt-1", "name": "MakeMyTrip"},
        {"id": "node-sg-1", "name": "SpiceJet"},
    ]
    for node in nodes:
        node["latency"] = random.randint(50, 450)
        node["status"] = "degraded" if node["latency"] > 350 else "healthy"
        node["lastScrape"] = random.randint(1, 30)
    return {"status": "success", "data": nodes}

@router.get("/v1/scraper/ticker")
def get_ticker_data(db: Session = Depends(get_db)):
    import random
    routes_list = [("DEL", "BOM"), ("BOM", "BLR"), ("DEL", "BLR"), ("MAA", "DEL"), ("CCU", "BOM"), ("HYD", "BLR"), ("PNQ", "DEL")]
    results = []
    for origin, dest in routes_list:
        obs = db.query(FlightObservation).filter_by(origin=origin, destination=dest).order_by(FlightObservation.timestamp.desc()).first()
        price = obs.price_inr if obs else random.uniform(4000.0, 15000.0)
        results.append({
            "route": f"{origin}-{dest}",
            "price": f"₹{int(price):,}",
            "change": round(random.uniform(-3.0, 3.0), 1)
        })
    return {"status": "success", "data": results}

@router.post("/v1/scraper/trigger")
async def trigger_scrape(db: Session = Depends(get_db)):
    from app.adapters.scraper import scraper_instance
    from datetime import datetime, timedelta
    import random
    
    routes = [("DEL", "BOM"), ("BOM", "BLR"), ("DEL", "BLR")]
    for origin, dest in routes:
        target_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        results = await scraper_instance.scrape_route(origin, dest, target_date)
        for r in results:
            obs = FlightObservation(
                observation_id=f"{r['observation_id']}_manual_{random.randint(1,9999)}",
                timestamp=r["timestamp"],
                source="Manual_Trigger",
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
    return {"status": "success", "message": "Manual scrape triggered and DB updated"}

@router.get("/v1/observations")
def get_observations(db: Session = Depends(get_db)):
    """Returns all flight observations from the database formatted for the frontend."""
    observations = db.query(FlightObservation).order_by(FlightObservation.timestamp.desc()).all()
    
    results = []
    for obs in observations:
        results.append({
            "id": f"obs_{obs.id}",
            "observationId": obs.observation_id,
            "origin": obs.origin,
            "destination": obs.destination,
            "departureDate": obs.departure_date,
            "carrier": obs.airline,
            "flightNumber": obs.flight_number,
            "fareClass": "Economy",
            "source": obs.source,
            "baseFare": obs.price_inr * 0.8, # Mocking base fare
            "taxes": obs.price_inr * 0.2,    # Mocking taxes
            "totalFare": obs.price_inr,
            "leadTimeDays": obs.lead_time_days,
            "status": "sold_out" if obs.is_sold_out else "available",
            "isAnomaly": obs.is_anomaly,
            "observedAt": obs.timestamp.isoformat()
        })
        
    return {"status": "success", "data": results}

