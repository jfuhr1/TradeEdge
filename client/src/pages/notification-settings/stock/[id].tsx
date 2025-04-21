import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockAlert } from "@shared/schema";
import { ArrowLeft, BellRing, Check, Info, Plus, Target, ArrowDownToLine } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

// Demo user data - hardcoded for display purposes
const demoUser = {
  id: 1,
  name: "Jane Smith",
  tier: "premium",
  email: "jane.smith@example.com",
  phone: "+1 555-123-4567"
};

export default function StockNotificationSettings() {
  const [, params] = useRoute("/notification-settings/stock/:id");
  const stockId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference>({
    userId: demoUser.id,
    stockAlertId: stockId || 0,
    // Target Alerts
    target1: {
      web: true,
      email: false,
      sms: false
    },
    target2: {
      web: true,
      email: false,
      sms: false
    },
    target3: {
      web: true,
      email: false,
      sms: false
    },
    customTarget: {
      percent: null,
      web: false,
      email: false,
      sms: false
    },
    // Buy Zone Alerts
    buyZoneLow: {
      web: true,
      email: false,
      sms: false
    },
    buyZoneHigh: {
      web: true,
      email: false,
      sms: false
    },
    buyLimit: {
      price: null,
      web: false,
      email: false,
      sms: false
    }
  });

  // Fetch stock alert details by ID
  const { data: alert, isLoading: isLoadingAlert } = useQuery<StockAlert>({
    queryKey: [`/api/stock-alerts/${stockId}`],
    enabled: !!stockId,
  });

  // Fetch notification preferences
  const { data: existingPreferences, isLoading: isLoadingPreferences } = useQuery<NotificationPreference>({
    queryKey: [`/api/alert-preferences/stock/${stockId}`],
    enabled: !!stockId,
    onSuccess: (data) => {
      if (data) {
        setPreferences(data);
      }
    },
    onError: () => {
      // If no preferences found, use defaults
    }
  });

  // Check if user is premium
  useEffect(() => {
    // In a real app, this would check the user's tier from auth context
    if (demoUser.tier === 'free') {
      setShowUpgradeDialog(true);
    }
  }, []);

  // Save notification preferences
  const savePreferences = useMutation({
    mutationFn: async () => {
      if (!alert) throw new Error("Stock alert not found");
      
      const res = await apiRequest("POST", "/api/alert-preferences", preferences);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings saved",
        description: `Your notification preferences for ${alert?.symbol} have been updated.`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/alert-preferences/stock/${stockId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save notification settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCheckboxChange = (
    target: 'target1' | 'target2' | 'target3' | 'customTarget' | 'buyZoneLow' | 'buyZoneHigh' | 'buyLimit',
    channel: 'web' | 'email' | 'sms',
    checked: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [target]: {
        ...prev[target],
        [channel]: checked
      }
    }));
  };

  const handlePercentChange = (value: string) => {
    const percent = value === '' ? null : parseFloat(value);
    setPreferences(prev => ({
      ...prev,
      customTarget: {
        ...prev.customTarget,
        percent: percent
      }
    }));
  };
  
  const handlePriceChange = (value: string) => {
    const price = value === '' ? null : parseFloat(value);
    setPreferences(prev => ({
      ...prev,
      buyLimit: {
        ...prev.buyLimit,
        price: price
      }
    }));
  };

  if (isLoadingAlert || !alert) {
    return (
      <MainLayout title="Notification Settings">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Notification Settings - ${alert.symbol}`}>
      {/* Back Button */}
      <Link href={`/stock-detail/${alert.id}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {alert.symbol} Details
        </Button>
      </Link>

      <div className="grid grid-cols-1 gap-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <BellRing className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notification Settings for {alert.symbol}</h1>
          </div>
          <p className="text-muted-foreground">
            Configure how and when you want to be notified about price movements for {alert.symbol}.
          </p>
        </div>

        {/* Target Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Target className="mr-2 h-5 w-5 text-primary" />
              Target Alerts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get notified when price targets are hit for the first time. Percentages are from the midpoint of the buy zone
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Target</TableHead>
                    <TableHead className="w-[25%] text-center">Web Notification</TableHead>
                    <TableHead className="w-[25%] text-center">Email Notification</TableHead>
                    <TableHead className="w-[25%] text-center">SMS Notification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Target 1: ${alert.target1.toFixed(2)}
                      <span className="block text-xs text-green-600">
                        +{(((alert.target1 / alert.currentPrice) - 1) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target1.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target1', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target1.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target1', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target1.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target1', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      Target 2: ${alert.target2.toFixed(2)}
                      <span className="block text-xs text-green-600">
                        +{(((alert.target2 / alert.currentPrice) - 1) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target2.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target2', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target2.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target2', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target2.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target2', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      Target 3: ${alert.target3.toFixed(2)}
                      <span className="block text-xs text-green-600">
                        +{(((alert.target3 / alert.currentPrice) - 1) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target3.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target3', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target3.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target3', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.target3.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('target3', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-14">
                          <Input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            placeholder="%"
                            value={preferences.customTarget.percent !== null ? preferences.customTarget.percent : ''}
                            onChange={(e) => handlePercentChange(e.target.value)}
                            className="w-full appearance-none"
                          />
                        </div>
                        <span>% Custom Target</span>
                      </div>
                      <span className="block text-xs text-muted-foreground">
                        Percentage from midpoint of buy zone
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.customTarget.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('customTarget', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.customTarget.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('customTarget', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.customTarget.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('customTarget', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Buy Zone Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <ArrowDownToLine className="mr-2 h-5 w-5 text-primary" />
              Buy Zone Alerts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get notified when price sell off into the buy zone from above or hits custom buy points for a low cost entry
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Alert Type</TableHead>
                    <TableHead className="w-[25%] text-center">Web Notification</TableHead>
                    <TableHead className="w-[25%] text-center">Email Notification</TableHead>
                    <TableHead className="w-[25%] text-center">SMS Notification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Buy Zone Low
                      <span className="block text-xs text-muted-foreground">
                        When price reaches ${alert.buyZoneMin.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneLow.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneLow', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneLow.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneLow', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneLow.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneLow', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      Buy Zone High
                      <span className="block text-xs text-muted-foreground">
                        When price reaches ${alert.buyZoneMax.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneHigh.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneHigh', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneHigh.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneHigh', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyZoneHigh.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyZoneHigh', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <Input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            placeholder="$"
                            value={preferences.buyLimit.price !== null ? preferences.buyLimit.price : ''}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            className="w-full appearance-none"
                          />
                        </div>
                        <span>Buy Limit</span>
                      </div>
                      <span className="block text-xs text-muted-foreground">
                        Must be below current price (${alert.currentPrice.toFixed(2)})
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyLimit.web}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyLimit', 'web', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyLimit.email}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyLimit', 'email', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preferences.buyLimit.sms}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('buyLimit', 'sms', !!checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert className="bg-primary/10 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle>About Notification Channels</AlertTitle>
                <AlertDescription className="text-sm">
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Web Notifications:</strong> Receive alerts in your browser when logged into TradeEdge Pro.</li>
                    <li><strong>Email Notifications:</strong> Receive alerts at {demoUser.email}.</li>
                    <li><strong>SMS Notifications:</strong> Receive text message alerts at {demoUser.phone}.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">All notifications are one-time only when price targets are first reached.</p>
            </div>
            <Button
              onClick={() => savePreferences.mutate()}
              disabled={savePreferences.isPending}
              size="lg"
            >
              {savePreferences.isPending ? "Saving..." : "Save Notification Settings"}
            </Button>
          </div>
        </div>

        {/* Link to global notification settings */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-muted-foreground" />
            <span>Manage all your notification settings</span>
          </div>
          <Link href="/notification-settings">
            <Button variant="outline">
              Go to Notification Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Upgrade dialog for free users */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Feature</DialogTitle>
            <DialogDescription>
              Custom notifications are available to premium members only. Upgrade your account to access this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-500" />
              <span>Receive notifications when prices hit your targets</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-500" />
              <span>Set custom price targets for any stock</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Choose from web, email, and SMS notifications</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Link href="/settings?upgrade=true">
              <Button>Upgrade Now</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}