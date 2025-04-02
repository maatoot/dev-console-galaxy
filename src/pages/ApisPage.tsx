import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, PlusCircle, Tag, Copy } from 'lucide-react';
import apiService from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

interface API {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  version: string;
  visibility: 'public' | 'private';
  provider_id: string;
}

const ApisPage = () => {
  const { user } = useAuth();
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<API | null>(null);
  
  const [newApiForm, setNewApiForm] = useState({
    name: '',
    description: '',
    endpoint: '',
    version: '1.0.0',
    visibility: 'public'
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
      await apiService.apis.create(newApiForm);
      toast('Success', {
        description: 'API created successfully.',
      });
      
      setNewApiForm({
        name: '',
        description: '',
        endpoint: '',
        version: '1.0.0',
        visibility: 'public'
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
        <h1 className="text-3xl font-bold tracking-tight">API Hub</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
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
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    value={newApiForm.endpoint}
                    onChange={(e) => setNewApiForm({...newApiForm, endpoint: e.target.value})}
                    placeholder="https://api.example.com/weather"
                    required
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
              </div>
              <DialogFooter>
                <Button type="submit">Create API</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All APIs</TabsTrigger>
          <TabsTrigger value="subscribed">Subscribed</TabsTrigger>
          <TabsTrigger value="my-apis">My APIs</TabsTrigger>
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
                          onClick={() => setSelectedApi(api)}
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
