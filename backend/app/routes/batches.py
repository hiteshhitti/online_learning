"""
Batch routes
  Public  : GET /batches/?course_id=   — used by the course detail page
  Admin   : GET/POST/PATCH/DELETE /admin/batches  — managed inside admin.py
            (see admin.py section at the bottom of this file for copy-paste)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.utils.sheets import get_sheet
from app.utils.auth import require_admin
from app.schemas.batch import BatchCreate, BatchUpdate
import uuid
from datetime import datetime

router = APIRouter()


# ── HELPERS ───────────────────────────────────────────────────────────────────

SHEET_NAME = "batches"

def _all_batches():
    return get_sheet(SHEET_NAME).get_all_records()

def _find_row(batch_id: str):
    """Return (row_index_1based, record) or raise 404."""
    sheet = get_sheet(SHEET_NAME)
    rows = sheet.get_all_records()
    for i, row in enumerate(rows, start=2):   # row 1 = header
        if str(row.get("id")) == batch_id:
            return sheet, i, row
    raise HTTPException(status_code=404, detail="Batch not found")


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@router.get("/")
def list_batches(course_id: str = Query(None)):
    """
    Return active batches. Optionally filter by course_id.
    Called by the frontend course detail page.
    """
    rows = _all_batches()

    # Filter by course
    if course_id:
        rows = [r for r in rows if str(r.get("course_id")) == str(course_id)]

    # Only active batches for public view
    rows = [r for r in rows if str(r.get("is_active", "TRUE")).upper() in ("TRUE", "1", "YES")]

    # Parse seats_filled as int so frontend can compute seats left
    for r in rows:
        r["seats_filled"] = int(r.get("seats_filled") or 0)
        r["seats_total"]  = int(r.get("seats_total")  or 0)

    return rows


# ── ADMIN — paste these into admin.py (or keep here and include router) ───────

@router.get("/admin", dependencies=[Depends(require_admin)])
def admin_list_batches(course_id: str = Query(None)):
    """Admin: list all batches (active + inactive), optionally filtered by course."""
    rows = _all_batches()
    if course_id:
        rows = [r for r in rows if str(r.get("course_id")) == str(course_id)]
    for r in rows:
        r["seats_filled"] = int(r.get("seats_filled") or 0)
        r["seats_total"]  = int(r.get("seats_total")  or 0)
    return rows


@router.post("/admin", dependencies=[Depends(require_admin)])
def admin_create_batch(batch: BatchCreate):
    """Admin: create a new batch."""
    sheet = get_sheet(SHEET_NAME)
    batch_id = str(uuid.uuid4())
    sheet.append_row([
        batch_id,
        batch.course_id,
        batch.name,
        batch.start_date,
        batch.timing,
        batch.seats_total,
        0,                          # seats_filled starts at 0
        batch.mode,
        "TRUE" if batch.is_active else "FALSE",
        str(datetime.now()),        # created_at
    ])
    return {"msg": "Batch created", "id": batch_id}


@router.patch("/admin/{batch_id}", dependencies=[Depends(require_admin)])
def admin_update_batch(batch_id: str, updates: BatchUpdate):
    """Admin: update any field of a batch."""
    sheet, row_idx, current = _find_row(batch_id)

    # Column order must match what append_row writes above:
    # 1=id  2=course_id  3=name  4=start_date  5=timing
    # 6=seats_total  7=seats_filled  8=mode  9=is_active  10=created_at
    col_map = {
        "name":        3,
        "start_date":  4,
        "timing":      5,
        "seats_total": 6,
        "mode":        8,
        "is_active":   9,
    }

    data = updates.model_dump(exclude_none=True)
    for field, col in col_map.items():
        if field in data:
            val = data[field]
            if field == "is_active":
                val = "TRUE" if val else "FALSE"
            sheet.update_cell(row_idx, col, val)

    return {"msg": "Batch updated"}


@router.delete("/admin/{batch_id}", dependencies=[Depends(require_admin)])
def admin_delete_batch(batch_id: str):
    """Admin: permanently delete a batch row."""
    sheet, row_idx, _ = _find_row(batch_id)
    sheet.delete_rows(row_idx)
    return {"msg": "Batch deleted"}
