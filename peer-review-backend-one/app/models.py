from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import TIMESTAMP
from app.database import Base

# =============================================================================
# ACTUAL DATABRICKS TABLES in workspace.askcal-analytics-dev
# =============================================================================

class Customer(Base):
    """Customer master table - Using Clone VW"""
    __tablename__ = "customer_clone_vw"
    
    cust_id = Column(BigInteger, primary_key=True, index=True)
    Account_Number = Column(BigInteger)
    alternate_id = Column(BigInteger)
    First_Name = Column(String)
    Last_Name = Column(String)
    Email = Column(String)
    StartDate = Column(Date)
    EndDate = Column(Date)
    AutoPay = Column(String)
    TDSP = Column(String)
    Premise_ID = Column(Numeric(22, 0))  # ESIID
    Status = Column(String)
    Classification = Column(String)
    Phone = Column(BigInteger)
    Service_Address_1 = Column(String)
    Service_City = Column(String)
    Service_State = Column(String)
    Service_Zip = Column(BigInteger)
    AnnualUsage = Column(Float)
    LoadProfile = Column(String)


class Contract(Base):
    """Contract/Rate information - Using Clone VW"""
    __tablename__ = "contract_clone_vw"
    
    Contract_No = Column(BigInteger, primary_key=True, index=True)
    Customer = Column(String)
    Account_Number = Column(BigInteger, index=True)
    Account_ID = Column(BigInteger)
    LDC_Account_Number = Column(Numeric(22, 0))  # ESIID
    Term = Column(BigInteger)
    Contract_Start_Date = Column(Date)
    contract_End_Date = Column(Date)
    RATE_CD = Column(String)
    Fixed_Rate = Column(Float)
    OnPeak_Rate = Column(String)
    OffPeak_Rate = Column(String)
    Service_State = Column(String)
    ETF_AM = Column(Float)


class HourlyUsage(Base):
    """Hourly interval usage data - Using Clone VW"""
    __tablename__ = "hourlyinterval_clone_vw"
    
    Id = Column(BigInteger, primary_key=True)
    ESIID = Column(Numeric(22, 0), index=True)  # Links to Customer.Premise_ID
    IntervalDate = Column(Date, index=True)
    IntervalHour = Column(BigInteger)  # 0-23
    Value = Column(Float)  # kWh
    CreatedBy = Column(String)
    CreateDate = Column(String)
    LSEID = Column(BigInteger)


class FifteenMinUsage(Base):
    """15-minute interval usage data (96 readings per day)"""
    __tablename__ = "fifteen_min_96_k"
    
    Id = Column(BigInteger, primary_key=True)
    LSEID = Column(BigInteger)
    ESIID = Column(Numeric(22, 0), index=True)  # Links to Customer.Premise_ID
    CHANNEL_TYPE = Column(BigInteger)
    INTERVAL_START_TIME = Column(DateTime, index=True)
    INTERVAL_END_TIME = Column(DateTime)
    IS_DST = Column(BigInteger)
    DATA_TYPE = Column(String)
    Value = Column(Float)  # kWh
    CreateDate = Column(DateTime)


class WeatherForecast(Base):
    """Weather forecast data by city"""
    __tablename__ = "psa_weather_city_forecast_mapped_view"
    
    # Composite key: SiteCode + FlowDate + HighLow
    SiteCode = Column(String, primary_key=True)
    FlowDate = Column(Date, primary_key=True)
    HighLow = Column(String, primary_key=True)  # 'High' or 'Low'
    Value = Column(Float)  # Temperature
    ProcessDate = Column(Date)
    MeasureCode = Column(String)
    City = Column(String, index=True)
    State = Column(String)


class AppraisalDistrict(Base):
    """Appraisal district data - Using Clone VW"""
    __tablename__ = "appraisaldistrict_clone_vw"
    
    # Need to check actual structure, placeholder for now
    Id = Column(BigInteger, primary_key=True)


# =============================================================================
# PLAN DIMENSION TABLE
# =============================================================================

class DimPlan(Base):
    """Plan Dimension table - DIM_PLAN"""
    __tablename__ = "dim_plan"

    plan_id = Column(String, primary_key=True)
    plan_name = Column(String)
    plan_desc = Column(String)
    term_months = Column(Integer)
    cancellation_fee = Column(Float)
    rate_type = Column(String)  # 'Fixed', 'Indexed', 'Time of Use'
    fixed_charge = Column(Float)
    energy_charge = Column(Float)  # Base rate
    peak_charge = Column(Float)
    offpeak_charge = Column(Float)
    tags = Column(String)  # Comma-separated tags
    renewable_pct = Column(Float)
    feature_json = Column(String) # JSON string for extra features


# =============================================================================
# LEGACY VIEW MODELS (kept for reference but may not exist in current schema)
# =============================================================================

class BaseCustomer(Base):
    """LEGACY: BASE_CUSTOMER_VW - may not exist"""
    __tablename__ = "BASE_CUSTOMER_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    CUSTOMER_NAME = Column(String)
    PLAN_CD = Column(String)
    FIXED_RATE = Column(Float)


class BaseCustomerContract(Base):
    """LEGACY: BASE_CUSTOMER_CONTRACT_VW - may not exist"""
    __tablename__ = "BASE_CUSTOMER_CONTRACT_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    ESIID = Column(String)
    ACCOUNT_NUMBER = Column(String)
    RATE_CD = Column(String)
    FIXED_RATE = Column(Float)
    ONPEAK_RATE = Column(String)
    OFFPEAK_RATE = Column(String)


class MonthlyUsage(Base):
    """LEGACY: MONTHLY_USAGE_VW - may not exist"""
    __tablename__ = "MONTHLY_USAGE_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    BILLING_MONTH = Column(Date, primary_key=True)
    MONTHLY_KWH = Column(Float)
    MONTHLY_COST = Column(Float)


class DailyUsage(Base):
    """LEGACY: DAILY_USAGE_VW - may not exist"""
    __tablename__ = "DAILY_USAGE_VW"

    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    USAGE_DATE = Column(Date, primary_key=True)
    DAILY_KWH = Column(Float)
    DAILY_COST = Column(Float)
    PEAK_USAGE_KWH = Column(Float)
    OFFPEAK_USAGE_KWH = Column(Float)


class CustomerUsageSummary(Base):
    """LEGACY: CUSTOMER_USAGE_SUMMARY_VW - may not exist"""
    __tablename__ = "CUSTOMER_USAGE_SUMMARY_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True)
    BILLING_MONTH = Column(Date, primary_key=True)
    TOTAL_USAGE_KWH = Column(Float)
    TOTAL_COST = Column(Float)
    PEAK_USAGE_KWH = Column(Float)
    OFFPEAK_USAGE_KWH = Column(Float)


class PeerUsage(Base):
    """LEGACY: PEER_USAGE_VW - may not exist"""
    __tablename__ = "PEER_USAGE_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    AREA_CODE = Column(Integer)
    HOME_SIZE_BUCKET = Column(String)
    PLAN_ID = Column(String)
    TIME_GRAIN = Column(String, primary_key=True)
    PEER_AVG_USAGE_KWH = Column(Float)
    PEER_MIN_USAGE_KWH = Column(Float)
    PEER_MAX_USAGE_KWH = Column(Float)
    PEER_STDDEV_USAGE_KWH = Column(Float)
    PEER_CUSTOMER_COUNT = Column(Integer)


class WeatherImpact(Base):
    """LEGACY: WEATHER_IMPACT_VW - may not exist"""
    __tablename__ = "WEATHER_IMPACT_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    MONTH = Column(Date, primary_key=True)
    BASE_LOAD_KWH = Column(Float)
    COOLING_LOAD_KWH = Column(Float)
    HEATING_LOAD_KWH = Column(Float)


class CostSummary(Base):
    """LEGACY: COST_SUMMARY_VW - may not exist"""
    __tablename__ = "COST_SUMMARY_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    BILLING_PERIOD = Column(Date, primary_key=True)
    TOTAL_AMOUNT = Column(Float)
    GENERATION_CHARGE = Column(Float)
    DELIVERY_CHARGE = Column(Float)
    TAXES = Column(Float)


class EnergyScore(Base):
    """LEGACY: ENERGY_SCORE_VW - may not exist"""
    __tablename__ = "ENERGY_SCORE_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    SCORE_DATE = Column(Date, primary_key=True)
    SCORE = Column(Integer)
    PERCENTILE = Column(Integer)
    COMPARISON_TEXT = Column(String)


class Forecast(Base):
    """LEGACY: FORECAST_VW - may not exist"""
    __tablename__ = "FORECAST_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    FORECAST_DATE = Column(Date, primary_key=True)
    FORECAST_KWH = Column(Float)
    FORECAST_COST = Column(Float)
    CONFIDENCE_LOWER = Column(Float)
    CONFIDENCE_UPPER = Column(Float)


# =============================================================================
# PEER USAGE VIEW - For peer comparison with property attributes
# =============================================================================

class PeerUsageView(Base):
    """Peer Usage View with property attributes for peer ranking"""
    __tablename__ = "PEER_PROPERTY_USAGE_VW"
    
    CUSTOMER_ID = Column(String, primary_key=True, index=True)
    ESIID = Column(String)
    YEAR_BUILT = Column(Integer)  # Plot Age
    ZIPCODE = Column(String, index=True)
    PLOT_SIZE = Column(String)  # Small/Medium/Large (sq ft bucket)
    PLOT_SIZE_SQFT = Column(Integer)  # Actual sq ft
    LOCATION = Column(String)  # City/Area
    MONTHLY_KWH = Column(Float)
    MONTHLY_COST = Column(Float)
    BILLING_MONTH = Column(Date, primary_key=True)

