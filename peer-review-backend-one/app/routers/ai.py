from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app import schemas, models, mocks
from app.database import get_db
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/insights/{customer_id}", response_model=schemas.AIInsightsResponse)
async def get_ai_insights(customer_id: str, category: str = "general", db: Session = Depends(get_db)):
    usage_dict = {}
    peers_list = []

    if db is None:
        # Use Mocks matches dashboard summary
        usage_dict = mocks.MOCK_DASHBOARD_SUMMARY.copy()
        peers_list = mocks.MOCK_PEER_DATA
    else:
        try:
            # Fetch Context Data using actual tables
            # 1. Get customer and their usage from hourly_24_k
            customer = db.query(models.Customer).filter(
                (models.Customer.cust_id == int(customer_id)) |
                (models.Customer.Account_Number == int(customer_id))
            ).first()
            
            if customer and customer.Premise_ID:
                from sqlalchemy import text
                result = db.execute(text("""
                    SELECT SUM(hourly_val) as total_kwh 
                    FROM (
                        SELECT IntervalDate, IntervalHour, MAX(Value) as hourly_val
                        FROM hourlyinterval_clone_vw 
                        WHERE ESIID = :esiid
                        GROUP BY IntervalDate, IntervalHour
                    ) as sub
                """), {"esiid": str(customer.Premise_ID)}).fetchone()
                
                total_kwh = float(result[0]) if result and result[0] else 850.0
                usage_dict = {
                    'current_kwh': total_kwh,
                    'current_cost': total_kwh * 0.12,
                    'peer_avg_kwh': 920.0,
                    'peer_avg_cost': 920.0 * 0.12,
                    'efficiency_score': int(100 - (total_kwh / 920) * 15)
                }
            else:
                usage_dict = mocks.MOCK_DASHBOARD_SUMMARY.copy()

            # 2. Peer Data - use mock for now
            peers_list = mocks.MOCK_PEER_DATA
        except Exception as e:
            print(f"AI/DB Error (Fallback): {e}")
            usage_dict = mocks.MOCK_DASHBOARD_SUMMARY.copy()
            peers_list = mocks.MOCK_PEER_DATA

    # 3. Calculate Derived Metrics for Context (Shared for both Mock & DB)
    current_kwh = usage_dict.get('current_kwh', 0)
    peer_avg_kwh = usage_dict.get('peer_avg_kwh', 0)
    peer_cost = usage_dict.get('peer_avg_cost', 0)
    current_cost = usage_dict.get('current_cost', 0)

    # Calculate Rank Percentile
    efficiency_ratio = (current_kwh / peer_avg_kwh) if peer_avg_kwh > 0 else 1
    rank_percentile = max(1, round((1 - efficiency_ratio) * 100 + 15))
    rank_percentile_display = f"Top {min(rank_percentile, 50)}%"
    
    # Calculate Savings
    is_saving = current_cost < peer_cost
    savings_amount = round(abs(current_cost - peer_cost))
    savings_text = f"Saving ${savings_amount}/mo" if is_saving else f"Could save ${savings_amount}/mo"

    context_summary = {
        "rank_text": rank_percentile_display,
        "savings_text": savings_text,
        "efficiency_score": usage_dict.get('efficiency_score', 85)
    }

    try:
        # Generate Insights
        insights = await ai_service.generate_insights(customer_id, usage_dict, peers_list, category, context_summary=context_summary, db=db)
        
        return {
            "customer_id": customer_id,
            "generated_at": datetime.now(),
            "insights": insights
        }
    except Exception as e:
        print(f"AI Generation Error: {e}")
        return {
            "customer_id": customer_id,
            "generated_at": datetime.now(),
            "insights": mocks.MOCK_AI_INSIGHTS
        }

@router.post("/insights/{customer_id}/chat", response_model=schemas.ChatResponse)
async def chat_with_ai(customer_id: str, request: schemas.ChatRequest, db: Session = Depends(get_db)):
    if db is None:
         # Use mock context for AI Chat
         context_data = { "usage": mocks.MOCK_USAGE_SUMMARY, "peers": mocks.MOCK_PEER_DATA }
         response_text = await ai_service.generate_chat_response(customer_id, request.message, context_data, db=None)
         return {"response": response_text}
    try:
        # Use mock context for chat - actual tables don't have all needed data yet
        context_data = { "usage": mocks.MOCK_USAGE_SUMMARY, "peers": mocks.MOCK_PEER_DATA }
        response_text = await ai_service.generate_chat_response(customer_id, request.message, context_data, db=db)
        return {"response": response_text}
    except Exception as e:
        print(f"Chat AI Error (Fallback): {e}")
        return {"response": mocks.MOCK_CHAT_RESPONSE}

@router.post("/voice-command", response_model=schemas.VoiceCommandResponse)
async def process_voice_command(request: schemas.VoiceCommandRequest, db: Session = Depends(get_db)):
    try:
        # Call AI Service to analyze intent
        result = await ai_service.analyze_voice_command(request.transcript, request.current_view)
        return result
    except Exception as e:
        print(f"Voice Command Error: {e}")
        return {
            "response_text": "I encountered an error processing that command.",
            "action": "none",
            "parameters": {}
        }

@router.post("/tts")
async def text_to_speech(request: schemas.TTSRequest):
    """
    Streams audio for the given text. 
    Returns raw bytes with audio/mpeg content type.
    """
    audio_bytes = await ai_service.generate_voice(request.text)
    
    if not audio_bytes:
        from fastapi import HTTPException
        # Return 204 or specialized error so frontend knows to use fallback
        raise HTTPException(status_code=503, detail="TTS Service Unavailable")
        
    from fastapi.responses import Response
    return Response(content=audio_bytes, media_type="audio/mpeg")

    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("/dashboard-ask", response_model=schemas.DashboardAskResponse)
async def dashboard_ask_ai(request: schemas.DashboardAskRequest):
    """
    Processes dashboard-specific queries and returns actions + synthesized text.
    """
    # Determine customer_id from request or fallback
    customer_id = request.customer_id or "123456" 
    
    context_data = request.context_data or {}
    
    response = await ai_service.generate_dashboard_response(
        customer_id=customer_id,
        query=request.query,
        context_data=context_data
    )
    return response

@router.post("/analyze-chart", response_model=schemas.ChartAnalysisResponse)
async def analyze_chart(request: schemas.ChartAnalysisRequest):
    """
    Generates dynamic analysis for a specific chart based on provided data context.
    """
    analysis = await ai_service.analyze_chart_data(request.chart_type, request.data_context)
    return {"analysis": analysis}

@router.post("/bill-analysis", response_model=schemas.BillAnalysisResponse)
async def analyze_bill_difference(request: schemas.BillAnalysisRequest, db: Session = Depends(get_db)):
    """
    Generates an explanation for bill differences.
    """
    # 1. Fetch usage data for the two months (or use mocks if DB is missing)
    usage_data = {}
    
    if db:
        # Try to get real data (Simplified for MVP: using total consumption)
        # In a real app, we'd query monthly_usage_vw by customer_id and billing_month
        pass

    # Fallback to simple calculation if no granular data
    # (The frontend actually has the specific month data, so for now we just trust the request context?
    # Actually, the request only sends month names. We need to fetch the data or have frontend send it.
    # To keep the API simple consistent with the current frontend call config (just IDs), we fetch/mock here.
    
    # Mock/Simulate data for the 2 months based on seasonality
    # Dec/Jan -> Winter (Higher), Apr/May -> Mild (Lower)
    
    usage_data = {
        "current_month_kwh": 1150,
        "compare_month_kwh": 980,
        "cost_diff": 25.4,
        "avg_temp_diff": -8  # 8 degrees colder
    }

    analysis = await ai_service.analyze_bill_difference(
        request.customer_id, 
        request.current_month, 
        request.compare_month, 
        usage_data
    )
    return {"analysis": analysis}
