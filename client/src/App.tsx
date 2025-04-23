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
import AlertSettings from "./pages/alert-settings";
import AccountSettings from "./pages/account-settings";
import NotificationSettings from "./pages/notification-settings";
import StockNotificationSettings from "./pages/notification-settings/stock/[id]";
import SuccessCenter from "./pages/success-center";
import WebSocketTest from "./pages/websocket-test";
import NotFound from "./pages/not-found";
import { AppLayout } from "./components/layout/app-layout";
import { AuthProvider } from "./hooks/use-auth";

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/ws-test" component={WebSocketTest} />
          <ProtectedRoute path="/success-center" component={SuccessCenter} />
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/stock-alerts" component={StockAlerts} />
          <ProtectedRoute path="/stock-detail/:id" component={StockDetail} />
          <ProtectedRoute path="/portfolio" component={Portfolio} />
          <ProtectedRoute path="/education" component={Education} />
          <ProtectedRoute path="/coaching" component={Coaching} />
          <ProtectedRoute path="/alert-settings" component={AlertSettings} />
          <ProtectedRoute path="/account-settings" component={AccountSettings} />
          <ProtectedRoute path="/notification-settings" component={NotificationSettings} />
          <ProtectedRoute path="/notification-settings/stock/:id" component={StockNotificationSettings} />
          <ProtectedRoute path="/admin/create-alert" component={CreateAlert} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
