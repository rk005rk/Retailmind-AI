
/* RetailMind AI — Business Health module */
(() => {
  const client = () => window.supabaseClient || window.db;
  const el = id => document.getElementById(id);
  const setText = (id, value) => {
    const node = el(id);
    if (node) node.textContent = value;
  };
  const setBar = (id, value) => {
    const node = el(id);
    if (node) {
      node.style.width = `${Math.max(0, Math.min(100, value))}%`;
    }
  };
  const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

  function statusFor(score) {
    if (score >= 80) return {
      label: "Excellent Operational Condition",
      cls: "badge badge-success",
      icon: "fa-shield-check"
    };
    if (score >= 60) return {
      label: "Good Operational Condition",
      cls: "badge badge-success",
      icon: "fa-circle-check"
    };
    if (score >= 40) return {
      label: "Needs Attention",
      cls: "badge badge-warning",
      icon: "fa-triangle-exclamation"
    };
    return {
      label: "Critical Condition",
      cls: "badge badge-danger",
      icon: "fa-circle-exclamation"
    };
  }

  function setStatus(score) {
    const node = el("pageHealthStatus");
    if (!node) return;
    const status = statusFor(score);
    node.className = status.cls;
    node.innerHTML = `<i class="fa-solid ${status.icon}"></i> ${status.label}`;
  }

  function setMetric(name, score) {
    setText(`pageHealth${name}`, score == null ? "N/A" : `${clamp(score)}%`);
    if (score != null) setBar(`pageHealth${name}Bar`, clamp(score));
  }

  function updateRecommendations({ products, supplierScore, profitMargin }) {
    const cards = document.querySelectorAll(
      "main.page-container .grid.grid-cols-3 > .card"
    );
    if (cards.length < 3) return;

    const lowStock = products.filter(
      p => Number(p.stock) <= Number(p.reorder_level)
    );
    const outOfStock = products.filter(p => Number(p.stock) <= 0);

    const actions = [
      {
        badge: "Pillar: Inventory",
        title: lowStock.length
          ? `Review ${lowStock.length} low-stock product${lowStock.length === 1 ? "" : "s"}`
          : "Maintain healthy inventory",
        body: outOfStock.length
          ? `${outOfStock.length} product(s) are out of stock. Review replenishment priorities.`
          : lowStock.length
            ? "Prioritise products at or below their reorder level to reduce stockout risk."
            : "No products are currently at or below their reorder level.",
        button: "View Inventory",
        href: "inventory.html"
      },
      {
        badge: "Pillar: Suppliers",
        title: supplierScore == null
          ? "Add supplier performance data"
          : supplierScore < 60
            ? "Review supplier performance"
            : "Monitor supplier performance",
        body: supplierScore == null
          ? "Supplier ratings are not available for the returned products."
          : `Current supplier rating-based score is ${supplierScore}%. Review low-rated suppliers.`,
        button: "View Suppliers",
        href: "suppliers.html"
      },
      {
        badge: "Pillar: Profitability",
        title: profitMargin < 0
          ? "Investigate negative gross profit"
          : profitMargin < 20
            ? "Review product margins"
            : "Protect current margins",
        body: `Calculated gross margin from completed sales is ${profitMargin.toFixed(1)}%. Compare selling prices with purchase costs before changing prices.`,
        button: "View Analytics",
        href: "analytics.html"
      }
    ];

    cards.forEach((card, index) => {
      const action = actions[index];
      if (!action) return;

      const badge = card.querySelector(".badge");
      const title = card.querySelector("h4");
      const body = card.querySelector("p");
      const button = card.querySelector("button");

      if (badge) badge.textContent = action.badge;
      if (title) title.textContent = action.title;
      if (body) body.textContent = action.body;

      if (button) {
        button.textContent = action.button;
        button.onclick = () => {
          window.location.href = action.href;
        };
      }
    });
  }

  async function loadHealth() {
    const db = client();

    if (!db) {
      throw new Error(
        "Supabase client not found. Check js/supabase.js is loaded first."
      );
    }

    setText("pageHealthScore", "…");

    const {
      data: { user },
      error: authError
    } = await db.auth.getUser();

    if (authError) throw authError;
    if (!user) {
      throw new Error("No signed-in user found. Please sign in again.");
    }

    const { data: membership, error: membershipError } = await db
      .from("business_members")
      .select("role,business_id,businesses(id,name,business_type,currency)")
      .eq("user_id", user.id)
      .single();

    if (membershipError) throw membershipError;

    const businessId = membership.business_id;

    window.currentBusiness = membership.businesses;
    window.currentBusinessId = businessId;
    window.businessId = businessId;

    setText(
      "pageHealthBusinessName",
      membership.businesses?.name || "Your Business"
    );

    const [productsResult, saleItemsResult, salesResult] = await Promise.all([
      db.from("products")
        .select("id,name,category,selling_price,purchase_price,stock,reorder_level,supplier_id,suppliers(id,name,rating,lead_time_days)")
        .eq("business_id", businessId),

      db.from("sale_items")
        .select("quantity,total_price,products(id,name,purchase_price),sales!inner(business_id,status)")
        .eq("sales.business_id", businessId)
        .eq("sales.status", "completed"),

      db.from("sales")
        .select("total_amount,sale_date,customer_id,status")
        .eq("business_id", businessId)
        .eq("status", "completed")
    ]);

    if (productsResult.error) throw productsResult.error;
    if (saleItemsResult.error) throw saleItemsResult.error;
    if (salesResult.error) throw salesResult.error;

    const products = productsResult.data || [];
    const saleItems = saleItemsResult.data || [];
    const sales = salesResult.data || [];

    const revenue = sales.reduce(
      (sum, sale) => sum + (Number(sale.total_amount) || 0),
      0
    );

    const grossProfit = saleItems.reduce((sum, item) => {
      const salesTotal = Number(item.total_price) || 0;
      const quantity = Number(item.quantity) || 0;
      const purchasePrice = Number(item.products?.purchase_price) || 0;
      return sum + salesTotal - quantity * purchasePrice;
    }, 0);

    const profitMargin = revenue > 0
      ? grossProfit / revenue * 100
      : 0;

    const profitabilityScore = clamp(profitMargin);

    const lowStock = products.filter(p =>
      Number(p.stock) > 0 &&
      Number(p.stock) <= Number(p.reorder_level)
    );

    const inventoryHealth = products.length
      ? clamp(100 - lowStock.length / products.length * 100)
      : null;

    const healthyStock = products.filter(p =>
      Number(p.stock) > Number(p.reorder_level)
    );

    const stockAccuracy = products.length
      ? clamp(healthyStock.length / products.length * 100)
      : null;

    const supplierRatings = products
      .map(p => Number(p.suppliers?.rating))
      .filter(rating => rating > 0);

    const supplierScore = supplierRatings.length
      ? clamp(
          supplierRatings.reduce((sum, rating) => sum + rating, 0) /
          supplierRatings.length * 20
        )
      : null;

    const customerSales = {};

    sales.forEach(sale => {
      if (!sale.customer_id) return;
      customerSales[sale.customer_id] =
        (customerSales[sale.customer_id] || 0) + 1;
    });

    const customerIds = Object.keys(customerSales);

    const retention = customerIds.length
      ? clamp(
          Object.values(customerSales).filter(count => count > 1).length /
          customerIds.length * 100
        )
      : null;

    // Same four-pillar calculation as dashboard.js.
    // Metrics with missing data are excluded from the average.
    const pillars = [
      profitabilityScore,
      inventoryHealth,
      stockAccuracy,
      supplierScore
    ].filter(value => value !== null);

    const healthScore = pillars.length
      ? clamp(pillars.reduce((sum, value) => sum + value, 0) / pillars.length)
      : 0;

    setText("pageHealthScore", healthScore);
    setText("sidebarHealthScore", `${healthScore}%`);
    setStatus(healthScore);

    setMetric("Profitability", profitabilityScore);
    setMetric("Inventory", inventoryHealth);
    setMetric("Customer", retention);
    setMetric("Stock", stockAccuracy);
    setMetric("Supplier", supplierScore);

    const circle = el("pageHealthCircle");

    if (circle) {
      const radius = 68;
      const circumference = 2 * Math.PI * radius;

      circle.style.strokeDasharray =
        `${circumference} ${circumference}`;
      circle.style.strokeDashoffset = circumference;

      requestAnimationFrame(() => {
        circle.style.transition = "stroke-dashoffset 1.2s ease-in-out";
        circle.style.strokeDashoffset =
          circumference - healthScore / 100 * circumference;
      });
    }

    const measuredPillars = [
      ["Profitability", profitabilityScore],
      ["Inventory health", inventoryHealth],
      ["Stock accuracy", stockAccuracy],
      ["Supplier performance", supplierScore]
    ].filter(item => item[1] !== null);

    measuredPillars.sort((a, b) => a[1] - b[1]);

    const insight = measuredPillars.length
      ? `Your business health score is ${healthScore}/100. The lowest measured pillar is ${measuredPillars[0][0]} (${measuredPillars[0][1]}%). Prioritise this area to improve operational health.`
      : "There is not enough business data to calculate a reliable health score yet.";

    setText("pageHealthInsight", insight);

    updateRecommendations({
      products,
      supplierScore,
      profitMargin
    });

    console.log("Business Health diagnostics loaded", {
      businessId,
      healthScore,
      profitabilityScore,
      inventoryHealth,
      retention,
      stockAccuracy,
      supplierScore,
      products: products.length,
      completedSales: sales.length
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadHealth().catch(error => {
      console.error("Business Health module failed to load:", error);

      const status = el("pageHealthStatus");

      if (status) {
        status.className = "badge badge-danger";
        status.textContent = "Unable to load business health";
      }

      setText(
        "pageHealthInsight",
        error.message || "Could not load health diagnostics. Check the console and Supabase permissions."
      );

      setText("pageHealthScore", "—");
    });
  });
})();
