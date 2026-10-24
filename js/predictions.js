/**
 * RETAILMIND AI - PREDICTIVE ANALYTICS SUITE
 * Handles Explainable AI factors, interactive What-If sales simulator, Smart Reorder approvals & Dynamic Pricing.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupPredictionTabs();
  setupSimulatorSlider();
  setupSmartReorderActions();
  animateExplainableAiBars();
  loadPredictionBusiness()
  .then(() => {
    loadReorderRecommendations();
  });
});
async function loadReorderRecommendations() {
  const businessId =
    window.currentBusiness?.id;

  if (!businessId) {
    console.error(
      'No current business available for reorder recommendations.'
    );
    return;
  }

  const {
    data: products,
    error
  } = await supabaseClient
    .from('products')
    .select(`
      id,
      name,
      sku,
      stock,
      reorder_level,
      purchase_price,
      supplier_id,
      suppliers (
        id,
        name,
        lead_time_days
      )
    `)
    .eq('business_id', businessId);

  if (error) {
    console.error(
      'Reorder products loading error:',
      error
    );
    return;
  }

  console.log(
    'RetailMind reorder products:',
    products
  );
  const lowStockProducts =
  products.filter(product =>
    Number(product.stock) > 0 &&
    Number(product.stock) <=
      Number(product.reorder_level)
  );

console.log(
  'RetailMind low-stock reorder products count:',
  lowStockProducts.length
);

console.log(
  'RetailMind low-stock reorder products:',
  lowStockProducts
);
const tableBody =
  document.getElementById(
    'reorderRecommendationsBody'
  );

if (!tableBody) {
  console.error(
    'Reorder recommendations table body not found.'
  );
  return;
}

if (lowStockProducts.length === 0) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="8"
          style="text-align: center; padding: 2rem;">
        No products currently require reordering.
      </td>
    </tr>
  `;

  return;
}

tableBody.innerHTML =
  lowStockProducts.map(product => {

    const currentStock =
      Number(product.stock) || 0;

    const reorderLevel =
      Number(product.reorder_level) || 0;

    const purchasePrice =
      Number(product.purchase_price) || 0;

    const recommendedQty =
      Math.max(
        reorderLevel - currentStock,
        1
      );

    const estimatedCost =
      recommendedQty * purchasePrice;

    const supplier =
      product.suppliers?.name ||
      'No Supplier';

    const leadTime =
      Number(
        product.suppliers?.lead_time_days
      ) || 0;

    const targetDate =
      new Date();

    targetDate.setDate(
      targetDate.getDate() + leadTime
    );

    const targetDelivery =
      targetDate.toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short'
        }
      );

    return `
      <tr>

        <td>
          <div class="font-bold text-dark">
            ${product.name}
          </div>

          <div class="text-muted"
               style="font-size: 0.75rem;">
            Current: ${currentStock}
            • Reorder: ${reorderLevel}
          </div>
        </td>

        <td>
          <strong class="text-primary">
            +${recommendedQty} units
          </strong>
        </td>

        <td>
          ${supplier}
        </td>

        <td>
          <strong>
            ₹${estimatedCost.toLocaleString('en-IN')}
          </strong>
        </td>

        <td>
          ${leadTime} ${leadTime === 1 ? 'Day' : 'Days'}
        </td>

        <td>
          ${targetDelivery}
        </td>

        <td>
          <span class="badge badge-success">
            <span class="badge-dot"></span>
            High
          </span>
        </td>

        <td>
          <button
            class="btn btn-sm btn-primary btn-reorder-action"
            data-product-id="${product.id}"
            data-supplier-id="${product.supplier_id || ''}"
          >
            Approve
          </button>
        </td>

      </tr>
    `;
  }).join('');

console.table(
  products.map(product => ({
    name: product.name,
    stock: product.stock,
    reorder_level: product.reorder_level,
    supplier: product.suppliers?.name
  }))
);
}
async function loadPredictionBusiness() {
  const {
    data: { session },
    error: sessionError
  } = await supabaseClient.auth.getSession();

  if (sessionError || !session?.user) {
    console.error(
      'Prediction session error:',
      sessionError
    );
    return;
  }

  const user = session.user;

  const {
    data: membership,
    error: membershipError
  } = await supabaseClient
    .from('business_members')
    .select(`
      business_id,
      role,
      businesses (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membershipError) {
    console.error(
      'Prediction business loading error:',
      membershipError
    );
    return;
  }

  window.currentBusiness =
    membership.businesses;

  window.currentBusinessRole =
    membership.role;

  window.currentUser =
    user;

  console.log(
    'RetailMind prediction business:',
    window.currentBusiness
  );
}
// Timeframe Tabs (Daily, Weekly, Monthly, Quarterly, Yearly)
function setupPredictionTabs() {
  const tabs = document.querySelectorAll('.prediction-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const period = tab.getAttribute('data-period');
      updatePredictionCards(period);
      showToast(`Loaded ${period} demand predictions.`, 'info', 'fa-brain');
    });
  });
}

function updatePredictionCards(period) {
  const multiplierMap = {
    'Daily': { sales: '420 units', rev: '₹25,200', growth: '+18.4%' },
    'Weekly': { sales: '2,940 units', rev: '₹1,76,400', growth: '+21.2%' },
    'Monthly': { sales: '12,600 units', rev: '₹7,56,000', growth: '+24.8%' },
    'Quarterly': { sales: '38,200 units', rev: '₹22,92,000', growth: '+19.6%' },
    'Yearly': { sales: '1,52,000 units', rev: '₹91,20,000', growth: '+26.5%' }
  };

  const data = multiplierMap[period] || multiplierMap['Daily'];

  const salesEl = document.getElementById('predSalesVal');
  const revEl = document.getElementById('predRevVal');
  const growthEl = document.getElementById('predGrowthVal');

  if (salesEl) salesEl.textContent = data.sales;
  if (revEl) revEl.textContent = data.rev;
  if (growthEl) growthEl.textContent = data.growth;
}

// Interactive "What If" Demand Simulator
function setupSimulatorSlider() {
  const slider = document.getElementById('demandSimulatorSlider');
  const sliderValLabel = document.getElementById('sliderPercentLabel');

  const revEl = document.getElementById('simRevenueVal');
  const profitEl = document.getElementById('simProfitVal');
  const unitsEl = document.getElementById('simInventoryVal');
  const riskEl = document.getElementById('simRiskBadge');

  if (!slider) return;

  slider.addEventListener('input', () => {
    const percent = parseInt(slider.value, 10);
    if (sliderValLabel) sliderValLabel.textContent = `+${percent}%`;

    // Base: Rev = 8.42L, Profit = 2.18L, Units = 1200
    const baseRev = 842650;
    const baseProfit = 218420;
    const baseUnits = 1200;

    const projectedRev = Math.round(baseRev * (1 + (percent / 100)));
    const projectedProfit = Math.round(baseProfit * (1 + (percent * 1.25 / 100)));
    const additionalUnits = Math.round(baseUnits * (percent / 100));

    // Animate or update texts
    if (revEl) revEl.textContent = '₹' + (projectedRev / 100000).toFixed(2) + ' Lakhs';
    if (profitEl) profitEl.textContent = '₹' + (projectedProfit / 100000).toFixed(2) + ' Lakhs';
    if (unitsEl) unitsEl.textContent = `+${additionalUnits} units`;

    if (riskEl) {
      if (percent < 25) {
        riskEl.className = 'badge badge-success';
        riskEl.innerHTML = '<span class="badge-dot"></span> Low Risk (Stock Adequate)';
      } else if (percent < 60) {
        riskEl.className = 'badge badge-warning';
        riskEl.innerHTML = '<span class="badge-dot"></span> Moderate Risk (Restock Advised)';
      } else {
        riskEl.className = 'badge badge-danger';
        riskEl.innerHTML = '<span class="badge-dot"></span> High Stockout Risk (Urgent PO Required)';
      }
    }
  });
}

// Animate Explainable AI factor progress bars
function animateExplainableAiBars() {
  const bars = document.querySelectorAll('.factor-progress-fill');
  bars.forEach(bar => {
    const targetWidth = bar.getAttribute('data-width') || '50%';
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = targetWidth;
    }, 200);
  });
}

// Smart Reorder batch approvals
function setupSmartReorderActions() {
  const approveAllBtn = document.getElementById('btnApproveAllReorder');
  if (!approveAllBtn) return;

  approveAllBtn.addEventListener('click', () => {
    approveAllBtn.disabled = true;
    approveAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing POs...`;

    setTimeout(() => {
      approveAllBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> All 5 POs Approved`;
      approveAllBtn.className = 'btn btn-success';

      const actionButtons = document.querySelectorAll('.btn-reorder-action');
      actionButtons.forEach(btn => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Dispatched';
        btn.className = 'btn btn-sm btn-outline';
        btn.disabled = true;
      });

      showToast('All 5 AI recommended purchase orders generated & sent to suppliers!', 'success', 'fa-truck-arrow-right');
    }, 1200);
  });
}
