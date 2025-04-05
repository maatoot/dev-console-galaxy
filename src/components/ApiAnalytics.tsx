
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsProps {
  apiId: string;
}

export const ApiAnalytics: React.FC<AnalyticsProps> = ({ apiId }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [usageData, setUsageData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);
  const [endpointData, setEndpointData] = useState<any[]>([]);
  
  useEffect(() => {
    fetchAnalytics();
  }, [apiId, timeRange]);
  
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get subscriptions for this API to filter requests
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('api_id', apiId);
      
      if (!subscriptions || subscriptions.length === 0) {
        setUsageData([]);
        setStatusData([]);
        setMethodData([]);
        setEndpointData([]);
        setLoading(false);
        return;
      }
      
      const subscriptionIds = subscriptions.map(sub => sub.id);
      
      // Calculate the date range for filtering
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '24hours':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      // Get all requests for the API within the time range
      const { data: requests } = await supabase
        .from('api_requests')
        .select('*')
        .in('subscription_id', subscriptionIds)
        .gte('request_date', startDate.toISOString())
        .order('request_date', { ascending: true });
      
      if (!requests || requests.length === 0) {
        setUsageData([]);
        setStatusData([]);
        setMethodData([]);
        setEndpointData([]);
        setLoading(false);
        return;
      }
      
      // Process usage data by date
      const usageByDate = requests.reduce((acc: Record<string, number>, request) => {
        const date = new Date(request.request_date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      const usageDataArray = Object.keys(usageByDate).map(date => ({
        date,
        requests: usageByDate[date]
      }));
      
      // Process status codes
      const statusCodes = requests.reduce((acc: Record<string, number>, request) => {
        let status;
        if (!request.status_code || request.status_code === 0) {
          status = 'Error';
        } else if (request.status_code >= 200 && request.status_code < 300) {
          status = 'Success';
        } else if (request.status_code >= 300 && request.status_code < 400) {
          status = 'Redirect';
        } else if (request.status_code >= 400 && request.status_code < 500) {
          status = 'Client Error';
        } else {
          status = 'Server Error';
        }
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const statusDataArray = Object.keys(statusCodes).map(status => ({
        name: status,
        value: statusCodes[status]
      }));
      
      // Process HTTP methods
      const methods = requests.reduce((acc: Record<string, number>, request) => {
        const method = request.request_method;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      const methodDataArray = Object.keys(methods).map(method => ({
        name: method,
        count: methods[method]
      }));
      
      // Process endpoints
      const endpoints = requests.reduce((acc: Record<string, number>, request) => {
        const endpoint = request.endpoint_path;
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {});
      
      // Get top 5 endpoints
      const endpointEntries = Object.entries(endpoints).sort((a, b) => b[1] - a[1]);
      const top5Endpoints = endpointEntries.slice(0, 5);
      const otherEndpoints = endpointEntries.slice(5);
      
      let endpointDataArray = top5Endpoints.map(([path, count]) => ({
        name: path,
        count
      }));
      
      if (otherEndpoints.length > 0) {
        const otherCount = otherEndpoints.reduce((acc, [_, count]) => acc + count, 0);
        endpointDataArray.push({
          name: 'Others',
          count: otherCount
        });
      }
      
      // Set state with processed data
      setUsageData(usageDataArray);
      setStatusData(statusDataArray);
      setMethodData(methodDataArray);
      setEndpointData(endpointDataArray);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Colors for the pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    'Success': '#10B981',
    'Error': '#EF4444',
    'Redirect': '#F59E0B',
    'Client Error': '#F97316',
    'Server Error': '#B91C1C'
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle>API Analytics</CardTitle>
            <CardDescription>Usage metrics and performance data</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 hours</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : usageData.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium">No data available</h3>
            <p className="text-muted-foreground mt-2">
              There is no analytics data for this API in the selected time period.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="usage">
            <TabsList className="mb-4">
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="status">Status Codes</TabsTrigger>
              <TabsTrigger value="methods">HTTP Methods</TabsTrigger>
              <TabsTrigger value="endpoints">Top Endpoints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="usage">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#8884d8" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="status">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="methods">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Requests" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="endpoints">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={endpointData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => 
                        name.length > 15 
                          ? `${name.substring(0, 15)}...: ${(percent * 100).toFixed(0)}%` 
                          : `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {endpointData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiAnalytics;
