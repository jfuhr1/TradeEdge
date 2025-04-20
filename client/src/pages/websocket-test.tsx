import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";

export default function WebSocketTest() {
  const { connected, sendMessage, lastMessage } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);

  // Add new messages to our list when they arrive
  useEffect(() => {
    if (lastMessage) {
      console.log("Adding message to list:", lastMessage);
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Send a ping message to the server
  const handlePing = () => {
    console.log("Sending ping...");
    sendMessage({ type: "ping" });
  };

  // Subscribe to stock updates
  const handleSubscribe = () => {
    console.log("Subscribing to stock updates...");
    sendMessage({ type: "subscribe", channel: "stock_updates" });
  };

  // Manually render the connection status indicator
  const connectionStatus = (
    <div className="flex items-center mb-4 gap-4">
      <div 
        className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        style={{ backgroundColor: connected ? '#22c55e' : '#ef4444' }}
      />
      <span>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test</h1>
      
      {connectionStatus}
      
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={handlePing}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send Ping
        </Button>
        <Button 
          onClick={handleSubscribe}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Subscribe to Updates
        </Button>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Messages Received: {messages.length}</h2>
      <div className="grid gap-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">No messages received yet.</p>
        ) : (
          messages.map((msg, index) => (
            <Card key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-50 pb-2">
                <CardTitle className="text-lg">Message Type: {msg.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(msg, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}