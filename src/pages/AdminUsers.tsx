
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Shield, ShieldX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AdminBadge from '@/components/AdminBadge';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [admins, setAdmins] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddAdminDialog, setShowAddAdminDialog] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');

  // Load users and admin data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Fetch admin roles
        const { data: adminsData, error: adminsError } = await supabase
          .from('admin_roles')
          .select('user_id');
          
        if (adminsError) throw adminsError;
        
        // Convert admin data to a map for easy lookup
        const adminMap: Record<string, boolean> = {};
        adminsData.forEach((admin) => {
          adminMap[admin.user_id] = true;
        });
        
        setProfiles(profilesData || []);
        setAdmins(adminMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);
          
        if (error) throw error;
        
        // Update local state
        setAdmins({
          ...admins,
          [userId]: false
        });
        
        toast('Admin privileges removed');
      } else {
        // Add admin role
        const { error } = await supabase
          .from('admin_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });
          
        if (error) throw error;
        
        // Update local state
        setAdmins({
          ...admins,
          [userId]: true
        });
        
        toast('Admin privileges granted');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast('Failed to update admin status');
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    
    const searchTermLower = searchQuery.toLowerCase();
    return (
      (profile.username && profile.username.toLowerCase().includes(searchTermLower)) ||
      profile.id.toLowerCase().includes(searchTermLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => {
            const isAdmin = admins[profile.id] || false;
            
            return (
              <Card key={profile.id} className={isAdmin ? 'border-amber-300' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{profile.username || 'Unnamed User'}</CardTitle>
                      {isAdmin && <AdminBadge />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">User ID</p>
                      <p className="text-xs font-mono truncate">{profile.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant={isAdmin ? "destructive" : "secondary"}
                        className="gap-2 text-sm"
                        onClick={() => handleToggleAdmin(profile.id, isAdmin)}
                      >
                        {isAdmin ? (
                          <>
                            <ShieldX className="h-4 w-4" /> Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" /> Make Admin
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
