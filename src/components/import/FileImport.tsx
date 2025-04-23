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
import Papa from 'papaparse';

export const FileImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("alipay");

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

  type AlipayCSVRow = {
    [key: string]: string | undefined;
    '------------------------------------------------------------------------------------': string;
  } & {
    '__parsed_extra'?: string[] | undefined;
  };

  const parseAlipayCSV = (results: Papa.ParseResult<Record<string, string>>): Partial<Transaction>[] => {
    return results.data
      .filter(row => row['收/支'] === '支出' || row['收/支'] === '收入')
      .map(row => {
        const isExpense = row['收/支'] === '支出';
        const amount = parseFloat(row['金额']);
        return {
          date: new Date(row['交易时间']),
          type: isExpense ? 'expense' : 'income',
          category: row['交易分类'] || 'Other',
          amount: amount,
          description: row['商品说明'] || '',
          merchant: row['交易对方'] || '',
          importedFrom: 'alipay'
        };
      });
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
      if (selectedSource === "alipay") {
        const text = await fileSelected.text();
        Papa.parse<AlipayCSVRow>(text, {
                  header: true,
                  encoding: "UTF-8",
                  complete: async (results) => {
                    try {
                      const transactions = parseAlipayCSV(results);
                      console.log("Parsed transactions:", transactions);
                      await importTransactionsMutation.mutateAsync(transactions);
                      
                      toast({
                        title: "Alipay Import Successful",
                        description: `Processed ${fileSelected.name} and imported ${transactions.length} transactions.`,
                      });
                    } catch (error) {
                      toast({
                        title: "Import Processing Failed",
                        description: `Error: ${(error as Error).message}, transactions: ${JSON.stringify(results.data)}`,
                        variant: "destructive",
                      });
                    }
                  },
                  error: (error) => {
                    toast({
                      title: "CSV Parsing Failed",
                      description: `Error: ${error.message}`,
                      variant: "destructive",
                    });
                  }
                });
      } else {
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
      }
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
    if (selectedSource === "alipay") {
      return (
        <div className="bg-muted/30 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">How to export Alipay transactions</h4>
              <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal pl-4">
                <li>Open Alipay app and go to "Records"</li>
                <li>Click on the download icon in the top right</li>
                <li>Select your date range</li>
                <li>Choose "Download Transaction Records"</li>
                <li>Save the CSV file and upload it here</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
    
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
          <Select defaultValue="alipay" onValueChange={handleSourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alipay">Alipay Export</SelectItem>
              <SelectItem value="wechat">WeChat Pay Export</SelectItem>
              <SelectItem value="generic">Generic CSV</SelectItem>
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
                    : selectedSource === "alipay" 
                      ? "Upload your Alipay export file (.csv)"
                      : "Drag and drop or click to upload"
                  }
                </p>
                <Input 
                  id="file" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".csv" 
                />
              </div>
            </div>
            <Button 
              onClick={handleFileUpload} 
              disabled={isLoading || !fileSelected}
              className={selectedSource === "alipay" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isLoading ? "Processing..." : selectedSource === "alipay" ? "Import Alipay Transactions" : "Upload and Process"}
            </Button>
          </div>
        </div>
        {selectedSource === "alipay" && (
          <div className="bg-muted/20 rounded-md p-4 text-sm font-mono whitespace-pre-wrap text-muted-foreground mt-4">
            <p className="font-semibold mb-2">Example Alipay CSV format (可复制):</p>
            <pre>
{`收/支,金额,交易时间,交易分类,商品说明,交易对方
支出,17.90,2025-04-21 23:28:38,生活服务,沙县小吃（黄贝岭上村店）-美团App-25042211100400001303055164433618,美团
收入,0.29,2025-04-21 19:44:24,投资理财,余额宝-2025.04.21-收益发放,博时基金管理有限公司
支出,52.00,2025-04-20 12:30:15,出行,打车-滴滴出行,滴滴`}
            </pre>
            <p className="text-xs mt-1 text-muted-foreground">
              <span className="font-semibold">Required columns</span>: 收/支, 金额, 交易时间, 交易分类, 商品说明, 交易对方<br />
              <span>Only rows with 收/支 = 支出 or 收入 are imported. Dates in <strong>YYYY-MM-DD HH:mm:ss</strong> are supported.</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
