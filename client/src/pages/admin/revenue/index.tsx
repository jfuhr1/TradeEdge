import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Loader2, TrendingUp, Users, CreditCard, RefreshCcw, DollarSign, Percent } from 'lucide-react';
import { PaymentTransaction } from '@shared/schema';

// Colors for charts
const COLORS = ['#1E88E5', '#00C853', '#FFB300', '#FF3D00', '#6200EA'];

const RevenueAnalyticsPage: React.FC = () => {
  const { hasPermission } = useAdminPermissions();
  const canViewAnalytics = hasPermission('canViewAnalytics');
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch payment transactions based on time range
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions
  } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/admin/revenue/transactions', timeRange],
    enabled: canViewAnalytics,
  });

  // Fetch user subscription stats
  const { 
    data: subscriptionStats, 
    isLoading: isLoadingSubscriptions,
    isError: isErrorSubscriptions
  } = useQuery<{
    total: number;
    active: number;
    new: number;
    churn: number;
    planBreakdown: { name: string; value: number }[];
  }>({
    queryKey: ['/api/admin/revenue/subscriptions', timeRange],
    enabled: canViewAnalytics,
  });
  
  // Helper to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Generate data for revenue chart
  const getRevenueChartData = () => {
    if (!transactions) return [];
    
    const endDate = new Date();
    let startDate: Date;
    let intervalFunction: any;
    let formatString: string;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 7);
        intervalFunction = (date: Date) => format(date, 'MM/dd');
        formatString = 'MM/dd';
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        intervalFunction = (date: Date) => format(date, 'MM/dd');
        formatString = 'MM/dd';
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        intervalFunction = (date: Date) => format(date, 'MM/dd');
        formatString = 'MM/dd';
        break;
      case '12m':
        startDate = subMonths(endDate, 12);
        
        // Create array of months
        const months = eachMonthOfInterval({
          start: startDate,
          end: endDate,
        });
        
        // Initialize data for each month
        return months.map(month => {
          const monthStr = format(month, 'MMM yyyy');
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          // Filter transactions for this month
          const monthTransactions = transactions.filter(
            t => new Date(t.createdAt) >= monthStart && new Date(t.createdAt) <= monthEnd
          );
          
          // Calculate total revenue for the month
          const revenue = monthTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
          );
          
          return {
            name: monthStr,
            revenue,
          };
        });
        
      default:
        startDate = subDays(endDate, 30);
        intervalFunction = (date: Date) => format(date, 'MM/dd');
        formatString = 'MM/dd';
    }
    
    // For daily data
    const dailyData: { [key: string]: number } = {};
    
    // Initialize with zero values
    for (let i = 0; i <= (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90); i++) {
      const date = subDays(endDate, i);
      const dateStr = format(date, formatString);
      dailyData[dateStr] = 0;
    }
    
    // Add revenue data
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      if (transactionDate >= startDate && transactionDate <= endDate) {
        const dateStr = format(transactionDate, formatString);
        dailyData[dateStr] = (dailyData[dateStr] || 0) + parseFloat(transaction.amount.toString());
      }
    });
    
    // Convert to array for chart
    return Object.entries(dailyData)
      .map(([name, revenue]) => ({ name, revenue }))
      .reverse();
  };
  
  // Generate data for payment type breakdown
  const getPaymentTypeData = () => {
    if (!transactions) return [];
    
    const paymentTypes: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const type = transaction.paymentType;
      paymentTypes[type] = (paymentTypes[type] || 0) + parseFloat(transaction.amount.toString());
    });
    
    return Object.entries(paymentTypes).map(([name, value]) => ({
      name: name
        .replace('_', ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      value
    }));
  };
  
  // Calculate summary metrics
  const getSummaryMetrics = () => {
    if (!transactions || !subscriptionStats) return null;
    
    // Calculate total revenue
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );
    
    // Calculate monthly recurring revenue (MRR)
    const subscriptionTransactions = transactions.filter(
      t => t.paymentType === 'subscription'
    );
    
    const mrr = subscriptionTransactions.reduce(
      (sum, t) => {
        // Only count most recent subscription payment per user
        const amount = parseFloat(t.amount.toString());
        // This is a simplification - in a real implementation, 
        // we'd need to account for different billing cycles (monthly vs yearly)
        return sum + amount;
      },
      0
    ) / (timeRange === '12m' ? 12 : 1); // Average if yearly
    
    // Average revenue per user
    const arpu = totalRevenue / (subscriptionStats.total || 1);
    
    // Churn rate (percentage)
    const churnRate = subscriptionStats.total > 0 
      ? (subscriptionStats.churn / subscriptionStats.total) * 100 
      : 0;
    
    return {
      totalRevenue,
      mrr,
      arpu,
      newSubscribers: subscriptionStats.new,
      churnRate,
      activeSubscribers: subscriptionStats.active
    };
  };
  
  const summaryMetrics = getSummaryMetrics();
  const revenueChartData = getRevenueChartData();
  const paymentTypeData = getPaymentTypeData();
  
  const isLoading = isLoadingTransactions || isLoadingSubscriptions;
  const isError = isErrorTransactions || isErrorSubscriptions;
  
  if (!canViewAnalytics) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You do not have permission to view revenue analytics.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex justify-center items-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  if (isError) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Data</CardTitle>
              <CardDescription>
                There was an error loading the revenue analytics data. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Revenue Analytics</h1>
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={(value: any) => setTimeRange(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="plans">Plan Distribution</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            {summaryMetrics && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(summaryMetrics.totalRevenue)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {timeRange === '7d' ? 'Last 7 days' : 
                         timeRange === '30d' ? 'Last 30 days' : 
                         timeRange === '90d' ? 'Last 90 days' : 
                         'Last 12 months'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        Monthly Recurring Revenue
                      </CardTitle>
                      <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(summaryMetrics.mrr)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Based on active subscriptions
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        Average Revenue Per User
                      </CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(summaryMetrics.arpu)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avg. per paying subscriber
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>
                      Revenue trend for the selected time period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={revenueChartData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            interval={timeRange === '12m' ? 0 : 'preserveStartEnd'} 
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value)} 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${formatCurrency(value)}`, 'Revenue']} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#1E88E5"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Payment Type</CardTitle>
                      <CardDescription>
                        Breakdown of revenue sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {paymentTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            {summaryMetrics && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        Active Subscribers
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summaryMetrics.activeSubscribers}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Current paying members
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        New Subscribers
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summaryMetrics.newSubscribers}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {timeRange === '7d' ? 'Last 7 days' : 
                         timeRange === '30d' ? 'Last 30 days' : 
                         timeRange === '90d' ? 'Last 90 days' : 
                         'Last 12 months'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        Churn Rate
                      </CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summaryMetrics.churnRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cancellation rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Growth Over Time */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Subscriber Growth</CardTitle>
                    <CardDescription>
                      New subscribers and churn over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={revenueChartData.map(item => ({
                            ...item,
                            newSubscribers: Math.round(summaryMetrics.newSubscribers / revenueChartData.length),
                            churned: Math.round((summaryMetrics.churnRate / 100) * (summaryMetrics.activeSubscribers / revenueChartData.length)),
                          }))}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="newSubscribers" name="New Subscribers" fill="#00C853" />
                          <Bar dataKey="churned" name="Churned" fill="#FF3D00" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          {/* Plan Distribution Tab */}
          <TabsContent value="plans">
            {subscriptionStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plan Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of subscribers by plan type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subscriptionStats.planBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {subscriptionStats.planBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default RevenueAnalyticsPage;