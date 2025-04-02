
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, Key, Package, RefreshCw } from 'lucide-react';
import apiService from '@/services/apiClient';
import { toast } from '@/components/ui/sonner';

interface API {
  id: string;
  name: string;
  description: string;
  endpoint: string;
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

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [apis, setApis] = useState<Record<string, API>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiService.subscriptions.list();
      const subscriptionsData = response.data || [];
      setSubscriptions(subscriptionsData);

      // Fetch API details for each subscription
      const apiIds = [...new Set(subscriptionsData.map(sub => sub.api_id))];
      const apisResponse = await apiService.apis.list();
      const apisData = apisResponse.data || [];
      
      const apisMap: Record<string, API> = {};
      apisData.forEach((api: API) => {
        apisMap[api.id] = api;
      });
      
      setApis(apisMap);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast('Error', {
        description: 'Failed to load subscriptions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast('Copied', {
      description: 'API key copied to clipboard.',
    });
  };

  const getStatusBadge = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    
    if (end < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    const daysLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 7) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Expiring Soon</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Subscriptions</h1>
        <Button onClick={fetchSubscriptions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          {subscriptions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((subscription) => {
                const api = apis[subscription.api_id];
                const isActive = new Date(subscription.end_date) > new Date();
                if (!isActive) return null;
                
                return (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{api?.name || 'Unknown API'}</CardTitle>
                        {getStatusBadge(subscription.end_date)}
                      </div>
                      <CardDescription>{api?.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium capitalize">{subscription.plan}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Limit:</span>
                          <span className="font-medium">
                            {subscription.usage_limit === -1 ? 'Unlimited' : `${subscription.usage_limit} requests/day`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expiry:</span>
                          <span className="font-medium">
                            {new Date(subscription.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        <div className="text-sm font-medium">API Key:</div>
                        <div className="flex">
                          <code className="flex-1 p-2 bg-muted rounded-l-md text-xs font-mono truncate border border-r-0 border-border">
                            {subscription.api_key}
                          </code>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="rounded-l-none"
                            onClick={() => copyApiKey(subscription.api_key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="pt-2 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link to={`/tester?apiKey=${subscription.api_key}`}>
                              Test API
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <a href={api?.endpoint} target="_blank" rel="noopener noreferrer">
                              Docs <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Subscriptions</h3>
              <p className="text-muted-foreground max-w-md">
                You don't have any active API subscriptions. Browse the API Hub to find APIs to use.
              </p>
              <Button asChild className="mt-4">
                <Link to="/apis">Browse API Hub</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="expired" className="mt-6">
          {subscriptions.some(sub => new Date(sub.end_date) <= new Date()) ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((subscription) => {
                const api = apis[subscription.api_id];
                const isExpired = new Date(subscription.end_date) <= new Date();
                if (!isExpired) return null;
                
                return (
                  <Card key={subscription.id} className="opacity-70">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{api?.name || 'Unknown API'}</CardTitle>
                        <Badge variant="destructive">Expired</Badge>
                      </div>
                      <CardDescription>{api?.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium capitalize">{subscription.plan}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expired on:</span>
                          <span className="font-medium">
                            {new Date(subscription.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Button asChild className="w-full">
                        <Link to={`/apis`}>
                          Renew Subscription
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Expired Subscriptions</h3>
              <p className="text-muted-foreground max-w-md">
                You don't have any expired subscriptions.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionsPage;
