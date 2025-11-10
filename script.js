// 🌸 Kannan Flower Shoop Vendor Tracker
// Offline LocalStorage-based management with Installments support

// ---------- Load Data ----------
let vendors = JSON.parse(localStorage.getItem("vendors")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// ---------- Add Vendor ----------
const vendorForm = document.getElementById("vendorForm");
if (vendorForm) {
  vendorForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("vendorName").value.trim();
    const contact = document.getElementById("vendorContact").value.trim();
    const address = document.getElementById("vendorAddress").value.trim();

    if (!name || !contact || !address) {
      alert("Please fill all vendor details!");
      return;
    }

    vendors.push({ name, contact, address });
    localStorage.setItem("vendors", JSON.stringify(vendors));

    e.target.reset();
    alert("✅ Vendor added successfully!");
  });
}

// ---------- Load Vendors in Dropdown ----------
const vendorSelect = document.getElementById("vendorSelect");
if (vendorSelect) {
  vendorSelect.innerHTML = vendors
    .map(v => `<option value="${v.name}">${v.name}</option>`)
    .join("");
}

// ---------- Add Transaction ----------
const transactionForm = document.getElementById("transactionForm");
if (transactionForm) {
  transactionForm.addEventListener("submit", e => {
    e.preventDefault();
    const vendor = document.getElementById("vendorSelect").value;
    const date = document.getElementById("date").value;
    const item = document.getElementById("item").value.trim();
    const quantity = document.getElementById("quantity").value;
    const amount = document.getElementById("amount").value;
    const paymentStatus = document.getElementById("paymentStatus").value;

    if (!vendor || !date || !item || !quantity || !amount) {
      alert("Please fill all transaction fields!");
      return;
    }

    transactions.push({
      vendor,
      date,
      item,
      quantity: Number(quantity),
      amount: Number(amount),
      paymentStatus,
      installments: []
    });

    localStorage.setItem("transactions", JSON.stringify(transactions));
    e.target.reset();
    alert("💰 Transaction added successfully!");
  });
}

// ---------- Render Transactions ----------
const transactionTable = document.getElementById("transactionTable");
if (transactionTable) renderTable();

function renderTable() {
  if (!transactionTable) return;

  transactionTable.innerHTML = transactions
    .map((t, i) => {
      const paid = (t.installments || []).reduce(
        (sum, p) => sum + Number(p.paid),
        0
      );
      const balance = t.amount - paid;
      const status = balance <= 0 ? "Paid" : "Pending";
      t.paymentStatus = status;

      // Update localStorage every render
      localStorage.setItem("transactions", JSON.stringify(transactions));

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${t.vendor}</td>
          <td>${t.date}</td>
          <td>${t.item}</td>
          <td>${t.quantity}</td>
          <td>₹${t.amount}</td>
          <td>₹${paid}</td>
          <td>₹${balance}</td>
          <td>
            <span class="badge ${status === "Paid" ? "bg-success" : "bg-warning text-dark"}">
              ${status}
            </span>
          </td>
          <td>
            <button class="btn btn-success btn-sm" onclick="openInstall(${i})">Pay</button>
            <button class="btn btn-warning btn-sm" onclick="openEdit(${i})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${i})">Delete</button>
            <button class="btn btn-info btn-sm" onclick="viewInstallments(${i})">History</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ---------- Delete Transaction ----------
function deleteTransaction(i) {
  if (confirm("🗑️ Delete this transaction?")) {
    transactions.splice(i, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    renderTable();
  }
}

// ---------- Edit Transaction ----------
function openEdit(i) {
  const t = transactions[i];
  document.getElementById("editIndex").value = i;
  document.getElementById("editVendor").value = t.vendor;
  document.getElementById("editDate").value = t.date;
  document.getElementById("editItem").value = t.item;
  document.getElementById("editQuantity").value = t.quantity;
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editStatus").value = t.paymentStatus;

  new bootstrap.Modal(document.getElementById("editModal")).show();
}

document.getElementById("saveEditBtn")?.addEventListener("click", () => {
  const i = document.getElementById("editIndex").value;
  transactions[i].date = document.getElementById("editDate").value;
  transactions[i].item = document.getElementById("editItem").value;
  transactions[i].quantity = Number(document.getElementById("editQuantity").value);
  transactions[i].amount = Number(document.getElementById("editAmount").value);
  transactions[i].paymentStatus = document.getElementById("editStatus").value;

  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTable();
  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
});

// ---------- Add Installment ----------
function openInstall(i) {
  document.getElementById("installIndex").value = i;
  document.getElementById("installAmount").value = "";
  document.getElementById("installDate").value = new Date()
    .toISOString()
    .split("T")[0];
  new bootstrap.Modal(document.getElementById("installmentModal")).show();
}

document.getElementById("saveInstallBtn")?.addEventListener("click", () => {
  const i = document.getElementById("installIndex").value;
  const paid = Number(document.getElementById("installAmount").value);
  const date = document.getElementById("installDate").value;

  if (!paid || paid <= 0) {
    alert("Enter a valid installment amount!");
    return;
  }

  if (!transactions[i].installments) transactions[i].installments = [];
  transactions[i].installments.push({ date, paid });

  const totalPaid = transactions[i].installments.reduce(
    (sum, p) => sum + Number(p.paid),
    0
  );
  if (totalPaid >= transactions[i].amount) {
    transactions[i].paymentStatus = "Paid";
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTable();
  bootstrap.Modal.getInstance(document.getElementById("installmentModal")).hide();
});

// ---------- View Installment History ----------
function viewInstallments(i) {
  const t = transactions[i];
  const list = t.installments || [];
  if (list.length === 0) {
    alert("No installments yet for this transaction!");
    return;
  }

  let history = `Installment History for ${t.vendor}:\n\n`;
  list.forEach((inst, idx) => {
    history += `${idx + 1}. Date: ${inst.date}, Paid: ₹${inst.paid}\n`;
  });
  const total = list.reduce((s, p) => s + Number(p.paid), 0);
  history += `\nTotal Paid: ₹${total}\nBalance: ₹${t.amount - total}`;
  alert(history);
}

// ---------- Export to CSV ----------
document.getElementById("exportBtn")?.addEventListener("click", () => {
  if (transactions.length === 0) {
    alert("No records to export!");
    return;
  }

  const csv = [
    ["Vendor", "Date", "Item", "Quantity", "Amount", "Paid", "Balance", "Status"],
    ...transactions.map(t => {
      const paid = (t.installments || []).reduce((s, p) => s + Number(p.paid), 0);
      const balance = t.amount - paid;
      return [
        t.vendor,
        t.date,
        t.item,
        t.quantity,
        t.amount,
        paid,
        balance,
        t.paymentStatus
      ];
    })
  ]
    .map(row => row.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kannan_flower_shoop_transactions.csv";
  link.click();
});
// ---------- Load Vendor Table ----------
function renderVendors() {
  const vendorTable = document.getElementById("vendorTable");
  if (!vendorTable) return;

  const vendors = JSON.parse(localStorage.getItem("vendors")) || [];
  vendorTable.innerHTML = vendors
    .map(
      (v, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${v.name}</td>
        <td>${v.contact}</td>
        <td>${v.address}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="openEditVendor(${i})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteVendor(${i})">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

// ---------- Add Vendor ----------
if (document.getElementById("vendorForm")) {
  document.getElementById("vendorForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("vendorName").value.trim();
    const contact = document.getElementById("vendorContact").value.trim();
    const address = document.getElementById("vendorAddress").value.trim();

    if (!name || !contact || !address) {
      alert("Please fill all fields!");
      return;
    }

    const vendors = JSON.parse(localStorage.getItem("vendors")) || [];
    vendors.push({ name, contact, address });
    localStorage.setItem("vendors", JSON.stringify(vendors));
    renderVendors();
    e.target.reset();
    alert("✅ Vendor added successfully!");
  });
}

// ---------- Edit Vendor ----------
function openEditVendor(index) {
  const vendors = JSON.parse(localStorage.getItem("vendors")) || [];
  const v = vendors[index];

  document.getElementById("editVendorIndex").value = index;
  document.getElementById("editVendorName").value = v.name;
  document.getElementById("editVendorContact").value = v.contact;
  document.getElementById("editVendorAddress").value = v.address;

  new bootstrap.Modal(document.getElementById("editVendorModal")).show();
}

// ---------- Save Vendor Changes ----------
document.getElementById("saveVendorChanges")?.addEventListener("click", () => {
  const vendors = JSON.parse(localStorage.getItem("vendors")) || [];
  const index = document.getElementById("editVendorIndex").value;

  vendors[index] = {
    name: document.getElementById("editVendorName").value.trim(),
    contact: document.getElementById("editVendorContact").value.trim(),
    address: document.getElementById("editVendorAddress").value.trim(),
  };

  localStorage.setItem("vendors", JSON.stringify(vendors));
  renderVendors();
  bootstrap.Modal.getInstance(document.getElementById("editVendorModal")).hide();
  alert("✏️ Vendor details updated successfully!");
});

// ---------- Delete Vendor ----------
function deleteVendor(index) {
  const vendors = JSON.parse(localStorage.getItem("vendors")) || [];
  if (confirm("Are you sure you want to delete this vendor?")) {
    vendors.splice(index, 1);
    localStorage.setItem("vendors", JSON.stringify(vendors));
    renderVendors();
  }
}

// ---------- Initial Render ----------
renderVendors();
