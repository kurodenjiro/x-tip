import dotenv from 'dotenv';
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { AptosAccount, AptosClient, FaucetClient, HexString } from 'aptos';

dotenv.config();

const {

} = process.env;
const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
const MODULE_NAME = "DropContract";

export async function POST(req: NextRequest) {
    const body = await req.json();

    const { amount, userId } = body;

    if (!amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {

        const user = await prisma.user.findFirst({
            where: {
                userId: userId,
            },
        });


        const account = new AptosAccount(HexString.ensure(user?.privateKey as string).toUint8Array());

        const recipient = new AptosAccount();
        await faucet.fundAccount(recipient.address(), 1000000);
        const payload = {
            type: "entry_function_payload",
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_drop`,
            type_arguments: [],
            arguments: [recipient.address().hex(), amount.toString()],
        };

        const txnRequest = await client.generateTransaction(account.address(), payload);
        const signedTxn = await client.signTransaction(account, txnRequest);
        const txnResponse = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(txnResponse.hash);
        // Get the private key as a Uint8Array
        const privateKeyBytes = recipient.signingKey.secretKey;
        // Convert it to a hex string
        const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");
        console.log('privateKeyHex', privateKeyHex,privateKeyBytes);
        const dropSecret = btoa(privateKeyHex);

        const dropLink = `${process.env.NEXT_PUBLIC_URL}/claim/${dropSecret}?owner=${user?.address}`;

        return NextResponse.json({ dropLink: dropLink }, { status: 200 });
    } catch (error) {
        console.error('Error creating drop link:', error);
        return NextResponse.json({ error: 'Failed to create drop link' }, { status: 500 });
    }
}
