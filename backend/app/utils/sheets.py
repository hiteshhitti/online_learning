import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials

BASE_DIR  = os.path.dirname(__file__)
CREDS_PATH = os.path.join(BASE_DIR, "creds.json")

scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]

SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1U68FI265VjfGbQa3UhODCZdlbrd2GI83acK3vMd7lmc/edit#gid=0"

# ── Lazy connection — only opened on first request, not at import time ────────
_spreadsheet = None

def _get_spreadsheet():
    global _spreadsheet
    if _spreadsheet is None:
        creds  = ServiceAccountCredentials.from_json_keyfile_name(CREDS_PATH, scope)
        client = gspread.authorize(creds)
        _spreadsheet = client.open_by_url(SPREADSHEET_URL)
    return _spreadsheet

def get_sheet(sheet_name: str):
    try:
        return _get_spreadsheet().worksheet(sheet_name)
    except Exception as e:
        raise Exception(f"Sheet '{sheet_name}' not found or access issue: {str(e)}")
