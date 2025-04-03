
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, PlusCircle, Tag, Copy, AlertCircle } from 'lucide-react';
import apiService from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';

interface API {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  endpoint: string;
  version: string;
  visibility: 'public' | 'private';
  provider_id: string;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    apiKeyName?: string;
    apiKeyLocation?: 'header' | 'query';
  };
  defaultHeaders?: Record<string, string>;
}

const ApisPage = () => {
  const { user, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<API | null>(null);
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer' | 'apiKey'>('none');
  
  const [newApiForm, setNewApiForm] = useState({
    name: '',
    description: '',
    baseUrl: '',
    endpoint: '',
    version: '1.0.0',
    visibility: 'public',
    authentication: {
      type: 'none',
      apiKeyName: '',
      apiKeyLocation: 'header'
    },
    defaultHeaders: '{}'
  });
  
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: 'free'
  });

  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    try {
      setLoading(true);
      const response = await apiService.apis.list();
      setApis(response.data || []);
    } catch (error) {
      console.error('Error fetching APIs:', error);
      toast('Error', {
        description: 'Failed to load APIs. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApis = apis.filter(api => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let defaultHeadersObj = {};
      
      try {
        defaultHeadersObj = JSON.parse(newApiForm.defaultHeaders);
      } catch (err) {
        toast('Warning', {
          description: 'Invalid JSON in default headers. Using empty headers.',
          variant: 'destructive'
        });
      }
      
      const apiData = {
        ...newApiForm,
        defaultHeaders: defaultHeadersObj,
        authentication: {
          ...newApiForm.authentication,
          type: authType
        }
      };
      
      await apiService.apis.create(apiData);
      toast('Success', {
        description: 'API created successfully.',
      });
      
      setNewApiForm({
        name: '',
        description: '',
        baseUrl: '',
        endpoint: '',
        version: '1.0.0',
        visibility: 'public',
        authentication: {
          type: 'none',
          apiKeyName: '',
          apiKeyLocation: 'header'
        },
        defaultHeaders: '{}'
      });
      
      setCreateDialogOpen(false);
      
      fetchApis();
    } catch (error) {
      console.error('Error creating API:', error);
      toast('Error', {
        description: 'Failed to create API. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApi) return;
    
    if (!isAuthenticated) {
      toast('Error', {
        description: 'You need to be logged in to subscribe to APIs.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    try {
      await apiService.subscriptions.create({
        api_id: selectedApi.id,
        plan: subscriptionForm.plan
      });
      
      toast('Success', {
        description: 'Subscribed to API successfully.',
      });
      
      setSubscribeDialogOpen(false);
      setSelectedApi(null);
      setSubscriptionForm({ plan: 'free' });
    } catch (error) {
      console.error('Error subscribing to API:', error);
      toast('Error', {
        description: 'Failed to subscribe to API. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const testApi = (apiKey: string) => {
    navigate(`/tester?apiKey=${apiKey}`);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const isProvider = userRole === 'provider' || userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">API Hub</h1>
        
        {isProvider && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create API
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleCreateApi}>
                <DialogHeader>
                  <DialogTitle>Create New API</DialogTitle>
                  <DialogDescription>
                    Add a new API to the marketplace. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">API Name</Label>
                    <Input
                      id="name"
                      value={newApiForm.name}
                      onChange={(e) => setNewApiForm({...newApiForm, name: e.target.value})}
                      placeholder="Weather API"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newApiForm.description}
                      onChange={(e) => setNewApiForm({...newApiForm, description: e.target.value})}
                      placeholder="A comprehensive weather data API..."
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={newApiForm.baseUrl}
                      onChange={(e) => setNewApiForm({...newApiForm, baseUrl: e.target.value})}
                      placeholder="https://api.example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endpoint">Endpoint Path</Label>
                    <Input
                      id="endpoint"
                      value={newApiForm.endpoint}
                      onChange={(e) => setNewApiForm({...newApiForm, endpoint: e.target.value})}
                      placeholder="/weather"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={newApiForm.version}
                        onChange={(e) => setNewApiForm({...newApiForm, version: e.target.value})}
                        placeholder="1.0.0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select 
                        value={newApiForm.visibility} 
                        onValueChange={(value) => setNewApiForm({...newApiForm, visibility: value})}
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="authType">Authentication Type</Label>
                    <Select 
                      value={authType} 
                      onValueChange={(value: 'none' | 'basic' | 'bearer' | 'apiKey') => {
                        setAuthType(value);
                        setNewApiForm({
                          ...newApiForm, 
                          authentication: {
                            ...newApiForm.authentication,
                            type: value
                          }
                        });
                      }}
                    >
                      <SelectTrigger id="authType">
                        <SelectValue placeholder="Select authentication type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {authType === 'apiKey' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="apiKeyName">API Key Name</Label>
                        <Input
                          id="apiKeyName"
                          value={newApiForm.authentication.apiKeyName}
                          onChange={(e) => setNewApiForm({
                            ...newApiForm, 
                            authentication: {
                              ...newApiForm.authentication,
                              apiKeyName: e.target.value
                            }
                          })}
                          placeholder="X-API-Key"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apiKeyLocation">API Key Location</Label>
                        <Select 
                          value={newApiForm.authentication.apiKeyLocation} 
                          onValueChange={(value: 'header' | 'query') => setNewApiForm({
                            ...newApiForm, 
                            authentication: {
                              ...newApiForm.authentication,
                              apiKeyLocation: value
                            }
                          })}
                        >
                          <SelectTrigger id="apiKeyLocation">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="query">Query Parameter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="defaultHeaders">Default Headers (JSON)</Label>
                    <Textarea
                      id="defaultHeaders"
                      value={newApiForm.defaultHeaders}
                      onChange={(e) => setNewApiForm({...newApiForm, defaultHeaders: e.target.value})}
                      placeholder='{"Content-Type": "application/json"}'
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create API</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search APIs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {!isAuthenticated && (
        <Card className="bg-yellow-950/20 border-yellow-900">
          <CardContent className="p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-400">
              Sign in or create an account to subscribe to APIs and get access to API keys.{' '}
              <Button variant="link" className="p-0 text-yellow-500" onClick={() => navigate('/login')}>
                Sign in now
              </Button>
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All APIs</TabsTrigger>
          {isAuthenticated && (
            <>
              <TabsTrigger value="subscribed">My Subscriptions</TabsTrigger>
              {isProvider && <TabsTrigger value="my-apis">My APIs</TabsTrigger>}
            </>
          )}
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {filteredApis.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredApis.map((api) => (
                <Card key={api.id}>
                  <CardHeader>
                    <CardTitle>{api.name}</CardTitle>
                    <CardDescription>{api.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Base URL:</span>
                        <span className="font-mono text-xs truncate max-w-[180px]">{api.baseUrl}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Endpoint:</span>
                        <span className="font-mono text-xs truncate max-w-[180px]">{api.endpoint}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{api.version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Visibility:</span>
                        <div className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          <span className="capitalize">{api.visibility}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Auth:</span>
                        <span className="capitalize">{api.authentication?.type || 'none'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Dialog open={subscribeDialogOpen && selectedApi?.id === api.id} onOpenChange={(open) => {
                      setSubscribeDialogOpen(open);
                      if (!open) setSelectedApi(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast('Info', {
                                description: 'Please sign in to subscribe to APIs',
                              });
                              navigate('/login');
                              return;
                            }
                            setSelectedApi(api);
                          }}
                        >
                          Subscribe
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleSubscribe}>
                          <DialogHeader>
                            <DialogTitle>Subscribe to {selectedApi?.name}</DialogTitle>
                            <DialogDescription>
                              Choose a plan to subscribe to this API.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="plan">Subscription Plan</Label>
                              <Select 
                                value={subscriptionForm.plan} 
                                onValueChange={(value) => setSubscriptionForm({...subscriptionForm, plan: value})}
                              >
                                <SelectTrigger id="plan">
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free (1000 requests/day)</SelectItem>
                                  <SelectItem value="basic">Basic (5000 requests/day)</SelectItem>
                                  <SelectItem value="pro">Pro (Unlimited)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Subscribe</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No APIs Found</h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery 
                  ? `No APIs match your search criteria "${searchQuery}".` 
                  : "There are no APIs available in the marketplace yet."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribed" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Check Subscriptions Page</h3>
            <p className="text-muted-foreground max-w-md">
              View and manage your API subscriptions in the dedicated Subscriptions page.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <a href="/subscriptions">View Subscriptions</a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="my-apis" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your Published APIs</h3>
            <p className="text-muted-foreground max-w-md">
              APIs you have published will appear here.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create API
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApisPage;
