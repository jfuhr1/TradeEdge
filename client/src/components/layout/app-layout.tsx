import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { useAuth } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <WebSocketProvider>
      <Navbar />
      <main>
        {children}
      </main>
    </WebSocketProvider>
  );
}