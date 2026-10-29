
/**
 * RETAILMIND AI - PREDICTIVE ANALYTICS
 * Real Supabase business data + Flask demand forecasting.
 *
 * Forecast API:
 * GET http://127.0.0.1:5000/api/predictions/demand?days=7
 *
 * Authentication:
 * Supabase access token sent to Flask as a Bearer token.
 *
 * No fabricated sales, revenue, or profit figures.
 */

const API_BASE_URL = "https://retailmind-ai-1tt7.onrender.com";
const DEMAND_API = `${API_BASE_URL}/api/predictions/demand`;

let forecastRows = [];
let forecastDaysLoaded = 7;
let forecastRequestNumber = 0;
let currentBusinessSales = [];
let currentBusinessProducts = [];
let simulatorBaseRevenue = 0;
let simulatorBaseUnits = 0;
let simulatorInitialized = false;
let currentBusinessSaleItems = [];
let simulatorBaseGrossProfit = 0;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  setupPredictionTabs();
  setupSimulatorSlider();
  setupSmartReorderActions();
  setupEnsembleForecast();

  await initializePredictionPage();
});

async function initializePredictionPage() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      showPageStatus("Please sign in to view your business predictions.");
      setKpiPlaceholders();
      return;
    }

    await loadPredictionBusiness();

    if (!window.currentBusiness?.id) {
      showPageStatus(
        "No business is linked to your account. Check your business membership."
      );
      setKpiPlaceholders();
      return;
    }

    await Promise.all([
      loadBusinessSales(),
      loadBusinessProducts(),
      loadBusinessSaleItems()
    ]);

    updateRealBusinessKpis();
    updateExplainableDemandDrivers();
    updateSimulatorFromRealData();
    await loadReorderRecommendations();
    await loadDeadStockMonitor();
    await loadDynamicPricingRecommendations();
  } catch (error) {
    console.error("Prediction page initialization failed:", error);
    showPageStatus(error.message || "Unable to initialize predictions.");
  }
}

/* =========================================================
   SUPABASE AUTHENTICATION
========================================================= */

async function getCurrentSession() {
  if (typeof supabaseClient === "undefined" || !supabaseClient?.auth) {
    throw new Error(
      "Supabase client is missing. Load your Supabase configuration before predictions.js."
    );
  }

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) throw error;

  return data?.session || null;
}

async function loadPredictionBusiness() {
  const session = await getCurrentSession();

  if (!session?.user) {
    window.currentBusiness = null;
    window.currentUser = null;
    return;
  }

  const { data: membership, error } = await supabaseClient
    .from("business_members")
    .select("business_id, role, businesses(id, name)")
    .eq("user_id", session.user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Business membership query failed:", error);
    throw new Error("Could not load your business membership.");
  }

  if (!membership?.business_id) {
    window.currentBusiness = null;
    window.currentUser = session.user;
    return;
  }

  // The relation can be returned as an object or an array.
  const businessRelation = membership.businesses;
  const business = Array.isArray(businessRelation)
    ? businessRelation[0]
    : businessRelation;

  window.currentBusiness = business?.id
    ? business
    : { id: membership.business_id, name: "Your Business" };

  window.currentBusinessRole = membership.role;
  window.currentUser = session.user;
}

/* =========================================================
   LOAD REAL SALES
========================================================= */

async function loadBusinessSales() {
  const businessId = window.currentBusiness?.id;
  if (!businessId) return;

  const { data, error } = await supabaseClient
    .from("sales")
    .select("id, total_amount, sale_date, status")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .order("sale_date", { ascending: false });

  if (error) {
    console.error("Sales query failed:", error);
    throw new Error("Could not load completed sales.");
  }

  currentBusinessSales = (data || []).filter(sale => {
    return sale.sale_date && Number.isFinite(Number(sale.total_amount));
  });
}

function getSaleDate(sale) {
  const date = new Date(sale.sale_date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSalesInRange(sales, startDate, endDate) {
  return sales.filter(sale => {
    const date = getSaleDate(sale);
    return date && date >= startDate && date < endDate;
  });
}

function sumSalesRevenue(sales) {
  return sales.reduce(
    (total, sale) => total + (Number(sale.total_amount) || 0),
    0
  );
}

function getLocalDayStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCurrency(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "—";

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function setKpiPlaceholders() {
  setText("predSalesVal", "—");
  setText("predRevVal", "—");
  setText("predGrowthVal", "—");
}

function updateExplainableDemandDrivers() {
  const sales = currentBusinessSales || [];

  const set = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const setBar = (id, percentage) => {
    const element = document.getElementById(id);
    if (!element) return;

    // Bar length is a visual scale, not a confidence score.
    const width = Math.min(100, Math.max(0, percentage));
    element.style.width = `${width}%`;
  };

  const today = getLocalDayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start30 = new Date(today);
  start30.setDate(start30.getDate() - 29);

  const start14 = new Date(today);
  start14.setDate(start14.getDate() - 13);

  const start7 = new Date(today);
  start7.setDate(start7.getDate() - 6);

  // Sum revenue for each local calendar date.
  const dailyRevenue = new Map();

  for (const sale of sales) {
    const date = getSaleDate(sale);
    if (!date || date < start30 || date >= tomorrow) continue;

    const day = getLocalDayStart(date);
    const key = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, "0"),
      String(day.getDate()).padStart(2, "0")
    ].join("-");

    dailyRevenue.set(
      key,
      (dailyRevenue.get(key) || 0) +
      Math.max(0, Number(sale.total_amount) || 0)
    );
  }

  const keyFor = date => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (
    let date = new Date(start30);
    date < tomorrow;
    date.setDate(date.getDate() + 1)
  ) {
    const revenue = dailyRevenue.get(keyFor(date)) || 0;
    const day = date.getDay();

    if (day === 0 || day === 6) {
      weekendTotal += revenue;
      weekendCount++;
    } else {
      weekdayTotal += revenue;
      weekdayCount++;
    }
  }

  const weekdayAverage = weekdayCount
    ? weekdayTotal / weekdayCount
    : 0;

  const weekendAverage = weekendCount
    ? weekendTotal / weekendCount
    : 0;

  if (
    weekendCount >= 2 &&
    weekdayCount >= 5 &&
    weekdayAverage > 0
  ) {
    const effect =
      ((weekendAverage - weekdayAverage) / weekdayAverage) * 100;

    set(
      "xaiWeekendValue",
      `${effect > 0 ? "+" : ""}${effect.toFixed(1)}%`
    );

    setBar(
      "xaiWeekendBar",
      Math.abs(effect) / (1 + Math.abs(effect)) * 100
    );

    set(
      "xaiWeekendDetail",
      `Average weekend revenue ${formatCurrency(weekendAverage)} per day; weekday average ${formatCurrency(weekdayAverage)}.`
    );
  } else {
    set("xaiWeekendValue", "Insufficient data");
    setBar("xaiWeekendBar", 0);
    set(
      "xaiWeekendDetail",
      "More completed sales across weekdays and weekends are needed."
    );
  }

  const revenueForRange = (start, end) => {
    let total = 0;

    for (
      let date = new Date(start);
      date < end;
      date.setDate(date.getDate() + 1)
    ) {
      total += dailyRevenue.get(keyFor(date)) || 0;
    }

    return total;
  };

  const previous7Start = new Date(start7);
  previous7Start.setDate(previous7Start.getDate() - 7);

  const recent7Revenue = revenueForRange(start7, tomorrow);
  const previous7Revenue = revenueForRange(
    previous7Start,
    start7
  );

  if (previous7Revenue > 0) {
    const trend =
      ((recent7Revenue - previous7Revenue) /
        previous7Revenue) * 100;

    set(
      "xaiTrendValue",
      `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`
    );

    setBar(
      "xaiTrendBar",
      Math.abs(trend) / (1 + Math.abs(trend)) * 100
    );

    set(
      "xaiTrendDetail",
      `Recent 7-day revenue ${formatCurrency(recent7Revenue)}; previous 7-day revenue ${formatCurrency(previous7Revenue)}.`
    );
  } else {
    set("xaiTrendValue", "Insufficient data");
    setBar("xaiTrendBar", 0);
    set(
      "xaiTrendDetail",
      "A positive previous-week revenue baseline is needed to calculate a trend."
    );
  }

  const badge = document.getElementById("xaiReliabilityBadge");
  if (badge) {
    badge.textContent = sales.length
      ? `${sales.length} recorded sales`
      : "No sales history";
  }

  set(
    "xaiSummary",
    sales.length
      ? "These are historical revenue comparisons, not proof of causation or a forecast-confidence score."
      : "No completed sales are available for this business yet."
  );
}

/* =========================================================
   REAL BUSINESS KPI CARDS
   These show completed sales, not forecasted values.
========================================================= */

function updateRealBusinessKpis() {
  const today = getLocalDayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const fourteenDaysAgo = new Date(sevenDaysAgo);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

  const todaySales = getSalesInRange(
    currentBusinessSales,
    today,
    tomorrow
  );

  const yesterdaySales = getSalesInRange(
    currentBusinessSales,
    yesterday,
    today
  );

  const lastSevenDays = getSalesInRange(
    currentBusinessSales,
    sevenDaysAgo,
    tomorrow
  );

  const previousSevenDays = getSalesInRange(
    currentBusinessSales,
    fourteenDaysAgo,
    sevenDaysAgo
  );

  const todayRevenue = sumSalesRevenue(todaySales);
  const yesterdayRevenue = sumSalesRevenue(yesterdaySales);

  const currentWeekRevenue = sumSalesRevenue(lastSevenDays);
  const previousWeekRevenue = sumSalesRevenue(previousSevenDays);

  // Count completed transactions, because the sales table does not
  // provide a guaranteed total item quantity for each sale.
  setText("predSalesVal", todaySales.length.toLocaleString("en-IN"));
  setText("predRevVal", formatCurrency(todayRevenue));

  const growthElement = document.getElementById("predGrowthVal");

  if (growthElement) {
    if (previousWeekRevenue > 0) {
      const growth =
        ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100;

      growthElement.textContent = formatPercent(growth);
      growthElement.title = "Revenue change versus the previous 7-day period";
    } else if (currentWeekRevenue > 0) {
      growthElement.textContent = "New sales";
      growthElement.title =
        "There is no previous 7-day revenue baseline for comparison.";
    } else {
      growthElement.textContent = "—";
      growthElement.title = "Not enough sales data to calculate growth.";
    }
  }

  // Keep daily comparison available for debugging or future UI use.
  window.predictionSalesSummary = {
    todayTransactions: todaySales.length,
    todayRevenue,
    yesterdayTransactions: yesterdaySales.length,
    yesterdayRevenue,
    currentWeekRevenue,
    previousWeekRevenue
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value ?? "");
}

function showPageStatus(message) {
  const status = document.getElementById("ensembleForecastStatus");
  if (status) status.textContent = message;
}

/* =========================================================
   LOAD REAL PRODUCTS
========================================================= */

async function loadBusinessProducts() {
  const businessId = window.currentBusiness?.id;
  if (!businessId) return;

  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      id,
      name,
      sku,
      category,
      stock,
      reorder_level,
      selling_price,
      purchase_price,
      supplier_id,
      is_archived,
      suppliers(id, name, lead_time_days)
    `)
    .eq("business_id", businessId)
    .eq("is_archived", false);

  if (error) {
    // If your database doesn't have is_archived, fix the schema/query
    // rather than silently showing potentially archived products.
    console.error("Product query failed:", error);
    throw new Error(
      "Could not load products. Check the products table and is_archived column."
    );
  }

  currentBusinessProducts = data || [];
}

async function loadBusinessSaleItems() {
  const businessId = window.currentBusiness?.id;
  if (!businessId) return;

  const { data, error } = await supabaseClient
    .from("sale_items")
    .select(`
      id,
      sale_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      products (
        id,
        purchase_price
      ),
      sales!inner (
        business_id,
        status,
        sale_date
      )
    `)
    .eq("sales.business_id", businessId)
    .eq("sales.status", "completed");

  if (error) {
    console.error("Sale items query failed:", error);
    throw new Error("Could not load product costs for profit calculation.");
  }

  currentBusinessSaleItems = data || [];
}

/* =========================================================
   SMART REORDER RECOMMENDATIONS — REAL INVENTORY DATA
   Quantities are based on configured reorder levels.
   No purchase order is created by rendering this table.
========================================================= */

async function loadReorderRecommendations() {
  const tableBody = document.getElementById(
    "reorderRecommendationsBody"
  );

  if (!tableBody) return;

  const businessId = window.currentBusiness?.id;

  if (!businessId) {
    tableBody.replaceChildren(
      makeTableMessage(
        "Sign in and select a business to view reorder suggestions.",
        8
      )
    );
    return;
  }

  try {
    const products = Array.isArray(currentBusinessProducts)
      ? currentBusinessProducts
      : [];

    // Only active products belonging to the selected business.
    // currentBusinessProducts is already loaded for the selected business.
    const businessProducts = products.filter(product =>
      product &&
      product.id &&
      product.is_archived !== true &&
      product.is_archived !== "true"
    );

    const lowStockProducts = businessProducts
      .filter(product => {
        const stock = Number(product.stock);
        const reorderLevel = Number(product.reorder_level);

        return (
          Number.isFinite(stock) &&
          Number.isFinite(reorderLevel) &&
          stock <= reorderLevel
        );
      })
      .sort((a, b) => {
        const stockA = Number(a.stock) || 0;
        const stockB = Number(b.stock) || 0;
        const levelA = Number(a.reorder_level) || 0;
        const levelB = Number(b.reorder_level) || 0;

        // Most urgent stock shortages first.
        const shortageA = levelA - stockA;
        const shortageB = levelB - stockB;

        return shortageB - shortageA;
      });

    tableBody.replaceChildren();

    if (!lowStockProducts.length) {
      tableBody.appendChild(
        makeTableMessage(
          businessProducts.length
            ? "No products are at or below their reorder levels."
            : "No active products were found for this business.",
          8
        )
      );
      return;
    }

    const currency = value =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(value);

    const formatDeliveryDate = days => {
      if (!Number.isInteger(days) || days < 0) {
        return "Not configured";
      }

      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + days);

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };

    lowStockProducts.forEach(product => {
      const stock = Number(product.stock);
      const reorderLevel = Number(product.reorder_level);

      // Replenish to the configured reorder level.
      // This is not yet a demand-based forecast quantity.
      const quantity = Math.max(
        0,
        Math.ceil(reorderLevel - stock)
      );

      const rawPrice = product.purchase_price;
      const priceAvailable =
        rawPrice !== null &&
        rawPrice !== undefined &&
        rawPrice !== "" &&
        Number.isFinite(Number(rawPrice)) &&
        Number(rawPrice) >= 0;

      const estimatedCost = priceAvailable
        ? quantity * Number(rawPrice)
        : null;

      const supplierRelation =
        product.suppliers ?? product.supplier ?? null;

      const supplier = Array.isArray(supplierRelation)
        ? supplierRelation[0]
        : supplierRelation;

      const supplierName =
        supplier?.name ||
        supplier?.supplier_name ||
        "Not configured";

      const rawLeadTime = supplier?.lead_time_days;

      const leadTimeAvailable =
        rawLeadTime !== null &&
        rawLeadTime !== undefined &&
        rawLeadTime !== "" &&
        Number.isFinite(Number(rawLeadTime)) &&
        Number(rawLeadTime) >= 0;

      const leadTime = leadTimeAvailable
        ? Math.ceil(Number(rawLeadTime))
        : null;

      const row = document.createElement("tr");

      // Product and current stock.
      const productCell = document.createElement("td");

      const name = document.createElement("div");
      name.className = "font-bold text-dark";
      name.textContent = product.name || "Unnamed product";

      const detail = document.createElement("div");
      detail.className = "text-muted";
      detail.style.fontSize = ".75rem";
      detail.textContent =
        `Current: ${stock} · Reorder level: ${reorderLevel}`;

      productCell.append(name, detail);
      row.appendChild(productCell);

      // Recommended quantity.
      const quantityCell = document.createElement("td");
      const quantityText = document.createElement("strong");

      quantityText.className = "text-primary";
      quantityText.textContent = quantity > 0
        ? `+${quantity} units`
        : "Review target";

      quantityCell.appendChild(quantityText);
      row.appendChild(quantityCell);

      // Supplier.
      const supplierCell = document.createElement("td");
      supplierCell.textContent = supplierName;
      row.appendChild(supplierCell);

      // Cost. Never show a missing cost as ₹0.
      const costCell = document.createElement("td");

      if (estimatedCost !== null) {
        const costText = document.createElement("strong");
        costText.textContent = currency(estimatedCost);
        costCell.appendChild(costText);
      } else {
        costCell.textContent = "Cost unavailable";
        costCell.className = "text-muted";
      }

      row.appendChild(costCell);

      // Lead time and estimated delivery.
      const leadCell = document.createElement("td");
      leadCell.textContent = leadTime === null
        ? "Not configured"
        : `${leadTime} ${leadTime === 1 ? "day" : "days"}`;

      row.appendChild(leadCell);

      const deliveryCell = document.createElement("td");
      deliveryCell.textContent = leadTime === null
        ? "Not available"
        : formatDeliveryDate(leadTime);

      row.appendChild(deliveryCell);

      // Transparent stock status instead of invented AI confidence.
      const statusCell = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = "badge badge-warning";

      if (stock <= 0) {
        statusBadge.textContent = "Out of stock";
      } else if (stock < reorderLevel) {
        statusBadge.textContent = "Below reorder level";
      } else {
        statusBadge.textContent = "At reorder level";
      }

      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);

      // Review action only. This does not claim an order was sent.
      const actionCell = document.createElement("td");
      const reviewButton = document.createElement("button");

      reviewButton.type = "button";
      reviewButton.className =
        "btn btn-sm btn-primary btn-reorder-action";

      reviewButton.dataset.productId = product.id;
      reviewButton.dataset.supplierId = product.supplier_id || "";
      reviewButton.dataset.quantity = String(quantity);

      reviewButton.textContent = "Review";
      reviewButton.disabled = quantity <= 0;

      actionCell.appendChild(reviewButton);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Reorder recommendations error:", error);

    tableBody.replaceChildren(
      makeTableMessage(
        "Could not load reorder recommendations. Check the browser console.",
        8
      )
    );
  }
}

/* =========================================================
   PURCHASE ORDER WORKFLOW — SUPABASE
========================================================= */

async function createPurchaseOrderFromRecommendation(button) {
  const productId = button.dataset.productId;
  const supplierId = button.dataset.supplierId;
  const quantity = Number(button.dataset.quantity);

  const businessId = window.currentBusiness?.id;

  if (!businessId || !productId) {
    showToast("Business or product information is missing.", "error");
    return;
  }

  if (!supplierId) {
    showToast(
      "Assign a supplier to this product before ordering.",
      "error"
    );
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    showToast("The recommended quantity is invalid.", "error");
    return;
  }

  const product = currentBusinessProducts.find(
    item => String(item.id) === String(productId)
  );

  if (!product) {
    showToast("Product not found. Refresh the recommendations.", "error");
    return;
  }

  const purchasePrice = product.purchase_price;

  if (
    purchasePrice === null ||
    purchasePrice === undefined ||
    purchasePrice === "" ||
    !Number.isFinite(Number(purchasePrice)) ||
    Number(purchasePrice) < 0
  ) {
    showToast(
      "A valid purchase price is required before ordering.",
      "error"
    );
    return;
  }

  const unitPrice = Number(purchasePrice);
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;


  const confirmed = await showPurchaseOrderConfirmation({
    productName: product.name || "Unnamed product",
    quantity,
    unitPrice,
    total: totalPrice
  });

  if (!confirmed) return;


  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving…";

  let createdOrderId = null;

  try {
    const { data: order, error: orderError } = await supabaseClient
      .from("purchase_orders")
      .insert({
        business_id: businessId,
        supplier_id: supplierId,
        order_date: new Date().toISOString(),
        total_amount: totalPrice,
        status: "pending"
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    createdOrderId = order.id;

    const { error: itemError } = await supabaseClient
      .from("purchase_order_items")
      .insert({
        purchase_order_id: createdOrderId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });

    if (itemError) {
      // Best-effort cleanup of the empty parent order.
      const { error: cleanupError } = await supabaseClient
        .from("purchase_orders")
        .delete()
        .eq("id", createdOrderId)
        .eq("business_id", businessId);

      if (cleanupError) {
        console.error("Order cleanup failed:", cleanupError);
      }

      throw itemError;
    }

    showRetailMindToast(
      "success",
      "Purchase order saved",
      `${product.name}: ${quantity} units, total ${new Intl.NumberFormat(
        "en-IN",
        { style: "currency", currency: "INR" }
      ).format(totalPrice)}. Status: Pending. Not sent to supplier.`
    );

    await loadReorderRecommendations();
  } catch (error) {
    console.error("Purchase order creation failed:", error);

    showRetailMindToast(
      "error",
      "Could not save purchase order",
      error.message || "Please check your connection and Supabase permissions."
    );

    button.disabled = false;
    button.textContent = originalText;
  }
}

/* Event delegation supports dynamically rendered Review buttons. */
document.addEventListener("click", event => {
  const button = event.target.closest(
    "#reorderRecommendationsBody .btn-reorder-action"
  );

  if (!button) return;

  createPurchaseOrderFromRecommendation(button);
});

/* =========================================================
   TIMEFRAME TABS
   No fake KPI values are inserted when tabs are clicked.
========================================================= */

function setupPredictionTabs() {
  const tabs = document.querySelectorAll(".prediction-tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      const period = tab.getAttribute("data-period");
      updatePredictionCards(period);

      if (typeof showToast === "function") {
        showToast("Timeframe selected.", "info", "fa-chart-line");
      }
    });
  });
}

function updatePredictionCards(period) {
  // The existing HTML KPI cards are daily/weekly business indicators.
  // Do not replace them with fabricated monthly/yearly numbers.
  updateRealBusinessKpis();

  const growthElement = document.getElementById("predGrowthVal");
  if (growthElement && period && period !== "Daily") {
    growthElement.title =
      "This KPI currently compares the latest 7 days with the preceding 7 days.";
  }
}

/* =========================================================
   WHAT-IF DEMAND SIMULATOR
   Uses actual completed revenue and product inventory.
   It is a scenario calculator, not a trained prediction model.
========================================================= */

function setupSimulatorSlider() {
  const slider = document.getElementById("demandSimulatorSlider");
  if (!slider) return;

  slider.addEventListener("input", updateSimulatorScenario);
}

function updateSimulatorFromRealData() {
  const today = getLocalDayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const recentSales = getSalesInRange(
    currentBusinessSales,
    sevenDaysAgo,
    tomorrow
  );

  simulatorBaseRevenue = sumSalesRevenue(recentSales);

  // Sum inventory from actual product records.
  simulatorBaseUnits = currentBusinessProducts.reduce(
    (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
    0
  );

  simulatorInitialized = true;
  updateSimulatorScenario();
}

function updateSimulatorScenario() {
  const slider = document.getElementById("demandSimulatorSlider");
  if (!slider) return;
  const today = getLocalDayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const profitSummary = calculateGrossProfitForPeriod(
    sevenDaysAgo,
    tomorrow
  );

  simulatorBaseGrossProfit =
    profitSummary.costsComplete
      ? profitSummary.grossProfit
      : null;

  window.simulatorProfitSummary = profitSummary;
  const percent = Number(slider.value) || 0;

  const percentLabel = document.getElementById("sliderPercentLabel");
  const revenueElement = document.getElementById("simRevenueVal");
  const profitElement = document.getElementById("simProfitVal");
  const inventoryElement = document.getElementById("simInventoryVal");
  const riskElement = document.getElementById("simRiskBadge");

  if (percentLabel) {
    percentLabel.textContent = `${percent >= 0 ? "+" : ""}${percent}%`;
  }

  if (!simulatorInitialized) {
    if (revenueElement) revenueElement.textContent = "—";
    if (profitElement) profitElement.textContent = "Not available";
    if (inventoryElement) inventoryElement.textContent = "—";

    if (riskElement) {
      riskElement.className = "badge";
      riskElement.textContent = "Waiting for business data";
    }
    return;
  }

  const scenarioRevenue = Math.round(
    simulatorBaseRevenue * (1 + percent / 100)
  );

  const estimatedExtraUnits = Math.round(
    simulatorBaseUnits * percent / 100
  );

  if (revenueElement) {
    revenueElement.textContent = formatCurrency(scenarioRevenue);
    revenueElement.title =
      "Illustrative scenario using actual completed revenue from the latest 7 days.";
  }

  // Profit cannot be calculated accurately without cost of goods sold,
  // operating expenses and a reliable margin calculation.

  if (profitElement) {
    const summary = window.simulatorProfitSummary;
    const scenarioFactor = 1 + percent / 100;

    const profitLabel = profitElement.parentElement
      ?.querySelector("span");

    if (!summary || !summary.costsComplete) {
      profitElement.textContent = "Unavailable";
      profitElement.title =
        "Complete product purchase prices are required to calculate gross profit.";
    } else {
      const scenarioGrossProfit = Math.round(
        summary.grossProfit * scenarioFactor
      );

      profitElement.textContent =
        formatCurrency(scenarioGrossProfit);

      profitElement.title =
        "Estimated gross profit based on completed sales and recorded purchase prices. Operating expenses are excluded.";
    }

    if (profitLabel) {
      profitLabel.textContent = "Estimated Gross Profit";
    }
  }


  if (inventoryElement) {
    inventoryElement.textContent =
      `${estimatedExtraUnits >= 0 ? "+" : ""}${estimatedExtraUnits} units`;
    inventoryElement.title =
      "Illustrative inventory change based on current recorded stock.";
  }

  if (riskElement) {
    if (percent < 0) {
      riskElement.className = "badge badge-success";
      riskElement.textContent = "Lower-demand scenario";
    } else if (percent < 25) {
      riskElement.className = "badge badge-success";
      riskElement.textContent = "Small demand change";
    } else if (percent < 60) {
      riskElement.className = "badge badge-warning";
      riskElement.textContent = "Review stock levels";
    } else {
      riskElement.className = "badge badge-danger";
      riskElement.textContent = "Large change — review stock";
    }
  }
}

/* =========================================================
   EXPLAINABLE AI BARS
   Do not invent feature-importance percentages.
========================================================= */

function animateExplainableAiBars() {
  document.querySelectorAll(".factor-progress-fill").forEach(bar => {
    const configuredWidth = bar.getAttribute("data-width");

    // Only animate a width explicitly supplied by the page.
    // This does not claim the width is a real model explanation.
    if (!configuredWidth) {
      bar.style.width = "0%";
      return;
    }

    bar.style.width = "0%";

    setTimeout(() => {
      bar.style.transition = "width 1s ease";
      bar.style.width = configuredWidth;
    }, 200);
  });
}


/* =========================================================
   REORDER ACTIONS
   Uses the custom purchase-order modal.
========================================================= */

function setupSmartReorderActions() {
  const approveAllButton = document.getElementById("btnApproveAllReorder");

  // Prevent duplicate event listeners if initialization runs again.
  if (approveAllButton && !approveAllButton.dataset.listenerAttached) {
    approveAllButton.dataset.listenerAttached = "true";

    approveAllButton.addEventListener("click", () => {
      showRetailMindToast(
        "info",
        "Review recommendations",
        "Review each product and confirm its purchase order individually. No orders have been placed."
      );
    });
  }
}

/* =========================================================
   REAL DEMAND FORECAST
========================================================= */

function setupEnsembleForecast() {
  const body = document.getElementById("ensembleForecastBody");
  if (!body) return;

  document.getElementById("forecastDays")
    ?.addEventListener("change", loadEnsembleForecast);

  document.getElementById("forecastProduct")
    ?.addEventListener("change", renderBusinessForecast);

  document.getElementById("refreshEnsembleForecast")
    ?.addEventListener("click", loadEnsembleForecast);
}

async function loadEnsembleForecast() {
  const body = document.getElementById("ensembleForecastBody");
  const status = document.getElementById("ensembleForecastStatus");
  const daysSelect = document.getElementById("forecastDays");
  const refreshButton = document.getElementById("refreshEnsembleForecast");

  if (!body || !status) return;

  const requestNumber = ++forecastRequestNumber;
  const days = [7, 14, 30].includes(Number(daysSelect?.value))
    ? Number(daysSelect.value)
    : 7;

  status.textContent = "Loading demand from completed business sales…";
  body.replaceChildren(makeForecastMessage("Loading forecast…", 4));

  if (refreshButton) refreshButton.disabled = true;

  try {
    const session = await getCurrentSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("Please sign in to view demand predictions.");
    }

    const response = await fetch(
      `${DEMAND_API}?days=${encodeURIComponent(days)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || `Forecast request failed (HTTP ${response.status}).`
      );
    }

    if (!Array.isArray(result.products)) {
      throw new Error("The demand API returned an unexpected response.");
    }

    if (requestNumber !== forecastRequestNumber) return;

    forecastDaysLoaded = days;

    forecastRows = result.products
      .filter(product =>
        product &&
        product.product_id &&
        product.expected_units != null &&
        product.data_status !== "insufficient_history"
      )
      .map(product => ({
        id: String(product.product_id),
        product: String(product.product_name || "Unnamed product"),
        sku: String(product.sku || ""),
        category: String(product.category || ""),
        quantity: Math.max(0, Number(product.expected_units) || 0),
        stock: Math.max(0, Number(product.current_stock) || 0),
        reorderLevel: Math.max(0, Number(product.reorder_level) || 0),
        dataStatus: product.data_status || "estimate_available",
        lastSaleDate: product.last_sale_date || null,
        sellingDays: Number(product.selling_days_last_30_days) || 0,
        unitsSold30Days: Number(product.units_sold_last_30_days) || 0,
        unitsSold7Days: Number(product.units_sold_last_7_days) || 0,
        suggestedReorderQuantity:
          product.suggested_reorder_quantity == null
            ? null
            : Math.max(0, Number(product.suggested_reorder_quantity) || 0)
      }));


    populateBusinessProductFilter(forecastRows);
    renderBusinessForecast();

    status.textContent = forecastRows.length
      ? `Estimated demand for the next ${days} days, based on completed sales.`
      : "No reliable demand estimates are available yet. Check your sales history.";

  } catch (error) {
    if (requestNumber !== forecastRequestNumber) return;

    console.error("Real demand forecast error:", error);

    status.textContent = error.message || "Unable to load demand predictions.";

    body.replaceChildren(
      makeForecastMessage(
        error.message || "Forecast unavailable. Check your sign-in and Flask backend.",
        4
      )
    );

    forecastRows = [];
    populateBusinessProductFilter([]);
    updateBusinessForecastSummary([], days);
  } finally {
    if (requestNumber === forecastRequestNumber && refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

/* =========================================================
   PRODUCT FILTER
========================================================= */

function populateBusinessProductFilter(rows) {
  const select = document.getElementById("forecastProduct");
  if (!select) return;

  const previousValue = select.value || "all";
  const uniqueProducts = new Map();

  rows.forEach(row => {
    uniqueProducts.set(row.id, row);
  });

  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All products";
  select.appendChild(allOption);

  [...uniqueProducts.values()]
    .sort((a, b) => a.product.localeCompare(b.product))
    .forEach(product => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.sku
        ? `${product.product} (${product.sku})`
        : product.product;
      select.appendChild(option);
    });

  select.value = uniqueProducts.has(previousValue)
    ? previousValue
    : "all";
}

/* =========================================================
   RANK PRODUCTS WITHOUT MERGING DUPLICATE NAMES
========================================================= */


function getRankedProductDemand(rows) {
  return rows
    .map(row => ({
      ...row,
      wholeUnits: Math.ceil(Math.max(0, row.quantity)),
      stockAfterDemand: row.stock - Math.ceil(Math.max(0, row.quantity))
    }))
    .sort((a, b) => {
      const priority = item => {
        if (item.stock <= 0) return 0;
        if (item.stockAfterDemand < 0) return 1;
        if (item.stockAfterDemand <= item.reorderLevel) return 2;
        return 3;
      };

      return priority(a) - priority(b) ||
        b.quantity - a.quantity ||
        a.product.localeCompare(b.product);
    });
}

/* =========================================================
   CUSTOMER-FRIENDLY FORECAST TABLE
========================================================= */

function renderBusinessForecast() {
  const body = document.getElementById("ensembleForecastBody");
  const productSelect = document.getElementById("forecastProduct");

  if (!body) return;

  const selectedProduct = productSelect?.value || "all";

  const filteredRows = selectedProduct === "all"
    ? forecastRows
    : forecastRows.filter(row => row.id === selectedProduct);

  const ranked = getRankedProductDemand(filteredRows);
  body.replaceChildren();

  if (!ranked.length) {
    body.appendChild(
      makeForecastMessage(
        "No reliable forecast is available for this selection.",
        4
      )
    );

    updateBusinessForecastSummary([], forecastDaysLoaded);
    return;
  }

  ranked.forEach((item, index) => {
    const row = document.createElement("tr");

    addForecastCell(row, String(index + 1));

    const productCell = document.createElement("td");
    const productName = document.createElement("strong");
    productName.textContent = item.product;
    productCell.appendChild(productName);

    const stockInfo = document.createElement("div");
    stockInfo.className = "text-muted";
    stockInfo.style.fontSize = ".8rem";
    stockInfo.textContent =
      `Stock: ${item.stock} · Reorder level: ${item.reorderLevel}`;
    productCell.appendChild(stockInfo);

    row.appendChild(productCell);

    const demandCell = document.createElement("td");
    demandCell.className = "ensemble-demand";
    demandCell.textContent = `${item.wholeUnits.toLocaleString("en-IN")} units`;
    row.appendChild(demandCell);

    const priorityCell = document.createElement("td");
    const badge = document.createElement("span");

    const stockAfterDemand = item.stock - item.wholeUnits;

    if (item.stock <= 0) {
      badge.className = "badge badge-danger";
      badge.textContent = "Out of stock";
    } else if (stockAfterDemand < 0) {
      badge.className = "badge badge-danger";
      badge.textContent = "Demand exceeds stock";
    } else if (stockAfterDemand <= item.reorderLevel) {
      badge.className = "badge badge-warning";
      badge.textContent = "Restock soon";
    } else if (index < 3) {
      badge.className = "badge badge-success";
      badge.textContent = "High demand";
    } else {
      badge.className = "badge";
      badge.textContent = "Stock sufficient";
    }

    priorityCell.appendChild(badge);

    if (item.suggestedReorderQuantity !== null) {
      const reorderNote = document.createElement("div");
      reorderNote.className = "text-muted";
      reorderNote.style.fontSize = ".8rem";
      reorderNote.style.marginTop = ".35rem";

      reorderNote.textContent = item.suggestedReorderQuantity > 0
        ? `Suggested reorder: ${item.suggestedReorderQuantity} units`
        : "No additional reorder suggested";

      priorityCell.appendChild(reorderNote);
    }

    if (item.dataStatus === "limited_history") {
      const note = document.createElement("div");
      note.className = "text-muted";
      note.style.fontSize = ".75rem";
      note.textContent = "Limited sales history";
      priorityCell.appendChild(note);
    }

    row.appendChild(priorityCell);
    body.appendChild(row);
  });


  updateBusinessForecastSummary(ranked, forecastDaysLoaded);
}

/* =========================================================
   FORECAST SUMMARY
========================================================= */

function updateBusinessForecastSummary(products, days) {
  const horizon = document.getElementById("forecastHorizon");
  const total = document.getElementById("forecastTotalUnits");
  const productCount = document.getElementById("forecastProductCount");
  const forecastCount = document.getElementById("ensembleForecastCount");

  const totalUnits = products.reduce(
    (sum, item) => sum + item.wholeUnits,
    0
  );

  if (horizon) horizon.textContent = `${days} days`;
  if (total) total.textContent = totalUnits.toLocaleString("en-IN");
  if (productCount) productCount.textContent = String(products.length);
  if (forecastCount) forecastCount.textContent = String(products.length);
}

/* =========================================================
   SAFE DOM HELPERS
========================================================= */

function addForecastCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value ?? "");
  row.appendChild(cell);
}

function makeForecastMessage(message, columns = 4) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = columns;
  cell.className = "ensemble-empty";
  cell.textContent = String(message ?? "");

  row.appendChild(cell);
  return row;
}

function makeTableMessage(message, columns = 4) {
  return makeForecastMessage(message, columns);
}

function escapeForecastText(value) {
  const span = document.createElement("span");
  span.textContent = String(value ?? "");
  return span.innerHTML;
}



function getSaleItemDate(item) {
  const relation = item.sales;
  const sale = Array.isArray(relation) ? relation[0] : relation;

  if (!sale?.sale_date) return null;

  const date = new Date(sale.sale_date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSaleItemProduct(item) {
  const relation = item.products;
  return Array.isArray(relation) ? relation[0] : relation;
}

function calculateGrossProfitForPeriod(startDate, endDate) {
  const sales = getSalesInRange(
    currentBusinessSales,
    startDate,
    endDate
  );

  const saleIds = new Set(
    sales.map(sale => String(sale.id))
  );

  const relevantItems = currentBusinessSaleItems.filter(
    item => saleIds.has(String(item.sale_id))
  );

  const revenue = sumSalesRevenue(sales);

  // Do not claim a profit when a completed sale has no item-cost data.
  const itemsBySale = new Map();

  relevantItems.forEach(item => {
    const key = String(item.sale_id);

    if (!itemsBySale.has(key)) {
      itemsBySale.set(key, []);
    }

    itemsBySale.get(key).push(item);
  });

  const allSalesHaveItems = sales.every(sale =>
    (itemsBySale.get(String(sale.id)) || []).length > 0
  );

  const costsComplete =
    allSalesHaveItems &&
    relevantItems.length > 0 &&
    relevantItems.every(item => {
      const product = getSaleItemProduct(item);
      const price = product?.purchase_price;
      const quantity = Number(item.quantity);

      return (
        price !== null &&
        price !== undefined &&
        Number.isFinite(Number(price)) &&
        Number(price) >= 0 &&
        Number.isFinite(quantity) &&
        quantity >= 0
      );
    });

  const costOfGoodsSold = costsComplete
    ? relevantItems.reduce((total, item) => {
      const product = getSaleItemProduct(item);

      return total +
        Number(item.quantity) *
        Number(product.purchase_price);
    }, 0)
    : null;

  return {
    revenue,
    costOfGoodsSold,
    grossProfit: costsComplete
      ? revenue - costOfGoodsSold
      : null,
    costsComplete,
    transactionCount: sales.length
  };
}


function showRetailMindToast(type, title, message) {
  const container = document.getElementById("rmToastContainer");
  if (!container) {
    console[type === "error" ? "error" : "log"](`${title}: ${message}`);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `rm-toast rm-toast-${type}`;

  const icon = document.createElement("div");
  icon.className = "rm-toast-icon";

  const iconElement = document.createElement("i");
  iconElement.className = type === "success"
    ? "fa-solid fa-check"
    : type === "error"
      ? "fa-solid fa-triangle-exclamation"
      : "fa-solid fa-circle-info";

  icon.appendChild(iconElement);

  const content = document.createElement("div");
  content.className = "rm-toast-content";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const description = document.createElement("p");
  description.textContent = message;

  content.append(heading, description);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "rm-toast-close";
  close.setAttribute("aria-label", "Dismiss notification");
  close.innerHTML = "&times;";
  close.addEventListener("click", () => toast.remove());

  toast.append(icon, content, close);
  container.appendChild(toast);

  window.setTimeout(() => toast.remove(), 5500);
}

function showPurchaseOrderConfirmation({
  productName,
  quantity,
  unitPrice,
  total
}) {
  const overlay = document.getElementById("rmConfirmOverlay");

  if (!overlay) {
    return Promise.reject(
      new Error("Purchase-order confirmation UI is missing from predictions.html.")
    );
  }

  document.getElementById("rmConfirmProduct").textContent = productName;
  document.getElementById("rmConfirmQuantity").textContent =
    `${quantity} units`;

  const currency = value => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);

  document.getElementById("rmConfirmUnitCost").textContent =
    currency(unitPrice);

  document.getElementById("rmConfirmTotal").textContent =
    currency(total);

  const confirmButton = document.getElementById("rmConfirmApprove");
  const cancelButton = document.getElementById("rmConfirmCancel");

  overlay.hidden = false;
  confirmButton.disabled = false;
  confirmButton.innerHTML =
    '<i class="fa-solid fa-check"></i> Confirm order';

  return new Promise(resolve => {
    let settled = false;

    const finish = accepted => {
      if (settled) return;
      settled = true;

      overlay.hidden = true;
      confirmButton.removeEventListener("click", accept);
      cancelButton.removeEventListener("click", cancel);
      overlay.removeEventListener("click", outsideClick);
      document.removeEventListener("keydown", escapeKey);

      resolve(accepted);
    };

    const accept = () => finish(true);
    const cancel = () => finish(false);

    const outsideClick = event => {
      if (event.target === overlay) cancel();
    };

    const escapeKey = event => {
      if (event.key === "Escape") cancel();
    };

    confirmButton.addEventListener("click", accept);
    cancelButton.addEventListener("click", cancel);
    overlay.addEventListener("click", outsideClick);
    document.addEventListener("keydown", escapeKey);
  });
}


/* =========================================================
   DEAD STOCK MONITOR — REAL INVENTORY AND SALES
========================================================= */

async function loadDeadStockMonitor() {
  const body = document.getElementById("deadStockTableBody");
  if (!body) return;

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const money = value => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

  const showMessage = message => {
    body.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = message;
    cell.style.textAlign = "center";
    cell.style.padding = "1.5rem";
    row.appendChild(cell);
    body.appendChild(row);
  };

  const businessId = window.currentBusiness?.id;

  if (!businessId) {
    showMessage("Select a business to view dead stock.");
    setText("deadStockStatus", "No business selected.");
    return;
  }

  try {
    const products = (currentBusinessProducts || []).filter(product =>
      product &&
      product.id &&
      product.is_archived !== true &&
      product.is_archived !== "true"
    );

    if (!products.length) {
      showMessage("No active products were found for this business.");
      setText("deadStockCapital", "—");
      setText("deadStockSlowCount", "0");
      setText("deadStockExpiryUnits", "Unavailable");
      setText("deadStockRecovery", "—");
      setText("deadStockStatus", "No active products available.");
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData?.session?.access_token) {
      throw new Error("Please sign in again to view sales history.");
    }

    // Fetch completed sale line items for this business.
    // Embedded sales relation is filtered by business and status.
    const { data: items, error } = await supabaseClient
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        sales!inner (
          business_id,
          status,
          sale_date
        )
      `)
      .eq("sales.business_id", businessId)
      .eq("sales.status", "completed");

    if (error) throw error;

    const latestSaleByProduct = new Map();

    for (const item of items || []) {
      const relations = Array.isArray(item.sales)
        ? item.sales
        : [item.sales];

      for (const sale of relations) {
        if (!sale?.sale_date || !item.product_id) continue;

        const timestamp = new Date(sale.sale_date).getTime();
        if (!Number.isFinite(timestamp)) continue;

        const previous = latestSaleByProduct.get(item.product_id);

        if (!previous || timestamp > previous.timestamp) {
          latestSaleByProduct.set(item.product_id, {
            timestamp,
            date: sale.sale_date
          });
        }
      }
    }

    const now = new Date();

    const analyzed = products.map(product => {
      const stock = Math.max(0, Number(product.stock) || 0);
      const purchasePrice = Number(product.purchase_price);
      const hasCost = product.purchase_price !== null &&
        product.purchase_price !== undefined &&
        product.purchase_price !== "" &&
        Number.isFinite(purchasePrice) &&
        purchasePrice >= 0;

      const stockValue = hasCost ? stock * purchasePrice : null;
      const lastSale = latestSaleByProduct.get(product.id);

      const daysSinceSale = lastSale
        ? Math.max(0, Math.floor(
          (now.getTime() - lastSale.timestamp) / 86400000
        ))
        : null;

      // Products with no recorded sale are treated as having
      // unknown duration unless their creation date is available.
      const createdAt = product.created_at
        ? new Date(product.created_at)
        : null;

      const daysWithoutSales = daysSinceSale !== null
        ? daysSinceSale
        : createdAt && Number.isFinite(createdAt.getTime())
          ? Math.max(0, Math.floor(
            (now.getTime() - createdAt.getTime()) / 86400000
          ))
          : null;

      let recommendation = "Monitor sales";
      let level = "info";

      if (stock === 0) {
        recommendation = "No stock remaining";
      } else if (daysWithoutSales === null) {
        recommendation = "Insufficient history";
      } else if (daysWithoutSales >= 30) {
        recommendation = "Review for clearance";
        level = "danger";
      } else if (daysWithoutSales >= 14) {
        recommendation = "Consider a bundle";
        level = "warning";
      } else if (daysWithoutSales >= 7) {
        recommendation = "Monitor movement";
        level = "info";
      }

      return {
        id: product.id,
        name: product.name || "Unnamed product",
        stock,
        purchasePrice,
        stockValue,
        hasCost,
        daysWithoutSales,
        recommendation,
        level,
        expiryDate: product.expiry_date || null
      };
    });

    const slowProducts = analyzed.filter(product =>
      product.stock > 0 &&
      product.daysWithoutSales !== null &&
      product.daysWithoutSales >= 14
    );

    // Dead capital is stock value for products with no sale
    // in at least 30 days. Missing purchase costs are excluded.
    const deadCapital = analyzed
      .filter(product =>
        product.stock > 0 &&
        product.daysWithoutSales !== null &&
        product.daysWithoutSales >= 30 &&
        product.hasCost
      )
      .reduce((sum, product) => sum + product.stockValue, 0);

    // Expiry is based only on products whose expiry_date exists.
    const nearExpiry = analyzed
      .filter(product => {
        if (!product.expiryDate || product.stock <= 0) return false;

        const expiry = new Date(`${product.expiryDate}T23:59:59`);
        if (!Number.isFinite(expiry.getTime())) return false;

        const daysLeft = (expiry.getTime() - now.getTime()) / 86400000;
        return daysLeft >= 0 && daysLeft <= 30;
      })
      .reduce((sum, product) => sum + product.stock, 0);

    // This is a planning estimate, not guaranteed cash recovery:
    // 80% of recorded stock cost value for slow products.
    const recoveryEstimate = slowProducts
      .filter(product => product.hasCost)
      .reduce((sum, product) => sum + product.stockValue * 0.8, 0);

    setText("deadStockCapital", money(deadCapital));
    setText("deadStockSlowCount", `${slowProducts.length} Items`);
    setText(
      "deadStockExpiryUnits",
      analyzed.some(product => product.expiryDate)
        ? `${nearExpiry} units`
        : "Unavailable"
    );
    setText("deadStockRecovery", money(recoveryEstimate));

    body.replaceChildren();

    const displayProducts = analyzed
      .filter(product =>
        product.stock > 0 &&
        product.daysWithoutSales !== null &&
        product.daysWithoutSales >= 14
      )
      .sort((a, b) =>
        (b.daysWithoutSales || 0) - (a.daysWithoutSales || 0)
      );

    if (!displayProducts.length) {
      showMessage("No slow-moving products meet the 14-day threshold.");
    } else {
      for (const product of displayProducts) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = product.name;
        nameCell.appendChild(name);

        const daysCell = document.createElement("td");
        daysCell.textContent = `${product.daysWithoutSales} days`;

        const valueCell = document.createElement("td");
        valueCell.textContent = product.hasCost
          ? money(product.stockValue)
          : "Cost unavailable";

        const recommendationCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = product.level === "danger"
          ? "badge badge-danger"
          : product.level === "warning"
            ? "badge badge-warning"
            : "badge badge-info";
        badge.textContent = product.recommendation;
        recommendationCell.appendChild(badge);

        row.append(
          nameCell,
          daysCell,
          valueCell,
          recommendationCell
        );

        body.appendChild(row);
      }
    }

    setText(
      "deadStockStatus",
      `Calculated from ${products.length} active products and completed sales. ` +
      "Dead capital uses recorded purchase cost; recovery is an illustrative 80% of slow-stock cost value."
    );
  } catch (error) {
    console.error("Dead Stock Monitor error:", error);
    showMessage(error.message || "Could not load dead stock data.");

    setText("deadStockCapital", "—");
    setText("deadStockSlowCount", "—");
    setText("deadStockExpiryUnits", "—");
    setText("deadStockRecovery", "—");
    setText("deadStockStatus", "Unable to calculate using current data.");
  }
}


/* =========================================================
   DYNAMIC PRICING — REAL PRODUCTS AND COMPLETED SALES
   Transparent rules; does not claim trained price elasticity.
========================================================= */

async function loadDynamicPricingRecommendations() {
  const body = document.getElementById("dynamicPricingTableBody");
  if (!body) return;

  const money = value => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);

  const showMessage = message => {
    body.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = message;
    cell.style.textAlign = "center";
    cell.style.padding = "1.5rem";
    row.appendChild(cell);
    body.appendChild(row);
  };

  if (!window.currentBusiness?.id) {
    showMessage("Select a business to view pricing recommendations.");
    return;
  }

  try {
    const products = (currentBusinessProducts || []).filter(product =>
      product?.id &&
      product.is_archived !== true &&
      product.is_archived !== "true"
    );

    const saleItems = currentBusinessSaleItems || [];
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 30);

    const salesByProduct = new Map();

    for (const item of saleItems) {
      const relation = item.sales;
      const sale = Array.isArray(relation) ? relation[0] : relation;

      if (
        !sale ||
        sale.status !== "completed" ||
        !sale.sale_date ||
        !item.product_id
      ) continue;

      const saleDate = new Date(sale.sale_date);
      if (!Number.isFinite(saleDate.getTime()) || saleDate > today) continue;

      const key = String(item.product_id);
      const metrics = salesByProduct.get(key) || {
        units30: 0,
        lastSale: null
      };

      if (saleDate >= cutoff) {
        metrics.units30 += Math.max(0, Number(item.quantity) || 0);
      }

      if (!metrics.lastSale || saleDate > metrics.lastSale) {
        metrics.lastSale = saleDate;
      }

      salesByProduct.set(key, metrics);
    }

    const recommendations = products.map(product => {
      const sellingPrice = Number(product.selling_price) || 0;
      const purchasePrice = Number(product.purchase_price) || 0;

      const profitPerUnit = sellingPrice - purchasePrice;

      const profitMargin = sellingPrice > 0
        ? (profitPerUnit / sellingPrice) * 100
        : 0;

      const profitDisplay = `₹${profitPerUnit.toFixed(2)}`;
      const marginDisplay = `${profitMargin.toFixed(1)}%`;
      const stock = Math.max(0, Number(product.stock) || 0);
      const reorderLevel = Math.max(0, Number(product.reorder_level) || 0);
      const currentPrice = Number(product.selling_price);
      const purchaseCost = Number(product.purchase_price);

      const validPrice =
        product.selling_price !== null &&
        product.selling_price !== "" &&
        Number.isFinite(currentPrice) &&
        currentPrice > 0;

      const validCost =
        product.purchase_price !== null &&
        product.purchase_price !== "" &&
        Number.isFinite(purchaseCost) &&
        purchaseCost >= 0;

      const metrics = salesByProduct.get(String(product.id));
      const units30 = metrics?.units30 || 0;

      const daysSinceSale = metrics?.lastSale
        ? Math.max(0, Math.floor(
          (today.getTime() - metrics.lastSale.getTime()) / 86400000
        ))
        : null;

      let recommendedPrice = validPrice ? currentPrice : null;
      let status = "Maintain price";
      let demandImpact = `${units30} units sold in 30 days`;
      let rationale =
        "No reliable price-response evidence is available. Maintain the current price.";

      if (!validPrice) {
        status = "Price unavailable";
        demandImpact = "Unavailable";
        rationale = "A valid current selling price is required.";
      } else if (!validCost) {
        status = "Review cost";
        demandImpact = `${units30} units sold in 30 days`;
        rationale =
          "Purchase cost is missing. Verify cost before considering a price change.";
      } else if (daysSinceSale === null) {
        status = "Insufficient history";
        demandImpact = "No completed sale";
        rationale =
          "No completed sale was found for this product. Check listing status, inventory, and sales history before repricing.";
      } else if (stock <= reorderLevel && stock > 0) {
        status = "Protect stock";
        rationale =
          "Stock is at or below its reorder level. Review replenishment before discounting.";
      } else if (stock === 0) {
        status = "Out of stock";
        rationale =
          "There is no stock available to sell. Replenish inventory before considering pricing changes.";
      } else if (daysSinceSale >= 30) {
        status = "Slow stock review";
        rationale =
          "No sale recorded for at least 30 days. Review product visibility, competition, and stock age before testing a discount.";
      } else if (daysSinceSale >= 14) {
        status = "Monitor slow sales";
        rationale =
          "No sale recorded for at least 14 days. Consider a controlled price test only after checking costs and market conditions.";
      } else {
        status = "Maintain price";
        rationale =
          "Recent sales exist, but historical data does not establish how demand changes when the price changes.";
      }

      // This version deliberately does not invent an optimized price.
      // It displays the current price until a valid pricing experiment
      // or demand-response model is available.
      return {
        product,
        currentPrice: validPrice ? currentPrice : null,
        recommendedPrice,
        profitPerUnit,
        profitMargin,
        units30,
        daysSinceSale,
        status,
        demandImpact,
        rationale
      };
    });

    // Prioritize products that have been inactive the longest.
    recommendations.sort((a, b) =>
      (b.daysSinceSale ?? -1) - (a.daysSinceSale ?? -1)
    );

    body.replaceChildren();

    if (!recommendations.length) {
      showMessage("No active products are available for pricing analysis.");
      return;
    }

    for (const item of recommendations) {
      const row = document.createElement("tr");

      const addCell = (text, className = "") => {
        const cell = document.createElement("td");
        cell.textContent = text;
        if (className) cell.className = className;
        row.appendChild(cell);
        return cell;
      };

      addCell(item.product.name || "Unnamed product");

      addCell(
        item.currentPrice === null ? "Unavailable" : money(item.currentPrice)
      );

      addCell(
        item.recommendedPrice === null
          ? "Unavailable"
          : money(item.recommendedPrice)
      );

      // Profit per unit
      addCell(
        money(item.profitPerUnit),
        item.profitPerUnit < 0 ? "text-danger" : ""
      );

      // Profit margin
      addCell(
        `${item.profitMargin.toFixed(1)}%`,
        item.profitMargin < 10 ? "text-danger" : ""
      );

      // Demand impact
      addCell(item.demandImpact);

      const rationaleCell = addCell(
        `${item.status}: ${item.rationale}`
      );
      rationaleCell.style.fontSize = ".8rem";
      rationaleCell.style.color = "var(--muted)";
      rationaleCell.style.whiteSpace = "normal";

      body.appendChild(row);
    }
  } catch (error) {
    console.error("Dynamic pricing recommendations failed:", error);
    showMessage(
      "Could not load pricing analysis. Check the browser console and Supabase connection."
    );
  }
}

