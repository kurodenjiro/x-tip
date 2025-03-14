"use client"
import { broadcast, getBalance, getChange } from '@/app/(dashboard)/lib/bitcoin';
import { useEffect, useState } from 'react';

export default  function Balance({ address }: { address: number }) {
  const [balance, setBalance] = useState<number | null>(null);
  console.log("address",address)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        console.error('Address is not provided');
        return;
      }
      try {
        const balanceData = await getBalance({address:address});
        console.log('balanceData', balanceData);
        const balanceInBTC = balanceData / 1e8; // Convert satoshis to BTC
        setBalance(balanceData);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
  }, [address]);
  return (
    <div className="p-4 bg-gray-100 rounded-md">
    {balance !== null ? (
      <p className="text-lg">Balance : {balance} Sats</p>
    ) : (
      <p className="text-lg">Loading...</p>
    )}
  </div>
  );
}