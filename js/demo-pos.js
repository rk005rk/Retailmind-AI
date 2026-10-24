
(() => {
  "use strict";

  const GST_RATE = 0.18;

  const products = [
    { id: "P101", name: "Amul Butter 100g", category: "Dairy", price: 58, stock: 42 },
    { id: "P102", name: "Tata Tea Gold 250g", category: "Beverages", price: 145, stock: 27 },
    { id: "P103", name: "Aashirvaad Atta 5kg", category: "Staples", price: 285, stock: 18 },
    { id: "P104", name: "Parle-G Family Pack", category: "Snacks", price: 40, stock: 65 },
    { id: "P105", name: "Fortune Sunflower Oil 1L", category: "Cooking Oil", price: 132, stock: 21 },
    { id: "P106", name: "Maggi Noodles 4-pack", category: "Instant Food", price: 56, stock: 34 }
  ];

  const $ = id => document.getElementById(id);
  let cart = {};
  let currentSale = null;

  function money(value) {
    return "₹" + Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getItems() {
    return products.filter(product => (cart[product.id] || 0) > 0);
  }

  function getSubtotal() {
    return getItems().reduce(
      (sum, product) => sum + product.price * cart[product.id],
      0
    );
  }

  // Render the product catalogue.
  function renderProducts() {
    const list = $("productList");
    list.replaceChildren();

    products.forEach(product => {
      const row = document.createElement("div");
      row.className = "demo-row";

      const details = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = product.name;

      const category = document.createElement("div");
      category.className = "demo-muted";
      category.textContent = `${product.category} · SKU ${product.id}`;

      const stock = document.createElement("div");
      stock.className = "demo-muted";
      stock.textContent = `Mock stock: ${product.stock} units`;

      details.append(name, category, stock);

      const action = document.createElement("div");
      action.style.textAlign = "right";

      const price = document.createElement("strong");
      price.textContent = money(product.price);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "demo-btn";
      button.style.display = "block";
      button.style.marginTop = ".35rem";
      button.innerHTML = '<i class="fa-solid fa-plus"></i> Add';

      button.addEventListener("click", () => {
        if ((cart[product.id] || 0) >= product.stock) {
          alert("The demo stock limit has been reached.");
          return;
        }

        cart[product.id] = (cart[product.id] || 0) + 1;
        renderCart();
      });

      action.append(price, button);
      row.append(details, action);
      list.appendChild(row);
    });
  }

  // Render the cart and calculate totals.
  function renderCart() {
    const cartElement = $("cart");
    cartElement.replaceChildren();

    const items = getItems();

    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "demo-muted";
      empty.textContent = "Your cart is empty. Add a product to begin.";
      cartElement.appendChild(empty);
    }

    items.forEach(product => {
      const row = document.createElement("div");
      row.className = "demo-row";

      const details = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = product.name;

      const price = document.createElement("div");
      price.className = "demo-muted";
      price.textContent = `${money(product.price)} each`;

      details.append(name, price);

      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.style.gap = ".45rem";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "demo-btn secondary";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `Remove one ${product.name}`);

      minus.addEventListener("click", () => {
        cart[product.id]--;

        if (cart[product.id] <= 0) {
          delete cart[product.id];
        }

        renderCart();
      });

      const quantity = document.createElement("strong");
      quantity.textContent = cart[product.id];

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "demo-btn secondary";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `Add one ${product.name}`);

      plus.addEventListener("click", () => {
        if (cart[product.id] >= product.stock) {
          alert("The demo stock limit has been reached.");
          return;
        }

        cart[product.id]++;
        renderCart();
      });

      controls.append(minus, quantity, plus);
      row.append(details, controls);
      cartElement.appendChild(row);
    });

    const subtotal = getSubtotal();
    const tax = Number((subtotal * GST_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    $("subtotal").textContent = money(subtotal);
    $("tax").textContent = money(tax);
    $("total").textContent = money(total);
  }

  // Safely retrieve existing demo sales.
  function getSavedSales() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("rm_demo_sales") || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.warn("Could not read demo sales.", error);
      return [];
    }
  }

  // Build the receipt markup.
  function buildReceipt(sale, items, snapshot) {
    const rows = items.map(product => `
      <tr>
        <td>
          ${escapeHTML(product.name)}
          <div class="receipt-small">SKU ${escapeHTML(product.id)}</div>
        </td>
        <td class="num">${snapshot[product.id]}</td>
        <td class="num">${money(product.price)}</td>
        <td class="num">${money(product.price * snapshot[product.id])}</td>
      </tr>
    `).join("");

    const date = new Date(sale.timestamp);

    return `
      <article class="receipt-paper" id="printableReceipt">
        <header class="receipt-center">
          <div style="font-size:1.3rem;font-weight:900;letter-spacing:.04em">
            RETAILMIND AI
          </div>
          <div style="font-size:.78rem;font-weight:700;margin-top:.2rem">
            DEMO RETAIL STORE
          </div>
          <div class="receipt-small">
            Sample POS transaction · Not a tax invoice
          </div>
        </header>

        <div class="receipt-rule"></div>

        <div class="receipt-line">
          <span>Bill No.</span><strong>${escapeHTML(sale.id)}</strong>
        </div>
        <div class="receipt-line">
          <span>Date</span><span>${escapeHTML(date.toLocaleDateString("en-IN"))}</span>
        </div>
        <div class="receipt-line">
          <span>Time</span><span>${escapeHTML(date.toLocaleTimeString("en-IN"))}</span>
        </div>
        <div class="receipt-line">
          <span>Customer</span><strong>${escapeHTML(sale.customer)}</strong>
        </div>
        <div class="receipt-line">
          <span>Payment</span><span>${escapeHTML(sale.payment)}</span>
        </div>

        <div class="receipt-rule"></div>

        <table class="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th class="num">Qty</th>
              <th class="num">Rate</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="receipt-rule"></div>

        <div class="receipt-line">
          <span>Subtotal</span><span>${money(sale.subtotal)}</span>
        </div>
        <div class="receipt-line">
          <span>GST (18%)</span><span>${money(sale.tax)}</span>
        </div>
        <div class="receipt-line" style="font-size:1rem;font-weight:900;margin-top:.6rem">
          <span>GRAND TOTAL</span><span>${money(sale.total)}</span>
        </div>
        <div class="receipt-line">
          <span>Amount paid</span><strong>${money(sale.total)}</strong>
        </div>

        <div class="receipt-rule"></div>

        <footer class="receipt-center">
          <div style="font-weight:800">Thank you for shopping!</div>
          <div class="receipt-small">Please visit again.</div>
          <div class="receipt-small" style="margin-top:.7rem">
            Simulated demo bill. No payment was processed.
          </div>
        </footer>
      </article>
    `;
  }

  // Clear the cart.
  $("clear").addEventListener("click", () => {
    cart = {};
    renderCart();
  });

  // Complete a simulated sale.
  $("checkout").addEventListener("click", () => {
    const items = getItems();

    if (items.length === 0) {
      alert("Add at least one product before checkout.");
      return;
    }

    const snapshot = { ...cart };
    const subtotal = getSubtotal();
    const tax = Number((subtotal * GST_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const sale = {
      id: "#DEMO-" + String(Date.now()).slice(-6),
      customer: $("customer").value.trim() || "Walk-in customer",
      items: items.reduce(
        (sum, product) => sum + snapshot[product.id],
        0
      ),
      payment: $("payment").value,
      subtotal,
      tax,
      total,
      timestamp: new Date().toISOString()
    };

    const sales = getSavedSales();
    sales.push(sale);

    try {
      sessionStorage.setItem("rm_demo_sales", JSON.stringify(sales));
    } catch (error) {
      console.warn("Demo sale could not be saved in this session.", error);
    }

    currentSale = sale;

    $("receiptContent").innerHTML = buildReceipt(sale, items, snapshot);
    $("receipt").style.display = "block";

    cart = {};
    renderCart();

    $("receipt").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  // Print only the receipt.
  $("printBill").addEventListener("click", () => {
    if (!$("printableReceipt")) {
      alert("Complete a demo sale first.");
      return;
    }

    window.print();
  });

  // Download a standalone HTML receipt.
  $("downloadBill").addEventListener("click", () => {
    const receipt = $("printableReceipt");

    if (!receipt || !currentSale) {
      alert("Complete a demo sale first.");
      return;
    }

    const styles = `
      * { box-sizing: border-box; }
      body {
        font-family: "Courier New", monospace;
        color: #111827;
        margin: 0;
        padding: 16px;
      }
      .receipt-paper {
        max-width: 460px;
        margin: auto;
        padding: 20px;
        border: 1px dashed #999;
      }
      .receipt-center { text-align: center; }
      .receipt-rule {
        border-top: 1px dashed #999;
        margin: 12px 0;
      }
      .receipt-line {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin: 6px 0;
        font-size: 12px;
      }
      .receipt-items {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .receipt-items th, .receipt-items td {
        padding: 5px 2px;
        border-bottom: 1px dashed #ddd;
        text-align: left;
        vertical-align: top;
      }
      .receipt-items .num {
        text-align: right;
        white-space: nowrap;
      }
      .receipt-small {
        font-size: 10px;
        color: #555;
        line-height: 1.5;
      }
      @page { size: 80mm auto; margin: 4mm; }
    `;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RetailMind AI Demo Bill</title>
<style>${styles}</style>
</head>
<body>${receipt.outerHTML}</body>
</html>`;

    const blob = new Blob([html], {
      type: "text/html;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      currentSale.id.replace(/[^a-zA-Z0-9-_]/g, "") + ".html";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  });

  // Start the page.
  renderProducts();
  renderCart();

})();
