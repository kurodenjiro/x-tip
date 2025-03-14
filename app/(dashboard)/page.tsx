"use client"
import { useContractInteraction } from "@/hooks/useContractInteraction";
import Link from "next/link";
import Balance from "@/components/Balance";
import Deposit from "@/components/Deposit";
import Withdraw from "@/components/Withdraw";
import { Button } from "@/components/ui/button";
import { useUserQuery } from "@/hooks/useQuery";

export default function Home() {
  const { isLoggedIn, currentAccountId } = useContractInteraction();
  const { data: user, isLoading, isError } = useUserQuery(currentAccountId || "");
  const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };
  const handleWithdraw = (amount: number) => {
    console.log(`Withdraw ${amount} BTC`); // Replace with actual withdraw logic
  };
  // Step 1 : Create btc wallet from generate address near kdf (done)
  // step 2 : store btc wallet in database (done)
  // step 3 : add deposit BTC (done)
  // step 4 : create near account then store with receipt twitter ID
  // step 5 : check balance wih amount before create droplink 
  // step 6 : when user go to drop url then check twitter ID and drop ID
  return (
    <div className="container mx-auto p-6">
      {isLoggedIn && currentAccountId && user ? (
        <>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">Welcome, {shortenAddress(user?.address)} !</h1>
              <Link href="/create-drop-link">
                <Button className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition duration-300">
                  Create Drop Link
                </Button>
              </Link>
            </div>
            <div className="mb-6">
              <Balance address={user?.address as any} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Deposit address={user?.address || ""} />
              <Withdraw onWithdraw={handleWithdraw} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-lg">Please log in to access the admin dashboard.</p>
        </div>
      )}
    </div>
  );
}

