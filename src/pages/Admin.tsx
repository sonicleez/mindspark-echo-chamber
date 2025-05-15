
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/UserManagement';
import ApiKeyManagement from '@/components/admin/ApiKeyManagement';
import RiveAnimationManagement from '@/components/admin/RiveAnimationManagement';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="animations">Rive Animations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="apikeys" className="mt-6">
          <ApiKeyManagement />
        </TabsContent>
        
        <TabsContent value="animations" className="mt-6">
          <RiveAnimationManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
