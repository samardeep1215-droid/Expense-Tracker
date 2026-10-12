const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const typeInputs = document.querySelectorAll('input[name="type"]');

const balanceEl = document.getElementById("balance");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");

const listEl = document.getElementById("transaction-list");
const emptyStateEl = document.getElementById("empty-state");
const clearAllBtn = document.getElementById("clear-all");

const STORAGE_KEY = "expense-tracker:transactions";

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.warn("Could not persist transactions", error);
  }
}

function formatCurrency(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function clearErrors() {
  ["description", "amount", "category"].forEach((field) => {
    document.getElementById(`${field}-error`).textContent = "";
  });
  [descriptionInput, amountInput, categoryInput].forEach((input) =>
    input.classList.remove("invalid")
  );
}

function setError(field, message) {
  document.getElementById(`${field}-error`).textContent = message;
  document.getElementById(`${field}`).classList.add("invalid");
}

function validate() {
  clearErrors();
  let valid = true;

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (!description) {
    setError("description", "Description is required.");
    valid = false;
  }

  if (amountInput.value.trim() === "") {
    setError("amount", "Amount is required.");
    valid = false;
  } else if (Number.isNaN(amount) || amount <= 0) {
    setError("amount", "Enter an amount greater than 0.");
    valid = false;
  }

  if (!category) {
    setError("category", "Please select a category.");
    valid = false;
  }

  return valid;
}

function getSelectedType() {
  return document.querySelector('input[name="type"]:checked').value;
}

function addTransaction(event) {
  event.preventDefault();
  if (!validate()) return;

  transactions.unshift({
    id: Date.now(),
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    type: getSelectedType(),
  });

  saveTransactions();
  render();
  form.reset();
  clearErrors();
  descriptionInput.focus();
}

function removeTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  render();
}

function clearAll() {
  if (transactions.length === 0) return;
  if (!confirm("Delete all transactions? This cannot be undone.")) return;
  transactions = [];
  saveTransactions();
  render();
}

function updateBalance() {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;

  balanceEl.textContent = formatCurrency(balance);
  balanceEl.style.color =
    balance > 0 ? "var(--income)" : balance < 0 ? "var(--expense)" : "var(--text)";
  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpenseEl.textContent = formatCurrency(totals.expense);
}

function renderList() {
  listEl.innerHTML = "";

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = `transaction transaction--${transaction.type}`;

    li.innerHTML = `
      <div class="transaction__info">
        <div class="transaction__desc"></div>
        <div class="transaction__category"></div>
      </div>
      <span class="transaction__amount"></span>
      <button class="transaction__delete" type="button" aria-label="Delete transaction">&times;</button>
    `;

    li.querySelector(".transaction__desc").textContent = transaction.description;
    li.querySelector(".transaction__category").textContent = transaction.category;
    li.querySelector(".transaction__amount").textContent =
      `${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}`;
    li.querySelector(".transaction__delete").addEventListener("click", () =>
      removeTransaction(transaction.id)
    );

    listEl.appendChild(li);
  });

  emptyStateEl.classList.toggle("hidden", transactions.length > 0);
}

function render() {
  updateBalance();
  renderList();
}

form.addEventListener("submit", addTransaction);
clearAllBtn.addEventListener("click", clearAll);

[
  descriptionInput,
  amountInput,
  categoryInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    document.getElementById(`${input.id}-error`).textContent = "";
  });
});

render();
