import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import { TierProtectedRoute } from "./lib/tier-protected-route";
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

// User Management Pages
import EditUserProfile from "./pages/admin/users/edit-profile/index";
import EditUserPermissions from "./pages/admin/users/edit-permissions/index";
import ChangeTier from "./pages/admin/users/change-tier/index";
import DisableAccount from "./pages/admin/users/disable-account/index";
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
import TierFeaturesDemo from "./pages/tier-features-demo";
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
          <Route path="/tier-features" component={TierFeaturesDemo} />
          
          {/* Basic protected routes - require login only */}
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/success-center" component={SuccessCenter} />
          <ProtectedRoute path="/settings" component={Settings} />
          <ProtectedRoute path="/notifications" component={Notifications} />
          <ProtectedRoute path="/account-settings" component={AccountSettings} />
          
          {/* Tier-protected routes with permission requirements */}
          {/* Free tier features */}
          <TierProtectedRoute 
            path="/stock-alerts" 
            component={StockAlerts} 
            requiredPermission="view_monthly_free_alert"
          />
          <TierProtectedRoute 
            path="/stock-detail/:id" 
            component={StockDetail} 
            requiredPermission="view_monthly_free_alert"
          />
          <TierProtectedRoute 
            path="/education" 
            component={Education} 
            requiredPermission="view_basic_education"
          />
          
          {/* Paid tier features */}
          <TierProtectedRoute 
            path="/portfolio" 
            component={Portfolio} 
            requiredPermission="use_portfolio_tracking" 
          />
          <TierProtectedRoute 
            path="/notification-settings" 
            component={NotificationSettings} 
            requiredPermission="custom_notifications" 
          />
          <TierProtectedRoute 
            path="/notification-settings/stock/:id" 
            component={StockNotificationSettings} 
            requiredPermission="custom_notifications" 
          />
          
          {/* Premium and Mentorship tier features */}
          <TierProtectedRoute 
            path="/coaching" 
            component={Coaching} 
            requiredTier="premium"
          />
          
          {/* Admin routes - require employee tier */}
          <TierProtectedRoute path="/admin" component={AdminIndex} requiredTier="employee" />
          <TierProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredTier="employee" />
          <TierProtectedRoute path="/admin/users" component={AdminUsers} requiredTier="employee" />
          <TierProtectedRoute path="/admin/create-alert" component={CreateAlert} requiredTier="employee" />
          <TierProtectedRoute path="/admin/education" component={AdminEducation} requiredTier="employee" />
          <TierProtectedRoute path="/admin/articles" component={AdminArticles} requiredTier="employee" />
          <TierProtectedRoute path="/admin/coaching" component={AdminCoaching} requiredTier="employee" />
          <TierProtectedRoute path="/admin/performance" component={AlertPerformance} requiredTier="employee" />
          <TierProtectedRoute path="/admin/promotions" component={AdminPromotions} requiredTier="employee" />
          
          {/* User Management Routes */}
          <TierProtectedRoute path="/admin/users/edit-profile" component={EditUserProfile} requiredTier="employee" />
          <TierProtectedRoute path="/admin/users/edit-permissions" component={EditUserPermissions} requiredTier="employee" />
          <TierProtectedRoute path="/admin/users/change-tier" component={ChangeTier} requiredTier="employee" />
          <TierProtectedRoute path="/admin/users/disable-account" component={DisableAccount} requiredTier="employee" />
          <TierProtectedRoute path="/admin/users/add-user" component={AddUser} requiredTier="employee" />
          
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
