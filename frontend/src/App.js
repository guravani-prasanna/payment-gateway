import React, { useState } from "react";
import axios from "axios";

function App() {
  const [amount, setAmount] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const createOrder = async () => {
    setError("");
    setResponse("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/orders`,
        {
          amount: Number(amount),
          currency: "INR"
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.REACT_APP_API_KEY,
            "X-Api-Secret": process.env.REACT_APP_API_SECRET
          }
        }
      );

      setResponse(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error(err);
      setError(
        err.response
          ? JSON.stringify(err.response.data, null, 2)
          : "Network Error"
      );
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>Payment Gateway Frontend</h2>

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      <button onClick={createOrder}>Create Order</button>

      <pre>{response}</pre>
      <pre style={{ color: "red" }}>{error}</pre>
    </div>
  );
}

export default App;
