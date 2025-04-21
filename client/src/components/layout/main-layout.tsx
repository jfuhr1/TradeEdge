import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function MainLayout({ children, title, description }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check sidebar state by watching its width
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLElement) {
          const sidebar = document.querySelector('.desktop-sidebar');
          if (sidebar && sidebar instanceof HTMLElement) {
            const isCollapsed = sidebar.classList.contains('w-16');
            setSidebarCollapsed(isCollapsed);
          }
        }
      });
    });

    const sidebar = document.querySelector('.desktop-sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className={`main-content flex-1 p-4 sm:p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
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
