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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionPreviewTable } from "./TransactionPreviewTable";

export const FileImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("alipay");
  const [showPreview, setShowPreview] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<Partial<Transaction>[]>([]);
  const [previewPage, setPreviewPage] = useState(1);

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

  const parseAlipayCSV = (results: Papa.ParseResult<AlipayCSVRow>): Partial<Transaction>[] => {
    const dataRows = results.data.filter(
      (row) =>
        row['------------------------------------------------------------------------------------'] &&
        row['__parsed_extra'] &&
        row['------------------------------------------------------------------------------------'] !== '交易时间'
    );

    return dataRows.map((row) => {
      const extraFields = row['__parsed_extra'] || [];
      const isExpense = extraFields[4] === '支出';
      const amount = parseFloat(extraFields[5]);

      return {
        date: new Date(row['------------------------------------------------------------------------------------']),
        type: isExpense ? 'expense' : 'income',
        category: extraFields[0] || 'Other',
        amount: amount,
        description: extraFields[3] || '',
        merchant: extraFields[1] || '',
        importedFrom: 'alipay',
      };
    });
  };

  const normalizeAlipayTransactions = (alipayTransactions: Partial<Transaction>[]): Partial<Transaction>[] => {
    if (!alipayTransactions.length) {
      return [];
    }

    return alipayTransactions
      .filter(txn => {
        return (
          txn.type &&
          typeof txn.type === 'string' &&
          txn.category &&
          typeof txn.category === 'string' &&
          txn.amount !== undefined &&
          typeof txn.amount === 'number' &&
          txn.date &&
          (txn.date instanceof Date || typeof txn.date === 'string')
        );
      })
      .map(txn => {
        const dateISO = txn.date instanceof Date
          ? txn.date.toISOString().slice(0, 10)
          : (typeof txn.date === "string" && txn.date.length > 10
              ? txn.date.slice(0, 10)
              : txn.date);

        return {
          date: dateISO,
          type: txn.type === 'expense' ? 'expense' : 'income',
          category: txn.category,
          amount: txn.amount,
          description: txn.description ?? '',
          merchant_name: txn.merchant_name ?? txn.merchant ?? '',
          imported_from: txn.importedFrom ?? 'file'
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
        Papa.parse(text, {
          header: true,
          encoding: "UTF-8",
          complete: (results) => {
            try {
              const transactions = parseAlipayCSV(results);
              const normalized = normalizeAlipayTransactions(transactions);

              setPreviewTransactions(normalized);
              setShowPreview(true);
              setPreviewPage(1);
            } catch (error) {
              toast({
                title: "Import Processing Failed",
                description: `Error: ${(error as Error).message}`,
                variant: "destructive",
              });
            }
            setIsLoading(false);
          },
          error: (error) => {
            toast({
              title: "CSV Parsing Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
            setIsLoading(false);
          }
        });
      } else {
        const mockTransactions: Partial<Transaction>[] = [];
        if (selectedSource === "wechat") {
          for (let i = 0; i < 5; i++) {
            mockTransactions.push({
              date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
              type: Math.random() > 0.3 ? 'expense' : 'income',
              category: Math.random() > 0.5 ? 'Shopping' : 'Food & Dining',
              amount: Math.floor(Math.random() * 100) + 10,
              description: `WeChat transaction #${i+1}`,
              merchant_name: `WeChat Merchant ${i+1}`,
              imported_from: 'wechat'
            });
          }
        } else {
          for (let i = 0; i < 3; i++) {
            mockTransactions.push({
              date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
              type: Math.random() > 0.3 ? 'expense' : 'income',
              category: 'Other',
              amount: Math.floor(Math.random() * 50) + 5,
              description: `Imported transaction #${i+1}`,
              imported_from: 'file'
            });
          }
        }
        setPreviewTransactions(mockTransactions);
        setShowPreview(true);
        setPreviewPage(1);
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handlePreviewTransactionChange = (idx: number, updated: Partial<Transaction>) => {
    setPreviewTransactions((prev) =>
      prev.map((txn, i) => (i === idx ? { ...txn, ...updated } : txn))
    );
  };

  const handleRowRemove = (idx: number) => {
    setPreviewTransactions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImportConfirm = async () => {
    if (!previewTransactions.length) {
      toast({
        title: "No transactions to import",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    try {
      const validTxns = previewTransactions.filter(
        (t) =>
          t.date &&
          t.type &&
          t.category &&
          typeof t.amount === "number" &&
          t.date.length === 10
      );
      if (!validTxns.length) {
        throw new Error("No valid transactions selected. Make sure all rows are valid");
      }
      await importTransactionsMutation.mutateAsync(validTxns);
      toast({
        title: "Import Successful",
        description: `Imported ${validTxns.length} transactions.`,
      });
      setShowPreview(false);
      setPreviewTransactions([]);
      setFileSelected(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    <>
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
            <Select defaultValue="alipay" onValueChange={setSelectedSource}>
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
                  onChange={e => {
                    setFileSelected(e.target.files?.[0] || null);
                  }}
                  accept=".csv"
                />
              </div>
            </div>
            <Button
              onClick={handleFileUpload}
              disabled={isLoading || !fileSelected}
              className={selectedSource === "alipay" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isLoading ? "Processing..." : selectedSource === "alipay" ? "Import Alipay Transactions" : "Upload and Preview"}
            </Button>
          </div>
          {selectedSource === "alipay" && (
            <div className="bg-muted/20 rounded-md p-4 text-sm font-mono whitespace-pre-wrap text-muted-foreground mt-4">
              <p className="font-semibold mb-2">Example Alipay CSV format:</p>
              <pre>
{`收/支,金额,交易时间,交易分类,商品说明,交易对方
支出,100.00,2024-04-20,Food & Dining,Coffee Shop,Starbucks
收入,5000.00,2024-04-18,Salary,Monthly Salary,Company XYZ
支出,50.00,2024-04-19,Transportation,Taxi Ride,City Taxi
支出,30.00,2024-04-17,Shopping,Books,Bookstore`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={open => setShowPreview(open)}>
        <DialogContent className="md:max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Review & Edit Transactions</DialogTitle>
            <div className="text-sm text-muted-foreground mb-2">
              Review the imported data, edit any fields if needed, and click "Import" to save.
            </div>
          </DialogHeader>
          <div className="mb-4">
            <TransactionPreviewTable
              transactions={previewTransactions}
              onTransactionChange={handlePreviewTransactionChange}
              onRemove={handleRowRemove}
              page={previewPage}
              perPage={15}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              onClick={() => setShowPreview(false)}
              variant="secondary"
              type="button"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={isLoading || previewTransactions.length === 0}
            >
              {isLoading ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
