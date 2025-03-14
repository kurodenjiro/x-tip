import { AptosClient, AptosAccount, FaucetClient, HexString, TxnBuilderTypes, BCS, CoinClient } from "aptos";

import { useWeb3Auth } from '@/context/web3auth-context';

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
const MODULE_NAME = "DropContract";

export function useContractInteraction() {
  const { web3auth, account, accountAddress } = useWeb3Auth();

  const addDrop = async (amount: number) => {

    if (web3auth?.connected) {
      const recipient = new AptosAccount();
      await faucet.fundAccount(recipient.address(), 1000000);
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_drop`,
        type_arguments: [],
        arguments: [recipient.address().hex(), amount.toString()],
      };
      console.log(account.address());
      const txnRequest = await client.generateTransaction(account.address(), payload);
      const signedTxn = await client.signTransaction(account, txnRequest);
      const txnResponse = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(txnResponse.hash);
      // Get the private key as a Uint8Array
      const privateKeyBytes = recipient.signingKey.secretKey;
      // Convert it to a hex string
      const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");
      console.log('privateKeyHex', privateKeyHex, privateKeyBytes);
      const dropSecret = btoa(privateKeyHex)
      const dropKeyPairBase64 = Buffer.from(dropSecret).toString('base64');

      const dropLink = `${process.env.NEXT_PUBLIC_URL}/claim/${dropKeyPairBase64}?owner=${accountAddress}`;
      return dropLink

    }
  }

  // const addDropKey = async (account: any, dropId: string, publicKey: string) => {
  //   if (web3auth?.connected && nearConnection && web3authAccountId) {
  //     const account: Account = await nearConnection.account(web3authAccountId);
  //     return account.functionCall({
  //       contractId: "linkdrop.testnet", // Replace with your actual contract ID
  //       methodName: "add_drop_key",
  //       args: {
  //         drop_id: dropId,
  //         key: publicKey,
  //       },
  //       gas: BigInt("300000000000000"), // Adjust the gas as needed
  //     });
  //   }
  // }


  return {
    addDrop,
    isLoggedIn: web3auth?.connected,
    currentAccountId: accountAddress
  };
} 