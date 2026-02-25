from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cache_control_headers():
    # 1. Test Monthly Usage
    response = client.get("/api/usage/monthly/12345")
    assert response.status_code in [200, 404, 503] # Depending on DB state, but we check headers
    if response.status_code == 200:
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "public, max-age=300"
        print("✅ Monthly Usage: Cache-Control header present and correct.")

    # 2. Test Dashboard Summary
    response = client.get("/api/dashboard/summary/12345")
    assert response.status_code in [200, 404, 503]
    if response.status_code == 200:
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "public, max-age=300"
        print("✅ Dashboard Summary: Cache-Control header present and correct.")

    # 3. Test Weather
    response = client.get("/api/weather/Houston")
    assert response.status_code == 200
    assert "Cache-Control" in response.headers
    assert response.headers["Cache-Control"] == "public, max-age=1800"
    print("✅ Weather: Cache-Control header present and correct.")
    
    # 4. Test Peer Filters
    response = client.get("/api/peer-filters")
    assert response.status_code == 200
    assert "Cache-Control" in response.headers
    assert response.headers["Cache-Control"] == "public, max-age=3600"
    print("✅ Peer Filters: Cache-Control header present and correct.")

    # 5. Test Customer Property Profile
    response = client.get("/api/customer/12345/property-profile")
    assert response.status_code == 200
    assert "Cache-Control" in response.headers
    assert response.headers["Cache-Control"] == "public, max-age=3600"
    print("✅ Customer Property Profile: Cache-Control header present and correct.")

if __name__ == "__main__":
    try:
        test_cache_control_headers()
        print("\n🎉 All Cache Optimization Tests Passed!")
    except AssertionError as e:
        print(f"\n❌ Test Failed: {e}")
    except Exception as e:
        print(f"\n❌ Error Running Tests: {e}")
