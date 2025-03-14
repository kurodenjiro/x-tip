import { AptosClient, AptosAccount, FaucetClient, HexString, TxnBuilderTypes, BCS, CoinClient } from "aptos";

// Aptos Network & Faucet Setup
const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const coinClient = new CoinClient(client);

// Smart Contract Information
const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
const MODULE_NAME = "DropContract";

// Generate Accounts for Testing
const owner = new AptosAccount();
const recipient = new AptosAccount();
const withdrawalAddress = new AptosAccount(); // This is where the recipient wants to withdraw the funds

// Function to register CoinStore for the recipient
async function ensureCoinStore(account) {
    try {
        const a = await client.getAccountResource(account.address(), `0x1::coin::CoinStore<${COIN_TYPE}>`);
        console.log(`CoinStore already registered for account: ${account.address().hex()}`);
    } catch (error) {
        if (error.status === 404) {
            console.log(`Registering CoinStore for account: ${account.address().hex()}`);
            const payload = {
                type: 'entry_function_payload',
                function: '0x1::managed_coin::register',
                type_arguments: [COIN_TYPE],
                arguments: [],
            };
            const txnRequest = await client.generateTransaction(account.address(), payload);
            const signedTxn = await client.signTransaction(account, txnRequest);
            const transactionRes = await client.submitTransaction(signedTxn);
            await client.waitForTransaction(transactionRes.hash);
            console.log(`CoinStore registered for account: ${account.address().hex()}`);
        } else {
            throw error;
        }
    }
}

async function initDrop(account) {
    const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::init`,
        type_arguments: [],
        arguments: [],
    };

    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txnResponse = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txnResponse.hash);
}

async function createDrop(account, recipient, amount) {
    const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_drop`,
        type_arguments: [],
        arguments: [recipient.hex(), amount.toString()],
    };

    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txnResponse = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txnResponse.hash);
}

async function claimDrop(account, owner, withdrawTo) {
    const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::claim_drop`,
        type_arguments: [],
        arguments: [owner.hex(), withdrawTo.hex()],
    };

    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txnResponse = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txnResponse.hash);
}

async function revokeDrop(account, recipient) {
    const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::revoke_drop`,
        type_arguments: [],
        arguments: [recipient.hex()],
    };

    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txnResponse = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txnResponse.hash);
}

async function main() {
    console.log("Funding accounts...", owner.address().toString(), recipient.address().toString());
    await faucet.fundAccount(owner.address(), 100_000_000);
    await faucet.fundAccount(recipient.address(), 10_000_000);
    await faucet.fundAccount(withdrawalAddress.address(), 10_000_000);

    console.log("Initializing Drop Storage...");
    await initDrop(owner);

    console.log("Creating a Drop...");
    await createDrop(owner, recipient.address(), 10_000_000);

    console.log("Claiming the Drop with Withdrawal Address...");
    await claimDrop(recipient, owner.address(), withdrawalAddress.address());

    console.log("Revoking the Drop...");
    await revokeDrop(owner, recipient.address());

    console.log("All tests completed.");
}

main().catch(console.error);