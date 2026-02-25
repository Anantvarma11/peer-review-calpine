from typing import List, Dict, Any, Optional
from datetime import datetime, date
from app import schemas
# Mock Plans Definition
# In a real app, this would come from a database (DIM_PLAN)
MARKET_PLANS = [
    {
        "plan_id": "SAVER_NIGHTS_12",
        "name": "Saver Nights 12",
        "description": "Best for Night-time EV Charging",
        "tags": ["Cheapest", "EV Friendly"],
        "features": {
            "contract_months": 12, "cancellation_fee": 150, "renewable_pct": 0,
            "best_for": "EV owners & night owls", "rate_type": "Time of Use",
            "smart_thermostat_discount": False, "autopay_discount": True,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 9.95,
            "peak_rate": 0.18,
            "offpeak_rate": 0.05,
            "peak_hours": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
            "offpeak_hours": [22, 23, 0, 1, 2, 3, 4, 5]
        },
        "pros": ["Lowest night rates at $0.05/kWh", "Great for EV charging overnight", "Autopay discount available"],
        "cons": ["High peak rates at $0.18/kWh", "$150 early termination fee"]
    },
    {
        "plan_id": "FIXED_SAVER_12",
        "name": "Fixed Saver 12",
        "description": "Lock in a low rate for 12 months.",
        "tags": ["Stable", "Balanced"],
        "features": {
            "contract_months": 12, "cancellation_fee": 100, "renewable_pct": 0,
            "best_for": "Budget-conscious families", "rate_type": "Fixed Flat",
            "smart_thermostat_discount": False, "autopay_discount": True,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 4.95,
            "flat_rate": 0.125,
            "type": "FLAT"
        },
        "pros": ["Predictable bills every month", "Lowest fixed charge at $4.95/mo", "No peak/off-peak hassle"],
        "cons": ["No savings for off-peak usage", "No renewable energy"]
    },
    {
        "plan_id": "GREEN_FLEX",
        "name": "Green Flex",
        "description": "100% Renewable Energy.",
        "tags": ["Greenest"],
        "features": {
            "contract_months": 6, "cancellation_fee": 75, "renewable_pct": 100,
            "best_for": "Eco-conscious households", "rate_type": "Fixed Flat",
            "smart_thermostat_discount": True, "autopay_discount": True,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 8.95,
            "flat_rate": 0.145,
            "type": "FLAT",
            "is_green": True
        },
        "pros": ["100% renewable wind/solar energy", "Short 6-month contract", "Smart thermostat discount"],
        "cons": ["Higher rate at $0.145/kWh", "No time-of-use savings"]
    },
    {
        "plan_id": "WEEKEND_FREE",
        "name": "Free Weekends",
        "description": "Free electricity every weekend!",
        "tags": ["Balanced"],
        "features": {
            "contract_months": 12, "cancellation_fee": 200, "renewable_pct": 0,
            "best_for": "Work-from-home on weekdays", "rate_type": "Weekend Free",
            "smart_thermostat_discount": False, "autopay_discount": False,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 12.95,
            "weekday_rate": 0.15,
            "weekend_rate": 0.0,
            "type": "WEEKEND"
        },
        "pros": ["Completely free electricity on weekends", "Great for laundry/chores on Sat-Sun"],
        "cons": ["Higher fixed charge at $12.95/mo", "$200 cancellation fee", "Weekday rate is premium"]
    },
    {
        "plan_id": "SOLAR_BUYBACK",
        "name": "Solar Buyback 24",
        "description": "Earn credits for excess solar energy.",
        "tags": ["Solar", "Green"],
        "features": {
            "contract_months": 24, "cancellation_fee": 250, "renewable_pct": 100,
            "best_for": "Solar panel owners", "rate_type": "Net Metering",
            "smart_thermostat_discount": True, "autopay_discount": True,
            "usage_credits": True
        },
        "rates": {
            "fixed_per_month": 11.95,
            "flat_rate": 0.135,
            "buyback_rate": 0.09,
            "type": "FLAT",
            "is_green": True
        },
        "pros": ["Earn $0.09/kWh for excess solar", "100% renewable", "Usage credits roll over"],
        "cons": ["24-month commitment", "$250 cancellation fee", "Only beneficial with solar panels"]
    },
    {
        "plan_id": "SUPER_VALUE_24",
        "name": "Super Value 24",
        "description": "Our lowest flat rate — lock in for 24 months.",
        "tags": ["Cheapest", "Stable"],
        "features": {
            "contract_months": 24, "cancellation_fee": 200, "renewable_pct": 0,
            "best_for": "High-usage households", "rate_type": "Fixed Flat",
            "smart_thermostat_discount": False, "autopay_discount": True,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 5.95,
            "flat_rate": 0.109,
            "type": "FLAT"
        },
        "pros": ["Lowest flat rate at $0.109/kWh", "Predictable long-term pricing", "Autopay discount"],
        "cons": ["24-month lock-in period", "$200 cancellation fee"]
    },
    {
        "plan_id": "PREPAID_POWER",
        "name": "Prepaid Power",
        "description": "Pay as you go — no contract, no deposit.",
        "tags": ["Flexible", "No Contract"],
        "features": {
            "contract_months": 0, "cancellation_fee": 0, "renewable_pct": 0,
            "best_for": "Renters & short-term stays", "rate_type": "Prepaid",
            "smart_thermostat_discount": False, "autopay_discount": False,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 0,
            "flat_rate": 0.169,
            "type": "FLAT"
        },
        "pros": ["No contract or deposit required", "Cancel anytime — zero fees", "Real-time balance tracking"],
        "cons": ["Highest per-kWh rate at $0.169", "No discounts available", "Service disconnects if balance is $0"]
    },
    {
        "plan_id": "EV_CHARGING_PRO",
        "name": "EV Charging Pro",
        "description": "Ultra-low overnight rates for EV owners.",
        "tags": ["EV Friendly", "Smart"],
        "features": {
            "contract_months": 12, "cancellation_fee": 175, "renewable_pct": 30,
            "best_for": "Multiple EV households", "rate_type": "Time of Use",
            "smart_thermostat_discount": True, "autopay_discount": True,
            "usage_credits": False
        },
        "rates": {
            "fixed_per_month": 14.95,
            "peak_rate": 0.16,
            "offpeak_rate": 0.03,
            "super_offpeak_rate": 0.02,
            "peak_hours": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
            "offpeak_hours": [22, 23, 4, 5],
            "super_offpeak_hours": [0, 1, 2, 3]
        },
        "pros": ["Ultra-low $0.02/kWh midnight rates", "30% renewable energy included", "Smart thermostat discount"],
        "cons": ["Highest fixed charge at $14.95/mo", "$175 cancellation fee"]
    }
]

class RecommendationService:
    def __init__(self):
        # Default Peak Hours if not in DB (6 AM to 9 PM)
        self.PEAK_HOURS = range(6, 22) 

    def calculate_annual_cost(self, usage_history: List[schemas.HourlyUsageSchema], plan: schemas.PlanSchema) -> float:
        """
        Simulate cost for the given usage history based on plan rates.
        """
        total_cost = 0.0
        
        # Monthly fixed charge component
        months = set()
        
        for record in usage_history:
            # Add to month set
            months.add((record.USAGE_DATE.year, record.USAGE_DATE.month))
            
            kwh = record.KWH
            if not kwh: continue
                
            hour = record.USAGE_HOUR
            
            # Rate Calculation Logic
            rate_type = plan.rate_type.upper() if plan.rate_type else "FIXED"
            
            if "FIXED" in rate_type or "FLAT" in rate_type:
                total_cost += kwh * plan.energy_charge
            
            elif "TIME" in rate_type or "TOU" in rate_type:
                if hour in self.PEAK_HOURS:
                    # Use Peak Rate if available, else fallback to energy_charge
                    rate = plan.peak_charge if plan.peak_charge is not None else plan.energy_charge
                    total_cost += kwh * rate
                else:
                    # Use Off-Peak Rate if available, else fallback to energy_charge
                    rate = plan.offpeak_charge if plan.offpeak_charge is not None else plan.energy_charge
                    total_cost += kwh * rate
            
            elif "WEEKEND" in rate_type:
                 # 0=Monday, 6=Sunday. Weekend is usually Sat(5), Sun(6)
                 weekday = record.USAGE_DATE.weekday() 
                 if weekday >= 5: # Sat or Sun
                     # Weekend Free or Discounted?
                     # If weekend_rate not in schema, assume 0 or offpeak
                     rate = 0.0 if plan.offpeak_charge == 0 else (plan.offpeak_charge or 0)
                     total_cost += kwh * rate
                 else:
                     total_cost += kwh * plan.energy_charge
                     
        # Add fixed monthly charges
        num_months = len(months)
        if num_months == 0: num_months = 12 # Default projection
        total_cost += num_months * plan.fixed_charge
        
        return total_cost

    def generate_recommendations(self, customer_id: str, hourly_usage: List[schemas.HourlyUsageSchema], current_plan_id: str, available_plans: List[schemas.PlanSchema]) -> schemas.RecommendationResponse:
        
        results = []
        
        # Safety check
        if not hourly_usage or not available_plans:
            return schemas.RecommendationResponse(
                customer_id=customer_id,
                best_plan=None,
                alternatives=[],
                explanation="Insufficient data or plans to generate recommendations.",
                generated_at=datetime.now()
            )

        # Normalize to Annual
        dates = sorted(list(set([h.USAGE_DATE for h in hourly_usage])))
        if not dates:
            days_count = 30
        else:
            days_count = (dates[-1] - dates[0]).days + 1
        
        annual_multiplier = 365.0 / max(days_count, 1)

        simulated_costs = []
        
        for plan in available_plans:
            cost_raw = self.calculate_annual_cost(hourly_usage, plan)
            annual_cost = cost_raw * annual_multiplier
            simulated_costs.append({
                "plan": plan,
                "annual_cost": annual_cost
            })
            
        # Sort by cost
        simulated_costs.sort(key=lambda x: x["annual_cost"])
        
        # Identify Best Plan (Cheapest)
        best = simulated_costs[0]
        
        # Determine Current Plan Cost (Virtual/Actual)
        current_in_list = next((x for x in simulated_costs if x["plan"].plan_id == current_plan_id), None)
        
        if current_in_list:
            baseline_cost = current_in_list["annual_cost"]
        else:
             # If current plan not found, assume baseline is 15% higher than best (arbitrary)
             baseline_cost = best["annual_cost"] * 1.15
            
        # Build Results
        recs = []
        for item in simulated_costs:
            plan = item["plan"]
            cost = item["annual_cost"]
            savings = max(0, baseline_cost - cost)
            
            # Simple scoring
            score = 90 # Base
            if savings > 0: score += 5
            
            tags_list = plan.tags.split(',') if plan.tags else []
            if "Greenest" in tags_list: score += 3
            
            recs.append(schemas.RecommendationResult(
                plan_id=plan.plan_id,
                plan_name=plan.plan_name,
                annual_cost=round(cost, 2),
                annual_savings=round(savings, 2),
                score=score,
                tags=tags_list
            ))

        return schemas.RecommendationResponse(
            customer_id=customer_id,
            best_plan=recs[0],
            alternatives=recs[1:4], # Next 3
            generated_at=datetime.now()
        )

rec_service = RecommendationService()
