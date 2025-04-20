import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Simple version that just renders the component directly without auth check
// We'll handle auth checking at the page level for now
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return <Route path={path} component={Component} />;
}
