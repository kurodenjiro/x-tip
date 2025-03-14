"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, WALLET_ADAPTERS, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { initializeApp } from "firebase/app";
import { TwitterAuthProvider, getAuth, signInWithRedirect, getRedirectResult, type UserCredential, signInWithPopup } from "firebase/auth";
import { AptosClient, AptosAccount, HexString, FaucetClient } from "aptos";

// Initialize the Aptos SDK with Testnet configuration
const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const faucet = new FaucetClient(NODE_URL, FAUCET_URL);
const client = new AptosClient(NODE_URL);

interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
  aggregateVerifier?: string;
}

interface Web3AuthContextType {
  web3auth: Web3AuthNoModal;
  provider: IProvider | null;
  account: any | null;
  accountAddress: string | null;
  aptosClient: any | null;
  loginWithProvider: (loginProvider: string) => Promise<IProvider>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const Web3AuthContext = createContext<Web3AuthContextType>({} as Web3AuthContextType);

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER, // Use "eip155" for EVM chains, "solana" for Aptos (Web3Auth categorizes it under Solana)
  chainId: "0x175", // Aptos Devnet Chain ID is "0x1"
  rpcTarget: "https://fullnode.devnet.aptoslabs.com/v1",
  displayName: "Aptos Devnet",
  blockExplorerUrl: "https://explorer.aptoslabs.com/",
  ticker: "APT",
  tickerName: "Aptos",
  logo: "https://raw.githubusercontent.com/aptos-labs/aptos-core/main/ecosystem/static/aptos_logo.svg"
};

const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig: chainConfig },
});

if (!process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID) {
  throw new Error('Please set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID in your .env.local file');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};



const web3auth = new Web3AuthNoModal({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider,
  useCoreKitKey: false,
});

// Add JWT configuration for Twitter Auth
const authAdapter = new AuthAdapter({
  adapterSettings: {
    loginConfig: {
      jwt: {
        verifier: "w3a-firebase-twitter",
        typeOfLogin: "jwt",
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
        jwtParameters: {
          sub: "sub",
          name: "name",
          picture: "picture",
          verifierIdField: "sub"
        }
      },
    },
  },
});

web3auth.configureAdapter(authAdapter);

interface Web3AuthProviderProps {
  children: ReactNode;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  const [aptosClient, setAptosClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase auth
  const signInWithTwitter = async (): Promise<UserCredential> => {
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const twitterProvider = new TwitterAuthProvider();

      // Add scopes if needed
      twitterProvider.setCustomParameters({
        'lang': 'en'
      });

      const res = await signInWithPopup(auth, twitterProvider);
      return res;
    } catch (err: any) {
      console.error('Firebase Auth Error:', err.code, err.message);
      if (err.code === 'auth/invalid-credential') {
        throw new Error('Twitter authentication failed. Please check if Twitter authentication is properly configured in Firebase console.');
      }
      throw err;
    }
  };

  const createOrGetUser = async (userAddress: string, userId: string, privateKey: string) => {
    try {
      const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: userAddress, userId: userId, privateKey: privateKey }),
      });

      const userData = await response.json();
      return userData;
    } catch (err) {
      console.error('Error creating/getting user:', err);
    }
  };

  const geAptosCredentials = async (web3authProvider: IProvider, userId: string) => {
    try {
      const privateKeyHex: any = await web3authProvider.request({ method: "private_key" });
      /// Convert the private key to a byte array
      const privateKeyBytes = HexString.ensure(privateKeyHex).toUint8Array();

      const aptosAccount = new AptosAccount(privateKeyBytes);

      const aptosAccountAddress = aptosAccount.address().toString();
      await ensureAccount(aptosAccount);

      await createOrGetUser(aptosAccountAddress, userId, Buffer.from(privateKeyBytes).toString("hex"));
      localStorage.setItem('accountId', aptosAccountAddress);

      // Get user info from Web3Auth
      const userInfo = await web3auth.getUserInfo();
      // console.log("User info:", userInfo);
      if (!userInfo || !userInfo.verifierId) {
        throw new Error("Could not get Twitter username");
      }
      console.log("Twitter username:", userInfo);
      setAccountAddress(aptosAccountAddress);
      setAccount(aptosAccount);
      return { aptosAccountAddress };
    } catch (error) {
      console.error("Error getting credentials:", error);
      throw error;
    }
  };


  const loginWithProvider = async (loginProvider: string): Promise<IProvider> => {
    try {
      setIsLoading(true);
      setError(null);
      // Trigger Twitter/X login
      const loginRes = await signInWithTwitter();
      const userId = loginRes.user.providerData[0].uid
      const idToken = await loginRes.user.getIdToken(true);
      // console.log("Firebase ID Token:", idToken);

      // Login in No Modal SDK with Twitter / X idToken
      const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: "jwt",
        extraLoginOptions: {
          id_token: idToken,
          verifierIdField: "sub"
        },
      });

      if (!web3authProvider) {
        throw new Error("Failed to get Web3Auth provider");
      }

      setProvider(web3authProvider);
      await geAptosCredentials(web3authProvider, userId);
      return web3authProvider;
    } catch (error: any) {
      console.error(`Login with ${loginProvider} failed:`, error);
      setError(error.message || "Failed to login");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (web3auth.connected) {
        await web3auth.logout();
        setProvider(null);
        setAccountAddress(null);
        setAccount(null);
        setAptosClient(null);
      }
    } catch (error: any) {
      console.error("Logout failed:", error);
      setError(error.message || "Failed to logout");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  async function ensureAccount(account: AptosAccount) {
    try {
      const COIN_TYPE = '0x1::aptos_coin::AptosCoin';
      await client.getAccountResource(account.address(), `0x1::coin::CoinStore<${COIN_TYPE}>`);
      console.log(`CoinStore already registered for account: ${account.address().hex()}`);
    } catch (error: any) {
      if (error.status === 404) {
        // init and fund account
        await faucet.fundAccount(account.address(), 100_000_000);
        console.log(`init DropContract for account: ${account.address().hex()}`);
        const MODULE_ADDRESS = "0xf4da837b7cc499e6afc64a40442f310876f14e0df96f57c8c0a92afae73f840c";
        const MODULE_NAME = "DropContract";

        const payload = {
          type: "entry_function_payload",
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::init`,
          type_arguments: [],
          arguments: [],
        }
        const txnRequest = await client.generateTransaction(account.address(), payload);
        const signedTxn = await client.signTransaction(account, txnRequest);
        const transactionRes = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(transactionRes.hash);
        console.log(`CoinStore registered for account: ${account.address().hex()}`);
      }
    }
  }
  // Initialize Web3Auth
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await web3auth.init();

        // Check if user was previously logged in
        const savedAccountId = localStorage.getItem('accountId');
        if (savedAccountId && web3auth) {
          try {
            if (!web3auth.connected) {
              // Only attempt to reconnect if not already connected
              // Trigger Twitter/X login
              const loginRes = await signInWithTwitter();

              const idToken = await loginRes.user.getIdToken(true);

              // Login in No Modal SDK with Twitter / X idToken
              const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
                loginProvider: "jwt",
                extraLoginOptions: {
                  id_token: idToken,
                  verifierIdField: "sub",
                },
              });
              const privateKeyHex: any = await web3authProvider?.request({ method: "private_key" });
              /// Convert the private key to a byte array
              const privateKeyBytes = HexString.ensure(privateKeyHex).toUint8Array();

              const aptosAccount = new AptosAccount(privateKeyBytes);
              await ensureAccount(aptosAccount);

              if (web3authProvider) {
                setProvider(web3authProvider);
                setAccount(aptosAccount);
                setAccountAddress(aptosAccount.address().toString());
                setAptosClient(aptosClient);
              }
            } else {
              // If already connected, just get the provider and restore the connection
              const web3authProvider = await web3auth.provider;
              const privateKeyHex: any = await web3authProvider?.request({ method: "private_key" });
              /// Convert the private key to a byte array
              const privateKeyBytes = HexString.ensure(privateKeyHex).toUint8Array();
              const aptosAccount = new AptosAccount(privateKeyBytes);
              await ensureAccount(aptosAccount);

              if (web3authProvider) {

                setProvider(web3authProvider);
                setAccount(aptosAccount);
                setAccountAddress(aptosAccount.address().toString());
                setAptosClient(aptosClient);

              }
            }
          } catch (error) {
            console.error("Error restoring session:", error);
            localStorage.removeItem('accountId');
            setProvider(null);
            setAccount(null);
            setAptosClient(null);
          }
        }

        console.log("Web3Auth initialized successfully");
      } catch (error: any) {
        console.error("Error initializing Web3Auth:", error);
        setError(error.message || "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <Web3AuthContext.Provider value={{
      web3auth,
      provider,
      account,
      accountAddress,
      aptosClient,
      loginWithProvider,
      logout,
      isLoading,
      error
    }}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
} 