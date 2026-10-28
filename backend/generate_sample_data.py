import csv, math, random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)

out = Path("backend/data/sample_sales.csv")
out.parent.mkdir(parents=True, exist_ok=True)

products = [
    ("P001", "Rice 5kg", 320, 18),
    ("P002", "Cooking Oil 1L", 145, 24),
    ("P003", "Milk 1L", 62, 35),
    ("P004", "Bread", 40, 28),
    ("P005", "Eggs 12-pack", 90, 20),
    ("P006", "Tea 250g", 125, 15),
    ("P007", "Biscuits", 30, 42),
    ("P008", "Shampoo 180ml", 110, 12),
]

fields = [
    "date", "product_id", "product_name", "price",
    "promotion", "day_of_week", "day_of_year", "units_sold"
]

with out.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    start = date(2025, 1, 1)

    for i in range(365):
        d = start + timedelta(days=i)
        dow = d.weekday()
        doy = d.timetuple().tm_yday
        seasonal = 1 + 0.12 * math.sin(2 * math.pi * doy / 365)
        seasonal += 0.06 * math.cos(2 * math.pi * dow / 7)

        for pid, name, base_price, demand in products:
            promo = int(random.random() < 0.16)
            price = round(
                base_price * (0.96 + random.random() * 0.08)
                * (0.94 if promo else 1), 2
            )
            expected = demand * seasonal * (1 + 0.0005 * i)
            expected *= (1.30 if promo else 1)
            expected *= (base_price / price) ** 0.45
            units = max(0, round(random.gauss(
                expected, max(1, expected * 0.12)
            )))

            writer.writerow({
                "date": d.isoformat(),
                "product_id": pid,
                "product_name": name,
                "price": price,
                "promotion": promo,
                "day_of_week": dow,
                "day_of_year": doy,
                "units_sold": units,
            })

print(f"Dataset created: {out}")
print("Rows: 2920 | Products: 8 | Days: 365")
