/**
 * RETAILMIND AI - CORE APPLICATION & GLOBAL STATE
 * Handles sidebar, mobile drawers, dropdowns, toasts, and realistic mock retail store.
 */

// Initial Mock Database for RetailMind AI
const DEFAULT_PRODUCTS = [
  { id: 'PRD-01', name: 'Fresh Milk 1L', category: 'Dairy', price: 62, cost: 48, stock: 12, reorder: 50, supplier: 'Heritage Dairy Farms', expiry: '2026-09-10', status: 'Critical', sales: 420 },
  { id: 'PRD-02', name: 'Whole Wheat Bread 400g', category: 'Bakery', price: 45, cost: 32, stock: 18, reorder: 40, supplier: 'Golden Crust Bakers', expiry: '2026-09-09', status: 'Low Stock', sales: 310 },
  { id: 'PRD-03', name: 'Basmati Rice 5kg', category: 'Grains', price: 480, cost: 380, stock: 24, reorder: 40, supplier: 'Punjab Royal Mills', expiry: '2027-03-15', status: 'Low Stock', sales: 185 },
  { id: 'PRD-04', name: 'Sunflower Cooking Oil 1L', category: 'Oils', price: 165, cost: 135, stock: 18, reorder: 30, supplier: 'AgroPure Refineries', expiry: '2027-01-20', status: 'Low Stock', sales: 240 },
  { id: 'PRD-05', name: 'Refined Sugar 1kg', category: 'Groceries', price: 48, cost: 38, stock: 145, reorder: 60, supplier: 'Madhur Sugars Ltd', expiry: '2027-08-10', status: 'In Stock', sales: 190 },
  { id: 'PRD-06', name: 'Premium Assam Tea 500g', category: 'Beverages', price: 290, cost: 210, stock: 85, reorder: 35, supplier: 'Valley Tea Estates', expiry: '2027-06-30', status: 'In Stock', sales: 165 },
  { id: 'PRD-07', name: 'Arabica Roast Coffee 200g', category: 'Beverages', price: 340, cost: 245, stock: 62, reorder: 25, supplier: 'Coorg Coffee Co.', expiry: '2027-05-18', status: 'In Stock', sales: 142 },
  { id: 'PRD-08', name: 'Herbal Shampoo 340ml', category: 'Personal Care', price: 240, cost: 160, stock: 54, reorder: 20, supplier: 'PureCare Naturals', expiry: '2028-02-14', status: 'In Stock', sales: 110 },
  { id: 'PRD-09', name: 'Moisturizing Soap 125g', category: 'Personal Care', price: 42, cost: 28, stock: 210, reorder: 50, supplier: 'PureCare Naturals', expiry: '2028-04-01', status: 'In Stock', sales: 320 },
  { id: 'PRD-10', name: 'Butter Cookies 200g', category: 'Snacks', price: 55, cost: 38, stock: 95, reorder: 40, supplier: 'Golden Crust Bakers', expiry: '2026-12-15', status: 'In Stock', sales: 280 },
  { id: 'PRD-11', name: 'Greek Yogurt 400g', category: 'Dairy', price: 95, cost: 70, stock: 8, reorder: 30, supplier: 'Heritage Dairy Farms', expiry: '2026-09-12', status: 'Critical', sales: 135 },
  { id: 'PRD-12', name: 'Organic Honey 500g', category: 'Groceries', price: 320, cost: 220, stock: 38, reorder: 20, supplier: 'NaturePure Ltd', expiry: '2028-08-30', status: 'In Stock', sales: 94 }
];

const DEFAULT_ORDERS = [
  { id: 'ORD-10248', customer: 'Ananya Sharma', date: 'Today, 02:45 PM', items: 'Milk 1L (x2), Bread (x1)', total: 169, payment: 'UPI', status: 'Completed' },
  { id: 'ORD-10247', customer: 'Vikram Malhotra', date: 'Today, 01:15 PM', items: 'Basmati Rice 5kg (x1), Oil 1L (x2)', total: 810, payment: 'Card', status: 'Completed' },
  { id: 'ORD-10246', customer: 'Pooja Verma', date: 'Today, 11:30 AM', items: 'Assam Tea (x1), Cookies (x3)', total: 455, payment: 'Cash', status: 'Processing' },
  { id: 'ORD-10245', customer: 'Rahul Deshmukh', date: 'Yesterday, 06:20 PM', items: 'Coffee 200g (x2), Honey (x1)', total: 1000, payment: 'UPI', status: 'Completed' },
  { id: 'ORD-10244', customer: 'Sneha Patel', date: 'Yesterday, 04:10 PM', items: 'Herbal Shampoo (x1), Soap (x4)', total: 408, payment: 'Card', status: 'Pending' },
  { id: 'ORD-10243', customer: 'Amitabh Sen', date: 'Yesterday, 02:00 PM', items: 'Sugar 1kg (x5), Oil 1L (x1)', total: 405, payment: 'Cash', status: 'Completed' }
];

const DEFAULT_NOTIFICATIONS = [
  { id: 1, title: 'Milk stock is below safety level', desc: 'Current: 12 units. Minimum required: 50 units.', time: '10 mins ago', type: 'danger', icon: 'fa-triangle-exclamation', read: false },
  { id: 2, title: 'Sales increased 18% this week', desc: 'Beverages and Bakery showed high momentum.', time: '2 hours ago', type: 'success', icon: 'fa-arrow-trend-up', read: false },
  { id: 3, title: 'Supplier shipment delayed', desc: 'AgroPure Refineries delayed PO-489 by 24h.', time: '5 hours ago', type: 'warning', icon: 'fa-truck-fast', read: false },
  { id: 4, title: '3 products approaching expiry', desc: 'Fresh Milk & Bread batch expiring within 4 days.', time: '1 day ago', type: 'danger', icon: 'fa-clock', read: true }
];

// Initialize Storage
function initStore() {
  if (!localStorage.getItem('retailmind_products')) {
    localStorage.setItem('retailmind_products', JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem('retailmind_orders')) {
    localStorage.setItem('retailmind_orders', JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem('retailmind_notifications')) {
    localStorage.setItem('retailmind_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
}

// Global Shell UI Behaviors
document.addEventListener('DOMContentLoaded', () => {
  initStore();
  setupSidebar();
  setupTopbarDropdowns();
  setupQuickAIModal();
});

// Sidebar & Mobile Off-canvas
function setupSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.mobile-toggle');

  if (!sidebar) return;

  // Insert Backdrop for mobile
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('show');
    });
  }

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
  });
}

// Topbar Dropdowns
function setupTopbarDropdowns() {
  const notifBtn = document.getElementById('notifToggle');
  const notifMenu = document.getElementById('notifDropdown');
  const profileBtn = document.getElementById('profileToggle');
  const profileMenu = document.getElementById('profileDropdown');

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (notifBtn && notifMenu && !notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
      notifMenu.classList.remove('show');
    }
    if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
      profileMenu.classList.remove('show');
    }
  });


  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (notifMenu) notifMenu.classList.remove('show');
      profileMenu.classList.toggle('show');
    });
  }
}

// Toast System
function showToast(message, type = 'success', icon = 'fa-circle-check') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-text">${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// Quick AI Modal
function setupQuickAIModal() {
  const aiQuickBtn = document.getElementById('aiQuickBtn');
  if (!aiQuickBtn) return;

  aiQuickBtn.addEventListener('click', () => {
    let modal = document.getElementById('quickAiModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickAiModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #FAF5FF 0%, #E6FBF5 100%);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="brand-badge" style="background: var(--primary); color: #fff;">AI</span>
              <h4 style="font-weight: 700;">RetailMind Quick Copilot</h4>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('quickAiModal').classList.remove('active')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.875rem; color: var(--muted); margin-bottom: 1rem;">
              Instant retail intelligence for inventory, restocking, and revenue forecasts.
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.25rem;">
              <button class="btn btn-secondary text-left" style="justify-content: flex-start; text-align: left;" onclick="window.location.href='ai-assistant.html?q=reorder'">
                <i class="fa-solid fa-boxes-packing text-primary"></i> Which products should I reorder today?
              </button>
              <button class="btn btn-secondary text-left" style="justify-content: flex-start; text-align: left;" onclick="window.location.href='ai-assistant.html?q=deadstock'">
                <i class="fa-solid fa-triangle-exclamation text-danger"></i> Show dead stock & slow movers
              </button>
              <button class="btn btn-secondary text-left" style="justify-content: flex-start; text-align: left;" onclick="window.location.href='ai-assistant.html?q=forecast'">
                <i class="fa-solid fa-chart-line text-accent"></i> Forecast next 7 days revenue
              </button>
            </div>
            <div class="input-icon-wrapper">
              <i class="fa-solid fa-robot"></i>
              <input type="text" id="quickAiInput" class="form-control" placeholder="Ask RetailMind AI anything..." onkeydown="if(event.key==='Enter') window.location.href='ai-assistant.html?q=' + encodeURIComponent(this.value)">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.getElementById('quickAiModal').classList.remove('active')">Close</button>
            <button class="btn btn-primary" onclick="const v = document.getElementById('quickAiInput').value; window.location.href='ai-assistant.html' + (v ? '?q=' + encodeURIComponent(v) : '')">Open Full Assistant</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('active');
  });
}
/* =========================================================
   SUPABASE GLOBAL PROFILE SYNC
========================================================= */

async function syncGlobalProfile() {

  // Make sure Supabase client exists
  if (typeof supabaseClient === "undefined") {
    console.warn("Supabase client not available.");
    return;
  }

  const {
    data: { session },
    error: sessionError
  } = await supabaseClient.auth.getSession();

  if (sessionError || !session?.user) {
    console.warn("No authenticated user for global profile.");
    return;
  }

  const user = session.user;

  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select(`
            full_name,
            avatar_url
        `)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Global profile loading error:",
      profileError
    );
    return;
  }

  const name =
    profile?.full_name ||
    user.email ||
    "User";
  /* =====================================================
     GET BUSINESS ROLE
  ===================================================== */

  const {
    data: membership,
    error: membershipError
  } = await supabaseClient
    .from("business_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "Global business role loading error:",
      membershipError
    );
  }

  const userRole =
    membership?.role || "staff";

  const roleLabel = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    staff: "Staff"
  };

  const displayRole =
    roleLabel[userRole] || "Staff";
  /* =====================================================
 UPDATE SIDEBAR ROLE
===================================================== */

  document
    .querySelectorAll(".sidebar-footer .user-role")
    .forEach(element => {

      element.textContent =
        displayRole;

    });
  const firstName =
    name.trim().split(/\s+/)[0];

  const dashboardGreeting =
    document.getElementById("dashboardGreeting");

  if (dashboardGreeting) {
    dashboardGreeting.textContent =
      `Good morning, ${firstName} 👋`;
  }
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();


  /* =====================================================
     ALL GLOBAL AVATARS
  ===================================================== */

  const avatars =
    document.querySelectorAll(
      ".user-avatar-circle"
    );

  avatars.forEach(avatar => {

    if (profile?.avatar_url) {

      avatar.innerHTML = `
                <img
                    src="${profile.avatar_url}"
                    alt="Profile Picture"
                    style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border-radius: 50%;
                        display: block;
                    "
                >
            `;

    } else {

      avatar.textContent = initials;

    }

  });


  /* =====================================================
     SIDEBAR USER NAME
  ===================================================== */

  const userName =
    document.querySelector(
      ".sidebar-footer .user-name"
    );

  if (userName) {
    userName.textContent = name;
  }


  /* =====================================================
     PROFILE DROPDOWN NAME
  ===================================================== */

  const dropdownName =
    document.querySelector(
      "#profileDropdown .font-bold"
    );

  if (dropdownName) {
    dropdownName.textContent = name;
  }


  /* =====================================================
     PROFILE DROPDOWN EMAIL
  ===================================================== */

  const dropdownEmail =
    document.querySelector(
      "#profileDropdown .text-muted"
    );

  if (dropdownEmail) {
    dropdownEmail.textContent =
      user.email || "";
  }

}


/* =========================================================
   RUN GLOBAL PROFILE SYNC
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    syncGlobalProfile();

  }
);

async function updateInventoryLowStockBadge() {
  const badges = document.querySelectorAll('#inventoryLowStockBadge');

  if (!badges.length || typeof supabaseClient === 'undefined') return;

  try {
    const { data: { user }, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !user) return;

    const { data: membership, error: membershipError } =
      await supabaseClient
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membership) {
      console.error('Unable to load inventory membership:', membershipError);
      return;
    }

    const { data: products, error: productsError } =
      await supabaseClient
        .from('products')
        .select('stock, reorder_level')
        .eq('business_id', membership.business_id)
        .eq('is_archived', false);

    if (productsError) throw productsError;

    const lowStockCount = (products || []).filter(product =>
      Number(product.stock) > 0 &&
      Number(product.stock) < Number(product.reorder_level)
    ).length;

    badges.forEach(badge => {
      badge.textContent = `${lowStockCount} low`;
      badge.style.display = lowStockCount > 0 ? 'inline-flex' : 'none';
    });
  } catch (error) {
    console.error('Failed to update inventory badge:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateInventoryLowStockBadge();
});

//======================== Notifications ========================//
async function updateSidebarNotificationCounts() {
  const badges = document.querySelectorAll(
    ".sidebar-notification-count"
  );

  if (!badges.length) return;

  const client = window.supabaseClient || window.db;

  if (!client) {
    console.error("Supabase client not found.");
    return;
  }

  try {
    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      badges.forEach((badge) => {
        badge.hidden = true;
      });
      return;
    }

    // First, use the currently selected business.
    let businessId =
      window.currentBusinessId ||
      window.businessId ||
      window.currentBusiness?.id;

    // If no business is set, look up the user's membership.
    if (!businessId) {
      const { data: memberships, error: membershipError } =
        await client
          .from("business_members")
          .select("business_id")
          .eq("user_id", user.id)
          .limit(2);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        console.warn("No business membership found.");
        badges.forEach((badge) => {
          badge.hidden = true;
        });
        return;
      }

      // Do not guess if the user belongs to multiple businesses.
      if (memberships.length > 1) {
        console.warn(
          "Multiple businesses found. Set the active business ID first."
        );
        return;
      }

      businessId = memberships[0].business_id;

      window.currentBusinessId = businessId;
      window.businessId = businessId;
    }

    const { count, error } = await client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    const unreadCount = count || 0;

    badges.forEach((badge) => {
      badge.textContent =
        unreadCount > 99 ? "99+" : String(unreadCount);

      badge.hidden = unreadCount === 0;
    });

    console.log("Sidebar unread notifications:", unreadCount);
  } catch (error) {
    console.error(
      "Failed to update sidebar notification counts:",
      error
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateSidebarNotificationCounts();
});

// ==========================================
// BUSINESS HEALTH SIDEBAR — GLOBAL SYNC
// Add this to js/app.js
// ==========================================

window.syncBusinessHealthSidebar = async function () {
  const db = window.supabaseClient || window.db;

  if (!db) {
    console.warn("Supabase client not found.");
    return;
  }

  try {
    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;

    const user = sessionData?.session?.user;

    if (!user) {
      updateSidebarHealth(null);
      return;
    }

    // Reuse the active business if already resolved.
    let businessId =
      window.currentBusinessId ||
      window.businessId ||
      window.currentBusiness?.id;

    // Otherwise, fetch the user's business membership.
    if (!businessId) {
      const { data: membership, error } = await db
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      businessId = membership?.business_id;
    }

    if (!businessId) {
      updateSidebarHealth(null);
      return;
    }

    // Load products, completed sales, and sale items.
    const [productsResult, salesResult, itemsResult] =
      await Promise.all([
        db.from("products")
          .select("id, stock, reorder_level")
          .eq("business_id", businessId),

        db.from("sales")
          .select("id, total_amount, status")
          .eq("business_id", businessId)
          .eq("status", "completed"),

        db.from("sale_items")
          .select(`
                        quantity,
                        total_price,
                        products(purchase_price),
                        sales!inner(business_id, status)
                    `)
          .eq("sales.business_id", businessId)
          .eq("sales.status", "completed")
      ]);

    if (productsResult.error) throw productsResult.error;
    if (salesResult.error) throw salesResult.error;
    if (itemsResult.error) throw itemsResult.error;

    const products = productsResult.data || [];
    const sales = salesResult.data || [];
    const items = itemsResult.data || [];

    // 1. Profitability score
    const revenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0
    );

    const grossProfit = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const sellingTotal = Number(item.total_price || 0);
      const purchasePrice = Number(
        item.products?.purchase_price || 0
      );

      return sum + sellingTotal - quantity * purchasePrice;
    }, 0);

    const profitabilityScore = revenue > 0
      ? clampHealthScore((grossProfit / revenue) * 100)
      : null;

    // 2. Inventory health score
    const lowStockCount = products.filter(product =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= Number(product.reorder_level || 0)
    ).length;

    const inventoryScore = products.length
      ? clampHealthScore(
        100 - (lowStockCount / products.length) * 100
      )
      : null;

    // 3. Stock accuracy score
    const stockAccuracyScore = products.length
      ? clampHealthScore(
        products.filter(product =>
          Number(product.stock || 0) >
          Number(product.reorder_level || 0)
        ).length / products.length * 100
      )
      : null;

    // 4. Supplier performance score
    // Supplier ratings are not queried here, so this score is omitted.
    // Add the supplier rating query if you want it included.

    const availableScores = [
      profitabilityScore,
      inventoryScore,
      stockAccuracyScore
    ].filter(score => score !== null);

    const businessHealth = availableScores.length
      ? Math.round(
        availableScores.reduce((sum, score) => sum + score, 0) /
        availableScores.length
      )
      : null;

    updateSidebarHealth(businessHealth);

    // Share the score with other page scripts.
    window.currentBusinessHealth = businessHealth;

  } catch (error) {
    console.error("Business Health sidebar sync failed:", error);
  }
};

function clampHealthScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function updateSidebarHealth(score) {
  document.querySelectorAll(
    "[data-business-health-score], .sidebar-business-health-score"
  ).forEach(element => {
    element.textContent = score === null ? "--%" : `${score}%`;
  });

  document.querySelectorAll("[data-business-health-status]").forEach(element => {
    if (score === null) {
      element.textContent = "No data";
    } else if (score >= 80) {
      element.textContent = "Healthy";
    } else if (score >= 60) {
      element.textContent = "Needs attention";
    } else {
      element.textContent = "At risk";
    }
  });
}


/* ============================================
   RETAILMIND AI — GLOBAL BUSINESS HEALTH SYNC
   Shared by every page
============================================ */

(() => {
  if (window.__rmHealthSyncInstalled) return;
  window.__rmHealthSyncInstalled = true;

  let syncInProgress = false;

  function getClient() {
    return window.supabaseClient || window.db;
  }

  function getHealthBadges() {
    const badges = new Set(
      document.querySelectorAll(
        "[data-business-health-score], " +
        ".sidebar-business-health-score"
      )
    );

    // Fallback for sidebars that still have older HTML markup.
    document.querySelectorAll("a").forEach(link => {
      const label = (link.innerText || "").trim();

      if (
        /business health/i.test(label) ||
        /health\.html/i.test(link.getAttribute("href") || "")
      ) {
        const candidates = link.querySelectorAll("span, strong, b");

        if (candidates.length) {
          badges.add(candidates[candidates.length - 1]);
        }
      }
    });

    return [...badges];
  }

  function renderHealth(score) {
    getHealthBadges().forEach(badge => {
      badge.textContent =
        score === null || score === undefined
          ? "--%"
          : `${score}%`;
    });

    window.currentBusinessHealth = score;
  }

  function clamp(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  async function syncBusinessHealth() {
    const db = getClient();

    if (!db || syncInProgress) return;

    syncInProgress = true;

    try {
      const { data: sessionResult, error: sessionError } =
        await db.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionResult?.session?.user;

      if (!user) {
        renderHealth(null);
        return;
      }

      // Use the active business, or find the user's membership.
      let businessId =
        window.currentBusinessId ||
        window.businessId ||
        window.currentBusiness?.id;

      if (!businessId) {
        const { data: membership, error } = await db
          .from("business_members")
          .select("business_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        businessId = membership?.business_id;
      }

      if (!businessId) {
        renderHealth(null);
        return;
      }

      // Fetch the same underlying data used for the health calculation.
      const [productsResult, salesResult, itemsResult] =
        await Promise.all([


          db.from("products")
            .select(`
    id,
    stock,
    reorder_level,
    suppliers: suppliers!products_supplier_id_fkey (rating)
  `)
            .eq("business_id", businessId),


          db.from("sales")
            .select("id, total_amount, status")
            .eq("business_id", businessId)
            .eq("status", "completed"),

          db.from("sale_items")
            .select(`
                            quantity,
                            total_price,
                            products(purchase_price),
                            sales!inner(business_id, status)
                        `)
            .eq("sales.business_id", businessId)
            .eq("sales.status", "completed")
        ]);

      if (productsResult.error) throw productsResult.error;
      if (salesResult.error) throw salesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const products = productsResult.data || [];
      const sales = salesResult.data || [];
      const items = itemsResult.data || [];

      // 1. Profitability
      const revenue = sales.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
      );

      const grossProfit = items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const sellingTotal = Number(item.total_price || 0);
        const cost = Number(item.products?.purchase_price || 0);

        return sum + sellingTotal - quantity * cost;
      }, 0);

      const profitability = revenue > 0
        ? clamp((grossProfit / revenue) * 100)
        : null;

      // 2. Inventory health
      const lowStock = products.filter(product =>
        Number(product.stock || 0) > 0 &&
        Number(product.stock || 0) <=
        Number(product.reorder_level || 0)
      ).length;

      const inventory = products.length
        ? clamp(100 - (lowStock / products.length) * 100)
        : null;

      // 3. Stock accuracy proxy
      const stockAccuracy = products.length
        ? clamp(
          products.filter(product =>
            Number(product.stock || 0) >
            Number(product.reorder_level || 0)
          ).length / products.length * 100
        )
        : null;

      // 4. Supplier performance from supplier ratings (0–5).
      const ratings = products
        .map(product => Number(product.suppliers?.rating || 0))
        .filter(rating => rating > 0);

      const supplierPerformance = ratings.length
        ? clamp(
          ratings.reduce((sum, rating) => sum + rating, 0) /
          ratings.length * 20
        )
        : null;

      // Average only available metrics.
      const scores = [
        profitability,
        inventory,
        stockAccuracy,
        supplierPerformance
      ].filter(score => score !== null);

      const health = scores.length
        ? clamp(scores.reduce((sum, score) => sum + score, 0) /
          scores.length)
        : null;

      renderHealth(health);

      console.log("Global Business Health synced:", health);

    } catch (error) {
      console.error('Global Business Health sync failed details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    } finally {
      syncInProgress = false;
    }
  }

  // Make it available to other scripts and business-switching controls.
  window.syncBusinessHealthSidebar = syncBusinessHealth;

  // Initial sync, including pages whose sidebar appears after DOM parsing.
  function startSync() {
    syncBusinessHealth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSync, {
      once: true
    });
  } else {
    startSync();
  }

  // Refresh after authentication changes.
  function watchAuth() {
    const db = getClient();

    if (!db?.auth) {
      setTimeout(watchAuth, 300);
      return;
    }

    db.auth.onAuthStateChange(() => {
      setTimeout(syncBusinessHealth, 0);
    });
  }

  watchAuth();

  // Refresh when the user returns to a page.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncBusinessHealth();
  });

  // Refresh after the active business changes.
  window.addEventListener("retailmind:business-changed", syncBusinessHealth);
})();
