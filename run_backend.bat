@echo off
echo Starting GridSathi Backend Server...
py -3.12 -m pip install -r backend/requirements.txt
py -3.12 backend/run.py
pause
