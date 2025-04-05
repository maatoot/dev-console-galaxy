
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlayCircle, PlusCircle, Trash, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { logApiRequest } from '@/integrations/supabase/client';

interface ApiTesterProps {
  apiKey: string;
  baseUrl: string;
  endpoints: { path: string; description: string }[];
  authType?: string;
  apiKeyName?: string;
  apiKeyLocation?: string;
  defaultHeaders?: Record<string, string>;
  subscriptionId: string;
}

interface RequestHeader {
  key: string;
  value: string;
}

export const ApiTester: React.FC<ApiTesterProps> = ({
  apiKey,
  baseUrl,
  endpoints,
  authType = 'none',
  apiKeyName = 'X-API-Key',
  apiKeyLocation = 'header',
  defaultHeaders = {},
  subscriptionId
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints.length > 0 ? endpoints[0].path : '');
  const [method, setMethod] = useState('GET');
  const [customPath, setCustomPath] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [headers, setHeaders] = useState<RequestHeader[]>([{ key: '', value: '' }]);
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    error?: string;
    time?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize headers with default headers if provided
  React.useEffect(() => {
    if (defaultHeaders && Object.keys(defaultHeaders).length > 0) {
      const initialHeaders = Object.entries(defaultHeaders).map(([key, value]) => ({
        key,
        value: value.toString()
      }));
      setHeaders([...initialHeaders, { key: '', value: '' }]);
    }
  }, [defaultHeaders]);

  // Update path when selecting an endpoint
  React.useEffect(() => {
    if (selectedEndpoint) {
      setCustomPath(selectedEndpoint);
    }
  }, [selectedEndpoint]);

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const handleRemoveQueryParam = (index: number) => {
    const updated = [...queryParams];
    updated.splice(index, 1);
    setQueryParams(updated);
  };

  const handleQueryParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...queryParams];
    updated[index][field] = value;
    setQueryParams(updated);
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const updated = [...headers];
    updated.splice(index, 1);
    setHeaders(updated);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const buildUrl = () => {
    const path = customPath.startsWith('/') ? customPath.slice(1) : customPath;
    let url = `${baseUrl}/${path}`;
    
    // Add query parameters
    const validQueryParams = queryParams.filter(param => param.key && param.value);
    if (validQueryParams.length > 0) {
      const queryString = validQueryParams
        .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
        .join('&');
      url += `?${queryString}`;
    }
    
    // Add API key to query if that's where it belongs
    if (authType === 'apiKey' && apiKeyLocation === 'query' && apiKey) {
      url += url.includes('?') ? '&' : '?';
      url += `${encodeURIComponent(apiKeyName)}=${encodeURIComponent(apiKey)}`;
    }
    
    return url;
  };

  const buildHeaders = () => {
    const headerObj: Record<string, string> = {};
    
    // Add valid headers from the form
    headers
      .filter(header => header.key && header.value)
      .forEach(header => {
        headerObj[header.key] = header.value;
      });
    
    // Add API key to headers if that's where it belongs
    if (authType === 'apiKey' && apiKeyLocation === 'header' && apiKey) {
      headerObj[apiKeyName] = apiKey;
    } else if (authType === 'bearer' && apiKey) {
      headerObj['Authorization'] = `Bearer ${apiKey}`;
    }
    
    return headerObj;
  };

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      const url = buildUrl();
      const headerObj = buildHeaders();
      
      const startTime = Date.now();
      
      let requestInit: RequestInit = {
        method,
        headers: headerObj,
      };
      
      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        try {
          // Try to parse as JSON first
          const parsedBody = JSON.parse(requestBody);
          requestInit.body = JSON.stringify(parsedBody);
          if (!headerObj['Content-Type']) {
            headerObj['Content-Type'] = 'application/json';
          }
        } catch (e) {
          // If parsing fails, use as raw text
          requestInit.body = requestBody;
        }
      }
      
      const requestOptions = {
        method,
        headers: headerObj,
        ...(['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? { body: requestBody } : {})
      };
      
      // Make the actual request
      const response = await fetch(url, requestInit);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Try to parse response as JSON
      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Convert headers to a plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: responseTime
      });
      
      // Log the API request to the database
      await logApiRequest({
        subscriptionId,
        endpointPath: customPath,
        statusCode: response.status,
        responseTime,
        requestMethod: method,
        requestHeaders: headerObj,
        requestQuery: queryParams.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
        requestBody: ['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? requestBody : null,
        responseHeaders,
        responseBody,
        error: response.ok ? null : `HTTP Error: ${response.status} ${response.statusText}`
      });
      
    } catch (error) {
      console.error('Error making request:', error);
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Log the failed request
      await logApiRequest({
        subscriptionId,
        endpointPath: customPath,
        statusCode: 0,
        responseTime: 0,
        requestMethod: method,
        requestHeaders: buildHeaders(),
        requestQuery: queryParams.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
        requestBody: ['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? requestBody : null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      toast('Error', {
        description: 'Failed to make request. Check the console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Tester</CardTitle>
        <CardDescription>
          Test API endpoints with your subscription key
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
          
          <TabsContent value="request" className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="endpoint" className="mb-2 block">Endpoint</Label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map((endpoint, idx) => (
                      <SelectItem key={idx} value={endpoint.path}>
                        {endpoint.path} {endpoint.description ? `- ${endpoint.description}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="method" className="mb-2 block">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="HTTP Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSendRequest} 
                disabled={isLoading || !customPath}
                className="gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Send Request
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customPath">Path</Label>
              <div className="flex items-center gap-2">
                <div className="bg-muted px-3 py-2 rounded-l-md border-y border-l">
                  {baseUrl}/
                </div>
                <Input 
                  id="customPath"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="rounded-l-none"
                  placeholder="users"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Query Parameters</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddQueryParam}
                  className="h-8 gap-1"
                >
                  <PlusCircle className="h-4 w-4" /> Add Parameter
                </Button>
              </div>
              
              {queryParams.map((param, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="key"
                    value={param.key}
                    onChange={(e) => handleQueryParamChange(idx, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <span>=</span>
                  <Input
                    placeholder="value"
                    value={param.value}
                    onChange={(e) => handleQueryParamChange(idx, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveQueryParam(idx)}
                    disabled={queryParams.length === 1 && !param.key && !param.value}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Headers</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddHeader}
                  className="h-8 gap-1"
                >
                  <PlusCircle className="h-4 w-4" /> Add Header
                </Button>
              </div>
              
              {headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="key"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <span>:</span>
                  <Input
                    placeholder="value"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveHeader(idx)}
                    disabled={headers.length === 1 && !header.key && !header.value}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {apiKey && (
                <div className="bg-muted/40 p-3 rounded-md border border-muted">
                  <div className="text-sm font-medium mb-2">Authentication</div>
                  {authType === 'apiKey' && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{apiKeyLocation === 'header' ? 'Header' : 'Query'}</Badge>
                      <code>{apiKeyName}: {apiKey.substring(0, 6)}...{apiKey.substring(apiKey.length - 4)}</code>
                    </div>
                  )}
                  {authType === 'bearer' && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">Header</Badge>
                      <code>Authorization: Bearer {apiKey.substring(0, 6)}...{apiKey.substring(apiKey.length - 4)}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="space-y-2">
                <Label htmlFor="requestBody">Request Body</Label>
                <Textarea 
                  id="requestBody" 
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{"example": "value"}'
                  className="min-h-[150px] font-mono"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="response">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : response.status || response.error ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    {response.status ? (
                      <>
                        <Badge className={
                          response.status >= 200 && response.status < 300
                            ? 'bg-green-500'
                            : response.status >= 400
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }>
                          {response.status}
                        </Badge>
                        <span className="text-sm font-medium">{response.statusText}</span>
                        {response.time && (
                          <span className="text-sm text-muted-foreground ml-auto">
                            {response.time}ms
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </div>
                  
                  <Tabs defaultValue="body">
                    <TabsList>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="body" className="mt-2">
                      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        {response.error ? (
                          <pre className="text-red-500 whitespace-pre-wrap">
                            {response.error}
                          </pre>
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {typeof response.body === 'string' ? response.body : 
                              JSON.stringify(response.body, null, 2)}
                          </pre>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="headers" className="mt-2">
                      <ScrollArea className="h-[300px] w-full rounded-md border">
                        <div className="p-4">
                          {response.headers ? (
                            Object.entries(response.headers).map(([key, value]) => (
                              <div key={key} className="flex border-b py-2">
                                <span className="font-medium min-w-[180px]">{key}:</span>
                                <span className="ml-2">{value}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No headers available</p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 h-[300px] text-center">
                  <div className="text-muted-foreground mb-2">
                    No response yet. Send a request to see results.
                  </div>
                  <Button 
                    onClick={handleSendRequest} 
                    disabled={isLoading || !customPath}
                    className="gap-2 mt-4"
                    variant="outline"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Send Request
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiTester;
