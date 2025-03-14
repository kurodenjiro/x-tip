"use client"

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "recharts";
import { AptosAccount, AptosClient, FaucetClient, HexString } from "aptos";


const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
const MODULE_NAME = "DropContract";

export default function ClaimDrop() {
  const params = useParams();
  const { key } = params;
  const [dropInfo, setDropInfo] = useState<any>(null);
  const [secretKey, setSecretKey] = useState<string | null>(key ? atob(decodeURIComponent(key as string)) : null);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner");

  useEffect(() => {
    const checkLink = async () => {

      try {
        const privateKeyBytes = HexString.ensure(secretKey as string).toUint8Array();
        const account = new AptosAccount(privateKeyBytes);
        console.log('account', account.address().hex());

        const COIN_TYPE = '0x1::aptos_coin::AptosCoin';
        await client.getAccountResource(account.address(), `0x1::coin::CoinStore<${COIN_TYPE}>`);
      } catch (error: any) {
        setErrorMsg(error.message);
      }
    }
    if (secretKey) {
      checkLink()
    }
  }, [secretKey]);


  const claim = async () => {
    setIsLoading(true)

    const privateKeyBytes = HexString.ensure(secretKey as string).toUint8Array();
    const account = new AptosAccount(privateKeyBytes);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::claim_drop`,
        type_arguments: [],
        arguments: [owner, address],
      };

      const txnRequest = await client.generateTransaction(account.address(), payload);
      const signedTxn = await client.signTransaction(account, txnRequest);
      const txnResponse = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(txnResponse.hash);
      console.log('Claim result:');

      setErrorMsg("claim success");
    } catch (error: any) {
      setErrorMsg(error.message);
    }
    setIsLoading(false);
  }
  return (
    <div className="flex justify-center items-center mt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Claim Drop</CardTitle>
          <CardDescription>Claim your drop using the secret key.</CardDescription>
        </CardHeader>
        <CardContent>

          <div className="space-y-2">
            <Label > Address to withdraw</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address to withdraw "
            />
          </div>

          <div className="flex justify-start mt-3">
            <Button onClick={claim} disabled={!secretKey || !address || isLoading}  >
              Claim Drop
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : ""}
            </Button>
          </div>
          {errorMsg ?
            <div>
              <p className="text-red ">{errorMsg} </p>
            </div>
            : <> </>}




        </CardContent>
      </Card>
    </div>
  );
}