import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StockAlert } from "@shared/schema";
import { BellRing, Clock, Cog, ExternalLink, Info, Search, Settings, Shield, Sliders } from "lucide-react";
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

// Demo user data - hardcoded for display purposes
const demoUser = {
  id: 1,
  name: "Jane Smith",
  tier: "premium",
  email: "jane.smith@example.com",
  phone: "+1 555-123-4567"
};

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
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
  });

  // Filter alerts based on search query
  const filteredAlerts = alerts?.filter(alert => 
    alert.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    alert.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            ) : filteredAlerts && filteredAlerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredAlerts.map(alert => (
                  <Card key={alert.id} className="transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {alert.symbol}
                          {alert.currentPrice >= alert.buyZoneMin && alert.currentPrice <= alert.buyZoneMax && (
                            <Badge variant="success" className="text-xs">In Buy Zone</Badge>
                          )}
                        </CardTitle>
                        <span className="text-lg font-medium">${alert.currentPrice.toFixed(2)}</span>
                      </div>
                      <CardDescription>{alert.companyName}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm pb-2">
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <p className="text-muted-foreground text-xs">Target 1</p>
                          <p className="font-medium">${alert.target1.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Target 2</p>
                          <p className="font-medium">${alert.target2.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Target 3</p>
                          <p className="font-medium">${alert.target3.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/notification-settings/stock/${alert.id}`}>
                        <Button variant="outline" className="w-full">
                          <Sliders className="mr-2 h-4 w-4" />
                          Manage Notifications
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-8 text-center p-8 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  {searchQuery ? "No stocks found matching your search" : "No stocks available"}
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
                        <Label htmlFor="system-announcements">System Announcements</Label>
                        <p className="text-sm text-muted-foreground">
                          Important platform updates and announcements
                        </p>
                      </div>
                      <Switch 
                        id="system-announcements" 
                        checked={globalSettingsEnabled.systemAnnouncements} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, systemAnnouncements: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="educational-content">Educational Content</Label>
                        <p className="text-sm text-muted-foreground">
                          New courses and educational materials
                        </p>
                      </div>
                      <Switch 
                        id="educational-content" 
                        checked={globalSettingsEnabled.educationalContent} 
                        onCheckedChange={(checked) => setGlobalSettingsEnabled({...globalSettingsEnabled, educationalContent: checked})}
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
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>How Notifications Work</AlertTitle>
              <AlertDescription>
                Global settings override individual stock settings. If you disable a notification channel globally, you won't receive any notifications through that channel, even if enabled for individual stocks.
              </AlertDescription>
            </Alert>
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