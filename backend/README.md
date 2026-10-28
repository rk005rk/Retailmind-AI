# RetailMind AI — Flask Prediction Backend

This starter preserves the existing HTML/CSS/JavaScript frontend and Supabase schema. It creates no new tables.

## Security
The browser sends its signed-in Supabase access token to Flask. Flask verifies it with Supabase Auth and forwards the same user JWT to PostgREST, so existing RLS policies remain enforced. Never use a service-role/secret key in the frontend. `.env` is ignored by Git.

This starter expects one business membership per signed-in user. Multiple memberships return HTTP 409 until a business selector is added.

## Setup (Windows PowerShell)
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `.env` with the existing Supabase URL and publishable/anon key.

## Run
```powershell
python app.py
```
Health check: `http://127.0.0.1:5000/api/health`

Authenticated endpoints:
- `GET /api/predictions/sales?days=7`
- `GET /api/predictions/demand?days=7`
- `GET /api/predictions/inventory`

`days` accepts 1–30.

## Frontend request example
```javascript
async function fetchRetailMindPrediction(endpoint) {
  const { data: { session }, error } =
    await window.supabaseClient.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error("Please sign in again.");

  const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Prediction request failed.");
  return payload;
}
```
Add your deployed frontend origin to `FRONTEND_ORIGINS` when deploying Flask.

## Existing schema assumptions
- `business_members(user_id, business_id)`
- `sales(id, business_id, total_amount, sale_date, status)`
- `sale_items(id, quantity, total_price, product_id, sale_id)`
- `products(id, business_id, name, sku, category, stock, reorder_level, selling_price, purchase_price, supplier_id)`

The `sale_items` query assumes a PostgREST relationship to `sales` and that `sales` has `sale_date`. If your actual schema differs, update the select to match it; do not create duplicate tables to fit the starter.

## Forecast limitations
Forecasts currently use a transparent baseline of recent and 30-day averages with bounded trend, not a trained/validated ML model. Validate against held-out historical sales before using forecasts for purchasing. Sparse history, seasonality, promotions, stockouts, and pending purchase orders are not yet modeled.
