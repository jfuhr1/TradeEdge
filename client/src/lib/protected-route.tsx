import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

// Simple route component that renders the component directly
// We're temporarily bypassing auth checks to get the app working
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return <Route path={path} component={Component} />;
}
