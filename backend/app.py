import os
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase_service import SupabaseService, SupabaseServiceError
from forecasting import (
    forecast_daily_revenue,
    forecast_product_demand,
    build_inventory_risks,
    forecast_daily_units,
    backtest_daily_units,
    compare_daily_unit_methods
)

load_dotenv()
app = Flask(__name__)
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173").split(",") if x.strip()]
CORS(app, resources={r"/api/*": {"origins": origins}})

def service_for_request():
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        raise SupabaseServiceError("Missing access token. Sign in and try again.", 401)
    return SupabaseService(header.split(" ", 1)[1].strip())

def parse_days():
    try:
        days = int(request.args.get("days", "7"))
    except ValueError:
        raise SupabaseServiceError("days must be an integer between 1 and 30.", 400)
    if not 1 <= days <= 30:
        raise SupabaseServiceError("days must be between 1 and 30.", 400)
    return days

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "RetailMind AI prediction API", "time": datetime.now(timezone.utc).isoformat()})

@app.get("/api/predictions/sales")
def sales_prediction():
    try:
        days = parse_days()
        svc = service_for_request()
        business_id = svc.get_single_business_id()
        result = forecast_daily_revenue(svc.get_completed_sales(business_id), days)
        result["business_id"] = business_id
        return jsonify(result)
    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code
    except Exception:
        app.logger.exception("Sales prediction failed")
        return jsonify({"error": "Sales prediction failed. Check backend logs."}), 500

@app.get("/api/predictions/demand")
def demand_prediction():
    try:
        days = parse_days()
        svc = service_for_request()
        business_id = svc.get_single_business_id()
        result = forecast_product_demand(svc.get_completed_sale_items(business_id), svc.get_products(business_id), days)
        result["business_id"] = business_id
        return jsonify(result)
    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code
    except Exception:
        app.logger.exception("Demand prediction failed")
        return jsonify({"error": "Demand prediction failed. Check backend logs."}), 500

@app.get("/api/predictions/inventory")
def inventory_prediction():
    try:
        svc = service_for_request()
        business_id = svc.get_single_business_id()
        result = build_inventory_risks(svc.get_completed_sale_items(business_id), svc.get_products(business_id))
        result["business_id"] = business_id
        return jsonify(result)
    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code
    except Exception:
        app.logger.exception("Inventory prediction failed")
        return jsonify({"error": "Inventory prediction failed. Check backend logs."}), 500

@app.get("/api/predictions/units")
def units_prediction():
    try:
        days = parse_days()
        svc = service_for_request()
        business_id = svc.get_single_business_id()

        result = forecast_daily_units(
            svc.get_completed_sale_items(business_id),
            days
        )

        result["business_id"] = business_id
        return jsonify(result)

    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code

    except Exception:
        app.logger.exception("Daily units prediction failed")
        return jsonify({
            "error": "Daily units prediction failed. Check backend logs."
        }), 500


@app.get("/api/predictions/units/backtest")
def units_backtest():
    try:
        svc = service_for_request()
        business_id = svc.get_single_business_id()

        result = backtest_daily_units(
            svc.get_completed_sale_items(business_id),
            evaluation_days=30
        )

        result["business_id"] = business_id
        return jsonify(result)

    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code

    except Exception:
        app.logger.exception("Units backtest failed")
        return jsonify({
            "error": "Forecast backtest failed. Check backend logs."
        }), 500


@app.get("/api/predictions/units/compare")
def compare_units_prediction():
    try:
        svc = service_for_request()
        business_id = svc.get_single_business_id()

        result = compare_daily_unit_methods(
            svc.get_completed_sale_items(business_id),
            evaluation_days=30
        )

        result["business_id"] = business_id
        return jsonify(result)

    except SupabaseServiceError as exc:
        return jsonify({"error": str(exc)}), exc.status_code

    except Exception:
        app.logger.exception("Forecast comparison failed")
        return jsonify({
            "error": "Forecast comparison failed. Check backend logs."
        }), 500


 
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
