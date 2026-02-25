import pandas as pd
import os

def parse_weather_codes(file_path):
    """
    Parses the weather-codes.txt file to extract Station Code, City, and State.
    Assumes pipe-delimited format: | Code | Station Name | Location |
    """
    codes = {}
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return codes

    with open(file_path, 'r') as f:
        lines = f.readlines()
        
    for line in lines:
        # Skip header/separator lines
        if not line.strip().startswith('|') or 'Station Name' in line or '---' in line:
            continue
            
        parts = [p.strip() for p in line.split('|')]
        # parts[0] is empty string before first |, parts[1] is Code
        if len(parts) >= 4:
            code = parts[1]
            location = parts[3]
            
            # Split Location into City, State
            if ',' in location:
                city, state = location.rsplit(',', 1)
                # Parse as Uppercase as requested
                codes[code] = {'City': city.strip().upper(), 'State': state.strip()}
            else:
                codes[code] = {'City': location.strip().upper(), 'State': ''}
                
    return codes

def enrich_csv(csv_path, codes_map, output_path=None):
    """
    Reads the weather CSV, adds City and State columns based on SiteCode, 
    and saves the result.
    """
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print(f"Reading {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Failed to read CSV: {e}")
        return
    
    print("Enriching data with City and State...")
    
    # Efficient mapping using pandas map
    # Convert codes_map to df for merge, or just map series
    # Let's use simple list comprehension for clarity as per previous successful run, 
    # or map for speed if dataset is huge. 200k rows is small for pandas.
    
    cities = []
    states = []
    
    # Pre-fetch lookup to avoid repeated dict lookup overhead in loop (negligible here but good practice)
    for code in df['SiteCode']:
        info = codes_map.get(code)
        if info:
            cities.append(info['City'])
            states.append(info['State'])
        else:
            cities.append(None)
            states.append(None)
            
    df['City'] = cities
    df['State'] = states
    
    if output_path is None:
        output_path = csv_path
        
    print(f"Saving enriched data to {output_path}...")
    df.to_csv(output_path, index=False)
    print("Enrichment complete.")

if __name__ == "__main__":
    # Configuration
    CODES_FILE = "weather-codes.txt"
    INPUT_CSV = "psa_weather_CpnTemps_Archive_200k.csv"
    
    # Logic
    print("Starting Weather Data Enrichment...")
    codes_map = parse_weather_codes(CODES_FILE)
    if not codes_map:
        print("No codes found. Exiting.")
    else:
        enrich_csv(INPUT_CSV, codes_map)
