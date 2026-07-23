const sampleData = {
  company: "Northwind Labs",
  period: "Q2 2026",
  accounts: [
    { name: "Revenue", value: 1250000, group: "income" },
    { name: "Cost of Goods Sold", value: 450000, group: "expense" },
    { name: "Operating Expenses", value: 280000, group: "expense" },
    { name: "Net Income", value: 520000, group: "income" },
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
  reportOutput: document.getElementById("reportOutput")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (!rows.length) return [];

  const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());

  return rows.slice(1).map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const account = {};

    headers.forEach((header, index) => {
      account[header] = values[index] || "";
    });

    return account;
  });
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

function getAccountValues(accounts, groups) {
  return accounts
    .filter((account) => groups.includes(account.group))
    .reduce((sum, account) => sum + Number(account.value || 0), 0);
}

function getIncomeMetrics(accounts) {
  // Derive a small set of financial KPIs from the uploaded account list.
  const income = getAccountValues(accounts, ["income"]);
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
  // Render the overview cards shown above the report output.
  const summary = ui.dataSummary;
  const accounts = data.accounts || [];
  const income = getAccountValues(accounts, ["income"]);
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
  // Build the main report card with KPIs and generated insights.
  const output = ui.reportOutput;
  const accounts = data.accounts || [];
  const income = getAccountValues(accounts, ["income"]);
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
  // Load the bundled sample data on first render.
  try {
    const response = await fetch("./data/sample-data.json");
    if (!response.ok) throw new Error("Sample data not found");
    const data = await response.json();
    const parsedData = normalizeData(data);
    appState.data = parsedData || sampleData;
    renderSummary(appState.data);
    renderReport(appState.data, ui.reportTypeSelect.value);
    setStatus("Sample dataset loaded successfully.");
  } catch (error) {
    appState.data = sampleData;
    renderSummary(appState.data);
    renderReport(appState.data, ui.reportTypeSelect.value);
    setStatus("Loaded a bundled sample dataset because no server data was available.");
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

ui.fileInput.addEventListener("change", handleFileUpload);
ui.generateButton.addEventListener("click", generateCurrentReport);
ui.sampleButton.addEventListener("click", () => {
  appState.data = sampleData;
  renderSummary(appState.data);
  renderReport(appState.data, ui.reportTypeSelect.value);
  setStatus("Loaded the sample financial dataset.");
});
ui.reportTypeSelect.addEventListener("change", generateCurrentReport);

window.addEventListener("DOMContentLoaded", loadInitialData);
