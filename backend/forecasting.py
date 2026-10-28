
from collections import defaultdict
from datetime import date, datetime, timedelta
import math


def parse_day(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        ).date()
    except (ValueError, TypeError):
        try:
            return date.fromisoformat(str(value)[:10])
        except (ValueError, TypeError):
            return None


def is_completed_sale(sale):
    return str(sale.get("status") or "").lower() == "completed"


def daily_revenue(sales):
    totals = defaultdict(float)

    for row in sales:
        if not is_completed_sale(row):
            continue

        day = parse_day(row.get("sale_date"))
        if day:
            totals[day] += float(row.get("total_amount") or 0)

    return totals


def forecast_series(values, horizon, today=None):
    today = today or date.today()
    history_days = sorted(d for d in values if d < today)

    if not history_days:
        return {
            "history_days": 0,
            "method": "insufficient_data",
            "forecast": [],
            "note": "No completed sales history is available."
        }

    # Calendar days without recorded sales contribute zero.
    series = [
        float(values.get(today - timedelta(days=30 - i), 0))
        for i in range(30)
    ]

    avg7 = sum(series[-7:]) / 7
    avg30 = sum(series) / 30
    previous7 = sum(series[-14:-7]) / 7
    trend = avg7 - previous7

    baseline = 0.65 * avg7 + 0.35 * avg30
    adjustment = max(-baseline * 0.25, min(baseline * 0.25, trend))

    forecast = [
        {
            "date": (today + timedelta(days=i)).isoformat(),
            "predicted_value": round(
                max(0, baseline + adjustment * min(i / 7, 1)), 2
            )
        }
        for i in range(1, horizon + 1)
    ]

    return {
        "history_days": len(history_days),
        "method": "weighted recent and 30-day average",
        "forecast": forecast,
        "note": (
            "Baseline estimate from recorded sales. "
            "It is not a guarantee of future demand."
        )
    }


def forecast_daily_revenue(sales, horizon):
    result = forecast_series(daily_revenue(sales), horizon)

    result.update({
        "metric": "daily_revenue",
        "currency": "INR",
        "historical_total_sales": len(sales),
        "historical_revenue": round(
            sum(
                float(s.get("total_amount") or 0)
                for s in sales
                if is_completed_sale(s)
            ),
            2
        )
    })

    return result


def item_demand_by_product(items):
    grouped = defaultdict(lambda: defaultdict(float))

    for item in items:
        product_id = str(item.get("product_id") or "")
        sale = item.get("sales") or {}

        # Some clients may return an embedded relationship as a list.
        if isinstance(sale, list):
            sale = sale[0] if sale else {}

        if not isinstance(sale, dict):
            continue

        if not is_completed_sale(sale):
            continue

        day = parse_day(sale.get("sale_date"))

        if product_id and day:
            grouped[product_id][day] += float(
                item.get("quantity") or 0
            )

    return grouped


def product_metrics(daily, today):
    last30_start = today - timedelta(days=30)
    last7_start = today - timedelta(days=7)

    last30 = sum(
        quantity
        for day, quantity in daily.items()
        if last30_start <= day < today
    )

    last7 = sum(
        quantity
        for day, quantity in daily.items()
        if last7_start <= day < today
    )

    selling_days = sum(
        1 for day, quantity in daily.items()
        if last30_start <= day < today and quantity > 0
    )

    last_sale = max(daily.keys()) if daily else None

    daily_rate = 0.65 * (last7 / 7) + 0.35 * (last30 / 30)

    if selling_days == 0:
        data_status = "insufficient_history"
    elif selling_days < 3:
        data_status = "limited_history"
    else:
        data_status = "estimate_available"

    return {
        "units_sold_last_7_days": int(last7),
        "units_sold_last_30_days": int(last30),
        "selling_days_last_30_days": selling_days,
        "last_sale_date": last_sale.isoformat() if last_sale else None,
        "estimated_daily_demand": daily_rate,
        "data_status": data_status
    }


def forecast_product_demand(items, products, horizon):
    grouped = item_demand_by_product(items)
    today = date.today()
    results = []

    for product in products:
        product_id = str(product.get("id") or "")
        daily = grouped.get(product_id, {})
        metrics = product_metrics(daily, today)

        stock = max(0, int(float(product.get("stock") or 0)))
        reorder_level = max(
            0, int(float(product.get("reorder_level") or 0))
        )

        enough_history = metrics["data_status"] != "insufficient_history"

        if enough_history:
            raw_demand = metrics["estimated_daily_demand"] * horizon
            expected_units = max(0, math.ceil(raw_demand))

            # Target enough stock for the forecast horizon, or the
            # configured reorder level, whichever is greater.
            target_stock = max(reorder_level, expected_units)
            suggested_reorder = max(0, target_stock - stock)
        else:
            expected_units = None
            suggested_reorder = None

        results.append({
            "product_id": product_id,
            "product_name": product.get("name") or "Unnamed product",
            "category": product.get("category"),
            "current_stock": stock,
            "reorder_level": reorder_level,
            "horizon_days": horizon,
            "expected_units": expected_units,
            "suggested_reorder_quantity": suggested_reorder,
            "stock_status": (
                "out_of_stock" if stock == 0
                else "below_reorder_level" if stock <= reorder_level
                else "in_stock"
            ),
            "data_status": metrics["data_status"],
            "units_sold_last_7_days": metrics["units_sold_last_7_days"],
            "units_sold_last_30_days": metrics["units_sold_last_30_days"],
            "selling_days_last_30_days": metrics["selling_days_last_30_days"],
            "last_sale_date": metrics["last_sale_date"]
        })

    results.sort(
        key=lambda product: (
            product["expected_units"] is None,
            -(product["expected_units"] or 0),
            product["product_name"].lower()
        )
    )

    return {
        "ok": True,
        "metric": "product_demand",
        "data_source": "supabase_completed_sales",
        "horizon_days": horizon,
        "products": results,
        "note": (
            "Estimates use recorded completed sales from the previous "
            "30 calendar days. Products with no recorded sales are not "
            "assigned an invented forecast. Sparse history is flagged."
        )
    }


def build_inventory_risks(items, products):
    grouped = item_demand_by_product(items)
    today = date.today()

    risk_order = {
        "critical": 0,
        "high": 1,
        "watch": 2,
        "unknown": 3,
        "healthy": 4
    }

    results = []

    for product in products:
        product_id = str(product.get("id") or "")
        daily = grouped.get(product_id, {})
        metrics = product_metrics(daily, today)

        stock = max(0, int(float(product.get("stock") or 0)))
        reorder_level = max(
            0, int(float(product.get("reorder_level") or 0))
        )

        rate = metrics["estimated_daily_demand"]
        enough_history = metrics["data_status"] != "insufficient_history"

        days_left = (
            round(stock / rate, 1)
            if enough_history and rate > 0
            else None
        )

        if stock == 0:
            risk = "critical"
        elif stock <= reorder_level:
            risk = "high"
        elif not enough_history:
            risk = "unknown"
        elif days_left is not None and days_left <= 3:
            risk = "critical"
        elif days_left is not None and days_left <= 7:
            risk = "high"
        elif days_left is not None and days_left <= 14:
            risk = "watch"
        else:
            risk = "healthy"

        target_stock = max(reorder_level, math.ceil(rate * 14))

        results.append({
            "product_id": product_id,
            "product_name": product.get("name") or "Unnamed product",
            "current_stock": stock,
            "reorder_level": reorder_level,
            "units_sold_last_30_days": metrics["units_sold_last_30_days"],
            "selling_days_last_30_days": metrics["selling_days_last_30_days"],
            "last_sale_date": metrics["last_sale_date"],
            "estimated_daily_demand": round(rate, 3) if enough_history else None,
            "estimated_days_until_stockout": days_left,
            "suggested_reorder_quantity": (
                max(0, target_stock - stock) if enough_history else None
            ),
            "data_status": metrics["data_status"],
            "risk": risk
        })

    results.sort(
        key=lambda product: (
            risk_order[product["risk"]],
            product["estimated_days_until_stockout"]
            if product["estimated_days_until_stockout"] is not None
            else 99999
        )
    )

    return {
        "ok": True,
        "metric": "inventory_risk",
        "data_source": "supabase_completed_sales",
        "products": results,
        "note": (
            "Inventory recommendations are estimates based on recent "
            "completed sales, current stock, and configured reorder "
            "levels. Pending purchase orders and supplier lead times "
            "are not included."
        )
    }

def forecast_daily_units(items, horizon=7):
    """
    Weekday-aware daily units forecast using completed Supabase sales.
    Uses historical weekday patterns when enough data is available,
    blended with recent demand. This is a statistical baseline,
    not a trained ML model.
    """
    from collections import defaultdict
    from datetime import date, timedelta
    import math

    today = date.today()
    daily_units = defaultdict(float)

    # Aggregate completed sale quantities by calendar date.
    for item in items:
        sale = item.get("sales") or {}

        if isinstance(sale, list):
            sale = sale[0] if sale else {}

        if not isinstance(sale, dict):
            continue

        if not is_completed_sale(sale):
            continue

        sale_day = parse_day(sale.get("sale_date"))
        quantity = float(item.get("quantity") or 0)

        if sale_day and sale_day < today and quantity >= 0:
            daily_units[sale_day] += quantity

    # Create a complete 56-day series, including zero-sale days.
    history_start = today - timedelta(days=56)

    series = [
        {
            "date": history_start + timedelta(days=i),
            "units": daily_units.get(history_start + timedelta(days=i), 0.0)
        }
        for i in range(56)
    ]

    
      # Weekday-aware statistical forecast
    from collections import defaultdict

    weekday_history = defaultdict(list)

    # Build weekday history from the previous 56 completed days
    for offset in range(56, 0, -1):
        past_day = today - timedelta(days=offset)
        weekday_history[past_day.weekday()].append(
            daily_units.get(past_day, 0.0)
        )

    # Last seven completed calendar days for the dashboard chart
    history = []
    for offset in range(7, 0, -1):
        past_day = today - timedelta(days=offset)
        history.append({
            "date": past_day.isoformat(),
            "actual_units": round(
                daily_units.get(past_day, 0.0), 2
            )
        })

    recent7 = [
        daily_units.get(today - timedelta(days=offset), 0.0)
        for offset in range(7, 0, -1)
    ]

    recent28 = [
        daily_units.get(today - timedelta(days=offset), 0.0)
        for offset in range(28, 0, -1)
    ]

    avg7 = sum(recent7) / 7
    avg28 = sum(recent28) / 28

    forecast = []

    for offset in range(1, horizon + 1):
        target_day = today + timedelta(days=offset)

        same_weekday_values = weekday_history.get(
            target_day.weekday(), []
        )

        weekday_avg = (
            sum(same_weekday_values) / len(same_weekday_values)
            if same_weekday_values
            else avg28
        )

        if len(same_weekday_values) >= 4:
            predicted = (
                0.65 * weekday_avg
                + 0.35 * (0.60 * avg7 + 0.40 * avg28)
            )
        else:
            predicted = 0.60 * avg7 + 0.40 * avg28

        forecast.append({
            "date": target_day.isoformat(),
            "predicted_units": max(0, math.ceil(predicted)),
            "weekday": target_day.strftime("%A")
        })

    # Return AFTER the loop has finished
    return {
        "ok": True,
        "metric": "daily_units_sold",
        "data_source": "supabase_completed_sale_items",
        "method": "weekday-aware statistical baseline",
        "history": history,
        "forecast": forecast,
        "history_window_days": 56,
        "note": (
            "Uses weekday patterns and recent 7-day and 28-day averages. "
            "This is a statistical baseline, not a trained ML model."
        )
    }


def backtest_daily_units(items, evaluation_days=14):
    """Evaluate daily-unit forecasts against historical actuals."""
    from collections import defaultdict
    from datetime import date, timedelta
    import math

    today = date.today()
    daily_units = defaultdict(float)

    for item in items:
        sale = item.get("sales") or {}

        if isinstance(sale, list):
            sale = sale[0] if sale else {}

        if not isinstance(sale, dict) or not is_completed_sale(sale):
            continue

        day = parse_day(sale.get("sale_date"))
        quantity = float(item.get("quantity") or 0)

        if day and day < today and quantity >= 0:
            daily_units[day] += quantity

    # Need enough earlier data to evaluate weekday patterns.
    start = today - timedelta(days=56)
    end = today - timedelta(days=1)

    observations = []
    absolute_errors = []
    squared_errors = []
    actual_total = 0.0

    for offset in range(evaluation_days, 0, -1):
        target = today - timedelta(days=offset)
        training_end = target - timedelta(days=1)
        training_start = training_end - timedelta(days=55)

        training = [
            (training_start + timedelta(days=i),
             daily_units.get(training_start + timedelta(days=i), 0.0))
            for i in range(56)
        ]

        recent7 = [value for _, value in training[-7:]]
        recent28 = [value for _, value in training[-28:]]

        avg7 = sum(recent7) / 7
        avg28 = sum(recent28) / 28
        baseline = 0.60 * avg7 + 0.40 * avg28

        weekday_history = [
            value for day, value in training
            if day.weekday() == target.weekday()
        ]

        if len(weekday_history) >= 4:
            weekday_avg = sum(weekday_history) / len(weekday_history)
            prediction = 0.65 * weekday_avg + 0.35 * baseline
        else:
            prediction = baseline

        prediction = max(0, math.ceil(prediction))
        actual = daily_units.get(target, 0.0)
        error = prediction - actual
        absolute_error = abs(error)

        observations.append({
            "date": target.isoformat(),
            "actual_units": round(actual, 2),
            "predicted_units": prediction,
            "absolute_error": round(absolute_error, 2)
        })

        absolute_errors.append(absolute_error)
        squared_errors.append(error ** 2)
        actual_total += actual

    if not observations:
        return {
            "ok": False,
            "error": "No evaluation observations are available."
        }

    mae = sum(absolute_errors) / len(absolute_errors)
    rmse = (sum(squared_errors) / len(squared_errors)) ** 0.5

    return {
        "ok": True,
        "metric": "daily_units_sold",
        "method": "weekday-aware statistical baseline",
        "evaluation_days": len(observations),
        "mae_units": round(mae, 2),
        "rmse_units": round(rmse, 2),
        "actual_units_total": round(actual_total, 2),
        "observations": observations,
        "note": (
            "MAE is the average absolute error in units per day. "
            "RMSE penalizes larger errors more heavily. "
            "These metrics evaluate this baseline, not a trained ML model."
        )
    }

def compare_daily_unit_methods(items, evaluation_days=14):
    """Compare three forecasting baselines on the same historical dates."""
    from collections import defaultdict
    from datetime import date, timedelta
    import math

    today = date.today()
    daily = defaultdict(float)

    for item in items:
        sale = item.get("sales") or {}
        if isinstance(sale, list):
            sale = sale[0] if sale else {}

        if not isinstance(sale, dict) or not is_completed_sale(sale):
            continue

        day = parse_day(sale.get("sale_date"))
        quantity = float(item.get("quantity") or 0)

        if day and day < today and quantity >= 0:
            daily[day] += quantity

    methods = {
        "7_day_average": [],
        "28_day_average": [],
        "weekday_aware": []
    }

    observations = []

    for offset in range(evaluation_days, 0, -1):
        target = today - timedelta(days=offset)
        train_end = target - timedelta(days=1)
        train_start = train_end - timedelta(days=55)

        training = [
            (train_start + timedelta(days=i),
             daily.get(train_start + timedelta(days=i), 0.0))
            for i in range(56)
        ]

        values = [value for _, value in training]
        avg7 = sum(values[-7:]) / 7
        avg28 = sum(values[-28:]) / 28

        weekday_values = [
            value for day, value in training
            if day.weekday() == target.weekday()
        ]

        weekday_avg = (
            sum(weekday_values) / len(weekday_values)
            if weekday_values else avg28
        )

        weekday_prediction = (
            0.65 * weekday_avg + 0.35 * (0.60 * avg7 + 0.40 * avg28)
            if len(weekday_values) >= 4
            else 0.60 * avg7 + 0.40 * avg28
        )

        predictions = {
            "7_day_average": max(0, avg7),
            "28_day_average": max(0, avg28),
            "weekday_aware": max(0, weekday_prediction)
        }

        actual = daily.get(target, 0.0)

        observations.append({
            "date": target.isoformat(),
            "actual_units": round(actual, 2),
            "predictions": {
                name: round(value, 2)
                for name, value in predictions.items()
            }
        })

        for name, predicted in predictions.items():
            error = predicted - actual
            methods[name].append({
                "absolute_error": abs(error),
                "squared_error": error ** 2
            })

    results = []

    for name, errors in methods.items():
        if not errors:
            continue

        mae = sum(x["absolute_error"] for x in errors) / len(errors)
        rmse = math.sqrt(
            sum(x["squared_error"] for x in errors) / len(errors)
        )

        results.append({
            "method": name,
            "mae_units": round(mae, 2),
            "rmse_units": round(rmse, 2),
            "evaluation_days": len(errors)
        })

    results.sort(key=lambda x: x["mae_units"])

    return {
        "ok": True,
        "metric": "daily_units_sold",
        "evaluation_days": evaluation_days,
        "results": results,
        "best_by_mae": results[0]["method"] if results else None,
        "observations": observations,
        "note": (
            "All methods use the same evaluation dates and only prior "
            "56-day windows. These are statistical baselines, not trained ML."
        )
    }
