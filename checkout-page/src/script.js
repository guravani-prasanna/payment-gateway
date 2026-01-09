// Global variables
let orderId = "";

// Run on page load
window.onload = function () {
  loadOrder();
};

// Auto-fill amount and order ID
function loadOrder() {
  const amount = localStorage.getItem("amount") || "500";
  orderId = "ORD-" + Math.floor(Math.random() * 1000000);
  document.getElementById("amount").value = amount;
  document.getElementById("oid").value = orderId;
}

// Show/hide forms
function showUPI() {
  document.getElementById("upiForm").style.display = "block";
  document.getElementById("cardForm").style.display = "none";
}

function showCard() {
  document.getElementById("cardForm").style.display = "block";
  document.getElementById("upiForm").style.display = "none";
}

// Show processing
function startProcessing() {
  document.getElementById("processing").style.display = "block";
  document.getElementById("upiForm").style.display = "none";
  document.getElementById("cardForm").style.display = "none";
  document.getElementById("success").style.display = "none";
  document.getElementById("error").style.display = "none";
}

// Simulate UPI payment
function payUPI(e) {
  e.preventDefault();
  startProcessing();

  const amount = document.getElementById("amount").value;
  const paymentId = "SIMULATED-UPI-" + Math.floor(Math.random() * 100000);

  setTimeout(() => {
    document.getElementById("processing").style.display = "none";
    document.getElementById("success").style.display = "block";
    document.getElementById("pid").innerText = paymentId;

    // Save the transaction
    saveTransaction(paymentId, amount, "UPI");

    document.getElementById("nextStep").style.display = "block";
  }, 2000);
}

function payCard(e) {
  e.preventDefault();
  startProcessing();

  const amount = document.getElementById("amount").value;
  const paymentId = "SIMULATED-CARD-" + Math.floor(Math.random() * 100000);

  setTimeout(() => {
    document.getElementById("processing").style.display = "none";
    document.getElementById("success").style.display = "block";
    document.getElementById("pid").innerText = paymentId;

    // Save the transaction
    saveTransaction(paymentId, amount, "Card");

    document.getElementById("nextStep").style.display = "block";
  }, 2000);
}
function nextStep() {
  alert("Proceeding to the next step!");
  // Optional redirect:
  // window.location.href = "next.html";
}
// This makes the Continue button work
document.getElementById("nextStep").addEventListener("click", function () {
  alert("Proceeding to the next step!");
  window.location.href = "transaction.html";
  // Optional: redirect to another page
  // window.location.href = "success.html";
});
function saveTransaction(id, amount, method) {
  // Get existing transactions from localStorage
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

  // Add the new transaction
  transactions.push({
    id: id,
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    amount: amount,
    method: method,
    status: "Success",
  });

  // Save back to localStorage
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
