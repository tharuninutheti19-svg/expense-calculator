(function () {
  "use strict";

  var EXPENSES = [
    { id: "rent", label: "Rent", color: "#17283b" },
    { id: "food", label: "Food", color: "#0b6e6e" },
    { id: "transport", label: "Transportation", color: "#3d8bbd" },
    { id: "utilities", label: "Utilities", color: "#8a7fb8" },
    { id: "shopping", label: "Shopping", color: "#c9703a" },
    { id: "entertainment", label: "Entertainment", color: "#d4a62a" },
    { id: "other", label: "Other", color: "#7d8b97" }
  ];

  var MAX_VALUE = 1e12;

  var incomeEl = document.getElementById("income");
  var currencyEl = document.getElementById("currency");
  var resetBtn = document.getElementById("reset");
  var heroEl = document.getElementById("hero");
  var pctEl = document.getElementById("savings-pct");
  var noteEl = document.getElementById("status-note");
  var barEl = document.getElementById("bar");
  var legendEl = document.getElementById("legend");
  var outIncome = document.getElementById("out-income");
  var outExpenses = document.getElementById("out-expenses");
  var outBalance = document.getElementById("out-balance");

  var fieldIds = ["income"].concat(EXPENSES.map(function (e) { return e.id; }));

  function formatMoney(value) {
    var code = currencyEl.value;
    var locale = code === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Returns { value, error }. Empty input counts as 0.
  function parseField(raw) {
    var text = raw.trim().replace(/,/g, "");
    if (text === "") return { value: 0, error: "" };
    if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(text)) {
      return { value: 0, error: "Enter a number, like 1500 or 1500.50." };
    }
    var num = parseFloat(text);
    if (num < 0) return { value: 0, error: "Value can't be negative." };
    if (num > MAX_VALUE) return { value: 0, error: "Value is too large." };
    return { value: num, error: "" };
  }

  function setError(id, message) {
    var input = document.getElementById(id);
    var errEl = document.getElementById(id + "-error");
    errEl.textContent = message;
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function update() {
    var values = {};
    var hasError = false;

    fieldIds.forEach(function (id) {
      var result = parseField(document.getElementById(id).value);
      values[id] = result.value;
      setError(id, result.error);
      if (result.error) hasError = true;
    });

    var income = values.income;
    var total = 0;
    EXPENSES.forEach(function (e) { total += values[e.id]; });
    var balance = income - total;

    outIncome.textContent = formatMoney(income);
    outExpenses.textContent = formatMoney(total);
    outBalance.textContent = formatMoney(balance);
    outBalance.classList.toggle("negative", balance < 0);

    // Savings percentage
    var pct = income > 0 ? (balance / income) * 100 : 0;
    pctEl.textContent = (Math.round(pct * 10) / 10).toString() + "%";

    heroEl.classList.remove("is-low", "is-deficit");
    if (hasError) {
      noteEl.textContent = "Fix the highlighted fields to see accurate results.";
    } else if (income <= 0) {
      noteEl.textContent = total > 0
        ? "Enter your monthly income to see your savings rate."
        : "Enter your income to get started.";
    } else if (balance < 0) {
      heroEl.classList.add("is-deficit");
      noteEl.textContent = "You're spending " + formatMoney(-balance) + " more than you earn.";
    } else if (pct < 20) {
      heroEl.classList.add("is-low");
      noteEl.textContent = "Below 20%. A common target is to save at least a fifth of income.";
    } else {
      noteEl.textContent = "You're saving at least 20% of your income.";
    }

    renderBreakdown(values, income, total, balance);
  }

  function renderBreakdown(values, income, total, balance) {
    barEl.innerHTML = "";
    legendEl.innerHTML = "";

    // Base the bar on income, or on total spending if income is missing or exceeded
    var base = Math.max(income, total);
    if (base <= 0) return;

    EXPENSES.forEach(function (e) {
      var amount = values[e.id];
      if (amount <= 0) return;

      var seg = document.createElement("span");
      seg.style.width = (amount / base) * 100 + "%";
      seg.style.background = e.color;
      seg.title = e.label + ": " + formatMoney(amount);
      barEl.appendChild(seg);

      var li = document.createElement("li");
      var swatch = document.createElement("i");
      swatch.style.background = e.color;
      li.appendChild(swatch);
      var share = Math.round((amount / base) * 100);
      li.appendChild(document.createTextNode(e.label + " " + share + "%"));
      legendEl.appendChild(li);
    });

    barEl.setAttribute(
      "aria-label",
      "Expenses use " + Math.round((total / base) * 100) + "% of income"
    );
  }

  fieldIds.forEach(function (id) {
    document.getElementById(id).addEventListener("input", update);
  });
  currencyEl.addEventListener("change", update);

  document.getElementById("calc-form").addEventListener("submit", function (e) {
    e.preventDefault();
  });

  resetBtn.addEventListener("click", function () {
    fieldIds.forEach(function (id) {
      document.getElementById(id).value = "";
    });
    update();
    incomeEl.focus();
  });

  update();
})();
