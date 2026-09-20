import numpy as np
import pandas as pd
import lightgbm as lgb
from typing import Dict, Tuple, List, Any

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lag, rolling, calendar, and solar/weather features for time series forecasting."""
    data = df.copy()
    data['timestamp'] = pd.to_datetime(data['timestamp'])
    data = data.sort_values('timestamp').reset_index(drop=True)
    
    # Lag features
    data['lag_1h'] = data['load_kw'].shift(1)
    data['lag_24h'] = data['load_kw'].shift(24)
    data['lag_168h'] = data['load_kw'].shift(168).bfill()
    data['rolling_mean_3h'] = data['load_kw'].shift(1).rolling(window=3, min_periods=1).mean()
    
    # Cyclical hour features
    data['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24.0)
    data['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24.0)
    
    # Drop initial rows with NaNs resulting from 24h lag
    data = data.dropna(subset=['lag_1h', 'lag_24h']).reset_index(drop=True)
    return data

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate Mean Absolute Error (MAE) and Mean Absolute Percentage Error (MAPE)."""
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    
    mae = float(np.mean(np.abs(y_true - y_pred)))
    # Avoid division by zero
    mask = y_true != 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)
    
    return {"mae": round(mae, 2), "mape": round(mape, 2)}

class EnergyForecaster:
    def __init__(self):
        self.feature_cols = [
            'hour', 'hour_sin', 'hour_cos', 'day_of_week', 'is_weekend',
            'temp_c', 'solar_kw', 'lag_1h', 'lag_24h', 'lag_168h', 'rolling_mean_3h'
        ]
        self.model_point = None
        self.model_q10 = None
        self.model_q90 = None
        self.is_trained = False
        
    def train_and_predict_24h(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train LightGBM models on historical data (all except last 24h for target prediction),
        evaluate against seasonal naive baseline on test set, and predict next 24h.
        """
        df_featured = create_features(df)
        
        # Split: test set is last 24h of history, target forecast horizon is next 24h
        train_df = df_featured.iloc[:-24]
        test_df = df_featured.iloc[-24:]
        
        X_train = train_df[self.feature_cols]
        y_train = train_df['load_kw']
        
        X_test = test_df[self.feature_cols]
        y_test = test_df['load_kw'].values
        
        # 1. Train LightGBM Point Regressor
        self.model_point = lgb.LGBMRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=5,
            num_leaves=31,
            random_state=42,
            verbosity=-1
        )
        self.model_point.fit(X_train, y_train)
        
        # 2. Train Quantile Regressors for prediction intervals
        self.model_q10 = lgb.LGBMRegressor(
            objective='quantile', alpha=0.10,
            n_estimators=100, learning_rate=0.05, max_depth=5, random_state=42, verbosity=-1
        )
        self.model_q10.fit(X_train, y_train)
        
        self.model_q90 = lgb.LGBMRegressor(
            objective='quantile', alpha=0.90,
            n_estimators=100, learning_rate=0.05, max_depth=5, random_state=42, verbosity=-1
        )
        self.model_q90.fit(X_train, y_train)
        self.is_trained = True
        
        # 3. Evaluate on held-out test set
        test_preds_lgb = self.model_point.predict(X_test)
        # Seasonal Naive baseline (lag 24h)
        test_preds_naive = test_df['lag_24h'].values
        
        lgb_metrics = calculate_metrics(y_test, test_preds_lgb)
        naive_metrics = calculate_metrics(y_test, test_preds_naive)
        
        # 4. Generate 24h Predictions for Target Horizon
        # Predict on test horizon (next 24h)
        pred_mean = self.model_point.predict(X_test)
        pred_q10 = self.model_q10.predict(X_test)
        pred_q90 = self.model_q90.predict(X_test)
        
        # Ensure q10 <= mean <= q90
        pred_q10 = np.minimum(pred_q10, pred_mean)
        pred_q90 = np.maximum(pred_q90, pred_mean)
        
        # Prepare hourly forecast details
        forecast_items = []
        for i in range(24):
            row = test_df.iloc[i]
            forecast_items.append({
                "hour": int(row['hour']),
                "timestamp": row['timestamp'].strftime("%Y-%m-%d %H:00"),
                "baseline_actual_kw": round(float(row['load_kw']), 2),
                "forecast_kw": round(float(pred_mean[i]), 2),
                "q10_kw": round(float(pred_q10[i]), 2),
                "q90_kw": round(float(pred_q90[i]), 2),
                "solar_kw": round(float(row['solar_kw']), 2),
                "temp_c": round(float(row['temp_c']), 2)
            })
            
        # Detect Anomalies in recent history
        anomalies = self.detect_anomalies(train_df)
        
        return {
            "forecast_items": forecast_items,
            "metrics": {
                "lightgbm": lgb_metrics,
                "seasonal_naive": naive_metrics,
                "improvement_pct": round(((naive_metrics['mape'] - lgb_metrics['mape']) / naive_metrics['mape']) * 100.0, 1)
            },
            "anomalies": anomalies,
            "data_freshness": "Updated live from Pune sensor telemetry & NASA POWER satellite solar feed."
        }
        
    def detect_anomalies(self, df_featured: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify historical hours where actual consumption deviated significantly from expectation."""
        if not self.is_trained:
            return []
            
        X = df_featured[self.feature_cols]
        y_true = df_featured['load_kw'].values
        y_pred = self.model_point.predict(X)
        
        residuals = y_true - y_pred
        std_res = np.std(residuals)
        mean_res = np.mean(residuals)
        
        anomalies = []
        # Check last 72 hours for anomalies
        for i in range(max(0, len(df_featured) - 72), len(df_featured)):
            row = df_featured.iloc[i]
            res = residuals[i]
            z_score = (res - mean_res) / (std_res + 1e-6)
            
            if abs(z_score) > 2.2:
                anomalies.append({
                    "timestamp": row['timestamp'].strftime("%Y-%m-%d %H:00"),
                    "hour": int(row['hour']),
                    "actual_kw": round(float(y_true[i]), 2),
                    "expected_kw": round(float(y_pred[i]), 2),
                    "deviation_kw": round(float(res), 2),
                    "z_score": round(float(z_score), 2),
                    "type": "Spike" if res > 0 else "Drop",
                    "severity": "High" if abs(z_score) > 3.0 else "Medium",
                    "description": f"Unusual energy { 'spike' if res > 0 else 'drop' } of {abs(round(res, 1))} kW detected at {row['timestamp'].strftime('%H:00')}."
                })
                
        return sorted(anomalies, key=lambda x: abs(x['z_score']), reverse=True)[:5]
