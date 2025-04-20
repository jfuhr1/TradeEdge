import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

type WebSocketContextType = {
  connected: boolean;
  sendMessage: (message: object) => void;
  lastMessage: any | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  lastMessage: null
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connectWebSocket = () => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Connection opened
      socket.addEventListener("open", () => {
        console.log("WebSocket connected");
        setConnected(true);
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Subscribe to stock updates by default
        socket.send(JSON.stringify({ 
          type: "subscribe", 
          channel: "stock_updates" 
        }));
      });
      
      // Listen for messages
      socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received from server:", data);
          setLastMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });
      
      // Handle errors
      socket.addEventListener("error", (event) => {
        console.error("WebSocket error:", event);
        setConnected(false);
      });
      
      // Handle connection close
      socket.addEventListener("close", () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        
        // Attempt to reconnect after a delay
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          connectWebSocket();
        }, 3000);
      });
      
      return socket;
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      
      // Attempt to reconnect after a delay
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log("Attempting to reconnect WebSocket after error...");
        connectWebSocket();
      }, 3000);
      
      return null;
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = connectWebSocket();
    
    // Implement ping for keep-alive
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Function to send messages to the server
  const sendMessage = (message: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.log("WebSocket is not connected, attempting to reconnect...");
      // If not connected, try to reconnect and queue the message
      if (!connected && !reconnectTimeoutRef.current) {
        connectWebSocket();
      }
    }
  };
  
  const value = {
    connected,
    sendMessage,
    lastMessage,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}