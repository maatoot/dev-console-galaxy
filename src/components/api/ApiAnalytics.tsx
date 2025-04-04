
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AlertTriangle } from 'lucide-react';

interface UsageLog {
  id: string;
  api_id: string;
  subscription_id: string;
  user_id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  response_time: number;
  method: string;
}

interface Subscription {
  id: string;
  user_id: string;
  api_id: string;
  plan: string;
  created_at: string;
  username?: string;
}

interface ApiAnalyticsProps {
  apiId: string;
  usageLogs: UsageLog[];
  subscriptions: Subscription[];
  isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A288E3'];

const ApiAnalytics: React.FC<ApiAnalyticsProps> = ({ 
  apiId, 
  usageLogs, 
  subscriptions,
  isLoading = false
}) => {
  const [timeRange, setTimeRange] = React.useState('7d');
  
  // Filter logs based on the selected time range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const ranges = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    };
    
    const startDate = ranges[timeRange as keyof typeof ranges];
    return usageLogs.filter(log => new Date(log.timestamp) >= startDate);
  }, [usageLogs, timeRange]);
  
  // Calculate API usage metrics
  const metrics = useMemo(() => {
    if (!filteredLogs.length) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        methodCounts: {},
        dailyUsage: [],
        statusCodes: {},
        endpointUsage: []
      };
    }
    
    // Get success rate
    const successRequests = filteredLogs.filter(log => log.status >= 200 && log.status < 300).length;
    const successRate = (successRequests / filteredLogs.length) * 100;
    
    // Get average response time
    const totalResponseTime = filteredLogs.reduce((sum, log) => sum + log.response_time, 0);
    const avgResponseTime = totalResponseTime / filteredLogs.length;
    
    // Count methods
    const methodCounts = filteredLogs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by day
    const dailyUsage = filteredLogs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      
      return acc;
    }, [] as Array<{ date: string; count: number }>).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Count status codes
    const statusCodes = filteredLogs.reduce((acc, log) => {
      const statusGroup = Math.floor(log.status / 100) * 100;
      const label = statusGroup === 200 ? 'Success (2xx)' : 
                    statusGroup === 300 ? 'Redirect (3xx)' : 
                    statusGroup === 400 ? 'Client Error (4xx)' : 
                    statusGroup === 500 ? 'Server Error (5xx)' : 'Other';
                    
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count endpoint usage
    const endpointUsage = filteredLogs.reduce((acc, log) => {
      // Extract the base path without query params for grouping
      const path = log.endpoint.split('?')[0];
      const existing = acc.find(item => item.endpoint === path);
      
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ endpoint: path || '/', count: 1 });
      }
      
      return acc;
    }, [] as Array<{ endpoint: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 endpoints
    
    return {
      totalRequests: filteredLogs.length,
      successRate,
      avgResponseTime,
      methodCounts,
      dailyUsage,
      statusCodes,
      endpointUsage
    };
  }, [filteredLogs]);
  
  // Transform data for charts
  const methodData = useMemo(() => {
    return Object.entries(metrics.methodCounts).map(([name, value]) => ({ name, value }));
  }, [metrics.methodCounts]);
  
  const statusData = useMemo(() => {
    return Object.entries(metrics.statusCodes).map(([name, value]) => ({ name, value }));
  }, [metrics.statusCodes]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!usageLogs.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Analytics</CardTitle>
          <CardDescription>Usage statistics and trends</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No usage data available yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Data will appear here once your API starts receiving requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>API Analytics</CardTitle>
            <CardDescription>Usage statistics and trends</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-sm">Success Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</div>
              <p className="text-muted-foreground text-sm">Avg Response Time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="methods">HTTP Methods</TabsTrigger>
            <TabsTrigger value="status">Status Codes</TabsTrigger>
            <TabsTrigger value="endpoints">Top Endpoints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests">
            <div className="h-80">
              <ChartContainer config={{
                success: { color: "hsl(var(--primary))" },
                error: { color: "hsl(var(--destructive))" },
              }}>
                <LineChart
                  data={metrics.dailyUsage}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="methods">
            <div className="h-80">
              <ChartContainer config={{
                GET: { color: "#0088FE" },
                POST: { color: "#00C49F" },
                PUT: { color: "#FFBB28" },
                DELETE: { color: "#FF8042" },
                PATCH: { color: "#A288E3" },
              }}>
                <BarChart
                  data={methodData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {methodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="status">
            <div className="h-80">
              <ChartContainer config={{
                "Success (2xx)": { color: "#00C49F" },
                "Redirect (3xx)": { color: "#0088FE" },
                "Client Error (4xx)": { color: "#FFBB28" },
                "Server Error (5xx)": { color: "#FF8042" },
                "Other": { color: "#A288E3" },
              }}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="endpoints">
            <div className="h-80">
              <ChartContainer config={{
                endpoint: { color: "hsl(var(--primary))" },
              }}>
                <BarChart
                  data={metrics.endpointUsage}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="endpoint" width={150} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
        
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Active Subscriptions ({subscriptions.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">User</th>
                    <th className="text-left py-2 font-medium">Plan</th>
                    <th className="text-left py-2 font-medium">Subscribed On</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b hover:bg-muted/50">
                      <td className="py-2">{subscription.username || subscription.user_id}</td>
                      <td className="py-2 capitalize">{subscription.plan}</td>
                      <td className="py-2">{new Date(subscription.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiAnalytics;
