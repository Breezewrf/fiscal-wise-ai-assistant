
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export const NotificationSetup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSMSConnect = () => {
    setIsLoading(true);
    
    // Simulate SMS connection
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Connected Successfully",
        description: "Your device is now set up to capture SMS notifications.",
      });
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS & Notifications</CardTitle>
        <CardDescription>
          Automatically capture transactions from SMS and app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">How It Works</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  This feature monitors your SMS and app notifications for transaction details. When enabled, we'll automatically capture and categorize expenses from your bank messages, payment apps, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Settings</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between border p-3 rounded-md">
              <div>
                <span className="font-medium">SMS Capture</span>
                <p className="text-sm text-muted-foreground">Read and process bank SMS messages</p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSMSConnect}
                disabled={isLoading}
              >
                Connect
              </Button>
            </div>
            
            <div className="flex items-center justify-between border p-3 rounded-md">
              <div>
                <span className="font-medium">App Notifications</span>
                <p className="text-sm text-muted-foreground">Capture spending from payment apps</p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSMSConnect}
                disabled={isLoading}
              >
                Connect
              </Button>
            </div>
            
            <div className="flex items-center justify-between border p-3 rounded-md">
              <div>
                <span className="font-medium">iCloud Sync</span>
                <p className="text-sm text-muted-foreground">Sync data across your devices</p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSMSConnect}
                disabled={isLoading}
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
