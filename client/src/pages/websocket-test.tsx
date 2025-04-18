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
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Send a ping message to the server
  const handlePing = () => {
    sendMessage({ type: "ping" });
  };

  // Subscribe to stock updates
  const handleSubscribe = () => {
    sendMessage({ type: "subscribe", channel: "stock_updates" });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test</h1>
      
      <div className="flex items-center mb-4 gap-4">
        <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={handlePing}>Send Ping</Button>
        <Button onClick={handleSubscribe}>Subscribe to Updates</Button>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Messages Received:</h2>
      <div className="grid gap-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">No messages received yet.</p>
        ) : (
          messages.map((msg, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Message Type: {msg.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
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