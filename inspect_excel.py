
import pandas as pd
import sys

file_path = "Performans-Data (1).xlsx"
try:
    df = pd.read_excel(file_path, header=None)
    # Print first few rows to identify header
    print("First 5 rows:")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error reading file: {e}")
