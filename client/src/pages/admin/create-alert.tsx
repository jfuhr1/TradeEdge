import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import StockAlertForm from "@/components/forms/stock-alert-form";
import { Redirect } from "wouter";

export default function CreateAlert() {
  const { user } = useAuth();
  const isAdmin = user?.tier === "premium"; // For demo purposes, premium users are admins
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Redirect to="/" />;
  }
  
  return (
    <MainLayout 
      title="Create Stock Alert" 
      description="Create a new stock alert to send to members"
    >
      <StockAlertForm />
    </MainLayout>
  );
}
