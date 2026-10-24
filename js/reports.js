
/* ============================================================
   RetailMind AI — Reports Module
   File: js/reports.js

   Features:
   - Supabase authentication and business-scoped data
   - Date-range filtering
   - Sales and revenue reports
   - Inventory audit and valuation
   - Estimated profit and loss
   - Recorded GST/tax summary
   - Customer purchase activity
   - Executive business summary
   - CSV export
   - Excel export using SheetJS
   - PDF export using the browser print dialog

   Notes:
   - Financial results depend on the columns actually stored in
     the database.
   - Profit is an estimate when product cost data is available.
   - This module does not claim to prepare official GST returns.
   ============================================================ */

(function () {
  "use strict";

  const REPORT_CONFIG = {
    currency: "INR",
    locale: "en-IN",
    maxRows: 10000,
    pageTitle: "RetailMind AI Reports"
  };

  const REPORTS = {
    Sales_Report: {
      title: "Sales & Revenue Report",
      description: "Recorded sales transactions and revenue."
    },
    Inventory_Audit: {
      title: "Inventory Valuation & Audit",
      description: "Current product stock and available cost data."
    },
    Profit_Loss_Report: {
      title: "Profit & Loss Statement",
      description: "Sales revenue and estimated product costs."
    },
    GST_Tax_Compliance: {
      title: "GST & Tax Report",
      description: "Tax amounts recorded in sales transactions."
    },
    Customer_Retention_Report: {
      title: "Customer & Loyalty Report",
      description: "Purchase activity grouped by customer."
    },
    AI_Executive_Brief: {
      title: "Executive Business Summary",
      description: "A summary of available business records."
    }
  };

  const state = {
    client: null,
    businessId: null,
    currentReport: null,
    currentRows: [],
    currentColumns: [],
    currentPeriod: null,
    isLoading: false,
    initialized: false
  };

  /* ------------------------------------------------------------
     DOM HELPERS
  ------------------------------------------------------------ */

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showStatus(message, type) {
    const element = byId("reportsStatus");

    if (!element) {
      console.log("[Reports]", message);
      return;
    }

    element.textContent = message;
    element.className = "report-status visible " + (type || "info");
  }

  function clearStatus() {
    const element = byId("reportsStatus");

    if (!element) return;

    element.textContent = "";
    element.className = "report-status";
  }

  function setLoading(loading) {
    state.isLoading = loading;

    document.querySelectorAll(".report-card-actions button").forEach(function (button) {
      button.disabled = loading;
      button.style.opacity = loading ? "0.65" : "";
      button.style.cursor = loading ? "wait" : "";
    });
  }

  function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat(REPORT_CONFIG.locale, {
      style: "currency",
      currency: REPORT_CONFIG.currency,
      maximumFractionDigits: 2
    }).format(number);
  }

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat(REPORT_CONFIG.locale, {
      maximumFractionDigits: 2
    }).format(number);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(REPORT_CONFIG.locale, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(REPORT_CONFIG.locale);
  }

  function sum(rows, getter) {
    return rows.reduce(function (total, row) {
      const value = Number(getter(row));

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function uniqueCount(values) {
    return new Set(
      values
        .filter(function (value) {
          return value !== null &&
            value !== undefined &&
            String(value).trim() !== "";
        })
        .map(String)
    ).size;
  }

  function safeFileName(value) {
    return String(value || "RetailMind_Report")
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function todayISO() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  }

  function toISODate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  /* ------------------------------------------------------------
     SUPABASE CLIENT
  ------------------------------------------------------------ */

  function getSupabaseClient() {
    /*
     * Supports common initialization patterns:
     * window.supabaseClient
     * window.db
     * a global `supabaseClient` variable
     *
     * If your project uses another variable name, update this
     * function to return that initialized client.
     */

    const candidates = [
      window.supabaseClient,
      window.db
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate.from === "function" &&
        candidate.auth
      ) {
        return candidate;
      }
    }

    try {
      if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient &&
        typeof supabaseClient.from === "function"
      ) {
        return supabaseClient;
      }
    } catch (error) {
      // The global lexical variable may not exist.
    }

    try {
      if (
        typeof db !== "undefined" &&
        db &&
        typeof db.from === "function"
      ) {
        return db;
      }
    } catch (error) {
      // The global lexical variable may not exist.
    }

    throw new Error(
      "Supabase client was not found. Check js/supabase.js and ensure it initializes the client before js/reports.js."
    );
  }

  async function getAuthenticatedUser() {
    const client = state.client;

    if (!client || !client.auth) {
      throw new Error("Supabase authentication is unavailable.");
    }

    const result = await client.auth.getUser();

    if (result.error) {
      throw result.error;
    }

    if (!result.data || !result.data.user) {
      throw new Error("Please sign in to access your business reports.");
    }

    return result.data.user;
  }

  async function resolveBusinessId(user) {
    /*
     * Resolve the business from the authenticated user's membership.
     * Do not trust a business ID supplied by the page URL.
     */

    const result = await state.client
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(2);

    if (result.error) {
      throw new Error(
        "Unable to find your business membership: " + result.error.message
      );
    }

    const memberships = result.data || [];

    if (memberships.length === 0) {
      throw new Error(
        "No business membership was found for this account. Join or create a business before generating reports."
      );
    }

    if (memberships.length > 1) {
      throw new Error(
        "This account belongs to multiple businesses. Configure your active-business selection before generating reports."
      );
    }

    return memberships[0].business_id;
  }

  /* ------------------------------------------------------------
     REPORTING PERIOD
  ------------------------------------------------------------ */

  function getSelectedPeriod() {
    const selector = byId("reportPeriod");
    const value = selector ? selector.value : "current_month";

    const now = new Date();

    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (value) {
      case "current_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case "previous_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case "current_quarter": {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

        start = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      }

      case "current_year":
        start = new Date(now.getFullYear(), 0, 1);
        break;

      case "all_time":
        start = null;
        end = null;
        break;

      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      value: value,
      start: start ? toISODate(start) : null,
      end: end ? toISODate(end) : null,
      label: getPeriodLabel(value, start, end)
    };
  }

  function getPeriodLabel(value, start, end) {
    const labels = {
      current_month: "Current Month",
      previous_month: "Previous Month",
      current_quarter: "Current Quarter",
      current_year: "This Year",
      all_time: "All Available Data"
    };

    if (value === "all_time") {
      return labels[value];
    }

    return (
      (labels[value] || "Selected Period") +
      " (" +
      formatDate(start) +
      " – " +
      formatDate(end) +
      ")"
    );
  }

  function applyDateFilter(query, period, columnName) {
    if (period.start) {
      query = query.gte(columnName, period.start);
    }

    if (period.end) {
      query = query.lt(
        columnName,
        nextDayISO(period.end)
      );
    }

    return query;
  }

  function nextDayISO(isoDate) {
    const date = new Date(isoDate + "T12:00:00");

    date.setDate(date.getDate() + 1);

    return toISODate(date);
  }

  /* ------------------------------------------------------------
     DATABASE HELPERS
  ------------------------------------------------------------ */

  async function fetchAllRows(buildQuery, label) {
    const rows = [];
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      const query = buildQuery(offset, pageSize);

      const result = await query;

      if (result.error) {
        throw new Error(
          "Unable to load " + label + ": " + result.error.message
        );
      }

      const batch = result.data || [];

      rows.push.apply(rows, batch);

      if (batch.length < pageSize) {
        break;
      }

      offset += pageSize;

      if (rows.length >= REPORT_CONFIG.maxRows) {
        showStatus(
          "The " + label + " report reached the " +
          REPORT_CONFIG.maxRows +
          " record limit. Exported data may be incomplete.",
          "info"
        );
        break;
      }
    }

    return rows;
  }

  async function fetchSales(period) {
    const businessId = state.businessId;

    return fetchAllRows(function (offset, pageSize) {
      let query = state.client
        .from("sales")
        .select(
          "id, business_id, customer_id, customer_name, total_amount, subtotal, discount_amount, gst_amount, status, sale_date"
        )
        .eq("business_id", businessId)
        .order("sale_date", { ascending: true })
        .range(offset, offset + pageSize - 1);

      query = applyDateFilter(query, period, "sale_date");

      return query;
    }, "sales");
  }

  async function fetchProducts() {
    return fetchAllRows(function (offset, pageSize) {
      return state.client
        .from("products")
        .select(
          "id, name, category, selling_price, purchase_price, stock, is_archived"
        )
        .eq("business_id", state.businessId)
        .order("name", { ascending: true })
        .range(offset, offset + pageSize - 1);
    }, "products");
  }

  async function fetchCustomers() {
    /*
     * Customer data is summarized from sales rows so this report
     * does not assume an unconfirmed customer-table schema.
     */
    return fetchSales(state.currentPeriod);
  }

  /* ------------------------------------------------------------
     REPORT ROW BUILDERS
  ------------------------------------------------------------ */

  function makeRow(date, reference, customer, status, amount, tax) {
    return {
      Date: date || "",
      "Transaction ID": reference || "",
      Customer: customer || "Walk-in / Not recorded",
      Status: status || "Not recorded",
      "Total Amount": amount == null ? "" : Number(amount),
      "Recorded Tax": tax == null ? "" : Number(tax)
    };
  }

  function buildSalesReport(sales) {
    const columns = [
      "Date",
      "Transaction ID",
      "Customer",
      "Status",
      "Total Amount",
      "Recorded Tax"
    ];

    const rows = sales.map(function (sale) {
      return makeRow(
        sale.sale_date,
        sale.id,
        sale.customer_name,
        sale.status,
        sale.total_amount,
        sale.gst_amount
      );
    });

    return {
      columns: columns,
      rows: rows,
      summary: [
        {
          label: "Transactions",
          value: formatNumber(sales.length)
        },
        {
          label: "Recorded Revenue",
          value: formatCurrency(
            sum(sales, function (sale) {
              return sale.total_amount;
            })
          )
        },
        {
          label: "Recorded Tax",
          value: formatCurrency(
            sum(sales, function (sale) {
              return sale.gst_amount;
            })
          )
        }
      ],
      notes: [
        "Revenue is calculated from the total_amount field in the sales table.",
        "Transaction statuses are displayed as stored. Confirm your business rules before treating this total as finalized revenue.",
        "Tax is shown only from the recorded gst_amount field."
      ]
    };
  }

  function buildInventoryReport(products) {
    const columns = [
      "Product ID",
      "Product",
      "Category",
      "Selling Price",
      "Purchase Price",
      "Stock",
      "Stock Selling Value",
      "Stock Cost Value",
      "Archived"
    ];

    const rows = products.map(function (product) {
      const stock = Number(product.stock);
      const sellingPrice = Number(product.selling_price);
      const purchasePrice = Number(product.purchase_price);

      const safeStock = Number.isFinite(stock) ? stock : 0;
      const safeSellingPrice = Number.isFinite(sellingPrice)
        ? sellingPrice
        : 0;

      const hasCost =
        product.purchase_price !== null &&
        product.purchase_price !== undefined &&
        product.purchase_price !== "" &&
        Number.isFinite(purchasePrice);

      return {
        "Product ID": product.id || "",
        Product: product.name || "",
        Category: product.category || "Uncategorized",
        "Selling Price": Number.isFinite(sellingPrice)
          ? sellingPrice
          : "",
        "Purchase Price": hasCost ? purchasePrice : "",
        Stock: Number.isFinite(stock) ? stock : "",
        "Stock Selling Value": safeStock * safeSellingPrice,
        "Stock Cost Value": hasCost
          ? safeStock * purchasePrice
          : "",
        Archived: product.is_archived ? "Yes" : "No"
      };
    });

    const activeProducts = products.filter(function (product) {
      return !product.is_archived;
    });

    const lowStockProducts = activeProducts.filter(function (product) {
      const stock = Number(product.stock);

      return Number.isFinite(stock) && stock <= 5;
    });

    const costProducts = rows.filter(function (row) {
      return row["Stock Cost Value"] !== "";
    });

    return {
      columns: columns,
      rows: rows,
      summary: [
        {
          label: "Products",
          value: formatNumber(products.length)
        },
        {
          label: "Active Products",
          value: formatNumber(activeProducts.length)
        },
        {
          label: "Low Stock (5 or Less)",
          value: formatNumber(lowStockProducts.length)
        },
        {
          label: "Stock Selling Value",
          value: formatCurrency(
            sum(rows, function (row) {
              return row["Stock Selling Value"];
            })
          )
        },
        {
          label: "Stock Cost Value",
          value: costProducts.length
            ? formatCurrency(
                sum(costProducts, function (row) {
                  return row["Stock Cost Value"];
                })
              )
            : "Unavailable"
        }
      ],
      notes: [
        "Inventory represents current product records, not historical stock as of the selected report period.",
        "The low-stock indicator uses a default threshold of 5 units. Change this threshold if your business uses another rule.",
        "Stock valuation is an estimate based on current stock multiplied by recorded prices. It is not a FIFO/LIFO accounting valuation."
      ]
    };
  }

  function buildProfitLossReport(sales, products) {
    const productCosts = new Map();

    products.forEach(function (product) {
      const id = String(product.id);

      const cost = Number(product.purchase_price);

      if (
        product.purchase_price !== null &&
        product.purchase_price !== undefined &&
        product.purchase_price !== "" &&
        Number.isFinite(cost)
      ) {
        productCosts.set(id, cost);
      }
    });

    const revenue = sum(sales, function (sale) {
      return sale.total_amount;
    });

    const discounts = sum(sales, function (sale) {
      return sale.discount_amount;
    });

    const recordedTax = sum(sales, function (sale) {
      return sale.gst_amount;
    });

    /*
     * This calculation does not invent COGS.
     * The current products table gives prices, but the report does not
     * assume sale-item quantities or cost snapshots that are not present
     * in the fetched sales records.
     */
    const hasProductCostData = productCosts.size > 0;

    const rows = [
      {
        Item: "Recorded Sales Total",
        Amount: revenue,
        Basis: "sales.total_amount"
      },
      {
        Item: "Recorded Discounts",
        Amount: discounts,
        Basis: "sales.discount_amount"
      },
      {
        Item: "Recorded Tax",
        Amount: recordedTax,
        Basis: "sales.gst_amount"
      },
      {
        Item: "Cost of Goods Sold",
        Amount: "",
        Basis: "Requires sale-item quantities and reliable cost records"
      },
      {
        Item: "Operating Expenses",
        Amount: "",
        Basis: "Not available from the fetched sales and product records"
      },
      {
        Item: "Net Profit",
        Amount: "",
        Basis: "Cannot be reliably calculated from these records alone"
      }
    ];

    return {
      columns: ["Item", "Amount", "Basis"],
      rows: rows,
      summary: [
        {
          label: "Recorded Sales Total",
          value: formatCurrency(revenue)
        },
        {
          label: "Recorded Discounts",
          value: formatCurrency(discounts)
        },
        {
          label: "Recorded Tax",
          value: formatCurrency(recordedTax)
        },
        {
          label: "Product Cost Data",
          value: hasProductCostData ? "Available" : "Unavailable"
        }
      ],
      notes: [
        "This is a preliminary financial summary, not a complete accounting Profit & Loss statement.",
        "Cost of goods sold requires sale-item quantities and appropriate cost records for the products sold.",
        "Net profit is not calculated because operating expenses and complete cost-of-goods-sold data have not been loaded."
      ]
    };
  }

  function buildTaxReport(sales) {
    const rows = sales.map(function (sale) {
      return {
        Date: sale.sale_date || "",
        "Transaction ID": sale.id || "",
        Customer: sale.customer_name || "Walk-in / Not recorded",
        "Taxable Subtotal": sale.subtotal == null
          ? ""
          : Number(sale.subtotal),
        "Recorded Discount": sale.discount_amount == null
          ? ""
          : Number(sale.discount_amount),
        "Recorded GST": sale.gst_amount == null
          ? ""
          : Number(sale.gst_amount),
        "Transaction Total": sale.total_amount == null
          ? ""
          : Number(sale.total_amount)
      };
    });

    const hasTaxData = sales.some(function (sale) {
      return sale.gst_amount !== null &&
        sale.gst_amount !== undefined &&
        sale.gst_amount !== "";
    });

    return {
      columns: [
        "Date",
        "Transaction ID",
        "Customer",
        "Taxable Subtotal",
        "Recorded Discount",
        "Recorded GST",
        "Transaction Total"
      ],
      rows: rows,
      summary: [
        {
          label: "Transactions",
          value: formatNumber(sales.length)
        },
        {
          label: "Recorded GST",
          value: hasTaxData
            ? formatCurrency(
                sum(sales, function (sale) {
                  return sale.gst_amount;
                })
              )
            : "No tax data recorded"
        },
        {
          label: "Recorded Subtotal",
          value: formatCurrency(
            sum(sales, function (sale) {
              return sale.subtotal;
            })
          )
        }
      ],
      notes: [
        "This report summarizes tax values stored in sales records.",
        "It does not calculate CGST, SGST, IGST, HSN classifications, input tax credits, or statutory return values.",
        "Verify tax treatment, invoice completeness, and applicable GST rules before using this report for filing."
      ]
    };
  }

  function buildCustomerReport(sales) {
    const grouped = new Map();

    sales.forEach(function (sale) {
      const customerId = sale.customer_id
        ? String(sale.customer_id)
        : "";

      const customerName = sale.customer_name
        ? String(sale.customer_name).trim()
        : "";

      const key = customerId ||
        customerName ||
        "walk-in";

      if (!grouped.has(key)) {
        grouped.set(key, {
          "Customer ID": customerId,
          Customer: customerName || "Walk-in / Not recorded",
          "Purchase Count": 0,
          "Recorded Spend": 0,
          "First Recorded Sale": sale.sale_date || "",
          "Most Recent Sale": sale.sale_date || ""
        });
      }

      const customer = grouped.get(key);

      customer["Purchase Count"] += 1;

      const amount = Number(sale.total_amount);

      if (Number.isFinite(amount)) {
        customer["Recorded Spend"] += amount;
      }

      if (
        sale.sale_date &&
        (
          !customer["First Recorded Sale"] ||
          sale.sale_date < customer["First Recorded Sale"]
        )
      ) {
        customer["First Recorded Sale"] = sale.sale_date;
      }

      if (
        sale.sale_date &&
        sale.sale_date > customer["Most Recent Sale"]
      ) {
        customer["Most Recent Sale"] = sale.sale_date;
      }
    });

    const rows = Array.from(grouped.values())
      .sort(function (a, b) {
        return b["Recorded Spend"] - a["Recorded Spend"];
      });

    return {
      columns: [
        "Customer ID",
        "Customer",
        "Purchase Count",
        "Recorded Spend",
        "First Recorded Sale",
        "Most Recent Sale"
      ],
      rows: rows,
      summary: [
        {
          label: "Customer Groups",
          value: formatNumber(rows.length)
        },
        {
          label: "Recorded Revenue",
          value: formatCurrency(
            sum(rows, function (row) {
              return row["Recorded Spend"];
            })
          )
        },
        {
          label: "Repeat Customer Groups",
          value: formatNumber(
            rows.filter(function (row) {
              return row["Purchase Count"] > 1 &&
                row["Customer"] !== "Walk-in / Not recorded";
            }).length
          )
        }
      ],
      notes: [
        "Customer groups are built from customer_id and customer_name in sales records.",
        "Walk-in transactions without customer information are grouped together.",
        "This report does not calculate loyalty points, RFM scores, or churn predictions."
      ]
    };
  }

  function buildExecutiveReport(sales, products) {
    const revenue = sum(sales, function (sale) {
      return sale.total_amount;
    });

    const recordedTax = sum(sales, function (sale) {
      return sale.gst_amount;
    });

    const activeProducts = products.filter(function (product) {
      return !product.is_archived;
    });

    const lowStock = activeProducts.filter(function (product) {
      const stock = Number(product.stock);

      return Number.isFinite(stock) && stock <= 5;
    });

    const customerIds = sales.map(function (sale) {
      return sale.customer_id ||
        sale.customer_name ||
        null;
    });

    const rows = [
      {
        Metric: "Recorded Sales Transactions",
        Value: sales.length,
        Interpretation: "Count of sales rows in the selected period"
      },
      {
        Metric: "Recorded Sales Total",
        Value: revenue,
        Interpretation: "Sum of sales.total_amount"
      },
      {
        Metric: "Recorded Tax",
        Value: recordedTax,
        Interpretation: "Sum of sales.gst_amount"
      },
      {
        Metric: "Active Products",
        Value: activeProducts.length,
        Interpretation: "Current non-archived product records"
      },
      {
        Metric: "Low-Stock Products",
        Value: lowStock.length,
        Interpretation: "Active products with stock at or below 5"
      },
      {
        Metric: "Distinct Customer Groups",
        Value: uniqueCount(customerIds),
        Interpretation: "Based on recorded customer IDs or names"
      }
    ];

    const insights = [];

    if (sales.length === 0) {
      insights.push(
        "No sales rows were returned for the selected reporting period."
      );
    } else {
      insights.push(
        "The database contains " + formatNumber(sales.length) +
        " sales rows for the selected period."
      );
      insights.push(
        "Recorded sales total: " + formatCurrency(revenue) + "."
      );
    }

    if (lowStock.length > 0) {
      insights.push(
        formatNumber(lowStock.length) +
        " active products have stock at or below 5 units. Review replenishment needs."
      );
    } else {
      insights.push(
        "No active products were identified at or below the default 5-unit low-stock threshold."
      );
    }

    insights.push(
      "Check the underlying transaction statuses, inventory costs, and expenses before making accounting or purchasing decisions."
    );

    return {
      columns: ["Metric", "Value", "Interpretation"],
      rows: rows,
      summary: [
        {
          label: "Sales Rows",
          value: formatNumber(sales.length)
        },
        {
          label: "Recorded Sales Total",
          value: formatCurrency(revenue)
        },
        {
          label: "Active Products",
          value: formatNumber(activeProducts.length)
        },
        {
          label: "Low-Stock Products",
          value: formatNumber(lowStock.length)
        }
      ],
      notes: insights
    };
  }

  /* ------------------------------------------------------------
     REPORT GENERATION
  ------------------------------------------------------------ */

  async function getReportData(reportType, period) {
    let sales = null;
    let products = null;

    switch (reportType) {
      case "Sales_Report":
        sales = await fetchSales(period);
        return buildSalesReport(sales);

      case "Inventory_Audit":
        products = await fetchProducts();
        return buildInventoryReport(products);

      case "Profit_Loss_Report":
        sales = await fetchSales(period);
        products = await fetchProducts();
        return buildProfitLossReport(sales, products);

      case "GST_Tax_Compliance":
        sales = await fetchSales(period);
        return buildTaxReport(sales);

      case "Customer_Retention_Report":
        sales = await fetchCustomers();
        return buildCustomerReport(sales);

      case "AI_Executive_Brief":
        sales = await fetchSales(period);
        products = await fetchProducts();
        return buildExecutiveReport(sales, products);

      default:
        throw new Error("Unknown report type: " + reportType);
    }
  }

  async function generateReport(reportType, format) {
    if (state.isLoading) return;

    if (!REPORTS[reportType]) {
      showStatus("The requested report type is not recognized.", "error");
      return;
    }

    setLoading(true);
    clearStatus();

    try {
      state.client = state.client || getSupabaseClient();

      const user = await getAuthenticatedUser();

      if (!state.businessId) {
        state.businessId = await resolveBusinessId(user);
      }

      const period = getSelectedPeriod();

      state.currentPeriod = period;

      showStatus(
        "Loading " + REPORTS[reportType].title + "...",
        "info"
      );

      const report = await getReportData(reportType, period);

      state.currentReport = {
        type: reportType,
        title: REPORTS[reportType].title,
        description: REPORTS[reportType].description,
        period: period,
        generatedAt: new Date().toISOString(),
        summary: report.summary || [],
        columns: report.columns || [],
        rows: report.rows || [],
        notes: report.notes || []
      };

      state.currentRows = state.currentReport.rows;
      state.currentColumns = state.currentReport.columns;

      if (format === "Preview") {
        renderReportPreview(state.currentReport);

        showStatus(
          "Report preview generated successfully.",
          "success"
        );
      } else if (format === "CSV") {
        downloadCurrentReportCSV();
      } else if (format === "Excel") {
        await downloadCurrentReportExcel();
      } else if (format === "PDF") {
        printCurrentReport();
      } else {
        renderReportPreview(state.currentReport);

        showStatus(
          "Report data loaded successfully.",
          "success"
        );
      }
    } catch (error) {
      console.error("[RetailMind Reports]", error);

      showStatus(
        error && error.message
          ? error.message
          : "Unable to generate this report. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------
     PREVIEW RENDERING
  ------------------------------------------------------------ */

  function renderReportPreview(report) {
    const preview = byId("reportPreview");
    const title = byId("reportPreviewTitle");
    const period = byId("reportPreviewPeriod");
    const content = byId("reportPreviewContent");

    if (!preview || !title || !period || !content) {
      showStatus(
        "The report preview elements are missing from reports.html.",
        "error"
      );
      return;
    }

    title.textContent = report.title;

    period.textContent =
      report.period.label +
      " · Generated " +
      formatDateTime(report.generatedAt);

    let html = "";

    if (report.summary && report.summary.length) {
      html += '<div class="grid grid-cols-3" style="gap:1rem;margin-bottom:1.5rem;">';

      report.summary.forEach(function (item) {
        html +=
          '<div class="card">' +
            '<div class="card-body">' +
              '<div class="text-muted" style="font-size:0.8rem;">' +
                escapeHTML(item.label) +
              '</div>' +
              '<div class="font-bold text-dark" style="font-size:1.25rem;margin-top:0.35rem;">' +
                escapeHTML(item.value) +
              '</div>' +
            '</div>' +
          '</div>';
      });

      html += "</div>";
    }

    if (report.rows.length === 0) {
      html +=
        '<div class="report-empty">' +
          '<i class="fa-solid fa-folder-open" style="font-size:2rem;margin-bottom:0.75rem;"></i>' +
          '<p>No records were found for this report.</p>' +
        '</div>';
    } else {
      html += '<div class="report-preview-table-wrap">';
      html += '<table class="report-preview-table">';
      html += "<thead><tr>";

      report.columns.forEach(function (column) {
        html += "<th>" + escapeHTML(column) + "</th>";
      });

      html += "</tr></thead><tbody>";

      report.rows.forEach(function (row) {
        html += "<tr>";

        report.columns.forEach(function (column) {
          const value = row[column];

          html += "<td>" + escapeHTML(formatCellValue(column, value)) + "</td>";
        });

        html += "</tr>";
      });

      html += "</tbody></table></div>";
    }

    if (report.notes && report.notes.length) {
      html +=
        '<div style="margin-top:1.5rem;">' +
          '<h4 class="font-bold text-dark" style="margin-bottom:0.75rem;">Report Notes</h4>' +
          '<ul style="padding-left:1.25rem;line-height:1.8;">';

      report.notes.forEach(function (note) {
        html += "<li>" + escapeHTML(note) + "</li>";
      });

      html += "</ul></div>";
    }

    content.innerHTML = html;
    preview.hidden = false;

    preview.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function formatCellValue(column, value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "number") {
      if (
        /amount|revenue|spend|price|value|tax|discount|profit|subtotal|gst|total/i.test(column)
      ) {
        return formatCurrency(value);
      }

      return formatNumber(value);
    }

    if (
      typeof value === "string" &&
      /date/i.test(column)
    ) {
      return formatDate(value);
    }

    return String(value);
  }

  function closeReportPreview() {
    const preview = byId("reportPreview");

    if (preview) {
      preview.hidden = true;
    }
  }

  /* ------------------------------------------------------------
     CSV EXPORT
  ------------------------------------------------------------ */

  function csvEscape(value) {
    if (value === null || value === undefined) {
      return '""';
    }

    let text = String(value);

    /*
     * Prevent spreadsheet formula injection for values originating
     * from user-controlled text fields.
     */
    if (/^[\s]*[=+\-@]/.test(text)) {
      text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
  }

  function createCSV(report) {
    const lines = [];

    lines.push(csvEscape(report.title));
    lines.push(csvEscape("Reporting Period: " + report.period.label));
    lines.push(csvEscape("Generated At: " + formatDateTime(report.generatedAt)));
    lines.push("");

    if (report.summary && report.summary.length) {
      lines.push(
        [
          csvEscape("Summary Metric"),
          csvEscape("Value")
        ].join(",")
      );

      report.summary.forEach(function (item) {
        lines.push(
          [
            csvEscape(item.label),
            csvEscape(item.value)
          ].join(",")
        );
      });

      lines.push("");
    }

    lines.push(
      report.columns.map(csvEscape).join(",")
    );

    report.rows.forEach(function (row) {
      lines.push(
        report.columns.map(function (column) {
          return csvEscape(row[column]);
        }).join(",")
      );
    });

    if (report.notes && report.notes.length) {
      lines.push("");
      lines.push(csvEscape("Report Notes"));

      report.notes.forEach(function (note) {
        lines.push(csvEscape(note));
      });
    }

    /*
     * UTF-8 BOM improves compatibility with Excel when opening
     * CSV files containing non-ASCII characters.
     */
    return "\uFEFF" + lines.join("\r\n");
  }

  function downloadBlob(content, mimeType, fileName) {
    const blob = new Blob([content], {
      type: mimeType
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadCurrentReportCSV() {
    if (!state.currentReport) {
      showStatus("Generate a report before exporting.", "error");
      return;
    }

    const report = state.currentReport;

    const fileName =
      safeFileName(report.title) +
      "_" +
      (report.period.start || "all") +
      "_to_" +
      (report.period.end || "all") +
      ".csv";

    downloadBlob(
      createCSV(report),
      "text/csv;charset=utf-8;",
      fileName
    );

    showStatus("CSV report downloaded successfully.", "success");
  }

  function exportCurrentReport(format) {
    if (!state.currentReport) {
      showStatus(
        "Choose Preview on a report before exporting it.",
        "error"
      );
      return;
    }

    if (format === "CSV") {
      downloadCurrentReportCSV();
      return;
    }

    if (format === "Excel") {
      downloadCurrentReportExcel();
      return;
    }

    if (format === "PDF") {
      printCurrentReport();
    }
  }

  /* ------------------------------------------------------------
     EXCEL EXPORT
  ------------------------------------------------------------ */

  function loadScriptOnce(src, globalName) {
    if (window[globalName]) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[data-report-library="' + globalName + '"]'
      );

      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });

        if (window[globalName]) {
          resolve();
        }

        return;
      }

      const script = document.createElement("script");

      script.src = src;
      script.async = true;
      script.dataset.reportLibrary = globalName;

      script.onload = resolve;

      script.onerror = function () {
        reject(
          new Error("Unable to load the export library: " + globalName)
        );
      };

      document.head.appendChild(script);
    });
  }

  async function downloadCurrentReportExcel() {
    if (!state.currentReport) {
      showStatus("Generate a report before exporting.", "error");
      return;
    }

    try {
      await loadScriptOnce(
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        "XLSX"
      );

      if (!window.XLSX) {
        throw new Error("Excel export library is unavailable.");
      }

      const report = state.currentReport;
      const workbook = window.XLSX.utils.book_new();

      const summaryRows = [
        ["Report", report.title],
        ["Reporting Period", report.period.label],
        ["Generated At", formatDateTime(report.generatedAt)],
        [],
        ["Summary Metric", "Value"]
      ];

      (report.summary || []).forEach(function (item) {
        summaryRows.push([item.label, item.value]);
      });

      const summarySheet = window.XLSX.utils.aoa_to_sheet(summaryRows);

      window.XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );

      const dataRows = report.rows.map(function (row) {
        return report.columns.map(function (column) {
          const value = row[column];

          return value === undefined || value === null
            ? ""
            : value;
        });
      });

      const dataSheet = window.XLSX.utils.aoa_to_sheet([
        report.columns,
        ...dataRows
      ]);

      window.XLSX.utils.book_append_sheet(
        workbook,
        dataSheet,
        "Report Data"
      );

      if (report.notes && report.notes.length) {
        const notesSheet = window.XLSX.utils.aoa_to_sheet([
          ["Report Notes"],
          ...report.notes.map(function (note) {
            return [note];
          })
        ]);

        window.XLSX.utils.book_append_sheet(
          workbook,
          notesSheet,
          "Notes"
        );
      }

      const fileName =
        safeFileName(report.title) +
        "_" +
        (report.period.start || "all") +
        "_to_" +
        (report.period.end || "all") +
        ".xlsx";

      window.XLSX.writeFile(workbook, fileName);

      showStatus("Excel report downloaded successfully.", "success");
    } catch (error) {
      console.error("[Reports Excel Export]", error);

      showStatus(
        "Excel export failed. " +
        (error.message || "Try exporting as CSV instead."),
        "error"
      );
    }
  }

  /* ------------------------------------------------------------
     PDF / PRINT EXPORT
  ------------------------------------------------------------ */

  function printCurrentReport() {
    if (!state.currentReport) {
      showStatus(
        "Generate or preview a report before printing.",
        "error"
      );
      return;
    }

    const report = state.currentReport;
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      showStatus(
        "The print window was blocked. Allow pop-ups for this site and try again.",
        "error"
      );
      return;
    }

    const header = `
      <header>
        <h1>${escapeHTML(report.title)}</h1>
        <p><strong>Period:</strong> ${escapeHTML(report.period.label)}</p>
        <p><strong>Generated:</strong> ${escapeHTML(formatDateTime(report.generatedAt))}</p>
      </header>
    `;

    let summaryHTML = "";

    if (report.summary && report.summary.length) {
      summaryHTML = `
        <h2>Summary</h2>
        <table>
          <thead>
            <tr><th>Metric</th><th>Value</th></tr>
          </thead>
          <tbody>
            ${report.summary.map(function (item) {
              return `
                <tr>
                  <td>${escapeHTML(item.label)}</td>
                  <td>${escapeHTML(item.value)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }

    let dataHTML = "";

    if (report.rows.length) {
      dataHTML = `
        <h2>Report Data</h2>
        <table>
          <thead>
            <tr>
              ${report.columns.map(function (column) {
                return "<th>" + escapeHTML(column) + "</th>";
              }).join("")}
            </tr>
          </thead>
          <tbody>
            ${report.rows.map(function (row) {
              return `
                <tr>
                  ${report.columns.map(function (column) {
                    return "<td>" +
                      escapeHTML(formatCellValue(column, row[column])) +
                      "</td>";
                  }).join("")}
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    } else {
      dataHTML = "<p>No records were found for this report.</p>";
    }

    let notesHTML = "";

    if (report.notes && report.notes.length) {
      notesHTML = `
        <h2>Notes and Limitations</h2>
        <ul>
          ${report.notes.map(function (note) {
            return "<li>" + escapeHTML(note) + "</li>";
          }).join("")}
        </ul>
      `;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHTML(report.title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            margin: 32px;
            line-height: 1.5;
          }

          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 17px; margin-top: 28px; }

          p { margin: 5px 0; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 11px;
          }

          th, td {
            border: 1px solid #d1d5db;
            padding: 7px;
            text-align: left;
            overflow-wrap: anywhere;
          }

          th { background: #f3f4f6; }

          tr { page-break-inside: avoid; }

          li { margin-bottom: 7px; }

          .print-help {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 12px;
            margin-bottom: 24px;
            font-size: 13px;
          }

          @media print {
            body { margin: 12mm; }
            .print-help { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-help">
          Choose <strong>Save as PDF</strong> in your browser's print dialog
          to save this report as a PDF file.
        </div>

        ${header}
        ${summaryHTML}
        ${dataHTML}
        ${notesHTML}

        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.print();
            }, 250);
          });
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();

    showStatus(
      "Print view opened. Select Save as PDF in the print dialog to save a PDF.",
      "success"
    );
  }

  /* ------------------------------------------------------------
     UI INITIALIZATION
  ------------------------------------------------------------ */

  function bindReportPeriod() {
    const selector = byId("reportPeriod");

    if (!selector) return;

    selector.addEventListener("change", function () {
      state.currentPeriod = getSelectedPeriod();

      showStatus(
        "Reporting period updated to " +
        state.currentPeriod.label +
        ". Generate or preview a report to refresh its data.",
        "info"
      );
    });
  }

  function bindMobileSidebar() {
    const toggle = document.querySelector(".mobile-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
      sidebar.classList.toggle("open");

      toggle.setAttribute(
        "aria-expanded",
        sidebar.classList.contains("active") ||
        sidebar.classList.contains("open")
          ? "true"
          : "false"
      );
    });
  }

  function bindAIQuickButton() {
    const button = byId("aiQuickBtn");

    if (!button) return;

    button.addEventListener("click", function () {
      window.location.href = "ai-assistant.html";
    });
  }

  async function initializeReports() {
    if (state.initialized) return;

    state.initialized = true;

    bindReportPeriod();
    bindMobileSidebar();
    bindAIQuickButton();

    state.currentPeriod = getSelectedPeriod();

    try {
      state.client = getSupabaseClient();

      /*
       * Authenticate immediately so users see a useful error
       * instead of an empty report interface.
       */
      const user = await getAuthenticatedUser();

      state.businessId = await resolveBusinessId(user);

      showStatus(
        "Reports are ready. Select a report to preview or export.",
        "success"
      );
    } catch (error) {
      console.error("[Reports Initialization]", error);

      showStatus(
        error.message ||
        "Unable to initialize reports. Check your Supabase configuration.",
        "error"
      );
    }
  }

  /* ------------------------------------------------------------
     PUBLIC FUNCTIONS
     These names are used by onclick attributes in reports.html.
  ------------------------------------------------------------ */

  window.generateReport = generateReport;
  window.exportCurrentReport = exportCurrentReport;
  window.closeReportPreview = closeReportPreview;

  window.RetailMindReports = {
    generateReport: generateReport,
    exportCurrentReport: exportCurrentReport,
    closeReportPreview: closeReportPreview,
    getSelectedPeriod: getSelectedPeriod
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeReports);
  } else {
    initializeReports();
  }
})();
