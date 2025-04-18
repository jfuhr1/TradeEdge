import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import StockAlerts from "./pages/stock-alerts";
import Portfolio from "./pages/portfolio";
import Education from "./pages/education";
import Coaching from "./pages/coaching";
import CreateAlert from "./pages/admin/create-alert";
import NotFound from "./pages/not-found";

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/stock-alerts" component={StockAlerts} />
      <ProtectedRoute path="/portfolio" component={Portfolio} />
      <ProtectedRoute path="/education" component={Education} />
      <ProtectedRoute path="/coaching" component={Coaching} />
      <ProtectedRoute path="/admin/create-alert" component={CreateAlert} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
