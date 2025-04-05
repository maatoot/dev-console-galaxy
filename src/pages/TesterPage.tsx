import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { KeyDisplay } from '@/components/ui/key-display';
import { 
  Send, Clock, Check, AlertTriangle, Copy, Plus, Trash, Eye, History, 
  ChevronDown, ChevronRight, ExternalLink, Save, Download, Upload,
  Server, Link, Settings, Play, Code
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderKeyValue {
  key: string;
  value: string;
}

interface RequestLog {
  timestamp: string;
  method: string;
  baseUrl: string;
  path: string;
  status: number | null;
  responseTime: number | null;
}

interface ExampleAPI {
  name: string;
  baseUrl: string;
  endpoints: Array<{
    path: string;
    method: string;
    description?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  }>;
  description?: string;
  documentation?: string;
}

interface SavedRequest {
  id: string;
  name: string;
  baseUrl: string;
  path: string;
  method: string;
  headers: HeaderKeyValue[];
  params: HeaderKeyValue[];
  body: string;
  createdAt: string;
}

const TesterPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialApiKey = searchParams.get('apiKey') || '';
  const initialPath = searchParams.get('path') || '';
  const initialBaseUrl = searchParams.get('baseUrl') || '';
  
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [path, setPath] = useState(initialPath);
  const [method, setMethod] = useState('GET');
  const [headersFormat, setHeadersFormat] = useState<'json' | 'keyValue'>('keyValue');
  const [headers, setHeaders] = useState('{}');
  const [headersList, setHeadersList] = useState<HeaderKeyValue[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [paramsList, setParamsList] = useState<HeaderKeyValue[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [currentRequestName, setCurrentRequestName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  const exampleAPIs: ExampleAPI[] = [
    {
      name: "Instagram API",
      baseUrl: "http://45.84.197.155:80",
      endpoints: [
        {
          path: "/index",
          method: "GET", 
          description: "Fetch Instagram data by URL",
          params: { url: "https://www.instagram.com/share/reel/_f1wT9MrQ" }
        }
      ],
      description: "Extract data from Instagram posts, reels and stories"
    }
  ];

  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
    
    const storedLogs = localStorage.getItem('api_tester_request_logs');
    if (storedLogs) {
      try {
        setRequestLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error('Failed to parse stored request logs:', e);
      }
    }
    
    const storedRequests = localStorage.getItem('api_tester_saved_requests');
    if (storedRequests) {
      try {
        setSavedRequests(JSON.parse(storedRequests));
      } catch (e) {
        console.error('Failed to parse stored saved requests:', e);
      }
    }
    
    if (initialApiKey) {
      if (!initialPath) {
        setPath('');
      }
      
      if (initialBaseUrl) {
        setBaseUrl(initialBaseUrl);
      }
    }

    if (!isAuthenticated && !window.location.href.includes('?apiKey=') && !isEmbedded) {
      toast('Info', {
        description: 'Sign in to save your requests and access all API tester features.',
      });
    }
  }, [initialApiKey, initialPath, initialBaseUrl, isAuthenticated]);

  useEffect(() => {
    if (headersFormat === 'json') {
      try {
        const headersObj = headersList.reduce((acc, header) => {
          if (header.key.trim()) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {} as Record<string, string>);
        setHeaders(JSON.stringify(headersObj, null, 2));
      } catch (e) {
        console.error('Error converting headers to JSON:', e);
      }
    }
  }, [headersFormat, headersList]);

  const handleAddHeader = () => {
    setHeadersList([...headersList, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...headersList];
    newHeaders.splice(index, 1);
    setHeadersList(newHeaders);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headersList];
    newHeaders[index][field] = value;
    setHeadersList(newHeaders);
  };
  
  const handleAddParam = () => {
    setParamsList([...paramsList, { key: '', value: '' }]);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...paramsList];
    newParams.splice(index, 1);
    setParamsList(newParams);
  };

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...paramsList];
    newParams[index][field] = value;
    setParamsList(newParams);
  };
  
  const buildUrl = () => {
    if (!baseUrl) return '';
    
    let finalUrl = baseUrl.trim();
    
    if (path) {
      if (!finalUrl.endsWith('/') && !path.startsWith('/')) {
        finalUrl += '/';
      }
      if (finalUrl.endsWith('/') && path.startsWith('/')) {
        finalUrl += path.substring(1);
      } else {
        finalUrl += path;
      }
    }
    
    const queryParams = paramsList.filter(p => p.key.trim());
    if (queryParams.length > 0) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + 
        queryParams
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&');
    }
    
    return finalUrl;
  };

  const saveRequestLog = (log: RequestLog) => {
    const updatedLogs = [log, ...requestLogs.slice(0, 19)];
    setRequestLogs(updatedLogs);
    localStorage.setItem('api_tester_request_logs', JSON.stringify(updatedLogs));
  };

  const handleSendRequest = async () => {
    if (!baseUrl.trim()) {
      toast('Error', {
        description: 'Please enter a base URL.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);
    
    const startTime = performance.now();
    const finalUrl = buildUrl();
    
    const requestLog: RequestLog = {
      timestamp: new Date().toISOString(),
      method,
      baseUrl,
      path,
      status: null,
      responseTime: null
    };
    
    try {
      let parsedHeaders = {};
      let parsedBody = undefined;
      
      try {
        if (headersFormat === 'json') {
          if (headers.trim()) {
            parsedHeaders = JSON.parse(headers);
          }
        } else {
          parsedHeaders = headersList.reduce((acc, header) => {
            if (header.key.trim()) {
              acc[header.key] = header.value;
            }
            return acc;
          }, {} as Record<string, string>);
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
        parsedBody = body.trim() ? body : undefined;
        
        if (body.trim()) {
          toast('Info', {
            description: 'Using raw text body instead of JSON.',
          });
        }
      }
      
      const response = await apiClient.gateway.proxy(
        apiKey,
        finalUrl,
        {
          method,
          headers: parsedHeaders,
          data: parsedBody
        }
      );
      
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      setResponseTime(responseTimeMs);
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      requestLog.status = response.status;
      requestLog.responseTime = responseTimeMs;
      saveRequestLog(requestLog);
      
      toast('Success', {
        description: `Request completed with status ${response.status}`,
      });
      
    } catch (error: any) {
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      setResponseTime(responseTimeMs);
      
      console.error('API request error:', error);
      
      if (error.response) {
        setResponse({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        requestLog.status = error.response.status;
      } else {
        setError(`Error: ${error.message || 'Unknown error'}`);
        requestLog.status = 500;
      }
      
      requestLog.responseTime = responseTimeMs;
      saveRequestLog(requestLog);
      
      toast('Error', {
        description: `Request failed: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
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

  const openInNewWindow = () => {
    const params = new URLSearchParams();
    if (apiKey) params.append('apiKey', apiKey);
    if (path) params.append('path', path);
    if (baseUrl) params.append('baseUrl', baseUrl);
    window.open(`/tester?${params.toString()}`, '_blank');
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  const handleSaveRequest = () => {
    if (!currentRequestName.trim()) {
      toast('Error', {
        description: 'Please enter a name for this request.',
        variant: 'destructive'
      });
      return;
    }
    
    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name: currentRequestName,
      baseUrl,
      path,
      method,
      headers: headersList,
      params: paramsList,
      body,
      createdAt: new Date().toISOString()
    };
    
    const updatedRequests = [...savedRequests, newRequest];
    setSavedRequests(updatedRequests);
    localStorage.setItem('api_tester_saved_requests', JSON.stringify(updatedRequests));
    
    setSaveDialogOpen(false);
    setCurrentRequestName('');
    
    toast('Success', {
      description: 'Request saved successfully.',
    });
  };

  const handleLoadRequest = (request: SavedRequest) => {
    setBaseUrl(request.baseUrl);
    setPath(request.path);
    setMethod(request.method);
    setHeadersList(request.headers);
    setParamsList(request.params || [{ key: '', value: '' }]);
    setBody(request.body);
    
    toast('Success', {
      description: `Loaded request: ${request.name}`,
    });
  };

  const handleDeleteRequest = (id: string) => {
    const updatedRequests = savedRequests.filter(req => req.id !== id);
    setSavedRequests(updatedRequests);
    localStorage.setItem('api_tester_saved_requests', JSON.stringify(updatedRequests));
    
    toast('Success', {
      description: 'Request deleted.',
    });
  };

  const handleUseExampleAPI = (example: ExampleAPI) => {
    setBaseUrl(example.baseUrl);
    
    if (example.endpoints && example.endpoints.length > 0) {
      const endpoint = example.endpoints[0];
      setMethod(endpoint.method);
      setPath(endpoint.path);
      
      if (endpoint.params) {
        const params = Object.entries(endpoint.params).map(([key, value]) => ({ key, value }));
        setParamsList(params.length > 0 ? params : [{ key: '', value: '' }]);
      }
      
      if (endpoint.headers) {
        const headers = Object.entries(endpoint.headers).map(([key, value]) => ({ key, value }));
        setHeadersList(headers.length > 0 ? headers : [{ key: 'Content-Type', value: 'application/json' }]);
      }
    }
    
    setApiKey('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Tester</h1>
          <p className="text-muted-foreground mt-2">
            Test your API endpoints and analyze responses with precision.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center"
          >
            <History className="mr-2 h-4 w-4" />
            {showLogs ? 'Hide History' : 'Show History'}
          </Button>
          {isEmbedded && (
            <Button variant="outline" onClick={openInNewWindow}>
              <Eye className="mr-2 h-4 w-4" />
              Open in New Window
            </Button>
          )}
        </div>
      </div>

      {showLogs && requestLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>Your recent API test requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Time</th>
                    <th className="text-left py-2 font-medium">Method</th>
                    <th className="text-left py-2 font-medium">URL</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Response Time</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestLogs.map((log, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 cursor-pointer">
                      <td className="py-2">{formatDate(log.timestamp)}</td>
                      <td className="py-2">{log.method}</td>
                      <td className="py-2 max-w-[200px] truncate">
                        {log.baseUrl}{log.path ? `/${log.path}` : ''}
                      </td>
                      <td className="py-2">
                        {log.status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.status >= 200 && log.status < 300
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="py-2">{log.responseTime ? `${log.responseTime}ms` : 'N/A'}</td>
                      <td className="py-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setMethod(log.method);
                            setBaseUrl(log.baseUrl);
                            setPath(log.path);
                          }}
                        >
                          Reuse
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Example APIs</CardTitle>
          <CardDescription>Try these pre-configured API examples</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {exampleAPIs.map((example, index) => (
              <div key={index} className="border rounded-md p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{example.name}</h3>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                  <div className="flex items-center mt-1 text-xs font-mono text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted mr-2">
                      {example.endpoints[0]?.method || 'GET'}
                    </span>
                    <span className="truncate">
                      {example.baseUrl}{example.endpoints[0]?.path || ''}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleUseExampleAPI(example)}
                >
                  Use this API
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={!baseUrl}
                  >
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
              <CardDescription>Configure your API request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <div className="flex">
                  <div className="w-[80px] flex-shrink-0">
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method" className="rounded-r-none">
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
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="flex-grow font-mono text-xs rounded-l-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="path">Path</Label>
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-muted-foreground pr-2 font-mono">
                    {baseUrl ? `${baseUrl}${!baseUrl.endsWith('/') && !path.startsWith('/') ? '/' : ''}` : ''}
                  </div>
                  <Input
                    id="path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="v1/users"
                    className="flex-grow font-mono text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                  className="font-mono text-xs"
                />
                {apiKey && <KeyDisplay apiKey={apiKey} className="mt-2" />}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Query Parameters</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAddParam}
                    className="h-7 py-1 px-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {paramsList.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Parameter"
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveParam(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="headers">Headers</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">JSON</span>
                    <Switch 
                      checked={headersFormat === 'json'} 
                      onCheckedChange={(checked) => setHeadersFormat(checked ? 'json' : 'keyValue')} 
                    />
                  </div>
                </div>
                
                {headersFormat === 'json' ? (
                  <Textarea
                    id="headers"
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder='{"Content-Type": "application/json"}'
                    className="font-mono text-xs h-24"
                  />
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {headersList.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Header"
                          value={header.key}
                          onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                        <Input
                          placeholder="Value"
                          value={header.value}
                          onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveHeader(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddHeader} 
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                )}
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
                    <Play className="mr-2 h-4 w-4" />
                    Execute Request
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {savedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Requests</CardTitle>
                <CardDescription>Reuse your frequently used API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedRequests.map((req) => (
                    <div key={req.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{req.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted mr-2">{req.method}</span>
                          <span className="text-xs font-mono truncate max-w-[180px]">
                            {req.baseUrl}{req.path ? `/${req.path}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLoadRequest(req)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteRequest(req.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto" 
                  onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                >
                  {isResponseExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
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
              <div>
                <div className={`p-3 mb-4 rounded-md ${
                  response.status >= 200 && response.status < 300 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      response.status >= 200 && response.status < 300 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      Status: {response.status} {response.statusText}
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {responseTime}ms
                    </span>
                  </div>
                </div>
                
                <div className="mb-4 bg-muted/50 rounded-md p-3 border border-border">
                  <h3 className="text-sm font-medium mb-2">Request URL</h3>
                  <div className="flex items-center">
                    <code className="bg-muted p-2 rounded text-xs font-mono break-all flex-grow">
                      {buildUrl()}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(buildUrl())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  isResponseExpanded ? 'max-h-[800px]' : 'max-h-0'
                }`}>
                  <div className="space-y-3 mb-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Request Method</h3>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        {method}
                      </div>
                    </div>
                    
                    {headersList.length > 0 && headersList[0].key && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Request Headers</h3>
                        <pre className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-32">
                          {formatJSON(headersFormat === 'json' 
                            ? JSON.parse(headers || '{}') 
                            : headersList.reduce((acc, h) => {
                                if (h.key) acc[h.key] = h.value;
                                return acc;
                              }, {})
                          )}
                        </pre>
                      </div>
                    )}
                    
                    {body && ['POST', 'PUT', 'PATCH'].includes(method) && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Request Body</h3>
                        <pre className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-32">
                          {formatJSON(JSON.parse(body || '{}'))}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Response Headers</h3>
                      <pre className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-32">
                        {formatJSON(response.headers)}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="body">
                  <TabsList className="mb-4">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body">
                    <div className="relative">
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(formatJSON(response.data))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {baseUrl && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(buildUrl(), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
                  <TabsContent value="raw">
                    <pre className="bg-card border border-border rounded-md p-4 overflow-auto h-80 text-xs font-mono whitespace-pre-wrap">
                      {formatJSON(response)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <Code className="h-12 w-12 mb-4" />
                <p className="text-center">Send a request to see the response here</p>
                <p className="text-center text-sm mt-2">Configure your request parameters on the left and click "Execute Request"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Save Request</h2>
            <div className="mb-4">
              <Label htmlFor="requestName">Request Name</Label>
              <Input 
                id="requestName" 
                value={currentRequestName}
                onChange={(e) => setCurrentRequestName(e.target.value)}
                placeholder="My API Request"
                className="mt-1"
              />
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              <p>This will save the current request configuration including URL, headers, and body.</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRequest}>
                Save Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TesterPage;
