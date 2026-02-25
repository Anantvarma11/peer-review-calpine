"""
Test script to verify Databricks AI endpoint connection
"""
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_databricks_ai():
    host = os.getenv("DATABRICKS_HOST", "")
    token = os.getenv("DATABRICKS_TOKEN", "")
    endpoint = os.getenv("DATABRICKS_AI_ENDPOINT", "")
    
    print("=== Databricks AI Connection Test ===")
    print(f"Host: {host[:50]}..." if len(host) > 50 else f"Host: {host}")
    print(f"Endpoint: {endpoint}")
    print(f"Token: {'***' + token[-4:] if token else 'NOT SET'}")
    print()
    
    if not all([host, token, endpoint]):
        print("[ERROR] Missing configuration! Please set:")
        if not host: print("  - DATABRICKS_HOST")
        if not token: print("  - DATABRICKS_TOKEN")
        if not endpoint: print("  - DATABRICKS_AI_ENDPOINT")
        return False
    
    # Build URL
    if host.endswith('/'):
        host = host[:-1]
    url = f"{host}/serving-endpoints/{endpoint}/invocations"
    
    print(f"Testing URL: {url}")
    print()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Simple test payload
    payload = {
        "messages": [
            {"role": "user", "content": "Say hello in exactly 5 words."}
        ],
        "max_tokens": 50
    }
    
    try:
        print("Sending test request...")
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Connection Successful!")
            print()
            print("Response:")
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0].get("message", {}).get("content", "")
                print(f"  AI says: {content}")
            else:
                print(f"  Raw: {data}")
            return True
        else:
            print(f"[FAILED] Request failed with status {response.status_code}")
            print(f"Response Body: {response.text[:1000]}")
            return False
            
    except httpx.TimeoutException:
        print("[ERROR] Request timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    test_databricks_ai()
