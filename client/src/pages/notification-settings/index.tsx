import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StockAlert } from "@shared/schema";
import { 
  BellRing, 
  Clock, 
  Cog, 
  ExternalLink, 
  Info, 
  Search, 
  Settings, 
  Shield, 
  Sliders,
  Check,
  X
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Demo user data - hardcoded for display purposes
const demoUser = {
  id: 1,
  name: "Jane Smith",
  tier: "premium",
  email: "jane.smith@example.com",
  phone: "+1 555-123-4567"
};

// Type for alert preferences - simplified for demo
interface NotificationPreference {
  id?: number;
  userId: number;
  stockAlertId: number; 
  // Target Alerts
  target1: {
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  target2: {
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  target3: {
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  customTarget: {
    percent: number | null;
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  // Buy Zone Alerts
  buyZoneLow: {
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  buyZoneHigh: {
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  buyLimit: {
    price: number | null;
    web: boolean;
    email: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function NotificationSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSettingsEnabled, setGlobalSettingsEnabled] = useState({
    email: true,
    sms: false,
    web: true,
    priceAlerts: true,
    systemAnnouncements: true,
    educationalContent: true,
    marketUpdates: false
  });

  // Fetch all stock alerts
  const { data: alerts, isLoading: isLoadingAlerts, error } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
    
    // Using retry false to avoid multiple unnecessary requests in demo mode
    retry: false
  });
  
  // Log any errors for debugging
  if (error) {
    console.error("Error fetching stock alerts:", error);
  }

  // For demo purposes, create dummy preferences
  const generateDummyPreferences = () => {
    if (!alerts) return [];
    
    return alerts.map(alert => ({
      alert,
      preference: {
        id: Math.floor(Math.random() * 1000),
        userId: demoUser.id,
        stockAlertId: alert.id,
        target1: {
          web: Math.random() > 0.3,
          email: Math.random() > 0.5,
          sms: Math.random() > 0.7,
        },
        target2: {
          web: Math.random() > 0.3,
          email: Math.random() > 0.5,
          sms: Math.random() > 0.7,
        },
        target3: {
          web: Math.random() > 0.3,
          email: Math.random() > 0.5,
          sms: Math.random() > 0.7,
        },
        customTarget: {
          percent: null,
          web: false,
          email: false,
          sms: false,
        },
        buyZoneLow: {
          web: Math.random() > 0.3,
          email: Math.random() > 0.5,
          sms: Math.random() > 0.7,
        },
        buyZoneHigh: {
          web: Math.random() > 0.3,
          email: Math.random() > 0.5,
          sms: Math.random() > 0.7,
        },
        buyLimit: {
          price: null,
          web: false,
          email: false,
          sms: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }));
  };

  // Generate dummy preferences
  const alertsWithPreferences = generateDummyPreferences();

  // Filter based on search query
  const filteredPreferences = alertsWithPreferences.filter(({ alert }) => 
    alert.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    alert.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to render a checkmark or X for notification status
  const renderNotificationStatus = (isEnabled: boolean) => {
    return isEnabled ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-gray-300" />
    );
  };

  return (
    <MainLayout title="Notification Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <BellRing className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notification Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your notification preferences across the platform. Choose when and how you want to be notified.
          </p>
        </div>

        <Tabs defaultValue="stocks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="global">Global Settings</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>
          
          {/* Stock-specific notification settings */}
          <TabsContent value="stocks" className="space-y-4 pt-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks by symbol or name"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoadingAlerts ? (
              <div className="mt-8 grid place-items-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredPreferences.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[12%]">Stock Symbol</TableHead>
                      <TableHead className="w-[12%]">Alert Date</TableHead>
                      <TableHead className="w-[9%] text-center">Target 1</TableHead>
                      <TableHead className="w-[9%] text-center">Target 2</TableHead>
                      <TableHead className="w-[9%] text-center">Target 3</TableHead>
                      <TableHead className="w-[10%] text-center">Custom Target</TableHead>
                      <TableHead className="w-[9%] text-center">Buy Zone Low</TableHead>
                      <TableHead className="w-[9%] text-center">Buy Zone High</TableHead>
                      <TableHead className="w-[9%] text-center">Custom Buy Limit</TableHead>
                      <TableHead className="w-[12%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreferences.map(({ alert, preference }) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {alert.symbol}
                            {alert.currentPrice >= alert.buyZoneMin && alert.currentPrice <= alert.buyZoneMax && (
                              <Badge variant="success" className="text-xs">In Buy Zone</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {alert.companyName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(alert.createdAt), 'MM/dd/yyyy')}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">${alert.target1.toFixed(2)}</span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.target1.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">${alert.target2.toFixed(2)}</span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.target2.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">${alert.target3.toFixed(2)}</span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.target3.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">
                              {preference.customTarget.percent ? 
                                `${preference.customTarget.percent}%` : 
                                '—'}
                            </span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.customTarget.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">${alert.buyZoneMin.toFixed(2)}</span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.buyZoneLow.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">${alert.buyZoneMax.toFixed(2)}</span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.buyZoneHigh.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">
                              {preference.buyLimit.price ? 
                                `$${preference.buyLimit.price.toFixed(2)}` : 
                                '—'}
                            </span>
                            <div className="flex justify-center gap-1">
                              {renderNotificationStatus(preference.buyLimit.web)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/notification-settings/stock/${alert.id}`}>
                            <Button variant="outline" size="sm">
                              <Sliders className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="mt-8 text-center p-8 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  {searchQuery ? "No stocks found matching your search" : "No notification preferences set. Add stock alerts to your watchlist first."}
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Global notification settings */}
          <TabsContent value="global" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="h-5 w-5" />
                  Global Notification Settings
                </CardTitle>
                <CardDescription>
                  These settings apply to all notifications across the platform
                </CardDescription>
              </CardHeader>
              <Alert className="mt-2 mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>How Notifications Work</AlertTitle>
                <AlertDescription>
                  Global settings override individual stock settings. If you disable a notification channel globally, you won't receive any notifications through that channel, even if enabled for individual stocks.
                </AlertDescription>
              </Alert>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="web-notifications">Web Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications in your browser
                        </p>
                      </div>
                      <Switch 
                        id="web-notifications" 
                        checked={globalSettingsEnabled.web} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, web: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications to {demoUser.email}
                        </p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={globalSettingsEnabled.email} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, email: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send text messages to {demoUser.phone}
                        </p>
                      </div>
                      <Switch 
                        id="sms-notifications" 
                        checked={globalSettingsEnabled.sms} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, sms: checked})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <Alert variant="warning" className="mb-4">
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Avoid Notification Fatigue</AlertTitle>
                    <AlertDescription>
                      We recommend not overdoing alerts as it can create fatigue with the app over time. There may be multiple stock alerts per day and multiple previous alerts hitting buy zones and targets each day, so keep your notifications focused on what matters most to you.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="price-alerts">Price Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when stocks hit target prices
                        </p>
                      </div>
                      <Switch 
                        id="price-alerts" 
                        checked={globalSettingsEnabled.priceAlerts} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, priceAlerts: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-stock-alerts">New Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          When a new stock alert is added by our team
                        </p>
                      </div>
                      <Switch 
                        id="new-stock-alerts" 
                        checked={globalSettingsEnabled.systemAnnouncements} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, systemAnnouncements: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="market-updates">Market Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Daily market summary and news
                        </p>
                      </div>
                      <Switch 
                        id="market-updates" 
                        checked={globalSettingsEnabled.marketUpdates} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, marketUpdates: checked})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">
                  Save Global Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Contact information for notifications */}
          <TabsContent value="contact" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Manage your contact information for notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue={demoUser.email} />
                  <p className="text-sm text-muted-foreground">
                    Used for email notifications and account updates
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue={demoUser.phone} />
                  <p className="text-sm text-muted-foreground">
                    Used for SMS notifications and authentication
                  </p>
                </div>
                
                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Notification Frequency</AlertTitle>
                  <AlertDescription>
                    To prevent notification fatigue, we limit SMS notifications to important alerts and consolidate others into a daily digest. You can manage these preferences in your account settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">
                  Update Contact Info
                </Button>
              </CardFooter>
            </Card>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <p>
                  Need to update more account information? Visit your 
                  <Link href="/settings">
                    <span className="text-primary hover:underline cursor-pointer"> account settings page</span>
                  </Link>.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}