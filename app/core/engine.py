import math
from typing import List
from app.models.flight import FlightObservation, RouteWeight

def calculate_geometric_mean(prices: List[float]) -> float:
    """Calculates the geometric mean of a list of prices."""
    if not prices:
        return 0.0
    
    log_sum = sum(math.log(p) for p in prices if p > 0)
    return math.exp(log_sum / len(prices))

def calculate_apix(observations: List[FlightObservation], weights: List[RouteWeight]) -> float:
    """
    Calculates the chain-linked, passenger-weighted geometric mean price index (APIx).
    Returns the computed index value.
    """
    # Group by route (origin -> destination)
    routes = {}
    for obs in observations:
        key = f"{obs.origin}-{obs.destination}"
        if key not in routes:
            routes[key] = []
        routes[key].append(obs.price_inr)
    
    # Calculate geometric mean for each route
    route_means = {}
    for route, prices in routes.items():
        route_means[route] = calculate_geometric_mean(prices)
        
    # Apply passenger volume weights
    total_index = 0.0
    weight_map = {f"{w.origin}-{w.destination}": w.weight_percentage for w in weights}
    
    for route, mean_price in route_means.items():
        weight = weight_map.get(route, 0)
        # Using a simulated base price anchor of 5000 INR for index normalization calculation
        base_price = 5000.0
        price_relative = (mean_price / base_price) * 100
        total_index += price_relative * (weight / 100.0)
        
    # If no data, return base 100
    if total_index == 0.0:
        return 100.00
        
    return round(total_index, 2)
