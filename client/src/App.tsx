import { Switch, Route } from "wouter";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import StockAlerts from "./pages/stock-alerts";
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
      <Route path="/" component={Dashboard} />
      <Route path="/stock-alerts" component={StockAlerts} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/education" component={Education} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/admin/create-alert" component={CreateAlert} />
      <Route path="/ws-test" component={WebSocketTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
