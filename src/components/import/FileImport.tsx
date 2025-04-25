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
import { ZipReader, BlobReader, TextWriter, Entry, Uint8ArrayWriter } from '@zip.js/zip.js';

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
  const [zipFileSelected, setZipFileSelected] = useState<File | null>(null);
  const [zipPassword, setZipPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [zipExtractedCSV, setZipExtractedCSV] = useState<string | null>(null);
  const [zipProcessing, setZipProcessing] = useState(false);

  const importTransactionsMutation = useMutation({
    mutationFn: importTransactions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
    setFileSelected(null);
    setZipFileSelected(null);
    setZipExtractedCSV(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(e.target.files[0]);
      setZipFileSelected(null);
      setZipExtractedCSV(null);
    }
  };

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setZipFileSelected(e.target.files[0]);
      setFileSelected(null);
      setZipExtractedCSV(null);
      setShowPasswordDialog(true);
    }
  };

  const handleZipPasswordSubmit = async () => {
    if (!zipFileSelected) return;
    setZipProcessing(true);
    try {
      const reader = new ZipReader(new BlobReader(zipFileSelected), { password: zipPassword });
      const entries = await reader.getEntries();
      const csvEntry = entries.find((entry: Entry) => entry.filename.endsWith('.csv'));
      if (!csvEntry) throw new Error('No CSV file found in zip.');
      let text: string;
      if (selectedSource === "alipay") {
        const uint8Array = await csvEntry.getData!(new Uint8ArrayWriter());
        const decoder = new TextDecoder('gbk');
        text = decoder.decode(uint8Array);
      } else if (selectedSource === "wechat") {
        text = await csvEntry.getData!(new TextWriter());
      } else {
        text = await csvEntry.getData!(new TextWriter());
      }
      setZipExtractedCSV(text as string);
      setShowPasswordDialog(false);
      await reader.close();
      toast({
        title: "Unzip Successful",
        description: "The zip file was extracted successfully.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Unzip Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setZipProcessing(false);
      setZipPassword('');
    }
  };

  const handleZipProcess = async () => {
    if (!zipExtractedCSV) return;
    setIsLoading(true);
    try {
      if (selectedSource === "alipay") {
        const encoder = new TextEncoder();
        Papa.parse<AlipayCSVRow>(zipExtractedCSV, {
          header: true,
          encoding: "GBK",
          complete: async (results) => {
            try {
              console.log("Unzip Parsing Alipay CSV", results);
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
          },
          error: (error) => {
            toast({
              title: "CSV Parsing Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
          }
        });
      } else if (selectedSource === "wechat") {
        Papa.parse<WeChatCSVRow>(zipExtractedCSV, {
          header: true,
          encoding: "UTF-8",
          complete: async (results) => {
            try {
              const transactions = parseWeChatCSV(results);
              const normalized = normalizeWeChatTransactions(transactions);
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
          },
          error: (error) => {
            toast({
              title: "CSV Parsing Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
          }
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
      setZipFileSelected(null);
      setZipExtractedCSV(null);
    }
  };

  type AlipayCSVRow = {
    [key: string]: string | undefined;
    '------------------------------------------------------------------------------------': string;
  } & {
    '__parsed_extra'?: string[] | undefined;
  };

  const parseAlipayCSV = (results: Papa.ParseResult<AlipayCSVRow>): Partial<Transaction>[] => {
    // Find the row with the header and __parsed_extra (contains all transactions)
    const headerRow = results.data.find(
      (row) =>
        row['------------------------------------------------------------------------------------'] === '交易时间' &&
        Array.isArray(row['__parsed_extra'])
    );
    if (!headerRow || !Array.isArray(headerRow['__parsed_extra'])) {
      return [];
    }
    const fields = headerRow['__parsed_extra'];
    const TRANSACTION_FIELD_COUNT = 12;
    // Skip the first transaction item (the head)
    const startIdx = TRANSACTION_FIELD_COUNT;
    const transactions: Partial<Transaction>[] = [];
    for (let i = startIdx; i + TRANSACTION_FIELD_COUNT <= fields.length; i += TRANSACTION_FIELD_COUNT) {
      const [
        category,
        merchant,
        account,
        description,
        typeStr,
        amountStr,
        method,
        status,
        orderId,
        merchantOrderId,
        remark,
        dateStr
      ] = fields.slice(i, i + TRANSACTION_FIELD_COUNT).map(f => (f ?? '').trim());

      // Skip empty or non-transaction rows
      if (!dateStr || !category || !typeStr || !amountStr) continue;
      // Skip "不计收支"
      if (typeStr === '不计收支') continue;

      const isExpense = typeStr === '支出';
      const amount = parseFloat(amountStr);

      transactions.push({
        date: new Date(dateStr.replace(/^\n/, '')), // Remove leading newline
        type: isExpense ? 'expense' : 'income',
        category: category || 'Other',
        amount: amount,
        description: description || '',
        merchant: merchant || '',
        importedFrom: 'alipay',
      });
    }
    return transactions;
  };

  const normalizeAlipayTransactions = (alipayTransactions: Partial<Transaction>[]): Partial<Transaction>[] => {
    if (!alipayTransactions.length) {
      return [];
    }
    
    console.log("Checking valid importedFrom values in database schema");
    
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
      .map(txn => ({
        ...txn,
        date: txn.date instanceof Date
          ? txn.date
          : new Date(txn.date as string),
        type: txn.type === 'expense' ? 'expense' : 'income',
        importedFrom: 'file'
      }));
  };

  type WeChatCSVRow = {
    '微信支付账单明细': string;  // Transaction time
    '': string;                 // Transaction type
    '_1': string;              // Merchant
    '_2': string;              // Description
    '_3': string;              // Income/Expense
    '_4': string;              // Amount
    '_5'?: string;             // Payment method
    '_6'?: string;             // Status
    '_7'?: string;             // Transaction ID
    '_8'?: string;             // Optional field
    '_9'?: string;             // Optional field
    '__parsed_extra'?: string[];
  };
  
  const parseWeChatCSV = (results: Papa.ParseResult<WeChatCSVRow>): Partial<Transaction>[] => {
    console.log("Parsing WeChat CSV", results);
    
    // Regular expression for date-time format validation
    const transactionPattern = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/;
    
    // Filter valid transactions first
    const validRows = results.data.filter(row => {
      return transactionPattern.test(row['微信支付账单明细']) &&
             row[''] !== '' && // Transaction type not empty
             row['_1'] !== '' && // Merchant not empty
             row['_2'] !== '' && // Description not empty
             row['_3'] !== '' && // Income/Expense not empty
             row['_4'] !== ''; // Amount not empty
    });

    try {
      return validRows.map((row) => {
        const isExpense = row['_3'] === '支出';
        let amount = 0;
        try {
          amount = parseFloat(row['_4'].replace('¥', ''));
        } catch (error) {
          console.error('Error parsing amount:', row['_4']);
          amount = 0;
        }

        return {
          date: new Date(row['微信支付账单明细']),
          type: isExpense ? 'expense' : 'income',
          category: row[''] || 'Other',
          amount: amount,
          description: row['_2'] || '',
          merchant: row['_1'] || '',
          importedFrom: 'wechat',
        };
      });
    } catch (error) {
      console.error('Error parsing WeChat transactions:', error);
      return [];
    }
  };

  const normalizeWeChatTransactions = (wechatTransactions: Partial<Transaction>[]): Partial<Transaction>[] => {
    if (!wechatTransactions.length) {
      return [];
    }
    
    return wechatTransactions
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
      .map(txn => ({
        ...txn,
        date: txn.date instanceof Date
          ? txn.date
          : new Date(txn.date as string),
        type: txn.type === 'expense' ? 'expense' : 'income',
        importedFrom: 'file'
      }));
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

  const preprocessGBK = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const decoder = new TextDecoder('gbk');
    return decoder.decode(arrayBuffer);
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
      let text: string;
      if (selectedSource === "alipay") {
        text = await preprocessGBK(fileSelected);
      } else {
        text = await fileSelected.text();
      }
      
      if (selectedSource === "alipay") {
        Papa.parse<AlipayCSVRow>(text, {
          header: true,
          // encoding: "UTF-8",
          complete: async (results) => {
            try {
              console.log("Parsing Alipay CSV", results);
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
          },
          error: (error) => {
            toast({
              title: "CSV Parsing Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
          }
        });
      } else if (selectedSource === "wechat") {
        Papa.parse<WeChatCSVRow>(text, {
          header: true,
          encoding: "UTF-8",
          complete: async (results) => {
            try {
              const transactions = parseWeChatCSV(results);
              const normalized = normalizeWeChatTransactions(transactions);
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
          },
          error: (error) => {
            toast({
              title: "CSV Parsing Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
          }
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
              {(selectedSource === "alipay" || selectedSource === "wechat") && (
                <div 
                  className="border rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById('file')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {fileSelected 
                        ? `Selected: ${fileSelected.name}`
                        : zipFileSelected
                          ? `Selected zip: ${zipFileSelected.name}`
                          : "Upload your exported file (.csv)"
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
              )}
              {(selectedSource === "alipay" || selectedSource === "wechat") && (
                <div 
                  className="border rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById('zipfile')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {zipFileSelected
                        ? `Selected zip: ${zipFileSelected.name}`
                        : "Or upload a password-protected zip file (.zip)"
                      }
                    </p>
                    <Input
                      id="zipfile"
                      type="file"
                      className="hidden"
                      onChange={handleZipFileChange}
                      accept=".zip"
                    />
                  </div>
                </div>
              )}
              {/* Only show CSV upload for generic/bank */}
              {(selectedSource === "generic" || selectedSource === "bank") && (
                <div 
                  className="border rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById('file')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {fileSelected 
                        ? `Selected: ${fileSelected.name}`
                        : "Upload your CSV file"
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
              )}
              {/* Buttons */}
              {(selectedSource === "alipay" || selectedSource === "wechat") && (
                <>
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={isLoading || !fileSelected}
                    className={selectedSource === "alipay" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {isLoading ? "Processing..." : "Import CSV"}
                  </Button>
                  <Button
                    onClick={handleZipProcess}
                    disabled={isLoading || !zipExtractedCSV}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Processing..." : "Process Zip"}
                  </Button>
                </>
              )}
              {(selectedSource === "generic" || selectedSource === "bank") && (
                <Button 
                  onClick={handleFileUpload} 
                  disabled={isLoading || !fileSelected}
                >
                  {isLoading ? "Processing..." : "Upload and Process"}
                </Button>
              )}
            </div>
          </div>
          {renderDataPreview()}
        </CardContent>
      </Card>
      
      {/* Password Dialog for Zip */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Zip Password</DialogTitle>
            <DialogDescription>
              This zip file is password-protected. Please enter the password to extract the CSV.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Password"
            value={zipPassword}
            onChange={e => setZipPassword(e.target.value)}
            disabled={zipProcessing}
          />
          <DialogFooter>
            <Button
              onClick={() => setShowPasswordDialog(false)}
              variant="secondary"
              disabled={zipProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleZipPasswordSubmit}
              disabled={zipProcessing || !zipPassword}
            >
              {zipProcessing ? "Extracting..." : "Extract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
