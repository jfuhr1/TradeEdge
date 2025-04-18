import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { StockAlert } from "@shared/schema";
import AlertCard from "../alerts/alert-card";

export default function LatestAlerts() {
  const { data: alerts, isLoading } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get the latest 2 alerts
  const latestAlerts = alerts?.slice(0, 2) || [];

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Latest Alerts</h2>
        <Link href="/stock-alerts" className="text-primary text-sm font-medium">
          View All Alerts
        </Link>
      </div>

      {latestAlerts.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-neutral-600">No stock alerts available yet.</p>
        </div>
      ) : (
        <>
          {latestAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} className="mb-4" />
          ))}
        </>
      )}
    </section>
  );
}
