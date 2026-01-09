let orderId = "", paymentId = "";

async function loadOrder() {
  const params = new URLSearchParams(window.location.search);
  orderId = params.get("order_id");

  const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`);
  const data = await res.json();

  document.getElementById("amount").innerText = "₹" + (data.amount / 100).toFixed(2);
  document.getElementById("oid").innerText = orderId;
}

function showUPI() {
  document.getElementById("upiForm").style.display = "block";
  document.getElementById("cardForm").style.display = "none";
}

function showCard() {
  document.getElementById("cardForm").style.display = "block";
  document.getElementById("upiForm").style.display = "none";
}

async function payUPI(e) {
  e.preventDefault();
  startProcessing();

  const vpa = document.getElementById("vpa").value;

  const res = await fetch("http://localhost:8000/api/v1/payments/public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId, method: "upi", vpa })
  });

  const data = await res.json();
  paymentId = data.id;
  pollStatus();
}

async function payCard(e) {
  e.preventDefault();
  startProcessing();

  const [month, year] = document.getElementById("expiry").value.split("/");

  const res = await fetch("http://localhost:8000/api/v1/payments/public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      method: "card",
      card: {
        number: document.getElementById("card_number").value,
        expiry_month: month,
        expiry_year: year,
        cvv: document.getElementById("cvv").value,
        holder_name: document.getElementById("name").value
      }
    })
  });

  const data = await res.json();
  paymentId = data.id;
  pollStatus();
}

function startProcessing() {
  document.getElementById("processing").style.display = "block";
  document.getElementById("upiForm").style.display = "none";
  document.getElementById("cardForm").style.display = "none";
}

async function pollStatus() {
  const res = await fetch(`http://localhost:8000/api/v1/payments/${paymentId}/public`);
  const data = await res.json();

  if (data.status === "processing") {
    setTimeout(pollStatus, 2000);
  } else if (data.status === "success") {
    document.getElementById("processing").style.display = "none";
    document.getElementById("success").style.display = "block";
    document.getElementById("pid").innerText = paymentId;
  } else {
    document.getElementById("processing").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errMsg").innerText = data.error_description;
  }
}