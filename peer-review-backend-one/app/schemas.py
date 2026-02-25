from datetime import date, datetime
from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, ConfigDict

# --- Base Schemas ---

class BaseCustomerContractSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    ESIID: Optional[Union[str, int]] = None
    ACCOUNT_NUMBER: Optional[Union[str, int]] = None
    RATE_CD: Optional[str] = None
    FIXED_RATE: Optional[float] = None
    ONPEAK_RATE: Optional[str] = None
    ONPEAK_RATE: Optional[str] = None
    OFFPEAK_RATE: Optional[str] = None
    SERVICE_ZIP: Optional[Union[str, int]] = None

class CustomerListSchema(BaseModel):
    id: str
    name: str

class CustomerResponse(BaseCustomerContractSchema):
    CUSTOMER_NAME: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MonthlyUsageSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    BILLING_MONTH: date
    MONTHLY_KWH: float
    MONTHLY_COST: float
    # PEER_KWH: Optional[float] = None
    # OFF_PEAK_KWH: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class DailyUsageSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    USAGE_DATE: date
    DAILY_KWH: float
    DAILY_COST: float
    PEAK_USAGE_KWH: float
    OFFPEAK_USAGE_KWH: float
    # MIN_TEMP_F: Optional[float] = None
    # MAX_TEMP_F: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class HourlyUsageSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    BILLING_MONTH: date
    USAGE_DATE: date
    USAGE_HOUR: int
    KWH: float
    FIXED_RATE: float
    COST: float
    # TEMP_F: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class UsageSummarySchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    BILLING_MONTH: Optional[date] = None
    TOTAL_USAGE_KWH: Optional[float] = None
    TOTAL_COST: Optional[float] = None
    PEAK_USAGE_KWH: Optional[float] = None
    OFFPEAK_USAGE_KWH: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class PeerUsageSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    AREA_CODE: Optional[int] = None
    HOME_SIZE_BUCKET: Optional[str] = None
    PLAN_ID: Optional[str] = None
    TIME_GRAIN: Optional[str] = None
    PEER_AVG_USAGE_KWH: Optional[float] = None
    PEER_MIN_USAGE_KWH: Optional[float] = None
    PEER_MAX_USAGE_KWH: Optional[float] = None
    PEER_STDDEV_USAGE_KWH: Optional[float] = None
    PEER_CUSTOMER_COUNT: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class WeatherImpactSchema(BaseModel):
    IMPACT_ID: Optional[str] = None
    CUSTOMER_ID: Union[str, int]
    MONTH: date
    BASE_LOAD_KWH: Optional[float] = None
    COOLING_LOAD_KWH: Optional[float] = None
    HEATING_LOAD_KWH: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class CostSummarySchema(BaseModel):
    COST_ID: Optional[str] = None
    CUSTOMER_ID: Union[str, int]
    BILLING_PERIOD: date
    TOTAL_AMOUNT: float
    GENERATION_CHARGE: Optional[float] = None
    DELIVERY_CHARGE: Optional[float] = None
    TAXES: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class EnergyScoreSchema(BaseModel):
    SCORE_ID: Optional[str] = None
    CUSTOMER_ID: Union[str, int]
    SCORE_DATE: date
    SCORE: int
    PERCENTILE: Optional[int] = None
    COMPARISON_TEXT: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ForecastSchema(BaseModel):
    FORECAST_ID: Optional[str] = None
    CUSTOMER_ID: Union[str, int]
    FORECAST_DATE: date
    FORECAST_KWH: Optional[float] = None
    FORECAST_COST: Optional[float] = None
    CONFIDENCE_LOWER: Optional[float] = None
    CONFIDENCE_UPPER: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

# --- AI Insights Schema ---

class AIInsightSchema(BaseModel):
    insight_type: str  # e.g., "anomaly", "recommendation", "forecast_explanation"
    severity: str      # "high", "medium", "low"
    title: str
    message: str
    actionable_item: Optional[str] = None
    related_metric: Optional[str] = None # e.g., "kwh", "cost"

class AIInsightsResponse(BaseModel):
    customer_id: str
    generated_at: datetime
    insights: List[AIInsightSchema]

class DashboardSummarySchema(BaseModel):
    customer_id: str
    current_kwh: float
    current_cost: float
    prev_kwh: Optional[float] = None
    prev_cost: Optional[float] = None
    efficiency_score: Optional[int] = 85
    insight_count: Optional[int] = 0
    kwh_change_pct: Optional[float] = None
    cost_change_pct: Optional[float] = None
    score_change_pct: Optional[float] = None
    projected_kwh: Optional[float] = None
    projected_cost: Optional[float] = None
    peer_avg_cost: Optional[float] = None
    peer_avg_kwh: Optional[float] = None
    peer_customer_count: Optional[int] = None
    peak_cost: Optional[float] = None
    off_peak_cost: Optional[float] = None
    billing_month: Optional[date] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class TTSRequest(BaseModel):
    text: str

class VoiceCommandRequest(BaseModel):
    transcript: str
    current_view: str = "dashboard"

class VoiceCommandResponse(BaseModel):
    response_text: str
    action: str # "UPDATE_CHART", "NAVIGATE", "NONE"
    parameters: Optional[Dict[str, Any]] = None

class DashboardAskRequest(BaseModel):
    customer_id: Optional[str] = None
    query: str
    context_data: Optional[Dict[str, Any]] = None

class DashboardAskResponse(BaseModel):
    response_text: str
    action: str
    parameters: Optional[Dict[str, Any]] = None
    projected_data: Optional[List[Dict[str, Any]]] = None

# --- Recommendation System Schemas ---

class PlanSchema(BaseModel):
    plan_id: str
    plan_name: str
    plan_desc: Optional[str] = None
    term_months: int
    cancellation_fee: float
    rate_type: str
    fixed_charge: float
    energy_charge: float
    peak_charge: Optional[float] = None
    offpeak_charge: Optional[float] = None
    tags: Optional[str] = None
    renewable_pct: float
    feature_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PlanDetails(BaseModel):
    plan_id: str
    name: str
    description: str
    rates: Dict[str, Any]
    tags: List[str]

class RecommendationResult(BaseModel):
    plan_id: str
    plan_name: str
    annual_cost: float
    annual_savings: float
    score: int
    tags: List[str]
    reason: Optional[str] = None

class RecommendationResponse(BaseModel):
    customer_id: str
    best_plan: RecommendationResult
    alternatives: List[RecommendationResult]
    explanation: Optional[str] = None
    generated_at: datetime
    current_plan_details: Optional[Dict[str, Any]] = None


# --- Detailed Recommendation Schemas ---

class AIRecommendationInsight(BaseModel):
    icon: str  # emoji
    title: str
    description: str
    category: str  # "savings", "usage", "seasonal", "behavioral"
    priority: int = 0

class PlanFeatureDetail(BaseModel):
    plan_id: str
    plan_name: str
    description: str
    tags: List[str]
    annual_cost: float
    annual_savings: float
    score: int
    features: Dict[str, Any]
    rates: Dict[str, Any]
    pros: List[str]
    cons: List[str]
    reason: Optional[str] = None
    cost_curve: Dict[int, float] = {}

class SavingsProjection(BaseModel):
    month: str
    current_plan_cost: float
    best_plan_cost: float
    savings: float

class DetailedRecommendationResponse(BaseModel):
    customer_id: str
    best_plan: PlanFeatureDetail
    all_plans: List[PlanFeatureDetail]
    ai_insights: List[AIRecommendationInsight]
    savings_projections: List[SavingsProjection]
    usage_pattern: Dict[str, Any]
    has_solar: bool = False
    explanation: Optional[str] = None
    generated_at: datetime

class ChartAnalysisRequest(BaseModel):
    chart_type: str
    data_context: Dict[str, Any]

class ChartAnalysisResponse(BaseModel):
    analysis: str

class BillAnalysisRequest(BaseModel):
    customer_id: str
    current_month: str
    compare_month: str

class BillAnalysisResponse(BaseModel):
    analysis: str


# --- Peer Comparison Schema ---

class PeerComparisonSchema(BaseModel):
    CUSTOMER_ID: Union[str, int]
    AREA_CODE: Optional[int] = None
    HOME_SIZE_BUCKET: Optional[str] = None
    PLAN_ID: Optional[str] = None
    TIME_GRAIN: Optional[str] = None
    PEER_AVG_USAGE_KWH: Optional[float] = None
    PEER_MIN_USAGE_KWH: Optional[float] = None
    PEER_MAX_USAGE_KWH: Optional[float] = None
    PEER_STDDEV_USAGE_KWH: Optional[float] = None
    PEER_CUSTOMER_COUNT: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- Weather Schema ---

class WeatherSchema(BaseModel):
    CITY: str
    FLOW_DATE: date
    HIGH_LOW: str
    VALUE: float
    
    model_config = ConfigDict(from_attributes=True)

