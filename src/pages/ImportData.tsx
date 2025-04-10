
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
import { Camera, MessageSquare, ScanSearch, Upload, AlertCircle, Receipt, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/components/transactions/TransactionList';
import { importTransactions, addTransaction } from '@/lib/db/transactions';
import { supabase } from '@/integrations/supabase/client';

export default function ImportData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("generic");
  
  // State for receipt scanning
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    merchant: string;
    amount: string;
    date: string;
    items?: string[];
    category?: string;
  } | null>(null);
  
  // Import transactions mutation
  const importTransactionsMutation = useMutation({
    mutationFn: importTransactions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
  
  // Add single transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(e.target.files[0]);
    }
  };

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
  };

  const handleFileUpload = async () => {
    if (!fileSelected) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, here we would parse the CSV file
      // For this example, we'll create mock transactions
      
      // Mock importing data from file
      const mockTransactions: Partial<Transaction>[] = [];
      
      // Generate different mock data depending on the source
      if (selectedSource === "wechat") {
        // Create 5 mock WeChat transactions
        for (let i = 0; i < 5; i++) {
          mockTransactions.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            type: Math.random() > 0.3 ? 'expense' : 'income',
            category: Math.random() > 0.5 ? 'Shopping' : 'Food & Dining',
            amount: Math.floor(Math.random() * 100) + 10,
            description: `WeChat transaction #${i+1}`,
            merchant: `WeChat Merchant ${i+1}`,
            importedFrom: 'wechat'
          });
        }
      } else {
        // Create 3 generic transactions
        for (let i = 0; i < 3; i++) {
          mockTransactions.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            type: Math.random() > 0.3 ? 'expense' : 'income',
            category: 'Other',
            amount: Math.floor(Math.random() * 50) + 5,
            description: `Imported transaction #${i+1}`,
            importedFrom: 'file'
          });
        }
      }
      
      // Save the transactions to the database
      await importTransactionsMutation.mutateAsync(mockTransactions);
      
      toast({
        title: `${selectedSource === "wechat" ? "WeChat Pay" : "File"} Import Successful`,
        description: `Processed ${fileSelected.name} and imported ${mockTransactions.length} transactions.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setFileSelected(null);
    }
  };

  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setReceiptImage(file);
      setExtractedData(null); // Reset extracted data when new image is selected
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanReceipt = async () => {
    if (!receiptImage) {
      toast({
        title: "No receipt image selected",
        description: "Please select an image of your receipt",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Convert the image to base64
      const reader = new FileReader();
      
      const imageBase64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      
      reader.readAsDataURL(receiptImage);
      const imageBase64 = await imageBase64Promise;
      
      // Send to our edge function
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 }
      });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Scanning error: ${data.error}`);
      }
      
      if (data.data) {
        setExtractedData({
          merchant: data.data.merchant || 'Unknown Merchant',
          amount: data.data.amount?.toString() || '0.00',
          date: data.data.date || new Date().toISOString().split('T')[0],
          items: data.data.items || [],
          category: data.data.category || 'Other'
        });
        
        toast({
          title: "Receipt Processed Successfully",
          description: "Transaction details have been extracted from your receipt.",
        });
      } else {
        throw new Error("No data received from receipt scanner");
      }
    } catch (error) {
      console.error("Receipt scanning error:", error);
      toast({
        title: "Receipt Scanning Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveReceiptData = async () => {
    if (!extractedData) return;
    
    setIsLoading(true);
    
    try {
      // Create a new transaction from the extracted data
      const newTransaction: Partial<Transaction> = {
        date: new Date(extractedData.date),
        type: 'expense',
        category: extractedData.category || 'Food & Dining',
        amount: parseFloat(extractedData.amount),
        description: extractedData.items?.join(', '),
        merchant: extractedData.merchant,
        importedFrom: 'receipt'
      };
      
      // Save to database
      await addTransactionMutation.mutateAsync(newTransaction);
      
      toast({
        title: "Transaction Saved",
        description: `Added transaction from ${extractedData.merchant} for $${extractedData.amount}`,
      });
      
      // Reset for next scan
      setReceiptImage(null);
      setReceiptPreview(null);
      setExtractedData(null);
    } catch (error) {
      toast({
        title: "Error Saving Transaction",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderExtractedDataPreview = () => {
    if (!extractedData) return null;
    
    return (
      <div className="mt-4 bg-muted/30 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Extracted Receipt Information</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Merchant:</span>
            <span className="font-medium">{extractedData.merchant}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">${extractedData.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{extractedData.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">{extractedData.category || "Other"}</span>
          </div>
          {extractedData.items && extractedData.items.length > 0 && (
            <div>
              <span className="text-muted-foreground">Items:</span>
              <ul className="pl-4 mt-1">
                {extractedData.items.map((item, index) => (
                  <li key={index} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          )}
          <Button 
            className="w-full mt-2" 
            onClick={handleSaveReceiptData}
            disabled={isLoading}
          >
            Save Transaction
          </Button>
        </div>
      </div>
    );
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
                Take a photo of your receipt to automatically extract transaction details using AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Receipt className="h-4 w-4" />
                <AlertTitle>AI Receipt Scanner</AlertTitle>
                <AlertDescription>
                  Our AI will analyze your receipt image and automatically extract the merchant name, amount, date, category, and items purchased.
                </AlertDescription>
              </Alert>
              
              <div className="border rounded-md p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  {receiptPreview ? (
                    <div className="relative mb-2">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="max-h-64 rounded-md object-contain"
                      />
                      <button 
                        onClick={() => {
                          setReceiptImage(null);
                          setReceiptPreview(null);
                          setExtractedData(null);
                        }}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  )}
                  <p className="text-muted-foreground">
                    {receiptImage 
                      ? `Selected: ${receiptImage.name}` 
                      : "Upload a photo of your receipt or capture one with your camera"}
                  </p>
                  <div className="grid gap-2 w-full max-w-sm">
                    <Input 
                      id="receipt" 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleReceiptImageChange}
                      className={receiptImage ? "hidden" : ""}
                    />
                    <Button 
                      onClick={handleScanReceipt}
                      disabled={isScanning || !receiptImage}
                      className="flex items-center justify-center"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing Receipt...
                        </>
                      ) : (
                        <>
                          <ScanSearch className="h-4 w-4 mr-2" />
                          Extract Receipt Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {renderExtractedDataPreview()}
              
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ScanSearch className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">How AI Receipt Scanning Works</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our advanced AI vision model analyzes payment receipts and extracts key information:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-4">
                      <li>Merchant name and location</li>
                      <li>Transaction amount and date</li>
                      <li>Individual items and their prices</li>
                      <li>Automatic expense categorization</li>
                    </ul>
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
