import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useYNAB } from "@/contexts/YNABContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Add autotable to jsPDF
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const ExportOptions = () => {
  const { payeeAnalysis, selectedBudgetId, budgets } = useYNAB();
  const [exportType, setExportType] = useState<string>("xlsx");
  const [exportTemplate, setExportTemplate] = useState<string>("detailed");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    transactionCount: true,
    totalAmount: true,
    averageAmount: true,
    firstTransaction: true,
    lastTransaction: true,
    categories: true
  });
  
  // Get selected budget name for export filename
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";
  
  const toggleField = (field: keyof typeof selectedFields) => {
    setSelectedFields({
      ...selectedFields,
      [field]: !selectedFields[field]
    });
  };
  
  const handleExport = () => {
    setIsExporting(true);
    
    try {
      if (exportType === "xlsx") {
        exportToXLSX();
      } else if (exportType === "csv") {
        exportToCSV();
      } else if (exportType === "pdf") {
        exportToPDF();
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const exportToXLSX = () => {
    const data = prepareExportData();
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Add column widths for better appearance
    const maxWidths: { [key: string]: number } = {
      A: 30, // Payee Name
      B: 15, // Transaction Count
      C: 15, // Total Amount
      D: 15, // Average Amount
      E: 15, // First Transaction
      F: 15, // Last Transaction
      G: 40  // Categories
    };
    
    worksheet["!cols"] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payee Analysis");
    XLSX.writeFile(workbook, `ynab-payees-${budgetName.replace(/\s+/g, '-').toLowerCase()}-${exportTemplate}.xlsx`);
  };
  
  const exportToCSV = () => {
    const data = prepareExportData();
    
    // Get headers from the first object's keys
    const headers = Object.keys(data[0]).join(",");
    
    // Convert each row to CSV
    const rows = data.map(row => 
      Object.values(row)
        .map(value => {
          // Quote strings that contain commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(",")
    );
    
    // Combine headers and rows
    const csvContent = [headers, ...rows].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ynab-payees-${budgetName.replace(/\s+/g, '-').toLowerCase()}-${exportTemplate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToPDF = () => {
    const data = prepareExportData();
    
    // Create PDF document
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Add title
    doc.setFontSize(16);
    doc.text(`YNAB Payee Analysis - ${budgetName}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), "MMM d, yyyy")}`, 14, 30);
    doc.setFontSize(10);
    
    // Convert data to format expected by autoTable
    const tableData = data.map(item => Object.values(item));
    const tableHeaders = Object.keys(data[0]).map(header => ({
      title: formatColumnHeader(header),
      dataKey: header
    }));
    
    // Add table
    doc.autoTable({
      startY: 40,
      head: [tableHeaders.map(h => h.title)],
      body: tableData,
      headStyles: { fillColor: [36, 144, 217] }, // YNAB blue color
      styles: { overflow: 'linebreak' },
      columnStyles: {
        // Set specific column widths
        0: { cellWidth: 40 }, // Name
        6: { cellWidth: 60 }  // Categories (wider)
      },
    });
    
    // Save PDF
    doc.save(`ynab-payees-${budgetName.replace(/\s+/g, '-').toLowerCase()}-${exportTemplate}.pdf`);
  };
  
  const formatColumnHeader = (header: string): string => {
    // Convert camelCase to Title Case with Spaces
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  const prepareExportData = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };
    
    return payeeAnalysis.map(payee => {
      const result: Record<string, any> = {};
      
      if (selectedFields.name) {
        result.name = payee.name;
      }
      
      if (selectedFields.transactionCount) {
        result.transactionCount = payee.transactionCount;
      }
      
      if (selectedFields.totalAmount) {
        result.totalAmount = exportTemplate === "raw" 
          ? payee.totalAmount 
          : formatCurrency(payee.totalAmount);
      }
      
      if (selectedFields.averageAmount) {
        result.averageAmount = exportTemplate === "raw" 
          ? payee.averageAmount 
          : formatCurrency(payee.averageAmount);
      }
      
      if (selectedFields.firstTransaction) {
        result.firstTransaction = payee.firstTransaction || "N/A";
      }
      
      if (selectedFields.lastTransaction) {
        result.lastTransaction = payee.lastTransaction || "N/A";
      }
      
      if (selectedFields.categories && payee.categoryBreakdown.length > 0) {
        result.categories = payee.categoryBreakdown
          .map(cat => `${cat.categoryName} (${cat.percentage.toFixed(1)}%)`)
          .join("; ");
      } else if (selectedFields.categories) {
        result.categories = "None";
      }
      
      return result;
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Export Options</CardTitle>
        <CardDescription>
          Export your payee data in various formats with customizable options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="format" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="format">Format & Template</TabsTrigger>
            <TabsTrigger value="fields">Fields & Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Export Format</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={exportType === "xlsx" ? "default" : "outline"}
                      size="sm"
                      className="w-full flex items-center justify-start gap-2"
                      onClick={() => setExportType("xlsx")}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xlsx)
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={exportType === "csv" ? "default" : "outline"}
                      size="sm"
                      className="w-full flex items-center justify-start gap-2"
                      onClick={() => setExportType("csv")}
                    >
                      <FileText className="h-4 w-4" />
                      CSV (.csv)
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={exportType === "pdf" ? "default" : "outline"}
                      size="sm"
                      className="w-full flex items-center justify-start gap-2"
                      onClick={() => setExportType("pdf")}
                    >
                      <FileText className="h-4 w-4" />
                      PDF (.pdf)
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Export Template</label>
                <Select value={exportTemplate} onValueChange={setExportTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detailed (Formatted)</SelectItem>
                    <SelectItem value="summary">Summary (Essential fields only)</SelectItem>
                    <SelectItem value="raw">Raw Data (Unformatted values)</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-muted-foreground mt-4">
                  {exportTemplate === "detailed" && (
                    <p>The detailed template includes all fields with formatted values and is suitable for distribution and presentation.</p>
                  )}
                  {exportTemplate === "summary" && (
                    <p>The summary template includes only essential fields for a quick overview.</p>
                  )}
                  {exportTemplate === "raw" && (
                    <p>Raw data template provides unformatted values suitable for further data processing.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="fields" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Fields to Export</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="name" 
                    checked={selectedFields.name}
                    onCheckedChange={() => toggleField("name")}
                  />
                  <Label htmlFor="name">Payee Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transactionCount" 
                    checked={selectedFields.transactionCount}
                    onCheckedChange={() => toggleField("transactionCount")}
                  />
                  <Label htmlFor="transactionCount">Transaction Count</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="totalAmount" 
                    checked={selectedFields.totalAmount}
                    onCheckedChange={() => toggleField("totalAmount")}
                  />
                  <Label htmlFor="totalAmount">Total Amount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="averageAmount" 
                    checked={selectedFields.averageAmount}
                    onCheckedChange={() => toggleField("averageAmount")}
                  />
                  <Label htmlFor="averageAmount">Average Amount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="firstTransaction" 
                    checked={selectedFields.firstTransaction}
                    onCheckedChange={() => toggleField("firstTransaction")}
                  />
                  <Label htmlFor="firstTransaction">First Transaction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lastTransaction" 
                    checked={selectedFields.lastTransaction}
                    onCheckedChange={() => toggleField("lastTransaction")}
                  />
                  <Label htmlFor="lastTransaction">Last Transaction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="categories" 
                    checked={selectedFields.categories}
                    onCheckedChange={() => toggleField("categories")}
                  />
                  <Label htmlFor="categories">Categories</Label>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mt-4">
                <p>Select at least one field to export.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleExport}
            disabled={isExporting || Object.values(selectedFields).every(v => !v)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : `Export as ${exportType.toUpperCase()}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptions;
