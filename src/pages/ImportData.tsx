
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileImport } from '@/components/import/FileImport';
import { ReceiptScanner } from '@/components/import/ReceiptScanner';
import { NotificationSetup } from '@/components/import/NotificationSetup';

export default function ImportData() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Import Data</h1>
      
      <Tabs defaultValue="file">
        <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md">
          <TabsTrigger value="file">Files</TabsTrigger>
          <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
          <TabsTrigger value="sms">SMS & Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file">
          <FileImport />
        </TabsContent>
        
        <TabsContent value="scan">
          <ReceiptScanner />
        </TabsContent>
        
        <TabsContent value="sms">
          <NotificationSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
