"use client"

export default function Balance({ balance }: { balance: number }) {
  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <h2 className="text-xl font-bold mb-2">Balance</h2>
      <p className="text-lg">{balance} BTC</p>
    </div>
  );
}