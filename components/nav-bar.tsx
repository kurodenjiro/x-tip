'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWeb3Auth } from '@/context/web3auth-context';
import { LoginModal } from './login-modal';
import { useState } from 'react';
import { useContractInteraction } from '@/hooks/useContractInteraction';


const Navbar = () => {
  const { web3auth, loginWithProvider, account, logout: web3authLogout } = useWeb3Auth();
  const { isLoggedIn, currentAccountId } = useContractInteraction();
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleLogout = async () => {
    if (web3auth?.connected) {
      await web3authLogout();
    }
  };


  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-black mr-8">
              X Drop
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                  <Link href="/profile" className="text-sm text-gray-700 font-medium">
                    {currentAccountId}
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginWithProvider={loginWithProvider}
      />
    </nav>
  );
};

export default Navbar;
