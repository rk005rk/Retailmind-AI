import os
import requests
from dotenv import load_dotenv
load_dotenv()

class SupabaseServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

class SupabaseService:
    """Forwards the user's JWT to Supabase so existing RLS policies remain enforced."""
    def __init__(self, token):
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY", "")
        self.token = token
        if not self.url or not self.anon_key:
            raise SupabaseServiceError("Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.", 500)
        self.headers = {"apikey": self.anon_key, "Authorization": "Bearer " + token, "Accept": "application/json"}

    def get_user(self):
        try:
            r = requests.get(self.url + "/auth/v1/user", headers=self.headers, timeout=15)
        except requests.RequestException as exc:
            raise SupabaseServiceError("Could not reach Supabase to verify the session.", 502) from exc
        if r.status_code == 401:
            raise SupabaseServiceError("Your session is invalid or expired. Sign in again.", 401)
        if not r.ok:
            raise SupabaseServiceError("Could not verify the signed-in user.", 502)
        return r.json()

    def _get(self, table, params):
        try:
            r = requests.get(self.url + "/rest/v1/" + table, headers=self.headers, params=params, timeout=20)
        except requests.RequestException as exc:
            raise SupabaseServiceError("Could not reach Supabase.", 502) from exc
        if r.status_code == 401:
            raise SupabaseServiceError("Your session is invalid or expired. Sign in again.", 401)
        if r.status_code == 403:
            raise SupabaseServiceError("Supabase denied access. Check RLS policies and membership.", 403)
        if not r.ok:
            raise SupabaseServiceError("Supabase query failed (HTTP {}). Check table/column names and RLS.".format(r.status_code), 502)
        return r.json()

    def get_single_business_id(self):
        user_id = self.get_user().get("id")
        rows = self._get("business_members", {"select": "business_id", "user_id": "eq." + user_id, "limit": "2"})
        if not rows:
            raise SupabaseServiceError("No business is linked to this account.", 403)
        if len(rows) > 1:
            raise SupabaseServiceError("This account belongs to multiple businesses. Business selection is required.", 409)
        return rows[0]["business_id"]

    def get_completed_sales(self, business_id):
        return self._get("sales", {"select": "id,business_id,total_amount,sale_date,status", "business_id": "eq." + business_id, "status": "eq.completed", "order": "sale_date.asc", "limit": "10000"})

    def get_completed_sale_items(self, business_id):
        return self._get("sale_items", {"select": "id,quantity,total_price,product_id,sale_id,sales!inner(business_id,status,sale_date)", "sales.business_id": "eq." + business_id, "sales.status": "eq.completed", "limit": "20000"})

    def get_products(self, business_id):
        return self._get("products", {"select": "id,name,sku,category,stock,reorder_level,selling_price,purchase_price,supplier_id", "business_id": "eq." + business_id, "limit": "10000"})
