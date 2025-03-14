"use client"
import { Account, AccountAddress, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

import { useEffect, useState } from 'react';

// Set up the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);


export default function Balance({ address }: { address: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  const getBalance = async (accountAddress: string, versionToWaitFor?: bigint): Promise<number> => {
    const amount = await aptos.getAccountAPTAmount({
      accountAddress,
      minimumLedgerVersion: versionToWaitFor,
    });
    console.log(`${name}'s balance is: ${amount}`);
    return amount/1e8;
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        console.error('Address is not provided');
        return;
      }
      try {
        const balanceData = await getBalance(address);
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
        <p className="text-lg">Balance : {balance} APT</p>
      ) : (
        <p className="text-lg">Loading...</p>
      )}
    </div>
  );
}