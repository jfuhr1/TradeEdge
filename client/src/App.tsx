import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import StockAlerts from "./pages/stock-alerts";
import StockDetail from "./pages/stock-detail";
import Portfolio from "./pages/portfolio";
import Education from "./pages/education";
import Coaching from "./pages/coaching";
import CreateAlert from "./pages/admin/create-alert";
import WebSocketTest from "./pages/websocket-test";
import NotFound from "./pages/not-found";

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/stock-alerts" component={StockAlerts} />
      <ProtectedRoute path="/stock/:id" component={StockDetail} />
      <ProtectedRoute path="/portfolio" component={Portfolio} />
      <ProtectedRoute path="/education" component={Education} />
      <ProtectedRoute path="/coaching" component={Coaching} />
      <ProtectedRoute path="/admin/create-alert" component={CreateAlert} />
      <Route path="/ws-test" component={WebSocketTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
