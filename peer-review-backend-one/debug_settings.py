"""
Debug Databricks connection settings
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=== Databricks Connection Settings ===\n")
print(f"DATABRICKS_HOST: {os.getenv('DATABRICKS_HOST', 'NOT SET')}")
print(f"DATABRICKS_HTTP_PATH: {os.getenv('DATABRICKS_HTTP_PATH', 'NOT SET')}")
print(f"DATABRICKS_CATALOG: {os.getenv('DATABRICKS_CATALOG', 'NOT SET')}")
print(f"DATABRICKS_SCHEMA: {os.getenv('DATABRICKS_SCHEMA', 'NOT SET')}")
print(f"DATABRICKS_TOKEN: {'***' + os.getenv('DATABRICKS_TOKEN', '')[-4:] if os.getenv('DATABRICKS_TOKEN') else 'NOT SET'}")
