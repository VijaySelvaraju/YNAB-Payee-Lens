
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useYNAB } from "@/contexts/YNABContext";
import PayeeAnalysisCard from "./PayeeAnalysisCard";
import PayeeDetailsDialog from "./PayeeDetailsDialog";
import { PayeeAnalysis } from "@/services/ynabService";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

const PayeeAnalysisGrid = () => {
  const { payeeAnalysis, budgets, selectedBudgetId } = useYNAB();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("transactionCount");
  const [selectedPayee, setSelectedPayee] = useState<PayeeAnalysis | null>(null);

  // Get selected budget name for export filename
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";

  const filteredPayees = payeeAnalysis.filter(
    (payee) => payee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPayees = [...filteredPayees].sort((a, b) => {
    switch (sortBy) {
      case "transactionCount":
        return b.transactionCount - a.transactionCount;
      case "name":
        return a.name.localeCompare(b.name);
      case "totalAmount":
        return b.totalAmount - a.totalAmount;
      case "averageAmount":
        return b.averageAmount - a.averageAmount;
      case "recent":
        const aDate = a.lastTransaction ? new Date(a.lastTransaction).getTime() : 0;
        const bDate = b.lastTransaction ? new Date(b.lastTransaction).getTime() : 0;
        return bDate - aDate;
      default:
        return 0;
    }
  });

  const exportToXLSX = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    };

    const worksheetData = payeeAnalysis.map(payee => {
      const topCategory = payee.categoryBreakdown[0]?.categoryName || "None";
      
      return {
        "Payee": payee.name,
        "Transactions": payee.transactionCount,
        "Total Amount": formatCurrency(payee.totalAmount),
        "Average Amount": formatCurrency(payee.averageAmount),
        "Primary Category": topCategory,
        "First Used": payee.firstTransaction ? new Date(payee.firstTransaction) : "N/A",
        "Last Used": payee.lastTransaction ? new Date(payee.lastTransaction) : "N/A"
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // Add column widths for better appearance
    worksheet["!cols"] = [
      { wch: 30 }, // Payee
      { wch: 12 }, // Transactions
      { wch: 15 }, // Total
      { wch: 15 }, // Average
      { wch: 25 }, // Category
      { wch: 12 }, // First
      { wch: 12 }  // Last
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payee Analysis");
    XLSX.writeFile(workbook, `ynab-payees-${budgetName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search payees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 md:gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactionCount">Most Frequent</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="totalAmount">Total Amount</SelectItem>
              <SelectItem value="averageAmount">Average Amount</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportToXLSX}
            variant="default"
            className="flex items-center gap-2 bg-ynab-green hover:bg-ynab-darkGreen whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export XLSX</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {sortedPayees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPayees.map((payee) => (
            <PayeeAnalysisCard
              key={payee.id}
              payee={payee}
              onViewDetails={setSelectedPayee}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No payees found matching your search criteria.</p>
        </div>
      )}

      {selectedPayee && (
        <PayeeDetailsDialog
          payee={selectedPayee}
          onClose={() => setSelectedPayee(null)}
        />
      )}

      <div className="text-sm text-muted-foreground flex justify-between">
        <span>Total: {payeeAnalysis.length} payees</span>
        {filteredPayees.length !== payeeAnalysis.length && (
          <span>Showing {filteredPayees.length} of {payeeAnalysis.length} payees</span>
        )}
      </div>
    </div>
  );
};

export default PayeeAnalysisGrid;
