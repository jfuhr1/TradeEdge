import { Link, useLocation } from "wouter";
import { Home, Bell, Briefcase, GraduationCap, Calendar, Settings, ChartLine, Trophy, ChevronLeft, ChevronRight, BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Demo user data - hardcoded for display purposes
  const demoUser = {
    name: "Jane Smith",
    tier: "premium"
  };

  const navItems = [
    { href: "/", icon: <Home className="w-5 h-5" />, label: "Dashboard" },
    { href: "/stock-alerts", icon: <Bell className="w-5 h-5" />, label: "Stock Alerts" },
    { href: "/portfolio", icon: <Briefcase className="w-5 h-5" />, label: "My Portfolio" },
    { href: "/notification-settings", icon: <BellRing className="w-5 h-5" />, label: "Notification Settings" },
    { href: "/education", icon: <GraduationCap className="w-5 h-5" />, label: "Education" },
    { href: "/coaching", icon: <Calendar className="w-5 h-5" />, label: "Book Coaching" },
    { href: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
  ];

  return (
    <aside className={`desktop-sidebar fixed ${collapsed ? 'w-16' : 'w-64'} h-full bg-white border-r border-neutral-200 overflow-y-auto transition-all duration-300`}>
      <div className="relative">
        <Button 
          variant="ghost" 
          size="sm"
          className="absolute top-3 right-2 rounded-full w-6 h-6 p-0 flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <ChartLine className="text-primary w-6 h-6 mr-2" />
          {!collapsed && (
            <>
              <h1 className="text-xl font-bold text-primary">TradeEdge Pro</h1>
            </>
          )}
        </div>
        {!collapsed && <p className="text-sm text-neutral-600 mt-1">Smart trades, better returns</p>}
      </div>
      
      {/* User Profile Summary */}
      {!collapsed && (
        <div className="p-4 flex items-center border-b border-neutral-200">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
            {demoUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-medium">{demoUser.name}</p>
            <div className="flex items-center mt-1">
              <span 
                className={`text-xs px-2 py-1 ${
                  demoUser.tier === 'premium' 
                    ? 'bg-primary text-white' 
                    : 'bg-neutral-200 text-neutral-700'
                } rounded-full`}
              >
                {demoUser.tier.charAt(0).toUpperCase() + demoUser.tier.slice(1)}
              </span>
              <Link href="/auth">
                <button className="text-xs text-primary ml-2">
                  Logout
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Links */}
      <nav className={`${collapsed ? 'mt-8' : 'mt-2'}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center p-4 ${
              location === item.href
                ? "text-primary border-l-4 border-primary bg-blue-50"
                : "text-neutral-700 hover:bg-neutral-100"
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className={`${collapsed ? 'w-auto' : 'w-6'}`}>{item.icon}</span>
            {!collapsed && <span className="ml-2">{item.label}</span>}
          </Link>
        ))}
        
        {!collapsed && demoUser.tier === 'free' && (
          <div className="mt-4 mx-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-sm">Your free trial ends in</p>
            <p className="text-primary font-bold font-mono">14 days</p>
            <button className="mt-2 w-full py-2 bg-primary text-white rounded-md text-sm">
              Upgrade Now
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
