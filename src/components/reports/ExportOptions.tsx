
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { FileDown, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface ExportOptionsProps {
  showExportOptions: boolean;
  setShowExportOptions: (show: boolean) => void;
  exportFormat: 'json' | 'csv' | 'pdf';
  setExportFormat: (format: 'json' | 'csv' | 'pdf') => void;
  handleDownload: () => void;
  isMobile: boolean;
}

export function ExportOptions({
  showExportOptions,
  setShowExportOptions,
  exportFormat,
  setExportFormat,
  handleDownload,
  isMobile
}: ExportOptionsProps) {
  if (isMobile) {
    return (
      <Drawer open={showExportOptions} onOpenChange={setShowExportOptions}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Export Report</DrawerTitle>
            <DrawerDescription>
              Choose a format to download your report
            </DrawerDescription>
          </DrawerHeader>
          <ExportFormatOptions 
            exportFormat={exportFormat} 
            setExportFormat={setExportFormat} 
          />
          <DrawerFooter>
            <Button onClick={handleDownload}>Download</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose a format to download your report
          </DialogDescription>
        </DialogHeader>
        <ExportFormatOptions 
          exportFormat={exportFormat} 
          setExportFormat={setExportFormat} 
        />
        <DialogFooter>
          <Button onClick={handleDownload}>Download</Button>
          <Button variant="outline" onClick={() => setShowExportOptions(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExportFormatOptionsProps {
  exportFormat: 'json' | 'csv' | 'pdf';
  setExportFormat: (format: 'json' | 'csv' | 'pdf') => void;
}

function ExportFormatOptions({ exportFormat, setExportFormat }: ExportFormatOptionsProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <h4 className="font-medium">Select format</h4>
        <div className="flex flex-col space-y-1.5">
          <Button 
            variant="outline" 
            className={cn(
              "justify-start text-left",
              exportFormat === 'json' && "border-primary"
            )}
            onClick={() => setExportFormat('json')}
          >
            <div className="flex items-center">
              <FileDown className="mr-2 h-4 w-4" />
              <span>JSON</span>
              {exportFormat === 'json' && <Check className="ml-auto h-4 w-4" />}
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className={cn(
              "justify-start text-left",
              exportFormat === 'csv' && "border-primary"
            )}
            onClick={() => setExportFormat('csv')}
          >
            <div className="flex items-center">
              <FileDown className="mr-2 h-4 w-4" />
              <span>CSV (Excel)</span>
              {exportFormat === 'csv' && <Check className="ml-auto h-4 w-4" />}
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className={cn(
              "justify-start text-left",
              exportFormat === 'pdf' && "border-primary"
            )}
            onClick={() => setExportFormat('pdf')}
          >
            <div className="flex items-center">
              <FileDown className="mr-2 h-4 w-4" />
              <span>PDF Document</span>
              {exportFormat === 'pdf' && <Check className="ml-auto h-4 w-4" />}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
