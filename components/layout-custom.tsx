'use client';

import Navbar from "@/components/nav-bar";

const LayoutCustom = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default LayoutCustom;