import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "gridsathi.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Audit Logs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            device_id TEXT NOT NULL,
            device_name TEXT NOT NULL,
            action TEXT NOT NULL,  -- 'APPROVED' or 'REJECTED'
            original_start INTEGER NOT NULL,
            proposed_start INTEGER NOT NULL,
            reason TEXT NOT NULL
        )
    """)
    
    # App Settings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()

def add_audit_log(device_id: str, device_name: str, action: str, original_start: int, proposed_start: int, reason: str):
    conn = get_db()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO audit_logs (timestamp, device_id, device_name, action, original_start, proposed_start, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (now_str, device_id, device_name, action, original_start, proposed_start, reason))
    conn.commit()
    conn.close()

def get_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, timestamp, device_id, device_name, action, original_start, proposed_start, reason
        FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_audit_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM audit_logs")
    conn.commit()
    conn.close()
