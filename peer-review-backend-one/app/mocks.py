from datetime import date, datetime, timedelta
import random

# --- Utilities ---
def generate_dates(days=30):
    end = date.today()
    return [end - timedelta(days=i) for i in range(days)][::-1]

DATES = generate_dates(30)
HOURS = list(range(24))

# --- MOCK DATA ---

MOCK_CUSTOMER = {
    "CUSTOMER_ID": "mock_sys",
    "ESIID": "1000000000",
    "ACCOUNT_NUMBER": "999999999",
    "RATE_CD": "E-TOU-C",
    "FIXED_RATE": 0.15,
    "ONPEAK_RATE": "0.25",
    "OFFPEAK_RATE": "0.12",
    "SERVICE_ZIP": "75001"
}

MOCK_CUSTOMER_LIST = [
    {"id": "mock_1", "name": "James Smith"},
    {"id": "mock_2", "name": "Mary Johnson"},
    {"id": "mock_3", "name": "Robert Williams"},
    {"id": "mock_4", "name": "Patricia Brown"},
    {"id": "mock_5", "name": "John Jones"}
]

MOCK_USAGE_SUMMARY = {
    "CUSTOMER_ID": "mock_sys",
    "BILLING_MONTH": date(2025, 12, 1),
    "TOTAL_USAGE_KWH": 850.5,
    "TOTAL_COST": 125.75,
    "PEAK_USAGE_KWH": 250.0,
    "OFFPEAK_USAGE_KWH": 600.5
}

MOCK_MONTHLY_USAGE = [
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 12, 1), "MONTHLY_KWH": 950.5, "MONTHLY_COST": 145.20},
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 11, 1), "MONTHLY_KWH": 880.0, "MONTHLY_COST": 132.50},
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 10, 1), "MONTHLY_KWH": 820.0, "MONTHLY_COST": 125.00},
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 9, 1), "MONTHLY_KWH": 900.0, "MONTHLY_COST": 138.00},
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 8, 1), "MONTHLY_KWH": 1100.0, "MONTHLY_COST": 180.50},
    {"CUSTOMER_ID": "mock_sys", "BILLING_MONTH": date(2025, 7, 1), "MONTHLY_KWH": 1200.0, "MONTHLY_COST": 210.00},
]

MOCK_DAILY_USAGE = [
    {
        "CUSTOMER_ID": "mock_sys",
        "USAGE_DATE": d,
        "DAILY_KWH": round(random.uniform(15, 45), 1),
        "DAILY_COST": round(random.uniform(3, 9), 2),
        "PEAK_USAGE_KWH": round(random.uniform(5, 15), 1),
        "OFFPEAK_USAGE_KWH": round(random.uniform(10, 30), 1),
    } for d in DATES
]

MOCK_HOURLY_USAGE = []
for d in DATES[-7:]: # Last 7 days
    for h in HOURS:
        MOCK_HOURLY_USAGE.append({
            "CUSTOMER_ID": "mock_sys",
            "BILLING_MONTH": date(d.year, d.month, 1),
            "USAGE_DATE": d,
            "USAGE_HOUR": h,
            "KWH": round(random.uniform(0.5, 3.0), 2),
            "FIXED_RATE": 0.15,
            "COST": round(random.uniform(0.1, 0.8), 2),
        })

MOCK_PEER_DATA = [
    # Schema: CUSTOMER_ID, PEER_AVG_USAGE_KWH, etc.
    {
        "CUSTOMER_ID": "mock_sys", 
        "PEER_AVG_USAGE_KWH": 920.0, 
        "PEER_MIN_USAGE_KWH": 500.0, 
        "PEER_MAX_USAGE_KWH": 1500.0,
        "PEER_STDDEV_USAGE_KWH": 50.0,
        "PEER_CUSTOMER_COUNT": 50,
        "HOME_SIZE_BUCKET": "Medium",
        "AREA_CODE": 94105
    }
]

MOCK_WEATHER_IMPACT = [
    {"IMPACT_ID": "imp_1", "CUSTOMER_ID": "mock_sys", "MONTH": date.today(), "BASE_LOAD_KWH": 300.0, "COOLING_LOAD_KWH": 150.0, "HEATING_LOAD_KWH": 0.0},
    {"IMPACT_ID": "imp_2", "CUSTOMER_ID": "mock_sys", "MONTH": date.today() - timedelta(days=30), "BASE_LOAD_KWH": 280.0, "COOLING_LOAD_KWH": 50.0, "HEATING_LOAD_KWH": 20.0}
]

MOCK_COST_SUMMARY = [
    {"COST_ID": "c1", "CUSTOMER_ID": "mock_sys", "BILLING_PERIOD": date(2025, 12, 1), "TOTAL_AMOUNT": 145.20, "GENERATION_CHARGE": 80.0, "DELIVERY_CHARGE": 60.0, "TAXES": 5.20},
    {"COST_ID": "c2", "CUSTOMER_ID": "mock_sys", "BILLING_PERIOD": date(2025, 11, 1), "TOTAL_AMOUNT": 132.50, "GENERATION_CHARGE": 70.0, "DELIVERY_CHARGE": 58.0, "TAXES": 4.50}
]

MOCK_FORECAST = [
    {"FORECAST_ID": f"f_{i}", "CUSTOMER_ID": "mock_sys", "FORECAST_DATE": date.today() + timedelta(days=i), "FORECAST_KWH": round(random.uniform(20, 35), 1), "FORECAST_COST": round(random.uniform(4, 7), 2), "CONFIDENCE_LOWER": 0.9, "CONFIDENCE_UPPER": 1.1}
    for i in range(7)
]

MOCK_ENERGY_SCORE = {
    "SCORE_ID": "s1",
    "CUSTOMER_ID": "mock_sys",
    "SCORE_DATE": date.today(),
    "SCORE": 85,
    "PERCENTILE": 80,
    "COMPARISON_TEXT": "Better than 80% of neighbors"
}

MOCK_DASHBOARD_SUMMARY = {
    "current_kwh": 850.0,
    "current_cost": 125.50,
    "efficiency_score": 88,
    "insight_count": 3,
    "kwh_change_pct": -5.2,
    "cost_change_pct": -4.8,
    "score_change_pct": 2.5,
    "projected_kwh": 870.0,
    "projected_cost": 128.00,
    "peer_avg_cost": 140.00,
    "peer_avg_kwh": 920.0,
    "peak_cost": 45.00,
    "off_peak_cost": 80.50,
    "billing_month": date.today().replace(day=1)
}

MOCK_AI_INSIGHTS = [
    {
        "title": "HVAC Efficiency",
        "message": "Your HVAC usage is 15% lower than peers this week. Great job maintaining efficient temperature settings!",
        "insight_type": "recommendation",
        "severity": "low",
        "actionable_item": "Keep thermostat at 72F",
        "related_metric": "kwh"
    },
    {
        "title": "Peak Usage Alert",
        "message": "We noticed a spike in usage between 5pm-8pm yesterday. Shifting this load could save you $5/month.",
        "insight_type": "anomaly",
        "severity": "medium",
        "actionable_item": "Run dishwasher after 9pm",
        "related_metric": "cost"
    }
]

MOCK_CHAT_RESPONSE = "I'm running in localized Mock Mode since our primary database is currently unavailable. Based on cached patterns, your projected bill is around $128, which is slightly lower than last month due to milder weather."

MOCK_WEATHER_DATA = [
     {"CITY": "Houston", "FLOW_DATE": d, "HIGH_LOW": "High", "VALUE": round(random.uniform(70, 95), 1)}
     for d in DATES
] + [
     {"CITY": "Houston", "FLOW_DATE": d, "HIGH_LOW": "Low", "VALUE": round(random.uniform(50, 75), 1)}
     for d in DATES
]

MOCK_PLANS = [
    {
        "plan_id": "SAVER_NIGHTS_12", "plan_name": "Saver Nights 12", "plan_desc": "Best for Night-time EV Charging",
        "term_months": 12, "cancellation_fee": 150, "rate_type": "Time of Use",
        "fixed_charge": 9.95, "energy_charge": 0.12, "peak_charge": 0.18, "offpeak_charge": 0.05,
        "tags": "Cheapest,EV Friendly", "renewable_pct": 0, "feature_json": '{"autopay_discount": true}'
    },
    {
        "plan_id": "FIXED_SAVER_12", "plan_name": "Fixed Saver 12", "plan_desc": "Lock in a low rate for 12 months.",
        "term_months": 12, "cancellation_fee": 100, "rate_type": "Fixed",
        "fixed_charge": 4.95, "energy_charge": 0.125, "peak_charge": None, "offpeak_charge": None,
        "tags": "Stable,Balanced", "renewable_pct": 0, "feature_json": '{"autopay_discount": true}'
    },
    {
        "plan_id": "GREEN_FLEX", "plan_name": "Green Flex", "plan_desc": "100% Renewable Energy.",
        "term_months": 6, "cancellation_fee": 75, "rate_type": "Fixed",
        "fixed_charge": 8.95, "energy_charge": 0.145, "peak_charge": None, "offpeak_charge": None,
        "tags": "Greenest", "renewable_pct": 100, "feature_json": '{"smart_thermostat_discount": true}'
    },
    {
        "plan_id": "WEEKEND_FREE", "plan_name": "Free Weekends", "plan_desc": "Free electricity every weekend!",
        "term_months": 12, "cancellation_fee": 200, "rate_type": "Weekend",
        "fixed_charge": 12.95, "energy_charge": 0.15, "peak_charge": None, "offpeak_charge": 0.0,
        "tags": "Balanced", "renewable_pct": 0, "feature_json": '{}'
    }
]
