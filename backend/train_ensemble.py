
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

BASE = Path(__file__).resolve().parent
DATA = pd.read_csv(BASE / "data" / "sample_sales.csv", parse_dates=["date"])
MODELS = BASE / "models"
MODELS.mkdir(exist_ok=True)

LOOKBACK = 14
DATA = DATA.sort_values(["product_id", "date"]).reset_index(drop=True)

# Final 30 days are reserved for testing.
last_date = DATA["date"].max()
test_start = last_date - pd.Timedelta(days=29)

# The 30 days before the final test period are for validation.
val_start = test_start - pd.Timedelta(days=30)

# Prepare the same date/product observations for both models.
records = []
for product_id, group in DATA.groupby("product_id"):
    group = group.sort_values("date").reset_index(drop=True)
    sales = group["units_sold"].to_numpy(dtype=float)

    for i in range(LOOKBACK, len(group)):
        row = group.iloc[i]
        record = {
            "date": row["date"],
            "product_id": product_id,
            "product_code": int(product_id[1:]) - 1,
            "price": float(row["price"]),
            "promotion": int(row["promotion"]),
            "day_of_week": int(row["day_of_week"]),
            "day_of_year": int(row["day_of_year"]),
            "actual": float(row["units_sold"]),
            "sequence": sales[i - LOOKBACK:i].copy(),
        }
        records.append(record)

all_data = pd.DataFrame(records)

features = [
    "product_code", "price", "promotion",
    "day_of_week", "day_of_year",
]

train = all_data[all_data["date"] < val_start]
val = all_data[
    (all_data["date"] >= val_start) &
    (all_data["date"] < test_start)
]
test = all_data[all_data["date"] >= test_start]

# Train XGBoost using the earlier training period only.
xgb = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=4,
)
xgb.fit(train[features], train["actual"])

# Scale LSTM sequences using training-period values only.
scaler = MinMaxScaler()
train_sales = DATA.loc[DATA["date"] < val_start, "units_sold"].to_numpy()
scaler.fit(train_sales.reshape(-1, 1))

def scaled_sequences(frame):
    X = np.stack([
        scaler.transform(seq.reshape(-1, 1)).flatten()
        for seq in frame["sequence"]
    ]).astype(np.float32)[..., np.newaxis]
    return X

X_train = scaled_sequences(train)
y_train = scaler.transform(train["actual"].to_numpy().reshape(-1, 1)).flatten()
X_val = scaled_sequences(val)
y_val = scaler.transform(val["actual"].to_numpy().reshape(-1, 1)).flatten()

lstm = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(LOOKBACK, 1)),
    tf.keras.layers.LSTM(32),
    tf.keras.layers.Dropout(0.15),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(1),
])
lstm.compile(optimizer="adam", loss="mse")
stop = tf.keras.callbacks.EarlyStopping(
    monitor="val_loss", patience=5, restore_best_weights=True
)
lstm.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=40, batch_size=32, shuffle=False,
    callbacks=[stop], verbose=1,
)

# Choose ensemble weights using validation data only.
val_xgb = np.maximum(0, xgb.predict(val[features]))
val_lstm = np.maximum(
    0,
    scaler.inverse_transform(lstm.predict(X_val, verbose=0)).flatten()
)
val_actual = val["actual"].to_numpy()

weights = np.arange(0.0, 1.01, 0.05)
best_weight = min(
    weights,
    key=lambda w: mean_absolute_error(
        val_actual, w * val_xgb + (1 - w) * val_lstm
    )
)

# Final evaluation on the untouched test period.
X_test = scaled_sequences(test)
test_xgb = np.maximum(0, xgb.predict(test[features]))
test_lstm = np.maximum(
    0,
    scaler.inverse_transform(lstm.predict(X_test, verbose=0)).flatten()
)
actual = test["actual"].to_numpy()
ensemble = best_weight * test_xgb + (1 - best_weight) * test_lstm

def metrics(y, pred):
    return {
        "mae_units": round(float(mean_absolute_error(y, pred)), 3),
        "rmse_units": round(float(np.sqrt(mean_squared_error(y, pred))), 3),
    }

results = {
    "data_source": "synthetic_sample_sales.csv",
    "synthetic_data": True,
    "test_days": 30,
    "test_rows": int(len(test)),
    "ensemble_weights": {
        "xgboost": round(float(best_weight), 2),
        "lstm": round(float(1 - best_weight), 2),
    },
    "xgboost": metrics(actual, test_xgb),
    "lstm": metrics(actual, test_lstm),
    "ensemble": metrics(actual, ensemble),
}

joblib.dump(xgb, MODELS / "ensemble_xgboost.joblib")
joblib.dump(scaler, MODELS / "ensemble_lstm_scaler.joblib")
lstm.save(MODELS / "ensemble_lstm.keras")

with (MODELS / "ensemble_metadata.json").open("w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\nEnsemble training and evaluation complete!")
print(json.dumps(results, indent=2))
print("\nSaved ensemble model files in:", MODELS)
print("All metrics are from synthetic data.")
