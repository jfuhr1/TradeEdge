import React from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function MainLayout({ children, title, description }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="main-content flex-1 p-4 sm:p-6">
        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-neutral-600">{description}</p>}
        </header>
        
        {/* Page Content */}
        {children}
      </main>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
