import asyncio
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.services.ai_service import ai_service
from app.schemas import AIInsightSchema

async def main():
    print("Testing AI Service...")
    try:
        insights = await ai_service.generate_insights(
            customer_id="test_user",
            usage_summary={},
            peers=[],
            category="general"
        )
        print("Success!")
        print(f"Got {len(insights)} insights.")
        for i in insights:
            print(f"- {i.title}: {i.insight_type}")
    except Exception as e:
        print("FAILED!")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
