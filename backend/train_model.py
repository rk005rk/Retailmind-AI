
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "sample_sales.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Load synthetic data
df = pd.read_csv(DATA_PATH)
df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date").reset_index(drop=True)

# Convert product IDs into numeric values
product_codes = {
    product_id: code
    for code, product_id in enumerate(sorted(df["product_id"].unique()))
}
df["product_code"] = df["product_id"].map(product_codes)

# Features used by the model
features = [
    "product_code",
    "price",
    "promotion",
    "day_of_week",
    "day_of_year",
]

# Split by date: earlier dates train; last 30 days test
cutoff = df["date"].max() - pd.Timedelta(days=30)
train = df[df["date"] <= cutoff].copy()
test = df[df["date"] > cutoff].copy()

X_train = train[features]
y_train = train["units_sold"]
X_test = test[features]
y_test = test["units_sold"]

# Train XGBoost
model = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=4,
)

model.fit(X_train, y_train)

# Evaluate on the held-out dates
predictions = np.maximum(0, model.predict(X_test))
mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))

# Save model and metadata
joblib.dump(model, MODEL_DIR / "xgboost_model.joblib")

metadata = {
    "model": "XGBoost",
    "data_source": "synthetic_sample_sales.csv",
    "synthetic_data": True,
    "features": features,
    "product_codes": product_codes,
    "test_days": 30,
    "test_rows": int(len(test)),
    "mae_units": round(float(mae), 3),
    "rmse_units": round(float(rmse), 3),
}
with (MODEL_DIR / "xgboost_metadata.json").open("w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print("\nXGBoost training complete!")
print(f"Training rows: {len(train)}")
print(f"Testing rows:  {len(test)}")
print(f"MAE:  {mae:.2f} units")
print(f"RMSE: {rmse:.2f} units")
print(f"Model saved to: {MODEL_DIR / 'xgboost_model.joblib'}")
print("Note: results are from synthetic data, not real retail sales.")
