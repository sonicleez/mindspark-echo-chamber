
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { Settings, Lock } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Check admin role
        const { data: adminData, error: adminError } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        if (adminError) throw adminError;
        
        if (isMounted) {
          setProfile(profileData);
          setIsAdmin(adminData && adminData.length > 0);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-medium">{profile?.username || user?.email}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {isAdmin && (
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                      Admin
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
              
              {isAdmin && (
                <Button variant="default" asChild>
                  <Link to="/admin">
                    <Lock className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
