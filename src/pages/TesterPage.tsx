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
import { Send, Clock, Check, AlertTriangle, Copy, Plus, Trash, Eye, History } from 'lucide-react';
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
  path: string;
  status: number | null;
  responseTime: number | null;
}

const TesterPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialApiKey = searchParams.get('apiKey') || '';
  const initialPath = searchParams.get('path') || '';
  const initialTestUrl = searchParams.get('testUrl') || '';
  
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [path, setPath] = useState(initialPath);
  const [testUrl, setTestUrl] = useState(initialTestUrl);
  const [method, setMethod] = useState('GET');
  const [headersFormat, setHeadersFormat] = useState<'json' | 'keyValue'>('keyValue');
  const [headers, setHeaders] = useState('{}');
  const [headersList, setHeadersList] = useState<HeaderKeyValue[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
    
    // Load request logs from localStorage
    const storedLogs = localStorage.getItem('api_tester_request_logs');
    if (storedLogs) {
      try {
        setRequestLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error('Failed to parse stored request logs:', e);
      }
    }
    
    if (initialApiKey) {
      // If we have an API key but no path, set a default
      if (!initialPath) {
        setPath('');
      }
      
      // If we have a test URL, use it
      if (initialTestUrl) {
        setTestUrl(initialTestUrl);
      }
    }

    if (!isAuthenticated && !window.location.href.includes('?apiKey=') && !isEmbedded) {
      toast('Info', {
        description: 'Please sign in to access all API tester features',
      });
    }
  }, [initialApiKey, initialPath, initialTestUrl, isAuthenticated]);

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

  const saveRequestLog = (log: RequestLog) => {
    const updatedLogs = [log, ...requestLogs.slice(0, 19)]; // Keep only last 20 logs
    setRequestLogs(updatedLogs);
    localStorage.setItem('api_tester_request_logs', JSON.stringify(updatedLogs));
  };

  const handleSendRequest = async () => {
    if (!apiKey.trim()) {
      toast('Error', {
        description: 'Please enter an API key.',
        variant: 'destructive'
      });
      return;
    }
    
    let finalPath = path.trim();
    
    // If test URL is provided, use it instead
    if (testUrl.trim()) {
      try {
        const url = new URL(testUrl);
        finalPath = url.pathname.substring(1) + url.search;
      } catch (e) {
        toast('Error', {
          description: 'Invalid test URL. Please check the format.',
          variant: 'destructive'
        });
        return;
      }
    } else if (!finalPath) {
      toast('Error', {
        description: 'Please enter a path or test URL.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);
    
    const startTime = performance.now();
    const requestLog: RequestLog = {
      timestamp: new Date().toISOString(),
      method,
      path: finalPath,
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
        toast('Warning', {
          description: 'Invalid JSON in request body. Using empty body.',
          variant: 'destructive'
        });
      }
      
      const response = await apiClient.gateway.proxy(apiKey, finalPath, {
        method,
        headers: parsedHeaders,
        data: parsedBody
      });
      
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      setResponseTime(responseTimeMs);
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      // Update and save request log
      requestLog.status = response.status;
      requestLog.responseTime = responseTimeMs;
      saveRequestLog(requestLog);
      
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
        
        // Update request log with error status
        requestLog.status = error.response.status;
        requestLog.responseTime = responseTimeMs;
      } else if (error.request) {
        setError('No response received from server. Check the API endpoint and your network connection.');
        requestLog.status = 0;
        requestLog.responseTime = responseTimeMs;
      } else {
        setError(`Error: ${error.message}`);
        requestLog.status = 500;
        requestLog.responseTime = responseTimeMs;
      }
      
      saveRequestLog(requestLog);
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
    if (testUrl) params.append('testUrl', testUrl);
    window.open(`/tester?${params.toString()}`, '_blank');
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Tester</h1>
          <p className="text-muted-foreground mt-2">
            Test your API endpoints with the Gateway service.
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
                    <th className="text-left py-2 font-medium">Path</th>
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
                      <td className="py-2 max-w-[200px] truncate">{log.path}</td>
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
                            setPath(log.path);
                            setTestUrl('');
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
                className="font-mono text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-url">Test URL (Optional)</Label>
              <Input
                id="test-url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint?param=value"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                If provided, this URL will be used instead of the path below.
              </p>
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
                  className="font-mono text-xs"
                />
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
