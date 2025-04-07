
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, MessageSquare, ScanSearch, Upload, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function ImportData() {
  const { toast } = useToast();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("generic");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(e.target.files[0]);
    }
  };

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
  };

  const handleFileUpload = () => {
    if (!fileSelected) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate file upload with different processing based on source
    setTimeout(() => {
      setIsLoading(false);
      
      if (selectedSource === "wechat") {
        toast({
          title: "WeChat Pay Import Successful",
          description: `Processed ${fileSelected.name} and imported 24 transactions from WeChat Pay.`,
        });
      } else {
        toast({
          title: "Upload Successful",
          description: `File "${fileSelected.name}" has been uploaded and processed.`,
        });
      }
      
      setFileSelected(null);
    }, 2000);
  };

  // Render help text based on selected source
  const renderSourceHelp = () => {
    if (selectedSource === "wechat") {
      return (
        <div className="bg-muted/30 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">How to export WeChat Pay transactions</h4>
              <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal pl-4">
                <li>Open WeChat and go to "Me" &gt; "Pay"</li>
                <li>Tap on "Wallet" &gt; "Bills"</li>
                <li>Click on the filter icon in the top right</li>
                <li>Select your date range</li>
                <li>Tap the "Export" button at the bottom</li>
                <li>Save the file and upload it here</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleScanUpload = () => {
    setIsLoading(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Scan Processed",
        description: "Receipt data has been extracted successfully.",
      });
    }, 2000);
  };

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
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Import Data</h1>
      
      <Tabs defaultValue="file">
        <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md">
          <TabsTrigger value="file">Files</TabsTrigger>
          <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
          <TabsTrigger value="sms">SMS & Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Transaction File</CardTitle>
              <CardDescription>
                Import transaction data from external sources like Alipay, WeChat Pay, or bank statements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select defaultValue="generic" onValueChange={handleSourceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic CSV</SelectItem>
                    <SelectItem value="alipay">Alipay Export</SelectItem>
                    <SelectItem value="wechat">WeChat Pay Export</SelectItem>
                    <SelectItem value="bank">Bank Statement</SelectItem>
                  </SelectContent>
                </Select>
                {renderSourceHelp()}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="grid gap-2">
                  <div 
                    className="border rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {fileSelected 
                          ? `Selected: ${fileSelected.name}`
                          : selectedSource === "wechat" 
                            ? "Upload your WeChat Pay export file (.csv)"
                            : "Drag and drop or click to upload"
                        }
                      </p>
                      <Input 
                        id="file" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept={selectedSource === "wechat" ? ".csv" : ".csv,.xlsx,.pdf"} 
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={isLoading || !fileSelected}
                    className={selectedSource === "wechat" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isLoading ? "Processing..." : selectedSource === "wechat" ? "Import WeChat Transactions" : "Upload and Process"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>Scan Receipt</CardTitle>
              <CardDescription>
                Take a photo of your receipt to automatically extract transaction details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-md p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Take a photo of your receipt or upload an existing image
                  </p>
                  <div className="grid gap-2 w-full max-w-sm">
                    <Input 
                      id="receipt" 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                    />
                    <Button 
                      onClick={handleScanUpload}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Scan Receipt"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ScanSearch className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">How OCR Works</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our OCR technology automatically extracts merchant name, date, amount and items from your receipts. The system will try to categorize your expenses based on the detected information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sms">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
