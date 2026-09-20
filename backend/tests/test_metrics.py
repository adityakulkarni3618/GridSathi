import pytest
import numpy as np
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.forecast_model import calculate_metrics

def test_calculate_metrics_accuracy():
    """Verify MAE and MAPE calculation precision."""
    y_true = np.array([100.0, 200.0, 300.0, 400.0])
    y_pred = np.array([110.0, 190.0, 300.0, 420.0])
    
    # Absolute errors: 10, 10, 0, 20 -> MAE = 40/4 = 10.0
    # Percentage errors: 10%, 5%, 0%, 5% -> MAPE = 20%/4 = 5.0%
    metrics = calculate_metrics(y_true, y_pred)
    
    assert metrics["mae"] == 10.0
    assert metrics["mape"] == 5.0

def test_zero_handling_in_mape():
    """Verify MAPE handles potential zeros in actual values without crashing or dividing by zero."""
    y_true = np.array([0.0, 100.0])
    y_pred = np.array([10.0, 110.0])
    
    metrics = calculate_metrics(y_true, y_pred)
    assert metrics["mape"] == 10.0 # Evaluates non-zero element (10/100 = 10%)
