
import React, { useState, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load the admin components for better performance
const UserManagement = React.lazy(() => import('@/components/admin/UserManagement'));
const ApiKeyManagement = React.lazy(() => import('@/components/admin/ApiKeyManagement'));
const APIServiceManagement = React.lazy(() => import('@/components/admin/APIServiceManagement'));

// Loading fallback component
const TabLoader = () => (
  <div className="flex justify-center items-center min-h-[300px]">
    <Spinner size="lg" />
  </div>
);

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="aiservices">AI Services</TabsTrigger>
        </TabsList>
        
        <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong loading this tab.</div>}>
          <TabsContent value="users" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <UserManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="apikeys" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <ApiKeyManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="aiservices" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <APIServiceManagement />
            </Suspense>
          </TabsContent>
        </ErrorBoundary>
      </Tabs>
    </div>
  );
};

export default AdminPage;
