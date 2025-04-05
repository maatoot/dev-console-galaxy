
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';

interface ApiRequest {
  id: string;
  endpoint_path: string;
  request_method: string;
  status_code: number;
  response_time: number;
  request_date: string;
  request_headers: any;
  request_body: any;
  request_query: any;
  response_headers: any;
  response_body: any;
  error: string | null;
}

interface ApiRequestLogsProps {
  apiId: string;
  limit?: number;
  showFilters?: boolean;
}

export const ApiRequestLogs: React.FC<ApiRequestLogsProps> = ({ 
  apiId, 
  limit = 10,
  showFilters = true
}) => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, [apiId, statusFilter, methodFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get subscriptions for this API to filter requests
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('api_id', apiId);
      
      if (!subscriptions || subscriptions.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      
      const subscriptionIds = subscriptions.map(sub => sub.id);
      
      // Build the query
      let query = supabase
        .from('api_requests')
        .select('*')
        .in('subscription_id', subscriptionIds)
        .order('request_date', { ascending: false })
        .limit(limit);
      
      // Apply filters if selected
      if (statusFilter === 'success') {
        query = query.gte('status_code', 200).lt('status_code', 300);
      } else if (statusFilter === 'error') {
        query = query.or('status_code.gte.400,status_code.eq.0');
      } else if (statusFilter === 'warning') {
        query = query.or('status_code.gte.300,status_code.lt.400');
      }
      
      if (methodFilter !== 'all') {
        query = query.eq('request_method', methodFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching API requests:', error);
        return;
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-500';
    } else if (statusCode >= 400 || statusCode === 0) {
      return 'bg-red-500';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'bg-yellow-500';
    }
    return '';
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: format(date, 'PPp') // Format: Jan 1, 2021, 12:00 PM
      };
    } catch (e) {
      return { relative: 'Unknown', absolute: 'Unknown date' };
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'POST':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PUT':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Request Logs</CardTitle>
        <CardDescription>
          Recent API requests and their statuses
        </CardDescription>
        
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Tabs 
              value={statusFilter} 
              onValueChange={setStatusFilter}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="warning">Warning</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs 
              value={methodFilter} 
              onValueChange={setMethodFilter}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All Methods</TabsTrigger>
                <TabsTrigger value="GET">GET</TabsTrigger>
                <TabsTrigger value="POST">POST</TabsTrigger>
                <TabsTrigger value="PUT">PUT</TabsTrigger>
                <TabsTrigger value="DELETE">DELETE</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No requests found</h3>
            <p className="text-muted-foreground mt-2">
              There are no API requests logged for this API yet.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const timeInfo = formatTime(request.request_date);
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge variant="outline" className={getMethodBadge(request.request_method)}>
                          {request.request_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">
                        {request.endpoint_path}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(request.status_code)}>
                          {request.status_code || 'Error'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.response_time ? `${request.response_time}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" title={timeInfo.absolute}>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{timeInfo.relative}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <span className="sr-only">View details</span>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[620px]">
                            <DialogHeader>
                              <DialogTitle>Request Details</DialogTitle>
                              <DialogDescription>
                                Complete information about the API request
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-6 py-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <Badge variant="outline" className={getMethodBadge(selectedRequest.request_method)}>
                                      {selectedRequest.request_method}
                                    </Badge>
                                    <span className="ml-2 font-mono">{selectedRequest.endpoint_path}</span>
                                  </div>
                                  <Badge className={getStatusBadgeColor(selectedRequest.status_code)}>
                                    {selectedRequest.status_code || 'Error'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedRequest.response_time || 0}ms</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatTime(selectedRequest.request_date).absolute}</span>
                                  </div>
                                </div>
                                
                                <Tabs defaultValue="request">
                                  <TabsList>
                                    <TabsTrigger value="request">Request</TabsTrigger>
                                    <TabsTrigger value="response">Response</TabsTrigger>
                                    {selectedRequest.error && (
                                      <TabsTrigger value="error">Error</TabsTrigger>
                                    )}
                                  </TabsList>
                                  
                                  <TabsContent value="request" className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Headers</h4>
                                      <ScrollArea className="h-[100px] w-full rounded-md border">
                                        {selectedRequest.request_headers ? (
                                          <pre className="p-4 text-sm">
                                            {JSON.stringify(selectedRequest.request_headers, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="p-4 text-muted-foreground">No headers</p>
                                        )}
                                      </ScrollArea>
                                    </div>
                                    
                                    {selectedRequest.request_query && Object.keys(selectedRequest.request_query).length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Query Parameters</h4>
                                        <ScrollArea className="h-[100px] w-full rounded-md border">
                                          <pre className="p-4 text-sm">
                                            {JSON.stringify(selectedRequest.request_query, null, 2)}
                                          </pre>
                                        </ScrollArea>
                                      </div>
                                    )}
                                    
                                    {selectedRequest.request_body && (
                                      <div>
                                        <h4 className="font-medium mb-2">Body</h4>
                                        <ScrollArea className="h-[150px] w-full rounded-md border">
                                          <pre className="p-4 text-sm">
                                            {typeof selectedRequest.request_body === 'string' 
                                              ? selectedRequest.request_body 
                                              : JSON.stringify(selectedRequest.request_body, null, 2)}
                                          </pre>
                                        </ScrollArea>
                                      </div>
                                    )}
                                  </TabsContent>
                                  
                                  <TabsContent value="response" className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Headers</h4>
                                      <ScrollArea className="h-[100px] w-full rounded-md border">
                                        {selectedRequest.response_headers ? (
                                          <pre className="p-4 text-sm">
                                            {JSON.stringify(selectedRequest.response_headers, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="p-4 text-muted-foreground">No headers</p>
                                        )}
                                      </ScrollArea>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Body</h4>
                                      <ScrollArea className="h-[200px] w-full rounded-md border">
                                        {selectedRequest.response_body ? (
                                          <pre className="p-4 text-sm">
                                            {typeof selectedRequest.response_body === 'string' 
                                              ? selectedRequest.response_body 
                                              : JSON.stringify(selectedRequest.response_body, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="p-4 text-muted-foreground">No response body</p>
                                        )}
                                      </ScrollArea>
                                    </div>
                                  </TabsContent>
                                  
                                  {selectedRequest.error && (
                                    <TabsContent value="error">
                                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                        <h4 className="font-medium mb-2 text-red-700">Error</h4>
                                        <pre className="p-2 bg-white rounded text-sm text-red-600 whitespace-pre-wrap">
                                          {selectedRequest.error}
                                        </pre>
                                      </div>
                                    </TabsContent>
                                  )}
                                </Tabs>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiRequestLogs;
