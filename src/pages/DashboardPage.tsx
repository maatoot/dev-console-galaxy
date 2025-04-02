
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiClient';
import { ArrowRight, CheckCircle, Clock, Package, Key, AlertTriangle } from 'lucide-react';

interface API {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  version: string;
}

interface Subscription {
  id: string;
  api_id: string;
  plan: string;
  start_date: string;
  end_date: string;
  usage_limit: number;
  api_key: string;
}

interface TestResult {
  id: string;
  api_id: string;
  status: 'success' | 'failure';
  response_time: number;
  tested_at: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [apis, setApis] = useState<API[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get APIs
        const apisResponse = await apiService.apis.list();
        setApis(apisResponse.data || []);

        // Get subscriptions
        const subscriptionsResponse = await apiService.subscriptions.list();
        setSubscriptions(subscriptionsResponse.data || []);

        // For demo purposes, let's simulate test results since we don't have an endpoint yet
        setTestResults([
          {
            id: '1',
            api_id: '1',
            status: 'success',
            response_time: 120,
            tested_at: new Date().toISOString(),
          },
          {
            id: '2',
            api_id: '2',
            status: 'failure',
            response_time: 3500,
            tested_at: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const recentApis = apis.slice(0, 3);
  const recentSubscriptions = subscriptions.slice(0, 3);
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apis.length}</div>
            <p className="text-xs text-muted-foreground">
              {apis.length === 0 ? 'No APIs available' : 'APIs available for use'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Active API subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Healthy APIs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testResults.filter(t => t.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">APIs with successful tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testResults.filter(t => t.status === 'failure').length}
            </div>
            <p className="text-xs text-muted-foreground">APIs with test failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent APIs Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent APIs</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/apis">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
          {recentApis.length > 0 ? (
            recentApis.map((api) => (
              <Card key={api.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{api.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{api.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col justify-between">
                  <div className="text-sm text-muted-foreground mb-4">
                    <div>Version: {api.version}</div>
                    <div className="truncate">Endpoint: {api.endpoint}</div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/apis/${api.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No APIs Available</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any APIs yet. Browse the marketplace or create your own.
                </p>
                <Button asChild>
                  <Link to="/apis">Browse API Hub</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Subscriptions Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Subscriptions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/subscriptions">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
          {recentSubscriptions.length > 0 ? (
            recentSubscriptions.map((subscription) => {
              const api = apis.find(a => a.id === subscription.api_id);
              return (
                <Card key={subscription.id}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{api?.name || 'Unknown API'}</CardTitle>
                    <CardDescription>
                      Plan: <span className="capitalize">{subscription.plan}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Key className="h-3 w-3 mr-1" />
                        <span className="font-mono truncate">{subscription.api_key}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Expires: {new Date(subscription.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/tester?apiKey=${subscription.api_key}`}>Test API</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Subscriptions</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't subscribed to any APIs yet. Browse the API Hub to find APIs to use.
                </p>
                <Button asChild>
                  <Link to="/apis">Find APIs</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
