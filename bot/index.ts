import { Scraper, SearchMode } from "agent-twitter-client";
import dotenv from "dotenv";
import puppeteer from 'puppeteer';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
    AptosAccountAddressTool,
    AptosBalanceTool,
    AptosGetTokenDetailTool,
    AptosGetTokenPriceTool,
    AptosTransactionTool,
    JouleGetPoolDetails,
} from "move-agent-kit"
import { tool } from "@langchain/core/tools";
import z from "zod"

import { setupAgentKit } from "./agent"
import { HexInput } from "@aptos-labs/ts-sdk";
import { AptosAccount, AptosClient, FaucetClient, HexString } from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
const MODULE_NAME = "DropContract";


dotenv.config();

function cookiesToArray(cookieString: string): string[] {
    return cookieString.split(";").map(cookie => cookie.trim());
}
function delay(time: number) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

export const createAptosReadAgent = async (privateKey: HexInput, scraper: any, conversionId: string) => {
    const sendTipTool = tool(
        async ({ address, amount }: { address: string, amount: number }): Promise<string> => {

            const account = new AptosAccount(HexString.ensure(privateKey as string).toUint8Array());
            const recipient = new AptosAccount();
            await faucet.fundAccount(recipient.address(), 100_000_000_000);
            const amountAptToOctas = BigInt(amount * 100_000_000)
            const payload = {
                type: "entry_function_payload",
                function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_drop`,
                type_arguments: [],
                arguments: [recipient.address().hex(), amountAptToOctas.toString()],
            };

            const txnRequest = await client.generateTransaction(account.address(), payload);
            const signedTxn = await client.signTransaction(account, txnRequest);
            const txnResponse = await client.submitTransaction(signedTxn);
            await client.waitForTransaction(txnResponse.hash);

            // Get the private key as a Uint8Array
            const privateKeyBytes = recipient.signingKey.secretKey;
            // Convert it to a hex string
            const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");

            const dropSecret = btoa(privateKeyHex)

            const dropLink = `${process.env.API_URL}/claim/${dropSecret}?owner=${address}`;

            // send messenger
            await scraper.sendDirectMessage(conversionId, `Here is your claim url test : ${dropLink}`);

            return `dropLink is ${dropLink} and txn hash is ${txnResponse.hash}`

        },
        {
            name: "send_tip",
            description: "to tip the user Twitter ",
            schema: z.object({
                address: z.string().min(1, "Address is required").regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Aptos address"),
                amount: z.number().positive("Amount must be a positive number"),
            }),
        }
    )

    const { agentRuntime, llm } = await setupAgentKit(privateKey)


    const readAgentTools = [
        new AptosAccountAddressTool(agentRuntime),
        new AptosTransactionTool(agentRuntime),
        new AptosBalanceTool(agentRuntime),
        sendTipTool

    ]

    const readAgent = createReactAgent({
        tools: readAgentTools,
        llm: llm,
        prompt: "You are a Twitter Agent who helps users connect to Aptos onchain information after providing wallet address. answer only once no more than 220 characters",
    })


    return readAgent
}
// write get api http://localhost:3000/api/user?userId=1766524126011740161
async function getUser(userId: string) {
    const response = await fetch(`${process.env.API_URL}/api/user?userId=${userId}`);

    const data = await response.json();
    return data;
}


async function replyToTweet(username: string, tweetId: string, replyMessage: string) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const cookiesString = process.env.TWITTER_COOKIES;
    if (!cookiesString) {
        console.error('Error: Missing environment variable (TWITTER_COOKIES)');
        return;
    }

    const cookies = cookiesString.split('; ').map(cookie => {
        const [name, value] = cookie.split('=');
        return { name, value, domain: '.x.com' };
    });
    await page.setCookie(...cookies);
    await page.goto('https://x.com');
    await page.goto(`https://x.com/${username}/status/${tweetId}`);

    // Wait for the reply button to be visible and click it
    await page.waitForSelector('div[data-testid="tweetTextarea_0RichTextInputContainer"]');
    await page.click('div[data-testid="tweetTextarea_0RichTextInputContainer"]');
    // Wait for the reply text area to be visible and type the reply message
    await page.type('div[data-testid="tweetTextarea_0RichTextInputContainer"]', replyMessage, { delay: 400 });
    // Click the reply button to post the reply
    await page.waitForSelector('div[data-testid="tweetTextarea_0RichTextInputContainer"]');

    await page.click('button[data-testid="tweetButtonInline"]');

    await browser.close();
}

async function sendDirectMessageOrNotify(scraper: Scraper, conversionId: string, message: string, tweetId: string, username: string) {
    try {
        await scraper.sendDirectMessage(conversionId, message);
        console.log(`[DM Sent] @${conversionId}: ${message}`);
    } catch (error: any) {
        console.error(`[DM Failed] @${conversionId}:`, error);

        if (error?.errors?.some((e: any) => e.code === 279)) {
            const replyMessage = `Hey @${conversionId}, please send me a DM so I can message you back!`;
            await replyToTweet(username, tweetId, replyMessage);
            console.log(`[Public Reply Sent] Asking @${conversionId} to DM first.`);
        }
    }
}



async function continuouslyCheckMentions(interval = 6000 * 3) {
    const scraper = new Scraper();
    const cookieString = process.env.TWITTER_COOKIES;
    const twitterUsername = process.env.TWITTER_USERNAME;
    // const readAgent = await createAptosReadAgent();

    if (!cookieString || !twitterUsername) {
        console.error("Error: Missing environment variables (TWITTER_COOKIES or TWITTER_USERNAME)");
        return;
    }
    await scraper.setCookies(cookiesToArray(cookieString));
    const bot = await scraper.me();
    const botId = bot?.userId;
    let lastSeenTweetId: string | null = null;
    console.log("[Monitoring] Started listening for mentions...");

    while (true) {
        try {
            const query = `@${twitterUsername}`;
            const tweets = [];
            for await (const tweet of scraper.searchTweets(query, 5, SearchMode.Latest)) {
                tweets.push(tweet);
            }

            if (tweets.length === 0) {
                await new Promise(resolve => setTimeout(resolve, interval));
                continue;
            }

            tweets.sort((a: any, b: any) => parseInt(b.id) - parseInt(a.id));

            const newMentions: any = lastSeenTweetId
                ? tweets.filter((tweet: any) => parseInt(tweet.id) > parseInt(lastSeenTweetId as string))
                : tweets;

            if (newMentions.length === 0) {
                await new Promise(resolve => setTimeout(resolve, interval));
                continue;
            }

            console.log(`[New Mentions] ${newMentions.length} tweets detected.`);

            for (const tweet of newMentions) {
                const userMention = tweet.username;

                if (!tweet.inReplyToStatusId) {
                    console.log(`[Ignoring] Tweet is not a reply: @${userMention}`);
                    continue;
                }

                const inReplyToStatusId = tweet.inReplyToStatusId;
                try {
                    const originalTweet: any = await scraper.getTweet(inReplyToStatusId);

                    if (!originalTweet) {
                        console.error("[Error] Failed to fetch original tweet.");
                        continue;
                    }

                    console.log(`[Original Tweet] From @${originalTweet.username}: ${originalTweet.text}`);

                    if (originalTweet.username !== userMention) {
                        const conversionId = `${originalTweet.userId}-${botId}`;

                        const userMentionInfo = await getUser(tweet.userId);
                        // check if user has already registered
                        if (!userMentionInfo) {
                            console.log(`[Processing] Reply to tweet ID: ${tweet.id} - Please register your wallet first`);
                            await replyToTweet(tweet.username, tweet.id, "Please register your wallet first");

                        } else {
                            const readAgent = await createAptosReadAgent(userMentionInfo.privateKey, scraper, conversionId);

                            const agentOutput = await readAgent.invoke({
                                messages:
                                    tweet.text,
                            });
                            console.log(`[Processing] Reply to tweet ID: ${tweet.id} - ${agentOutput.messages[agentOutput.messages.length - 1].content.toString()}`);
                            await replyToTweet(tweet.username, tweet.id, agentOutput.messages[agentOutput.messages.length - 1].content.toString());
                        }

                    } else {
                        console.log(`[Processing] Reply to tweet ID: ${tweet.id} - Cannot transfer to yourself`);
                        // await replyToTweet(tweet.username, tweet.id, "Cannot transfer to yourself");
                    }
                } catch (error) {
                    console.error("[Error] Fetching original tweet:", error);
                }
            }

            lastSeenTweetId = newMentions[0].id;
        } catch (error) {
            console.error("[Error] Checking mentions:", error);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }
}
continuouslyCheckMentions();
