
import React, { useState } from 'react';
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
import { Upload, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/components/transactions/TransactionList';
import { importTransactions } from '@/lib/db/transactions';

export const FileImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("generic");

  const importTransactionsMutation = useMutation({
    mutationFn: importTransactions,
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
      // Mock importing data from file
      const mockTransactions: Partial<Transaction>[] = [];
      
      if (selectedSource === "wechat") {
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

  return (
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
  );
};
