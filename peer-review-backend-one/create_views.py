"""
Script to create missing views in Databricks for the peer-review-backend API.
These views derive data from existing tables to provide weather impact, cost summary,
forecast, and energy score endpoints.
"""

from databricks import sql
import os
from dotenv import load_dotenv

load_dotenv()

# Get connection details from environment
host = os.getenv("DATABRICKS_HOST", "").replace("https://", "").rstrip("/")
http_path = os.getenv("DATABRICKS_HTTP_PATH")
token = os.getenv("DATABRICKS_TOKEN")
catalog = os.getenv("DATABRICKS_CATALOG", "calpine_data_new")
schema = os.getenv("DATABRICKS_SCHEMA", "default")

print(f"Connecting to Databricks...")
print(f"  Host: {host}")
print(f"  Catalog: {catalog}")
print(f"  Schema: {schema}")

# SQL statements to create views
# These views derive data from existing monthly/daily usage data

CREATE_CUSTOMER_CLONE_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.customer_clone_vw AS
SELECT * FROM {catalog}.`{schema}`.customer
"""

CREATE_CONTRACT_CLONE_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.contract_clone_vw AS
SELECT * FROM {catalog}.`{schema}`.contract
"""

CREATE_HOURLYINTERVAL_CLONE_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.hourlyinterval_clone_vw AS
SELECT * FROM {catalog}.`{schema}`.hourly_24_k
"""

CREATE_APPRAISALDISTRICT_CLONE_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.appraisaldistrict_clone_vw AS
SELECT * FROM {catalog}.`{schema}`.appraisal_district
"""

CREATE_WEATHER_IMPACT_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.WEATHER_IMPACT_VW AS
SELECT 
    CUSTOMER_ID,
    BILLING_MONTH as MONTH,
    MONTHLY_KWH * 0.4 as BASE_LOAD_KWH,
    CASE 
        WHEN MONTH(BILLING_MONTH) IN (6, 7, 8, 9) THEN MONTHLY_KWH * 0.45
        ELSE MONTHLY_KWH * 0.1
    END as COOLING_LOAD_KWH,
    CASE 
        WHEN MONTH(BILLING_MONTH) IN (12, 1, 2) THEN MONTHLY_KWH * 0.45
        ELSE MONTHLY_KWH * 0.1
    END as HEATING_LOAD_KWH
FROM {catalog}.`{schema}`.monthly_usage_vw
"""

CREATE_COST_SUMMARY_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.COST_SUMMARY_VW AS
SELECT 
    CUSTOMER_ID,
    BILLING_MONTH as BILLING_PERIOD,
    MONTHLY_COST as TOTAL_AMOUNT,
    MONTHLY_COST * 0.55 as GENERATION_CHARGE,
    MONTHLY_COST * 0.35 as DELIVERY_CHARGE,
    MONTHLY_COST * 0.10 as TAXES
FROM {catalog}.`{schema}`.monthly_usage_vw
"""

CREATE_FORECAST_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.FORECAST_VW AS
SELECT 
    CUSTOMER_ID,
    DATE_ADD(BILLING_MONTH, 30) as FORECAST_DATE,
    MONTHLY_KWH * 1.05 as FORECAST_KWH,
    MONTHLY_COST * 1.05 as FORECAST_COST,
    MONTHLY_KWH * 0.90 as CONFIDENCE_LOWER,
    MONTHLY_KWH * 1.20 as CONFIDENCE_UPPER
FROM {catalog}.`{schema}`.monthly_usage_vw
WHERE BILLING_MONTH = (
    SELECT MAX(BILLING_MONTH) 
    FROM {catalog}.`{schema}`.monthly_usage_vw m2 
    WHERE m2.CUSTOMER_ID = monthly_usage_vw.CUSTOMER_ID
)
"""

CREATE_ENERGY_SCORE_VW = f"""
CREATE OR REPLACE VIEW {catalog}.`{schema}`.ENERGY_SCORE_VW AS
SELECT 
    m.CUSTOMER_ID,
    m.BILLING_MONTH as SCORE_DATE,
    CASE 
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 0.8 THEN 95
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH THEN 85
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 1.2 THEN 70
        ELSE 55
    END as SCORE,
    CASE 
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 0.8 THEN 90
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH THEN 70
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 1.2 THEN 45
        ELSE 20
    END as PERCENTILE,
    CASE 
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 0.8 THEN 'Excellent! You use 20%+ less than your peers.'
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH THEN 'Good job! You are below average.'
        WHEN m.MONTHLY_KWH < p.PEER_AVG_USAGE_KWH * 1.2 THEN 'Room for improvement - slightly above average.'
        ELSE 'High usage detected - consider energy saving tips.'
    END as COMPARISON_TEXT
FROM {catalog}.`{schema}`.monthly_usage_vw m
LEFT JOIN {catalog}.`{schema}`.peer_usage_vw p ON m.CUSTOMER_ID = p.CUSTOMER_ID
WHERE m.BILLING_MONTH = (
    SELECT MAX(BILLING_MONTH) 
    FROM {catalog}.`{schema}`.monthly_usage_vw m2 
    WHERE m2.CUSTOMER_ID = m.CUSTOMER_ID
)
"""

views = [
    ("customer_clone_vw", CREATE_CUSTOMER_CLONE_VW),
    ("contract_clone_vw", CREATE_CONTRACT_CLONE_VW),
    ("hourlyinterval_clone_vw", CREATE_HOURLYINTERVAL_CLONE_VW),
    ("appraisaldistrict_clone_vw", CREATE_APPRAISALDISTRICT_CLONE_VW),
    ("WEATHER_IMPACT_VW", CREATE_WEATHER_IMPACT_VW),
    ("COST_SUMMARY_VW", CREATE_COST_SUMMARY_VW),
    ("FORECAST_VW", CREATE_FORECAST_VW),
    ("ENERGY_SCORE_VW", CREATE_ENERGY_SCORE_VW),
]

try:
    with sql.connect(
        server_hostname=host,
        http_path=http_path,
        access_token=token,
    ) as connection:
        with connection.cursor() as cursor:
            for view_name, create_sql in views:
                print(f"\nCreating {view_name}...")
                try:
                    cursor.execute(create_sql)
                    print(f"  ✅ {view_name} created successfully!")
                except Exception as e:
                    print(f"  ❌ Failed to create {view_name}: {e}")
            
            print("\n--- Verification ---")
            for view_name, _ in views:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {catalog}.`{schema}`.{view_name}")
                    count = cursor.fetchone()[0]
                    print(f"  {view_name}: {count} rows")
                except Exception as e:
                    print(f"  {view_name}: Error - {e}")
                    
    print("\n✅ All views created successfully!")
    
except Exception as e:
    print(f"\n❌ Connection/Execution Error: {e}")
