const sampleData = {
  company: "Northwind Labs",
  period: "Q2 2026",
  accounts: [
    { name: "Revenue", value: 1250000, group: "income" },
    { name: "Cost of Goods Sold", value: 450000, group: "expense" },
    { name: "Operating Expenses", value: 280000, group: "expense" },
    { name: "Net Income", value: 520000, group: "net_income" },
    { name: "Cash", value: 320000, group: "asset" },
    { name: "Accounts Receivable", value: 180000, group: "asset" },
    { name: "Accounts Payable", value: 95000, group: "liability" },
    { name: "Equity", value: 405000, group: "equity" },
    { name: "Operating Cash Flow", value: 620000, group: "cash_inflow" },
    { name: "Investing Cash Flow", value: -150000, group: "cash_outflow" },
    { name: "Financing Cash Flow", value: -50000, group: "cash_outflow" }
  ]
};

const appState = {
  data: sampleData
};

const ui = {
  fileInput: document.getElementById("uploadData"),
  reportTypeSelect: document.getElementById("reportType"),
  generateButton: document.getElementById("generateReport"),
  sampleButton: document.getElementById("loadSample"),
  statusMessage: document.getElementById("statusMessage"),
  dataSummary: document.getElementById("dataSummary"),
  reportOutput: document.getElementById("reportOutput"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  chatMessages: document.getElementById("chatMessages"),
  suggestionButtons: document.querySelectorAll(".suggestion-btn")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeData(rawData) {
  // Convert common JSON, array, or CSV-style data into a consistent internal structure.
  if (!rawData) {
    return null;
  }

  if (Array.isArray(rawData)) {
    return {
      company: "Uploaded Company",
      period: "Custom Period",
      accounts: rawData.map((item) => ({
        name: item.name || item.account || "Unnamed",
        value: Number(item.value || item.amount || 0),
        group: item.group || item.category || item.type || "misc"
      }))
    };
  }

  if (typeof rawData === "string") {
    const trimmed = rawData.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeData(parsed);
      } catch (error) {
        // fall through to CSV handling
      }
    }
  }

  if (rawData && typeof rawData === "object") {
    if (rawData.accounts && Array.isArray(rawData.accounts)) {
      return {
        company: rawData.company || "Uploaded Company",
        period: rawData.period || "Custom Period",
        accounts: rawData.accounts.map((item) => ({
          name: item.name || item.account || "Unnamed",
          value: Number(item.value || item.amount || 0),
          group: item.group || item.category || item.type || "misc"
        }))
      };
    }

    if (rawData.rows && Array.isArray(rawData.rows)) {
      return {
        company: rawData.company || "Uploaded Company",
        period: rawData.period || "Custom Period",
        accounts: rawData.rows.map((item) => ({
          name: item.name || item.account || "Unnamed",
          value: Number(item.value || item.amount || 0),
          group: item.group || item.category || item.type || "misc"
        }))
      };
    }
  }

  const csvRows = parseCsv(typeof rawData === "string" ? rawData : "");
  if (csvRows.length) {
    if (csvRows[0].product_id && csvRows[0].discounted_price) {
      return {
        type: "amazon_catalog",
        company: "Amazon Product Catalog",
        period: `${csvRows.length.toLocaleString()} products`,
        products: csvRows
      };
    }
    return {
      company: "Uploaded Company",
      period: "Custom Period",
      accounts: csvRows.map((item) => ({
        name: item.name || item.account || "Unnamed",
        value: Number(item.value || item.amount || 0),
        group: item.group || item.category || item.type || "misc"
      }))
    };
  }

  return null;
}

function parsePrice(value) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function parsePercent(value) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function getCatalogMetrics(products) {
  const validRatings = products.map((product) => Number(product.rating)).filter((rating) => Number.isFinite(rating));
  const categories = products.reduce((counts, product) => {
    const category = (product.category || "Uncategorized").split("|")[0];
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ["Uncategorized", 0];
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    productCount: products.length,
    averagePrice: average(products.map((product) => parsePrice(product.discounted_price)).filter(Boolean)),
    averageDiscount: average(products.map((product) => parsePercent(product.discount_percentage)).filter(Boolean)),
    averageRating: average(validRatings),
    ratingCount: products.reduce((sum, product) => sum + parsePrice(product.rating_count), 0),
    categoryCount: Object.keys(categories).length,
    topCategory,
    categories
  };
}

function formatRupees(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function renderCatalogSummary(data) {
  const metrics = getCatalogMetrics(data.products);
  ui.dataSummary.innerHTML = `
    <h3>${data.company}</h3>
    <p><strong>Dataset:</strong> ${data.period} · 16 source columns</p>
    <div class="metric-grid">
      <div class="metric-card"><span>Products</span><strong>${metrics.productCount.toLocaleString()}</strong></div>
      <div class="metric-card"><span>Average price</span><strong>${formatRupees(metrics.averagePrice)}</strong></div>
      <div class="metric-card"><span>Average rating</span><strong>${metrics.averageRating.toFixed(1)} / 5</strong></div>
      <div class="metric-card"><span>Average discount</span><strong>${metrics.averageDiscount.toFixed(0)}%</strong></div>
    </div>
    <p style="margin-top: 12px; color: var(--muted);">Top category: ${metrics.topCategory[0]} (${metrics.topCategory[1].toLocaleString()} products)</p>`;
}

function renderCatalogReport(data, reportType) {
  const metrics = getCatalogMetrics(data.products);
  const categoryRows = Object.entries(metrics.categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topRated = [...data.products].filter((product) => Number(product.rating) >= 4.5).slice(0, 3);
  let title = "Catalog Overview";
  let subtitle = "Product and pricing snapshot";
  let detailItems = [
    { label: "Average discounted price", value: formatRupees(metrics.averagePrice) },
    { label: "Customer ratings recorded", value: metrics.ratingCount.toLocaleString("en-IN") }
  ];
  let insights = [
    `${metrics.productCount.toLocaleString()} products are represented across ${metrics.categoryCount} top-level categories.`,
    `Average customer rating is ${metrics.averageRating.toFixed(1)} out of 5.`,
    `Products have an average listed discount of ${metrics.averageDiscount.toFixed(0)}%.`
  ];
  if (reportType === "balance") {
    title = "Category Analysis";
    subtitle = "Catalog concentration";
    detailItems = categoryRows.slice(0, 2).map(([category, count]) => ({ label: category, value: `${count.toLocaleString()} products` }));
    insights = categoryRows.map(([category, count]) => `${category} contains ${count.toLocaleString()} products (${((count / metrics.productCount) * 100).toFixed(1)}% of the catalog).`);
  } else if (reportType === "cashflow") {
    title = "Customer Sentiment";
    subtitle = "Ratings and review signals";
    detailItems = [
      { label: "Average rating", value: `${metrics.averageRating.toFixed(1)} / 5` },
      { label: "Ratings captured", value: metrics.ratingCount.toLocaleString("en-IN") }
    ];
    insights = topRated.length ? topRated.map((product) => `Highly rated (${product.rating}/5): ${product.product_name.slice(0, 90)}${product.product_name.length > 90 ? "…" : ""}`) : insights;
  }
  ui.reportOutput.innerHTML = `
    <div class="report-card">
      <div class="report-card-header"><div><h3>${title}</h3><p>${data.company} • ${data.period}</p></div><span class="report-tag">${subtitle}</span></div>
      <div class="report-kpi-grid">
        <div class="kpi-card"><span>Products</span><strong>${metrics.productCount.toLocaleString()}</strong></div>
        <div class="kpi-card"><span>Average price</span><strong>${formatRupees(metrics.averagePrice)}</strong></div>
        <div class="kpi-card"><span>Average rating</span><strong>${metrics.averageRating.toFixed(1)} / 5</strong></div>
        <div class="kpi-card"><span>Average discount</span><strong>${metrics.averageDiscount.toFixed(0)}%</strong></div>
        <div class="kpi-card highlight-card"><span>Top category</span><strong>${metrics.topCategory[0]}</strong></div>
      </div>
      <div class="detail-list">${detailItems.map((item) => `<div class="detail-item"><span>${item.label}</span><strong>${item.value}</strong></div>`).join("")}</div>
      <div class="insights-panel"><div class="insights-title">Insights</div><ul class="insight-list">${insights.map((insight) => `<li>${insight}</li>`).join("")}</ul></div>
    </div>`;
}

function getAccountValues(accounts, groups) {
  return accounts
    .filter((account) => groups.includes(account.group))
    .reduce((sum, account) => sum + Number(account.value || 0), 0);
}

function getRevenueValue(accounts) {
  return accounts
    .filter((account) => account.group === "income" && !/net\s*(income|profit)|profit/i.test(account.name))
    .reduce((sum, account) => sum + Number(account.value || 0), 0);
}

function getIncomeMetrics(accounts) {
  // Derive a small set of financial KPIs from the uploaded account list.
  const income = getRevenueValue(accounts);
  const expenses = getAccountValues(accounts, ["expense"]);
  const netIncome = income - expenses;
  const margin = income > 0 ? (netIncome / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

  return {
    income,
    expenses,
    netIncome,
    margin,
    expenseRatio,
    transactionCount: accounts.length
  };
}

function buildInsights(metrics, reportType, assets, liabilities, equity) {
  // Generate short, readable insights from the computed metrics.
  const insights = [];

  if (metrics.income > 0 && metrics.expenses > 0) {
    const variance = ((metrics.income - metrics.expenses) / Math.max(metrics.expenses, 1)) * 100;
    const direction = metrics.income >= metrics.expenses ? "exceeds" : "falls short of";
    insights.push(`Revenue ${direction} expenses by ${Math.abs(variance).toFixed(1)}%.`);
    insights.push(`Expenses represent ${metrics.expenseRatio.toFixed(1)}% of revenue.`);
  }

  if (metrics.margin >= 15) {
    insights.push(`Profit margin is satisfactory at ${metrics.margin.toFixed(1)}%.`);
  } else if (metrics.margin > 0) {
    insights.push(`Profit margin is moderate at ${metrics.margin.toFixed(1)}%.`);
  } else {
    insights.push("Profit margin is flat and should be monitored.");
  }

  if (reportType === "balance") {
    insights.push(`Assets exceed liabilities by ${formatCurrency(Math.max(assets - liabilities, 0))}.`);
  } else if (reportType === "cashflow") {
    insights.push(`Equity stands at ${formatCurrency(equity)} for this period.`);
  }

  insights.push(`The report includes ${metrics.transactionCount} financial accounts.`);
  return insights.slice(0, 5);
}

function renderSummary(data) {
  if (data.type === "amazon_catalog") {
    renderCatalogSummary(data);
    return;
  }
  // Render the overview cards shown above the report output.
  const summary = ui.dataSummary;
  const accounts = data.accounts || [];
  const income = getRevenueValue(accounts);
  const expenses = getAccountValues(accounts, ["expense"]);
  const assets = getAccountValues(accounts, ["asset"]);
  const liabilities = getAccountValues(accounts, ["liability"]);
  const equity = getAccountValues(accounts, ["equity"]);
  const netIncome = income - expenses;

  summary.innerHTML = `
    <h3>${data.company}</h3>
    <p><strong>Period:</strong> ${data.period}</p>
    <div class="metric-grid">
      <div class="metric-card">
        <span>Revenue</span>
        <strong>${formatCurrency(income)}</strong>
      </div>
      <div class="metric-card">
        <span>Net Income</span>
        <strong>${formatCurrency(netIncome)}</strong>
      </div>
      <div class="metric-card">
        <span>Assets</span>
        <strong>${formatCurrency(assets)}</strong>
      </div>
      <div class="metric-card">
        <span>Equity</span>
        <strong>${formatCurrency(equity)}</strong>
      </div>
    </div>
    <p style="margin-top: 12px; color: var(--muted);">${accounts.length} accounts loaded</p>
  `;
}

function renderReport(data, reportType) {
  if (data.type === "amazon_catalog") {
    renderCatalogReport(data, reportType);
    return;
  }
  // Build the main report card with KPIs and generated insights.
  const output = ui.reportOutput;
  const accounts = data.accounts || [];
  const income = getRevenueValue(accounts);
  const expenses = getAccountValues(accounts, ["expense"]);
  const grossProfit = income - expenses;
  const assets = getAccountValues(accounts, ["asset"]);
  const liabilities = getAccountValues(accounts, ["liability"]);
  const equity = getAccountValues(accounts, ["equity"]);
  const cashInflow = getAccountValues(accounts, ["cash_inflow"]);
  const cashOutflow = getAccountValues(accounts, ["cash_outflow"]);
  const netCash = cashInflow + cashOutflow;
  const metrics = getIncomeMetrics(accounts);
  const insights = buildInsights(metrics, reportType, assets, liabilities, equity);

  let title = "Financial report";
  let subtitle = "Executive summary";
  let detailItems = [];

  if (reportType === "income") {
    title = "Income Statement";
    subtitle = "Performance snapshot";
    detailItems = [
      { label: "Gross profit", value: formatCurrency(grossProfit) },
      { label: "Operating margin", value: `${((grossProfit / Math.max(income, 1)) * 100).toFixed(1)}%` }
    ];
  } else if (reportType === "balance") {
    title = "Balance Sheet";
    subtitle = "Position snapshot";
    detailItems = [
      { label: "Total assets", value: formatCurrency(assets) },
      { label: "Net position", value: formatCurrency(assets - liabilities - equity) }
    ];
  } else {
    title = "Cash Flow Summary";
    subtitle = "Liquidity snapshot";
    detailItems = [
      { label: "Cash inflows", value: formatCurrency(cashInflow) },
      { label: "Net cash movement", value: formatCurrency(netCash) }
    ];
  }

  output.innerHTML = `
    <div class="report-card">
      <div class="report-card-header">
        <div>
          <h3>${title}</h3>
          <p>${data.company} • ${data.period}</p>
        </div>
        <span class="report-tag">${subtitle}</span>
      </div>

      <div class="report-kpi-grid">
        <div class="kpi-card">
          <span>Total revenue</span>
          <strong>${formatCurrency(metrics.income)}</strong>
        </div>
        <div class="kpi-card">
          <span>Total expenses</span>
          <strong>${formatCurrency(metrics.expenses)}</strong>
        </div>
        <div class="kpi-card">
          <span>Net profit</span>
          <strong>${formatCurrency(metrics.netIncome)}</strong>
        </div>
        <div class="kpi-card">
          <span>Profit margin</span>
          <strong>${metrics.margin.toFixed(1)}%</strong>
        </div>
        <div class="kpi-card highlight-card">
          <span>Transactions</span>
          <strong>${metrics.transactionCount}</strong>
        </div>
      </div>

      <div class="detail-list">
        ${detailItems
          .map(
            (item) => `
              <div class="detail-item">
                <span>${item.label}</span>
                <strong>${item.value}</strong>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="insights-panel">
        <div class="insights-title">Insights</div>
        <ul class="insight-list">
          ${insights.map((insight) => `<li>${insight}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function setStatus(message, isSuccess = true) {
  // Update the application's feedback area for success or error states.
  const status = ui.statusMessage;
  status.textContent = message;
  status.className = `status-message ${isSuccess ? "success" : "error"}`;
}

async function loadInitialData() {
  // Load the bundled Amazon catalog on first render.
  try {
    const response = await fetch("./data/amazon.csv");
    if (!response.ok) throw new Error("Amazon dataset not found");
    const data = await response.text();
    const parsedData = normalizeData(data);
    appState.data = parsedData || sampleData;
    renderSummary(appState.data);
    renderReport(appState.data, ui.reportTypeSelect.value);
    setStatus("Amazon product dataset loaded successfully.");
  } catch (error) {
    appState.data = sampleData;
    renderSummary(appState.data);
    renderReport(appState.data, ui.reportTypeSelect.value);
    setStatus("Loaded a bundled sample dataset because the Amazon dataset was unavailable.");
  }
}

function handleFileUpload(event) {
  // Parse and render the uploaded file if it contains valid data.
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const parsedData = normalizeData(content);

      if (!parsedData || !parsedData.accounts || !parsedData.accounts.length) {
        throw new Error("No valid accounts found");
      }

      appState.data = parsedData;
      renderSummary(appState.data);
      renderReport(appState.data, ui.reportTypeSelect.value);
      setStatus(`Loaded ${file.name} successfully.`);
    } catch (error) {
      setStatus(`Could not parse ${file.name}. Use JSON or CSV with name, value, and group columns.`, false);
    }
  };
  reader.readAsText(file);
}

function generateCurrentReport() {
  // Re-render the report when the selected report type changes.
  const reportType = ui.reportTypeSelect.value;
  renderSummary(appState.data);
  renderReport(appState.data, reportType);
  setStatus(`Generated ${ui.reportTypeSelect.options[ui.reportTypeSelect.selectedIndex].text}.`);
}

function appendChatMessage(message, role = "assistant") {
  const messageElement = document.createElement("div");
  const textElement = document.createElement("p");
  messageElement.className = `chat-message ${role}-message`;
  textElement.textContent = message;
  messageElement.appendChild(textElement);
  ui.chatMessages.appendChild(messageElement);
  ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;
}

function getChatResponse(question) {
  if (appState.data.type === "amazon_catalog") {
    const metrics = getCatalogMetrics(appState.data.products);
    const normalizedQuestion = question.toLowerCase();
    if (/rating|review|note|avis/.test(normalizedQuestion)) {
      return `The catalog averages ${metrics.averageRating.toFixed(1)} out of 5, based on ${metrics.ratingCount.toLocaleString("en-IN")} recorded customer ratings.`;
    }
    if (/category|categorie|catégorie|product|produit/.test(normalizedQuestion)) {
      return `${metrics.topCategory[0]} is the largest top-level category, with ${metrics.topCategory[1].toLocaleString()} of ${metrics.productCount.toLocaleString()} products.`;
    }
    if (/price|prix|discount|reduction|réduction/.test(normalizedQuestion)) {
      return `The average discounted price is ${formatRupees(metrics.averagePrice)} and the average listed discount is ${metrics.averageDiscount.toFixed(0)}%.`;
    }
    if (/watch|risk|attention|surveill/.test(normalizedQuestion)) {
      return `Watch catalog concentration in ${metrics.topCategory[0]}, which represents ${((metrics.topCategory[1] / metrics.productCount) * 100).toFixed(1)}% of listed products, and validate low-rated products before promotion.`;
    }
    return `I can help analyze ${metrics.productCount.toLocaleString()} Amazon products: average price (${formatRupees(metrics.averagePrice)}), average rating (${metrics.averageRating.toFixed(1)}/5), discounts, and categories.`;
  }
  const accounts = appState.data.accounts || [];
  const revenue = getRevenueValue(accounts);
  const expenses = getAccountValues(accounts, ["expense"]);
  const profit = revenue - expenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const cash = accounts
    .filter((account) => account.group === "asset" && /cash/i.test(account.name))
    .reduce((sum, account) => sum + Number(account.value || 0), 0);
  const assets = getAccountValues(accounts, ["asset"]);
  const liabilities = getAccountValues(accounts, ["liability"]);
  const normalizedQuestion = question.toLowerCase();

  if (/cash|liquid|trésorerie|tresorerie/.test(normalizedQuestion)) {
    return `Cash on hand is ${formatCurrency(cash)}. Total assets are ${formatCurrency(assets)} and liabilities are ${formatCurrency(liabilities)}.`;
  }

  if (/profit|margin|profitable|profitab|rentab|bénéfice|benefice/.test(normalizedQuestion)) {
    return `Revenue is ${formatCurrency(revenue)} and expenses are ${formatCurrency(expenses)}, leaving ${formatCurrency(profit)} in calculated net profit. That is a ${margin.toFixed(1)}% profit margin.`;
  }

  if (/watch|risk|attention|surveill/.test(normalizedQuestion)) {
    if (profit <= 0) return "Expenses currently exceed revenue. The priority is to understand the largest expense accounts and protect cash.";
    if (liabilities > assets) return "The business is profitable, but liabilities exceed assets. Review upcoming obligations and near-term cash coverage.";
    return `Profitability is positive at ${margin.toFixed(1)}%. Keep an eye on expenses, which are ${revenue ? ((expenses / revenue) * 100).toFixed(1) : 0}% of revenue, and maintain the ${formatCurrency(cash)} cash balance.`;
  }

  if (/revenue|sales|income|revenu|chiffre/.test(normalizedQuestion)) {
    return `Reported revenue for ${appState.data.period} is ${formatCurrency(revenue)} across ${accounts.length} loaded accounts.`;
  }

  return `For ${appState.data.company}, I can help explain revenue (${formatCurrency(revenue)}), expenses (${formatCurrency(expenses)}), profit margin (${margin.toFixed(1)}%), cash, and balance-sheet position. Try asking about profitability, cash, or risks to watch.`;
}

function submitChatQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  appendChatMessage(cleanQuestion, "user");
  appendChatMessage(getChatResponse(cleanQuestion));
  ui.chatInput.value = "";
  ui.chatInput.focus();
}

function initializeChat() {
  appendChatMessage("Hi — I’m your local catalog assistant. Ask me about product prices, ratings, discounts, or categories.");
}

ui.fileInput.addEventListener("change", handleFileUpload);
ui.generateButton.addEventListener("click", generateCurrentReport);
ui.sampleButton.addEventListener("click", loadInitialData);
ui.reportTypeSelect.addEventListener("change", generateCurrentReport);
ui.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitChatQuestion(ui.chatInput.value);
});
ui.suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => submitChatQuestion(button.dataset.question || ""));
});

window.addEventListener("DOMContentLoaded", () => {
  loadInitialData();
  initializeChat();
});
