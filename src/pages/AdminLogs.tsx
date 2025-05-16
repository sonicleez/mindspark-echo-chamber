
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, RefreshCw } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>("week");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select(`
          id, 
          operation, 
          tokens_used, 
          successful, 
          created_at,
          ai_configs (name, provider, model),
          user_id
        `)
        .order('created_at', { ascending: false });
      
      // Apply timeframe filter
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case "day":
          startDate = new Date(now.setDate(now.getDate() - 1));
          query = query.gte('created_at', startDate.toISOString());
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          query = query.gte('created_at', startDate.toISOString());
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          query = query.gte('created_at', startDate.toISOString());
          break;
        // "all" doesn't need a filter
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading usage logs:', error);
      toast('Failed to load usage logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [timeframe]);

  const formatDatetime = (datetime: string) => {
    return new Date(datetime).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    
    const searchTermLower = searchQuery.toLowerCase();
    return (
      log.operation.toLowerCase().includes(searchTermLower) ||
      (log.ai_configs?.name && log.ai_configs.name.toLowerCase().includes(searchTermLower)) ||
      (log.ai_configs?.provider && log.ai_configs.provider.toLowerCase().includes(searchTermLower)) ||
      (log.ai_configs?.model && log.ai_configs.model.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Usage Logs</h2>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-[180px] md:w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Operation</th>
              <th className="py-2 px-4 text-left">Provider</th>
              <th className="py-2 px-4 text-left">Model</th>
              <th className="py-2 px-4 text-left">Tokens</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="py-2 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                </tr>
              ))
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">{formatDatetime(log.created_at)}</td>
                  <td className="py-2 px-4">{log.operation}</td>
                  <td className="py-2 px-4">{log.ai_configs?.provider || 'N/A'}</td>
                  <td className="py-2 px-4">{log.ai_configs?.model || 'N/A'}</td>
                  <td className="py-2 px-4">{log.tokens_used || 'Unknown'}</td>
                  <td className="py-2 px-4">
                    <Badge variant={log.successful ? "default" : "destructive"}>
                      {log.successful ? 'Success' : 'Failed'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted-foreground">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogs;
