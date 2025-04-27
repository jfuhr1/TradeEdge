import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  CreditCard, 
  Settings as SettingsIcon, 
  Layout, 
  LineChart, 
  Users, 
  Bell, 
  MoveUpRight,
  Key
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define dashboard sections that can be toggled
const dashboardSections = [
  { id: "portfolio", label: "Portfolio Overview", defaultChecked: true },
  { id: "stockAlerts", label: "Latest Stock Alerts", defaultChecked: true },
  { id: "buyZone", label: "Stocks in Buy Zone", defaultChecked: true },
  { id: "approachingTargets", label: "Stocks Approaching Targets", defaultChecked: true },
  { id: "recentlyHitTargets", label: "Recently Hit Targets", defaultChecked: true },
  { id: "education", label: "Education Progress", defaultChecked: true },
  { id: "coaching", label: "Coaching Sessions", defaultChecked: false }
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  
  // States for dashboard settings
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    dashboardSections.reduce((acc, section) => ({ ...acc, [section.id]: section.defaultChecked }), {})
  );
  const [defaultAlertCount, setDefaultAlertCount] = useState("6");
  const [defaultBuyZoneCount, setDefaultBuyZoneCount] = useState("all");
  const [chartTimeframe, setChartTimeframe] = useState("1D");
  
  // States for profile settings
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  
  // States for trading preferences
  const [positionSize, setPositionSize] = useState("5");
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [defaultStopLoss, setDefaultStopLoss] = useState("5");
  
  // Save dashboard settings
  const saveDashboardSettings = async () => {
    try {
      // In a real app, we would save these settings to the user's profile
      // For the prototype we'll just show a success toast
      toast({
        title: "Dashboard settings saved",
        description: "Your dashboard preferences have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Save profile settings
  const saveProfileSettings = async () => {
    try {
      // In a real app, we would update the user's profile
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Save trading preferences
  const saveTradingPreferences = async () => {
    try {
      toast({
        title: "Trading preferences saved",
        description: "Your trading preferences have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle toggle change
  const handleToggleChange = (sectionId: string, checked: boolean) => {
    setVisibleSections(prev => ({
      ...prev,
      [sectionId]: checked
    }));
  };

  return (
    <MainLayout 
      title="Settings" 
      description="Customize your TradeEdge Pro experience"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Membership</span>
            </TabsTrigger>
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span>Trading</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Settings Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Customization</CardTitle>
                <CardDescription>
                  Configure which sections appear on your dashboard and their default settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Visible Dashboard Sections</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dashboardSections.map(section => (
                      <div className="flex items-center space-x-2" key={section.id}>
                        <Switch 
                          id={`dashboard-section-${section.id}`} 
                          checked={visibleSections[section.id]} 
                          onCheckedChange={(checked) => handleToggleChange(section.id, checked)}
                        />
                        <Label htmlFor={`dashboard-section-${section.id}`}>{section.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Default Display Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default-alert-count">Default Number of Stock Alerts</Label>
                      <Select 
                        value={defaultAlertCount} 
                        onValueChange={setDefaultAlertCount}
                      >
                        <SelectTrigger id="default-alert-count">
                          <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default-buy-zone-count">Default Buy Zone Display</Label>
                      <Select 
                        value={defaultBuyZoneCount} 
                        onValueChange={setDefaultBuyZoneCount}
                      >
                        <SelectTrigger id="default-buy-zone-count">
                          <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default-chart-timeframe">Default Chart Timeframe</Label>
                      <Select 
                        value={chartTimeframe} 
                        onValueChange={setChartTimeframe}
                      >
                        <SelectTrigger id="default-chart-timeframe">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1D">1 Day</SelectItem>
                          <SelectItem value="1W">1 Week</SelectItem>
                          <SelectItem value="1M">1 Month</SelectItem>
                          <SelectItem value="3M">3 Months</SelectItem>
                          <SelectItem value="1Y">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveDashboardSettings}>Save Dashboard Settings</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Related Settings</CardTitle>
                <CardDescription>
                  Configure other preferences that affect your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure which notifications appear and how they're delivered</p>
                  </div>
                  <Link href="/notification-settings">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Configure
                    </Button>
                  </Link>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Custom Alert Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure your personalized stock alert preferences</p>
                  </div>
                  <Link href="/alert-settings">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Configure
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input 
                      id="profile-name" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email Address</Label>
                    <Input 
                      id="profile-email" 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone Number</Label>
                    <Input 
                      id="profile-phone" 
                      type="tel" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveProfileSettings}>Save Profile</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Change
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Enhance your account security with 2FA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Not Enabled</Badge>
                    <Button variant="outline">Setup</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Membership Tab */}
          <TabsContent value="membership" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Membership</CardTitle>
                <CardDescription>
                  View and manage your TradeEdge Pro subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Premium Tier</h3>
                      <p className="text-sm text-muted-foreground">Subscribed since April 15, 2025</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Billing Cycle</span>
                      <span className="text-sm font-medium">Annual</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Next Billing Date</span>
                      <span className="text-sm font-medium">April 15, 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Amount</span>
                      <span className="text-sm font-medium">$999.00 / year</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <Button variant="outline" className="flex-1">Update Payment Information</Button>
                  <Button variant="outline" className="flex-1">View Billing History</Button>
                  <Button variant="outline" className="flex-1">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upgrade Your Membership</CardTitle>
                <CardDescription>
                  Explore other membership tiers to get more benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle>Mentorship Tier</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Most Popular</Badge>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="mb-2">
                        <span className="text-3xl font-bold">$5,000</span>
                        <span className="text-muted-foreground"> one-time</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <MoveUpRight className="h-4 w-4 text-primary" />
                          <span>All Premium features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <MoveUpRight className="h-4 w-4 text-primary" />
                          <span>1-on-1 coaching sessions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <MoveUpRight className="h-4 w-4 text-primary" />
                          <span>Private Discord channel access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <MoveUpRight className="h-4 w-4 text-primary" />
                          <span>Portfolio review sessions</span>
                        </li>
                      </ul>
                      <Button className="w-full">Upgrade Now</Button>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Membership Benefits</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your Premium membership includes:
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Unlimited stock alerts</li>
                        <li>• Full educational library access</li>
                        <li>• Weekly group coaching sessions</li>
                        <li>• Priority support</li>
                        <li>• Advanced technical analysis</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Need Help?</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        If you have any questions about your membership or need assistance, our support team is here to help.
                      </p>
                      <Button variant="outline" className="w-full">Contact Support</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trading Preferences Tab */}
          <TabsContent value="trading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Preferences</CardTitle>
                <CardDescription>
                  Configure your default trading settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="position-size">Default Position Size (% of Portfolio)</Label>
                    <Select 
                      value={positionSize} 
                      onValueChange={setPositionSize}
                    >
                      <SelectTrigger id="position-size">
                        <SelectValue placeholder="Select position size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1%</SelectItem>
                        <SelectItem value="2">2%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                    <Select 
                      value={riskTolerance} 
                      onValueChange={setRiskTolerance}
                    >
                      <SelectTrigger id="risk-tolerance">
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-stop-loss">Default Stop Loss (%)</Label>
                    <Select 
                      value={defaultStopLoss} 
                      onValueChange={setDefaultStopLoss}
                    >
                      <SelectTrigger id="default-stop-loss">
                        <SelectValue placeholder="Select stop loss" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Automated Trading Settings</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-add-to-portfolio" />
                    <Label htmlFor="auto-add-to-portfolio">Automatically add new stock alerts to my portfolio tracking</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-alerts" />
                    <Label htmlFor="auto-alerts">Enable automatic price alerts for all stocks</Label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveTradingPreferences}>Save Trading Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Preferences</CardTitle>
                <CardDescription>
                  Customize the look and feel of your TradeEdge Pro experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-primary cursor-pointer hover:bg-accent/50 transition">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="w-full h-20 bg-background mb-4 rounded-md border"></div>
                        <p className="text-sm font-medium">Light Mode</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-accent/50 transition">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="w-full h-20 bg-black mb-4 rounded-md border"></div>
                        <p className="text-sm font-medium">Dark Mode</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-accent/50 transition">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="w-full h-20 bg-gradient-to-b from-background to-black mb-4 rounded-md border"></div>
                        <p className="text-sm font-medium">System Default</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Chart Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="chart-color-scheme">Chart Color Scheme</Label>
                      <Select defaultValue="default">
                        <SelectTrigger id="chart-color-scheme">
                          <SelectValue placeholder="Select color scheme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (Green/Red)</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                          <SelectItem value="colorblind">Colorblind Friendly</SelectItem>
                          <SelectItem value="trading">Trading View Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Default Chart Type</Label>
                      <Select defaultValue="candle">
                        <SelectTrigger id="chart-type">
                          <SelectValue placeholder="Select chart type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="candle">Candlestick</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Display Settings</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="compact-view" />
                    <Label htmlFor="compact-view">Use compact view (smaller padding and font sizes)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="show-animations" defaultChecked />
                    <Label htmlFor="show-animations">Show animations and transitions</Label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Appearance Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}