import { useState } from "react";
import { ContentPermissionWrapper } from "@/components/content-permission-wrapper";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, DollarSignIcon, LockIcon, UnlockIcon, BarChartIcon, BookOpenIcon, VideoIcon, UsersIcon } from "lucide-react";

export default function TierFeaturesDemo() {
  const { user, loginMutation } = useAuth();
  const [selectedTab, setSelectedTab] = useState("features");
  const [demoTier, setDemoTier] = useState(user?.tier || "free");
  
  // For demo purposes - allow changing tier without actually modifying user record
  const handleDemoTierChange = (tier: string) => {
    setDemoTier(tier);
  };

  // Get tier display information
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "free":
        return { name: "Free", icon: <UnlockIcon className="h-4 w-4" />, color: "bg-gray-500" };
      case "paid":
        return { name: "Paid", icon: <DollarSignIcon className="h-4 w-4" />, color: "bg-blue-500" };
      case "premium":
        return { name: "Premium", icon: <CrownIcon className="h-4 w-4" />, color: "bg-amber-500" };
      case "mentorship":
        return { name: "Mentorship", icon: <UsersIcon className="h-4 w-4" />, color: "bg-purple-500" };
      case "employee":
        return { name: "Employee", icon: <Badge className="h-4 w-4" />, color: "bg-green-500" };
      default:
        return { name: "Unknown", icon: <LockIcon className="h-4 w-4" />, color: "bg-gray-500" };
    }
  };

  const tierInfo = getTierInfo(user?.tier || "free");
  const demoTierInfo = getTierInfo(demoTier);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Membership Tier Features</h1>
        <p className="text-muted-foreground">
          This page demonstrates the tier-based access control system and shows what features are available at each membership level.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Your Current Membership</CardTitle>
            <CardDescription>Your account tier and available features</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="flex items-center gap-2">
                <Badge className={tierInfo.color}>{tierInfo.name}</Badge>
                <span>{tierInfo.icon}</span>
                <span className="text-lg font-medium">{user.firstName} {user.lastName}</span>
              </div>
            ) : (
              <p>Please log in to see your membership tier.</p>
            )}
          </CardContent>
          <CardFooter>
            {user ? (
              <Button variant="outline" onClick={() => window.location.href = "/settings?tab=membership"}>
                Manage Membership
              </Button>
            ) : (
              <Button onClick={() => window.location.href = "/auth"}>Log In</Button>
            )}
          </CardFooter>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>
              Preview different membership tiers without changing your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tier-select">Select Tier to Preview</Label>
                <Select value={demoTier} onValueChange={handleDemoTierChange}>
                  <SelectTrigger id="tier-select">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid ($29.99/month)</SelectItem>
                    <SelectItem value="premium">Premium ($999/year)</SelectItem>
                    <SelectItem value="mentorship">Mentorship ($5,000)</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <p>Previewing:</p>
                <Badge className={demoTierInfo.color}>{demoTierInfo.name}</Badge>
                <span>{demoTierInfo.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="features" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="features">Feature Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock Alerts</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="coaching">Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Tier Comparison</CardTitle>
              <CardDescription>See what's included in each membership level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="border-b md:border-b-0 md:border-r border-muted p-4">
                  <h3 className="font-semibold mb-4">Feature Category</h3>
                  <div className="space-y-6">
                    <div className="h-16">Stock Alerts</div>
                    <div className="h-16">Education Content</div>
                    <div className="h-16">Portfolio Tools</div>
                    <div className="h-16">Coaching Access</div>
                    <div className="h-16">Priority Support</div>
                  </div>
                </div>

                <div className="border-b md:border-b-0 md:border-r border-muted p-4">
                  <h3 className="font-semibold mb-2">Free</h3>
                  <Badge variant="outline">$0</Badge>
                  <div className="space-y-6 mt-4">
                    <div className="h-16">One free alert per month</div>
                    <div className="h-16">Basic educational articles</div>
                    <div className="h-16">View-only market data</div>
                    <div className="h-16">Weekly intro webinars</div>
                    <div className="h-16">Standard support channels</div>
                  </div>
                </div>

                <div className="border-b md:border-b-0 md:border-r border-muted p-4">
                  <h3 className="font-semibold mb-2">Paid</h3>
                  <Badge variant="outline">$29.99/month</Badge>
                  <div className="space-y-6 mt-4">
                    <div className="h-16">All stock alerts</div>
                    <div className="h-16">Full education library</div>
                    <div className="h-16">Portfolio tracking</div>
                    <div className="h-16">Weekly new alerts coaching</div>
                    <div className="h-16">Standard support channels</div>
                  </div>
                </div>

                <div className="border-b md:border-b-0 md:border-r border-muted p-4">
                  <h3 className="font-semibold mb-2">Premium</h3>
                  <Badge variant="outline">$999/year</Badge>
                  <div className="space-y-6 mt-4">
                    <div className="h-16">All alerts with priority notifications</div>
                    <div className="h-16">Full education + advanced courses</div>
                    <div className="h-16">Portfolio tracking + analytics</div>
                    <div className="h-16">Q&A sessions + annual review</div>
                    <div className="h-16">Priority support</div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2">Mentorship</h3>
                  <Badge variant="outline">$5,000 one-time</Badge>
                  <div className="space-y-6 mt-4">
                    <div className="h-16">All Premium features</div>
                    <div className="h-16">All Premium features</div>
                    <div className="h-16">Custom portfolio strategy</div>
                    <div className="h-16">20 structured coaching sessions</div>
                    <div className="h-16">VIP support</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alert Features</CardTitle>
              <CardDescription>Preview different alert features by membership tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Tier Stock Features */}
              <ContentPermissionWrapper requiredPermission="view_monthly_free_alert">
                <div className="p-4 bg-muted/40 rounded-lg">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-blue-500" />
                    Monthly Free Stock Alert
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Each month we release one high-quality trade idea for free members.
                  </p>
                  <Button>View Latest Free Alert</Button>
                </div>
              </ContentPermissionWrapper>

              {/* Paid Tier Stock Features */}
              <ContentPermissionWrapper requiredPermission="view_all_alerts">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <BarChartIcon className="h-5 w-5" />
                    All Trade Ideas &amp; Alerts
                  </h3>
                  <p className="text-blue-600/80 dark:text-blue-400/80 mb-4">
                    Get access to all of our trade ideas with detailed analysis, buy zones, targets and technical reasoning.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">MSFT</span>
                      <p className="font-medium">Microsoft Corp.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">AAPL</span>
                      <p className="font-medium">Apple Inc.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">SHOP</span>
                      <p className="font-medium">Shopify Inc.</p>
                    </div>
                  </div>
                  <Button variant="outline">View All Alerts</Button>
                </div>
              </ContentPermissionWrapper>

              {/* Premium Tier Features */}
              <ContentPermissionWrapper requiredPermission="access_priority_notifications">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <CrownIcon className="h-5 w-5" />
                    Priority Notifications
                  </h3>
                  <p className="text-amber-600/80 dark:text-amber-400/80 mb-4">
                    Get instant alerts via SMS when stocks hit key levels. Be the first to know when it's time to act.
                  </p>
                  <Button className="bg-amber-600 hover:bg-amber-700">Configure Notifications</Button>
                </div>
              </ContentPermissionWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Content</CardTitle>
              <CardDescription>Preview education features by membership tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Tier Education */}
              <ContentPermissionWrapper requiredPermission="view_basic_education">
                <div className="p-4 bg-muted/40 rounded-lg">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5 text-green-500" />
                    Basic Educational Content
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Learn the fundamentals of stock trading with our free introductory content.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
                      <h4 className="font-medium">Stock Market Basics</h4>
                      <p className="text-sm text-muted-foreground">Introduction to how the stock market works</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
                      <h4 className="font-medium">Reading Stock Charts</h4>
                      <p className="text-sm text-muted-foreground">Learn the basics of technical analysis</p>
                    </div>
                  </div>
                  <Button>Browse Free Education</Button>
                </div>
              </ContentPermissionWrapper>

              {/* Paid Tier Education */}
              <ContentPermissionWrapper requiredPermission="view_full_education">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                    <VideoIcon className="h-5 w-5" />
                    Complete Education Library
                  </h3>
                  <p className="text-green-600/80 dark:text-green-400/80 mb-4">
                    Access our complete library of educational courses, videos, and trading strategies.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">ADVANCED</span>
                      <p className="font-medium">Advanced Price Action</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">STRATEGY</span>
                      <p className="font-medium">Swing Trading Mastery</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">PSYCHOLOGY</span>
                      <p className="font-medium">Trading Psychology</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-100 dark:hover:bg-green-900">
                    View Full Library
                  </Button>
                </div>
              </ContentPermissionWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Features</CardTitle>
              <CardDescription>Preview coaching options by membership tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Tier Coaching */}
              <ContentPermissionWrapper requiredPermission="attend_weekly_intro">
                <div className="p-4 bg-muted/40 rounded-lg">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-gray-500" />
                    Weekly Intro Sessions
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Attend our weekly introduction to TradeEdge Pro methodology and approach.
                  </p>
                  <Button>Register for Next Session</Button>
                </div>
              </ContentPermissionWrapper>

              {/* Paid Tier Coaching */}
              <ContentPermissionWrapper requiredPermission="attend_weekly_new_alerts">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <UsersIcon className="h-5 w-5" />
                    Weekly New Alerts Breakdown
                  </h3>
                  <p className="text-indigo-600/80 dark:text-indigo-400/80 mb-4">
                    Join weekly sessions where we break down new stock alerts and explain our analysis.
                  </p>
                  <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900">
                    Join This Week's Session
                  </Button>
                </div>
              </ContentPermissionWrapper>

              {/* Premium Tier Coaching */}
              <ContentPermissionWrapper requiredTier="premium">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <CrownIcon className="h-5 w-5" />
                    Premium Q&amp;A Sessions
                  </h3>
                  <p className="text-purple-600/80 dark:text-purple-400/80 mb-2">
                    Participate in exclusive Q&amp;A sessions with our top analysts. Get your trading questions answered live.
                  </p>
                  <p className="text-purple-600/80 dark:text-purple-400/80 mb-4">
                    Plus, receive an annual portfolio review and consultation session.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="bg-purple-600 hover:bg-purple-700">Book Consultation</Button>
                    <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900">
                      View Schedule
                    </Button>
                  </div>
                </div>
              </ContentPermissionWrapper>

              {/* Mentorship Tier Coaching */}
              <ContentPermissionWrapper requiredTier="mentorship">
                <div className="p-4 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-800">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-pink-700 dark:text-pink-400">
                    <UsersIcon className="h-5 w-5" />
                    1-on-1 Coaching Program
                  </h3>
                  <p className="text-pink-600/80 dark:text-pink-400/80 mb-4">
                    Develop your personalized trading strategy with 20 structured coaching sessions over 12 months.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
                      <h4 className="font-medium">Personalized Strategy Development</h4>
                      <p className="text-sm text-muted-foreground">5 initial sessions focused on your goals</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
                      <h4 className="font-medium">Trade Implementation</h4>
                      <p className="text-sm text-muted-foreground">10 sessions executing your strategy</p>
                    </div>
                  </div>
                  <Button className="bg-pink-600 hover:bg-pink-700">View Your Coaching Schedule</Button>
                </div>
              </ContentPermissionWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}