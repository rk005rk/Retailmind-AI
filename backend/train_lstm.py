
from pathlib import Path
import json

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import joblib

# Reproducibility
np.random.seed(42)
tf.random.set_seed(42)

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "sample_sales.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH, parse_dates=["date"])
df = df.sort_values(["product_id", "date"])

LOOKBACK = 14  # Use the previous 14 days to predict the next day

# Use a chronological split: last 30 days are reserved for testing
last_date = df["date"].max()
test_start = last_date - pd.Timedelta(days=29)

X_train, y_train = [], []
X_test, y_test = [], []

# Fit the scaler using training-period sales only
training_sales = df.loc[df["date"] < test_start, "units_sold"].to_numpy()
scaler = MinMaxScaler()
scaler.fit(training_sales.reshape(-1, 1))

for _, product_df in df.groupby("product_id"):
    sales = product_df["units_sold"].to_numpy(dtype=float)
    dates = product_df["date"].to_numpy()

    scaled = scaler.transform(sales.reshape(-1, 1)).flatten()

    for i in range(LOOKBACK, len(sales)):
        sequence = scaled[i - LOOKBACK:i]
        target_date = pd.Timestamp(dates[i])

        if target_date < test_start:
            X_train.append(sequence)
            y_train.append(scaled[i])
        else:
            X_test.append(sequence)
            y_test.append(scaled[i])

X_train = np.array(X_train, dtype=np.float32)[..., np.newaxis]
y_train = np.array(y_train, dtype=np.float32)
X_test = np.array(X_test, dtype=np.float32)[..., np.newaxis]
y_test = np.array(y_test, dtype=np.float32)

model = Sequential([
    Input(shape=(LOOKBACK, 1)),
    LSTM(32),
    Dropout(0.15),
    Dense(16, activation="relu"),
    Dense(1),
])

model.compile(optimizer="adam", loss="mse")

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
)

model.fit(
    X_train,
    y_train,
    epochs=40,
    batch_size=32,
    validation_split=0.1,
    shuffle=False,
    callbacks=[early_stop],
    verbose=1,
)

scaled_predictions = model.predict(X_test, verbose=0)
predictions = scaler.inverse_transform(scaled_predictions).flatten()
actual = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
predictions = np.maximum(0, predictions)

mae = mean_absolute_error(actual, predictions)
rmse = np.sqrt(mean_squared_error(actual, predictions))

model.save(MODEL_DIR / "lstm_model.keras")
joblib.dump(scaler, MODEL_DIR / "lstm_scaler.joblib")

metadata = {
    "model": "LSTM",
    "data_source": "synthetic_sample_sales.csv",
    "synthetic_data": True,
    "lookback_days": LOOKBACK,
    "test_days": 30,
    "test_rows": int(len(y_test)),
    "mae_units": round(float(mae), 3),
    "rmse_units": round(float(rmse), 3),
}
with (MODEL_DIR / "lstm_metadata.json").open("w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print("\nLSTM training complete!")
print(f"Training sequences: {len(X_train)}")
print(f"Testing sequences:  {len(X_test)}")
print(f"MAE:  {mae:.2f} units")
print(f"RMSE: {rmse:.2f} units")
print("Saved lstm_model.keras and lstm_scaler.joblib")
print("Note: results are from synthetic data.")
