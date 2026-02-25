import requests
import json

try:
    # Use the port found in user logs: 10000
    response = requests.get('http://127.0.0.1:10000/api/dashboard/summary/983241')
    if response.status_code == 200:
        data = response.json()
        print("Keys in response:", data.keys())
        if 'peer_avg_kwh' in data:
            print(f"peer_avg_kwh: {data['peer_avg_kwh']}")
        else:
            print("peer_avg_kwh NOT FOUND in response")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
