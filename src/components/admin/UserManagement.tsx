
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  is_admin: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Fetch users from auth.users and join with profiles
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Join the data
      const mergedUsers = authUsers?.users?.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          username: profile?.username,
          is_admin: profile?.is_admin || false,
          created_at: user.created_at,
        };
      }) || [];
      
      return mergedUsers;
    },
  });
  
  const updateAdminStatus = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      return { userId, isAdmin };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });
  
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {(error as Error).message}</div>;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center p-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username || 'N/A'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_admin}
                      onCheckedChange={(checked) => 
                        updateAdminStatus.mutate({ userId: user.id, isAdmin: checked })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
