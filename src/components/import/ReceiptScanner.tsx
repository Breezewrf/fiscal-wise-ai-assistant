
import React, { useState } from 'react';
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Camera, Receipt, ScanSearch, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/components/transactions/TransactionList';
import { addTransaction } from '@/lib/db/transactions';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const expenseCategories = [
  "Food & Dining",
  "Shopping",
  "Housing",
  "Transportation",
  "Entertainment",
  "Health & Medical",
  "Personal Care",
  "Education",
  "Travel",
  "Gifts & Donations",
  "Bills & Utilities",
  "Other",
];

export const ReceiptScanner = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    merchant: string;
    amount: string;
    date: string | Date;
    items?: string[];
    category?: string;
  } | null>(null);

  const addTransactionMutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setReceiptImage(file);
      setExtractedData(null);
      
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
      const reader = new FileReader();
      
      const imageBase64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      
      reader.readAsDataURL(receiptImage);
      const imageBase64 = await imageBase64Promise;
      
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
        const dateValue = data.data.date ? new Date(data.data.date) : new Date();
        
        setExtractedData({
          merchant: data.data.merchant || 'Unknown Merchant',
          amount: data.data.amount?.toString() || '0.00',
          date: dateValue,
          items: data.data.items || [],
          category: data.data.category || 'Other'
        });
        
        toast({
          title: "Receipt Processed Successfully",
          description: "Transaction details have been extracted from your receipt. You can edit them if needed.",
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
      const newTransaction: Partial<Transaction> = {
        date: extractedData.date instanceof Date ? extractedData.date : new Date(extractedData.date),
        type: 'expense',
        category: extractedData.category || 'Food & Dining',
        amount: parseFloat(extractedData.amount),
        description: extractedData.items?.join(', '),
        merchant: extractedData.merchant,
        importedFrom: 'receipt'
      };
      
      await addTransactionMutation.mutateAsync(newTransaction);
      
      toast({
        title: "Transaction Saved",
        description: `Added transaction from ${extractedData.merchant} for $${extractedData.amount}`,
      });
      
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

  const handleMerchantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        merchant: e.target.value
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        amount: e.target.value
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (extractedData && date) {
      setExtractedData({
        ...extractedData,
        date: date
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        category
      });
    }
  };

  const handleItemsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (extractedData) {
      const items = e.target.value.split('\n').filter(item => item.trim() !== '');
      setExtractedData({
        ...extractedData,
        items
      });
    }
  };

  const renderExtractedDataPreview = () => {
    if (!extractedData) return null;
    
    return (
      <div className="mt-4 bg-muted/30 p-4 rounded-lg">
        <h4 className="font-medium mb-4">Extracted Receipt Information</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input 
              id="merchant" 
              value={extractedData.merchant} 
              onChange={handleMerchantChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              value={extractedData.amount} 
              onChange={handleAmountChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !extractedData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {extractedData.date instanceof Date
                    ? format(extractedData.date, "PPP")
                    : extractedData.date || "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="single"
                  selected={extractedData.date instanceof Date ? extractedData.date : new Date(extractedData.date)}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={extractedData.category || "Other"} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {extractedData.items && (
            <div className="space-y-2">
              <Label htmlFor="items">Items</Label>
              <Textarea 
                id="items" 
                value={extractedData.items.join('\n')}
                onChange={handleItemsChange}
                rows={Math.min(5, extractedData.items.length + 1)}
                className="resize-y"
              />
            </div>
          )}
          
          <Button 
            className="w-full mt-4" 
            onClick={handleSaveReceiptData}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Transaction"}
          </Button>
        </div>
      </div>
    );
  };

  return (
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
            Our AI will analyze your receipt image and automatically extract the merchant name, amount, date, category, and items purchased. You can edit any details before saving.
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
  );
};
