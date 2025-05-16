
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminStatus } from '@/hooks/useAdminStatus';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { isAdmin, isLoading } = useAdminStatus(user?.id);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || email === user?.email) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;
      
      toast("Email update initiated", {
        description: "Please check your new email for a confirmation link.",
      });
    } catch (error: any) {
      toast("Error updating email", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast("Password updated", {
        description: "Your password has been successfully updated.",
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast("Error updating password", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      {isAdmin && (
        <div className="mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-900 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Admin Access
              </CardTitle>
              <CardDescription className="text-amber-800">
                You have administrator privileges on this platform.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="bg-amber-600 hover:bg-amber-700 text-white"
                asChild
              >
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Go to Admin Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Settings</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Changing your email will require verification.</span>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateEmail}
                disabled={loading || !email || email === user?.email}
              >
                {loading ? 'Updating...' : 'Update Email'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Password should be at least 8 characters long.</span>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Administration Settings</CardTitle>
                <CardDescription>Manage system configurations and administrator options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Admin Access</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You currently have administrator access to the platform. Use the admin dashboard for complete system management.
                  </p>
                  
                  <Button asChild variant="default">
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Go to Admin Dashboard
                    </Link>
                  </Button>
                </div>
                
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-900 text-lg">Admin Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800">
                      <li>User management and permissions</li>
                      <li>Content moderation and approval</li>
                      <li>System configuration and settings</li>
                      <li>Security monitoring and updates</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link to="/admin/users">
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/settings">
                    System Settings
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
