"use client"

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useContractInteraction } from "@/hooks/useContractInteraction";

const MIN_AMOUNT = 0.001;

export default function CreateDropLink({ user }: { user: any }) {
  const [amount, setAmount] = useState("");
  const [dropLink, setDropLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, currentAccountId, addDrop } = useContractInteraction();

  const createDropLink = async () => {
    if (!amount) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const aptosAmount = Number.parseInt(amount);
   
    try {
      setIsLoading(true);
      const dropLink = await addDrop(aptosAmount);
      setDropLink(dropLink as string);
      toast({
        title: "Success",
        description: "Drop link created successfully.",
        variant: "default",
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating drop link:", error);
      toast({
        title: "Error",
        description: "Failed to create drop link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Create Drop Link </h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder={MIN_AMOUNT.toString()}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_AMOUNT}
          />
        </div>

        <Button onClick={createDropLink} disabled={isLoading} className="w-full">
          {isLoading ? 'Loading...' : 'Create Drop Link'}
        </Button>
        {dropLink && (
          <div className="p-4 bg-secondary rounded-md break-all">
            <p className="text-sm font-medium mb-2">Your Drop Link:</p>
            <p className="font-mono text-xs">{dropLink}</p>
          </div>
        )}
      </div>
      <Link href="/" className="text-blue-500 underline mt-4 inline-block">Return to Home</Link>
    </Card>
  );
}

