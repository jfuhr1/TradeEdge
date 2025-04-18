import { Link, useLocation } from "wouter";
import { Home, Bell, Briefcase, GraduationCap, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
    { href: "/stock-alerts", icon: <Bell className="w-5 h-5" />, label: "Alerts" },
    { href: "/portfolio", icon: <Briefcase className="w-5 h-5" />, label: "Portfolio" },
    { href: "/education", icon: <GraduationCap className="w-5 h-5" />, label: "Learn" },
    { href: "/settings", icon: <User className="w-5 h-5" />, label: "Profile" },
  ];

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-2 ${
              location === item.href ? "text-primary" : "text-neutral-700"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
