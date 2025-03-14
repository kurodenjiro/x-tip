"use client"

import { useState } from "react";

export default function Withdraw({ onWithdraw }: { onWithdraw: (amount: number) => void }) {
  const [amount, setAmount] = useState("");

  const handleWithdraw = () => {
    const amountNumber = parseFloat(amount);
    if (!isNaN(amountNumber) && amountNumber > 0) {
      onWithdraw(amountNumber);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <h2 className="text-xl font-bold mb-2">Withdraw</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleWithdraw}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
      >
        Withdraw
      </button>
    </div>
  );
}