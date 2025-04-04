import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import apiService from '@/services/apiClient';
import { Copy, CheckCircle, PlusCircle, ExternalLink, Edit, Trash, FileTerminal, BarChart, Eye, EyeOff } from 'lucide-react';

interface API {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  visibility: string;
  provider_id: string;
  created_at: string;
  endpoints: { path: string; description: string }[];
  authentication?: {
    type: string;
    apiKeyName?: string;
    apiKeyLocation?: string;
  };
}

interface Subscription {
  id: string;
  api_id: string;
  plan: string;
  api_key: string;
}

const ApiDetailsPage = () => {
  const { apiId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [api, setApi] = useState<API | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({ path: '', description: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!apiId) return;
    
    const fetchApiDetails = async () => {
      try {
        setLoading(true);
        const apiResponse = await apiService.apis.get(apiId);
        setApi(apiResponse.data);
        
        if (user && apiResponse.data.provider_id === user.id) {
          setIsOwner(true);
        }
        
        if (user) {
          const subscriptionsResponse = await apiService.subscriptions.list();
          const subscriptions = subscriptionsResponse.data || [];
          const existingSubscription = subscriptions.find(
            (sub: Subscription) => sub.api_id === apiId
          );
          if (existingSubscription) {
            setSubscription(existingSubscription);
          }
        }
      } catch (error) {
        console.error('Error fetching API details:', error);
        toast('Error', {
          description: 'Failed to load API details.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchApiDetails();
  }, [apiId, user]);

  const handleSubscribe = async () => {
    try {
      if (!api) return;
      
      const newSubscription = await apiService.subscriptions.create({
        api_id: api.id,
        plan: 'basic',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 1000
      });
      
      setSubscription(newSubscription.data);
      toast('Success', { description: 'Successfully subscribed to API!' });
    } catch (error) {
      console.error('Error subscribing to API:', error);
      toast('Error', {
        description: 'Failed to subscribe. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddEndpoint = async () => {
    try {
      if (!api || !newEndpoint.path.trim()) return;
      
      await apiService.apis.addEndpoint(api.id, newEndpoint);
      
      const apiResponse = await apiService.apis.get(api.id);
      setApi(apiResponse.data);
      
      setNewEndpoint({ path: '', description: '' });
      toast('Success', { description: 'Endpoint added successfully!' });
    } catch (error) {
      console.error('Error adding endpoint:', error);
      toast('Error', {
        description: 'Failed to add endpoint. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast('Copied', {
      description: 'API key copied to clipboard.',
    });
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const formatApiKey = (key: string) => {
    return showApiKey ? key : key.replace(/./g, '•');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!api) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">API not found</h2>
        <Button asChild>
          <Link to="/apis">Back to API Hub</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{api.name}</h1>
          <p className="text-muted-foreground mt-2">{api.description}</p>
        </div>
        <div className="flex gap-2">
          {isOwner ? (
            <Button onClick={() => setActiveTab('management')}>
              <Edit className="mr-2 h-4 w-4" />
              Manage API
            </Button>
          ) : subscription ? (
            <Button variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Subscribed
            </Button>
          ) : (
            <Button onClick={handleSubscribe}>
              Subscribe
            </Button>
          )}
          {subscription && (
            <Button asChild variant="outline">
              <Link to={`/tester?apiKey=${subscription.api_key}`}>
                <FileTerminal className="mr-2 h-4 w-4" />
                Test API
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          {subscription && <TabsTrigger value="subscription">My Subscription</TabsTrigger>}
          {isOwner && <TabsTrigger value="management">Management</TabsTrigger>}
          {isOwner && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Base URL</h3>
                  <p className="font-mono text-sm mt-1">{api.baseUrl}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Visibility</h3>
                  <Badge variant="outline" className="mt-1 capitalize">{api.visibility}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Authentication</h3>
                  <p className="text-sm mt-1 capitalize">{api.authentication?.type || 'None'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm mt-1">{new Date(api.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                How to authenticate with this API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {api?.authentication?.type === 'apiKey' ? (
                <div className="space-y-4">
                  <p>
                    This API uses an API key for authentication. You need to include your API key in the
                    {' '}{api.authentication.apiKeyLocation === 'header' ? 'request headers' : 'query parameters'}.
                  </p>
                  
                  <div className="font-mono text-sm bg-muted p-3 rounded-md">
                    {api.authentication.apiKeyLocation === 'header' ? (
                      <pre>{api.authentication.apiKeyName}: YOUR_API_KEY</pre>
                    ) : (
                      <pre>?{api.authentication.apiKeyName}=YOUR_API_KEY</pre>
                    )}
                  </div>
                  
                  {subscription ? (
                    <div className="bg-card p-4 rounded-md border border-border">
                      <div className="text-sm font-medium mb-2">Your API Key:</div>
                      <div className="flex">
                        <code className="flex-1 p-2 bg-muted rounded-l-md text-xs font-mono truncate border border-r-0 border-border">
                          {formatApiKey(subscription.api_key)}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-none border-x-0"
                          onClick={toggleApiKeyVisibility}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="rounded-l-none"
                          onClick={() => copyApiKey(subscription.api_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button onClick={handleSubscribe}>
                        Subscribe to Get API Key
                      </Button>
                    </div>
                  )}
                </div>
              ) : api?.authentication?.type === 'bearer' ? (
                <div className="space-y-4">
                  <p>
                    This API uses Bearer token authentication. Include your token in the Authorization header.
                  </p>
                  
                  <div className="font-mono text-sm bg-muted p-3 rounded-md">
                    <pre>Authorization: Bearer YOUR_TOKEN</pre>
                  </div>
                  
                  {subscription ? (
                    <div className="bg-card p-4 rounded-md border border-border">
                      <div className="text-sm font-medium mb-2">Your API Token:</div>
                      <div className="flex">
                        <code className="flex-1 p-2 bg-muted rounded-l-md text-xs font-mono truncate border border-r-0 border-border">
                          {formatApiKey(subscription.api_key)}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-none border-x-0"
                          onClick={toggleApiKeyVisibility}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="rounded-l-none"
                          onClick={() => copyApiKey(subscription.api_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button onClick={handleSubscribe}>
                        Subscribe to Get API Token
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p>This API does not require authentication.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Endpoints</CardTitle>
              <CardDescription>
                Explore the available endpoints for this API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {api.endpoints && api.endpoints.length > 0 ? (
                <div className="space-y-4">
                  {api.endpoints.map((endpoint, index) => (
                    <div key={index} className="bg-muted p-4 rounded-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-sm font-semibold">
                            {endpoint.path}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {endpoint.description || 'No description available'}
                          </p>
                        </div>
                        {subscription && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link to={`/tester?apiKey=${subscription.api_key}&path=${endpoint.path.replace(/^\//, '')}`}>
                              Test
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No endpoints available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {subscription && (
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium capitalize">{subscription.plan}</span>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  <div className="text-sm font-medium">API Key:</div>
                  <div className="flex">
                    <code className="flex-1 p-2 bg-muted rounded-l-md text-xs font-mono truncate border border-r-0 border-border">
                      {formatApiKey(subscription.api_key)}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-none border-x-0"
                      onClick={toggleApiKeyVisibility}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {isOwner && (
          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your API details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-name">API Name</Label>
                  <Input id="api-name" defaultValue={api.name} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-description">Description</Label>
                  <Textarea id="api-description" defaultValue={api.description} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-baseUrl">Base URL</Label>
                  <Input id="api-baseUrl" defaultValue={api.baseUrl} />
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>Manage your API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {api.endpoints && api.endpoints.map((endpoint, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{endpoint.path}</TableCell>
                        <TableCell>{endpoint.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Endpoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Endpoint</DialogTitle>
                      <DialogDescription>
                        Create a new endpoint for your API
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-endpoint-path">Endpoint Path</Label>
                        <Input 
                          id="new-endpoint-path" 
                          placeholder="/users" 
                          value={newEndpoint.path}
                          onChange={e => setNewEndpoint({...newEndpoint, path: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-endpoint-description">Description</Label>
                        <Textarea 
                          id="new-endpoint-description" 
                          placeholder="Get a list of users" 
                          value={newEndpoint.description}
                          onChange={e => setNewEndpoint({...newEndpoint, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddEndpoint}>Add Endpoint</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {isOwner && (
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Analytics</CardTitle>
                <CardDescription>
                  Statistics about your API usage
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    Detailed analytics for your API will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ApiDetailsPage;
