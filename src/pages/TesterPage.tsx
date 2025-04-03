
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Clock, Check, AlertTriangle, Copy } from 'lucide-react';
import apiService from '@/services/apiClient';
import { toast } from '@/lib/toast';

const TesterPage = () => {
  const [searchParams] = useSearchParams();
  const initialApiKey = searchParams.get('apiKey') || '';
  
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [path, setPath] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialApiKey) {
      setPath('test');
    }
  }, [initialApiKey]);

  const handleSendRequest = async () => {
    if (!apiKey.trim()) {
      toast('Error', {
        description: 'Please enter an API key.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!path.trim()) {
      toast('Error', {
        description: 'Please enter a path.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);
    
    const startTime = performance.now();
    
    try {
      let parsedHeaders = {};
      let parsedBody = undefined;
      
      try {
        if (headers.trim()) {
          parsedHeaders = JSON.parse(headers);
        }
      } catch (e) {
        toast('Warning', {
          description: 'Invalid JSON in headers. Using empty headers.',
          variant: 'destructive'
        });
      }
      
      try {
        if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
          parsedBody = JSON.parse(body);
        }
      } catch (e) {
        toast('Warning', {
          description: 'Invalid JSON in request body. Using empty body.',
          variant: 'destructive'
        });
      }
      
      const response = await apiService.gateway.proxy(apiKey, path, {
        method,
        headers: parsedHeaders,
        data: parsedBody
      });
      
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
    } catch (error: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      
      console.error('API request error:', error);
      
      if (error.response) {
        setResponse({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        setError('No response received from server. Check the API endpoint and your network connection.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatJSON = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied', {
      description: 'Content copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Tester</h1>
        <p className="text-muted-foreground mt-2">
          Test your API endpoints with the Gateway service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>Configure your API request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000"
              />
            </div>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-8">
                <Label htmlFor="path">Path</Label>
                <Input
                  id="path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="test"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                className="font-mono text-xs h-20"
              />
            </div>
            
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="space-y-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"name": "example"}'
                  className="font-mono text-xs h-40"
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSendRequest} disabled={loading} className="w-full">
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              {responseTime !== null && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" /> 
                  {responseTime}ms
                </div>
              )}
            </div>
            {response && (
              <CardDescription className="flex items-center">
                {response.status >= 200 && response.status < 300 ? (
                  <Check className="mr-1 h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
                )}
                Status: {response.status} {response.statusText}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="spinner" />
              </div>
            ) : error ? (
              <div className="h-80 flex flex-col items-center justify-center text-destructive p-4">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-center">{error}</p>
              </div>
            ) : response ? (
              <Tabs defaultValue="body">
                <TabsList className="mb-4">
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>
                <TabsContent value="body">
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(formatJSON(response.data))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-card border border-border rounded-md p-4 overflow-auto h-80 text-xs font-mono whitespace-pre-wrap">
                      {formatJSON(response.data)}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="headers">
                  <pre className="bg-card border border-border rounded-md p-4 overflow-auto h-80 text-xs font-mono">
                    {formatJSON(response.headers)}
                  </pre>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <Send className="h-12 w-12 mb-4" />
                <p className="text-center">Send a request to see the response here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TesterPage;
