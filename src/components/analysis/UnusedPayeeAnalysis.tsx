
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useYNAB } from "@/contexts/YNABContext";
import ynabService, { UnusedPayeeAnalysis } from "@/services/ynabService";
import { format } from "date-fns";
import { FileSpreadsheet, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const UnusedPayeesAnalysis = () => {
  const [unusedPayees, setUnusedPayees] = useState<UnusedPayeeAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayThreshold, setDayThreshold] = useState("90");
  const [isLoading, setIsLoading] = useState(false);
  const [hideTransfers, setHideTransfers] = useState(true);
  const { selectedBudgetId, budgets } = useYNAB();
  
  // Get selected budget name
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";
  
  const handleAnalyzeUnusedPayees = async () => {
    setIsLoading(true);
    try {
      // If "all-time" is selected, pass a special flag to the service
      if (dayThreshold === "all-time") {
        const results = await ynabService.findUnusedPayees(selectedBudgetId, -1);
        setUnusedPayees(results.filter(p => !p.lastUsed)); // Only show payees that have never been used
      } else {
        const threshold = parseInt(dayThreshold, 10);
        const results = await ynabService.findUnusedPayees(selectedBudgetId, threshold);
        setUnusedPayees(results);
      }
    } catch (error) {
      console.error("Error analyzing unused payees:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter out transfer payees if hideTransfers is true
  const filteredPayees = unusedPayees
    .filter(payee => {
      const matchesSearch = payee.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isTransfer = payee.name.toLowerCase().startsWith("transfer : ");
      return matchesSearch && (!hideTransfers || !isTransfer);
    });
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };
  
  const exportToXLSX = () => {
    const worksheetData = filteredPayees.map(payee => ({
      "Payee Name": payee.name,
      "Last Used": formatDate(payee.lastUsed),
      "Days Since Last Used": payee.daysSinceLastUsed || "N/A",
      "Status": payee.isUnused ? "Unused" : "Active"
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unused Payees");
    
    // Add column widths for better appearance
    const maxWidths = {
      A: 30, // Payee Name
      B: 15, // Last Used
      C: 25, // Days Since
      D: 10  // Status
    };
    
    worksheet["!cols"] = [
      { wch: maxWidths.A },
      { wch: maxWidths.B },
      { wch: maxWidths.C },
      { wch: maxWidths.D }
    ];
    
    XLSX.writeFile(workbook, `ynab-unused-payees-${budgetName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unused Payees Finder</CardTitle>
        <CardDescription>
          Identify payees that haven't been used recently to clean up your budget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-1 block">Find payees unused for:</label>
              <Select value={dayThreshold} onValueChange={setDayThreshold}>
                <SelectTrigger>
                  <SelectValue placeholder="Select threshold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">All time (never used)</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAnalyzeUnusedPayees} 
              disabled={isLoading}
              className="whitespace-nowrap bg-ynab-blue hover:bg-blue-600"
            >
              {isLoading ? "Analyzing..." : "Find Unused Payees"}
            </Button>
          </div>
          
          {unusedPayees.length > 0 && (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search payees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="hide-transfers-unused" 
                      checked={hideTransfers}
                      onCheckedChange={setHideTransfers}
                    />
                    <Label htmlFor="hide-transfers-unused">Hide Transfers</Label>
                  </div>
                </div>
                <Button 
                  onClick={exportToXLSX}
                  variant="default"
                  className="flex items-center gap-2 bg-ynab-green hover:bg-ynab-darkGreen w-full md:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export XLSX
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Payee Name</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Days Unused</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayees.length > 0 ? (
                      filteredPayees.map((payee) => (
                        <TableRow key={payee.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{payee.name}</TableCell>
                          <TableCell>{formatDate(payee.lastUsed)}</TableCell>
                          <TableCell>{payee.daysSinceLastUsed || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${payee.isUnused ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                              {payee.isUnused ? "Unused" : "Active"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No results found. Try adjusting your search or filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="text-sm text-muted-foreground flex justify-between items-center">
                <span>Found {unusedPayees.length} payees, {unusedPayees.filter(p => p.isUnused).length} unused</span>
                {filteredPayees.length !== unusedPayees.length && (
                  <span>Showing {filteredPayees.length} of {unusedPayees.length} payees</span>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnusedPayeesAnalysis;
