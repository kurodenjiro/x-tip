import {
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    HexInput,
    Network,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import dotenv from "dotenv";
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { AgentRuntime, LocalSigner } from "move-agent-kit"
config()
dotenv.config();

export const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
})

export const setupAgentKit = async (APTOS_PRIVATE_KEY: HexInput) => {
    const aptosConfig = new AptosConfig({
        network: Network.DEVNET,
    })
    const aptos = new Aptos(aptosConfig)
    const account = await aptos.deriveAccountFromPrivateKey({
        privateKey: new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(APTOS_PRIVATE_KEY, PrivateKeyVariants.Ed25519)
        ),
    })
    const signer = new LocalSigner(account, Network.DEVNET)
    const agentRuntime = new AgentRuntime(signer, aptos)

    return {
        agentRuntime,
        llm,
    }
}