
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ApiServiceInfoProps {
  name: string;
  description: string;
  url: string;
}

const ApiServiceInfo: React.FC<ApiServiceInfoProps> = ({ name, description, url }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-medium">Documentation</h3>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {name} API Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiServiceInfo;
