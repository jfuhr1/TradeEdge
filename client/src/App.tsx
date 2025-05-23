import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import StockAlerts from "./pages/stock-alerts";
import StockDetail from "./pages/stock-detail";
import SampleStockPick from "./pages/sample-stock-pick";
import Portfolio from "./pages/portfolio";
import Education from "./pages/education";
import Coaching from "./pages/coaching";

// Admin pages
import AdminIndex from "./pages/admin/index";
import AdminUsers from "./pages/admin/users/index";
import CreateAlert from "./pages/admin/create-alert";
import AdminDashboard from "./pages/admin/dashboard";
import AdminEducation from "./pages/admin/education";
import AdminArticles from "./pages/admin/articles";
import AdminCoaching from "./pages/admin/coaching";
import AlertPerformance from "./pages/admin/performance";
import AdminPromotions from "./pages/admin/promotions";
import AdminAnalytics from "./pages/admin/analytics/index";
import AdminStockAlerts from "./pages/admin/stock-alerts/index";
import CreateStockAlert from "./pages/admin/stock-alerts/create";
import StockAlertPreview from "./pages/admin/stock-alerts/preview";
import RecoverDraftPage from "./pages/admin/stock-alerts/recover-draft";

// User Management Pages
import ManageUser from "./pages/admin/users/manage/index";
import ManageUserCombined from "./pages/admin/users/manage-combined/index";
import DemoUserDiagnostic from "./pages/admin/users/manage-combined/demouser-simple";
import AddUser from "./pages/admin/users/add-user/index";

import AccountSettings from "./pages/account-settings";
import NotificationSettings from "./pages/notification-settings";
import StockNotificationSettings from "./pages/notification-settings/stock/[id]";
import SuccessCenter from "./pages/success-center";
import WebSocketTest from "./pages/websocket-test";
import NotFound from "./pages/not-found";
import LandingPage from "./pages/landing-page";
import SignupPage from "./pages/signup";
import WelcomePage from "./pages/welcome";
import Notifications from "./pages/notifications";
import Settings from "./pages/settings";
import SubscribePage from "./pages/subscribe";
import { AppLayout } from "./components/layout/app-layout";
import { AuthProvider } from "./hooks/use-auth";

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={LandingPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/welcome" component={WelcomePage} />
          <Route path="/sample-stock-pick" component={SampleStockPick} />
          <Route path="/ws-test" component={WebSocketTest} />
          
          {/* Protected routes - require login */}
          <ProtectedRoute path="/subscribe" component={SubscribePage} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/success-center" component={SuccessCenter} />
          <ProtectedRoute path="/stock-alerts" component={StockAlerts} />
          <ProtectedRoute path="/stock-detail/:id" component={StockDetail} />
          <ProtectedRoute path="/portfolio" component={Portfolio} />
          <ProtectedRoute path="/education" component={Education} />
          <ProtectedRoute path="/coaching" component={Coaching} />

          <ProtectedRoute path="/account-settings" component={AccountSettings} />
          <ProtectedRoute path="/settings" component={Settings} />
          <ProtectedRoute path="/notifications" component={Notifications} />
          <ProtectedRoute path="/notification-settings" component={NotificationSettings} />
          <ProtectedRoute path="/notification-settings/stock/:id" component={StockNotificationSettings} />
          
          {/* Admin routes */}
          <AdminRoute path="/admin" component={AdminIndex} />
          <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
          <AdminRoute path="/admin/users" component={AdminUsers} />
          <AdminRoute path="/admin/create-alert" component={CreateAlert} />
          <AdminRoute path="/admin/stock-alerts" component={AdminStockAlerts} />
          <AdminRoute path="/admin/stock-alerts/create" component={CreateStockAlert} />
          <AdminRoute path="/admin/stock-alerts/preview" component={StockAlertPreview} />
          <AdminRoute path="/admin/stock-alerts/recover-draft" component={RecoverDraftPage} />
          <AdminRoute path="/admin/stock-alerts/edit/:id" component={CreateStockAlert} />
          <AdminRoute path="/admin/education" component={AdminEducation} />
          <AdminRoute path="/admin/articles" component={AdminArticles} />
          <AdminRoute path="/admin/coaching" component={AdminCoaching} />
          <AdminRoute path="/admin/performance" component={AlertPerformance} />
          <AdminRoute path="/admin/promotions" component={AdminPromotions} />
          <AdminRoute path="/admin/analytics" component={AdminAnalytics} />
          
          {/* User Management Routes */}
          <AdminRoute path="/admin/users/manage/:id" component={ManageUser} />
          <AdminRoute path="/admin/users/manage-combined/demouser" component={DemoUserDiagnostic} />
          <AdminRoute path="/admin/users/manage-combined/:id" component={ManageUserCombined} />
          <AdminRoute path="/admin/users/add-user" component={AddUser} />
          
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
