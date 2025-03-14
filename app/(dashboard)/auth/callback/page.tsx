"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/context/web3auth-context';
import { WALLET_ADAPTERS } from "@web3auth/base";

export default function AuthCallback() {
  const router = useRouter();
  const { web3auth } = useWeb3Auth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get hash from URL
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;

          if (hash) {
            // Let Web3Auth handle the callback
            await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
              loginProvider: "jwt",
              extraLoginOptions: {
                domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
                verifierIdField: "sub",
                verifier: "w3a-auth0-twitter",
                clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
                connection: "twitter"
              }
            });

            // Close popup if in popup mode
            if (window.opener) {
              window.close();
            } else {
              // Redirect to home page
              router.push('/');
            }
          }

        } else {
          console.error('No hash found in callback URL');
          router.push('/');
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        router.push('/');
      }
    };

    handleCallback();
  }, [router, web3auth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Completing authentication, please wait...</p>
    </div>
  );
} 