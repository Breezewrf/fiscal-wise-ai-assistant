import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, AlertCircle, Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/components/transactions/TransactionList';
import { importTransactions } from '@/lib/db/transactions';
import Papa from 'papaparse';
import { format } from "date-fns";


export const FileImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("alipay");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    transactions: Partial<Transaction>[];
    totalAmount: number;
    count: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

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

  const handleEditTransaction = (index: number, field: keyof Transaction, value: any) => {
    setPreviewData(prev => prev ? {
      ...prev,
      transactions: prev.transactions.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    } : null);
  };

  const handleConfirmImport = async () => {
    try {
      if (previewData) {
        await importTransactionsMutation.mutateAsync(previewData.transactions);
        toast({
          title: "Import Successful",
          description: `Imported ${previewData.transactions.length} transactions.`,
        });
        setIsPreviewOpen(false);
        setPreviewData(null);
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil((previewData?.transactions.length || 0) / itemsPerPage);
  const paginatedData = previewData?.transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

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
              setPreviewData({
                transactions: normalized,
                totalAmount: normalized.reduce((sum, t) => {
                  const amount = t.amount || 0;
                  return sum + (t.type === 'expense' ? -amount : amount);
                }, 0),
                count: normalized.length
              });
              setIsPreviewOpen(true);
            } catch (error) {
              toast({
                title: "Parsing Failed",
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
      } else if (selectedSource === "wechat") {
        const mockTransactions: Partial<Transaction>[] = [];

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
        setPreviewData({
          transactions: mockTransactions,
          totalAmount: mockTransactions.reduce((sum, t) => {
            const amount = t.amount || 0;
            return sum + (t.type === 'expense' ? -amount : amount);
          }, 0),
          count: mockTransactions.length
        });
        setIsPreviewOpen(true);
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

  const renderDataPreview = () => {
    if (!previewData) return null;
  };

  const renderPageSizeSelector = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Items per page:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => setItemsPerPage(Number(value))}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
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
          {renderDataPreview()}
        </CardContent>
      </Card>
      
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl h-[80vh] flex flex-col"> {/* Changed from max-w-4xl to max-w-7xl */}
          <DialogHeader>
            <DialogTitle>Preview Import Data</DialogTitle>
            <DialogDescription>
              Review and edit transactions before importing. {previewData?.transactions.length} items total.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((transaction, index) => (
                  <TableRow key={index}>
                    {editingRow === index ? (
                      <>
                        <TableCell>
                          <Input
                            type="date"
                            value={transaction.date instanceof Date 
                              ? transaction.date.toISOString().split('T')[0]
                              : ''}
                            onChange={(e) => handleEditTransaction(index, 'date', new Date(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transaction.type}
                            onValueChange={(value) => handleEditTransaction(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transaction.category}
                            onChange={(e) => handleEditTransaction(index, 'category', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={transaction.amount}
                            onChange={(e) => handleEditTransaction(index, 'amount', parseFloat(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transaction.description}
                            onChange={(e) => handleEditTransaction(index, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transaction.merchant}
                            onChange={(e) => handleEditTransaction(index, 'merchant', e.target.value)}
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {transaction.date instanceof Date 
                            ? transaction.date.toLocaleDateString()
                            : new Date(transaction.date as string).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                            {transaction.type === 'expense' ? '-' : '+'}${transaction.amount?.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.merchant}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            onClick={() => setEditingRow(editingRow === index ? null : index)}
                          >
                            {editingRow === index ? 'Save' : 'Edit'}
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {renderPageSizeSelector()}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
