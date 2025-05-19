
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useYNAB } from "@/contexts/YNABContext";
import ynabService, { UnusedPayeeAnalysis } from "@/services/ynabService";
import { format } from "date-fns";
import { FileSpreadsheet, Filter, ArrowDown, ArrowUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const UnusedPayeesAnalysis = () => {
  const [unusedPayees, setUnusedPayees] = useState<UnusedPayeeAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayThreshold, setDayThreshold] = useState("90");
  const [isLoading, setIsLoading] = useState(false);
  const [hideTransfers, setHideTransfers] = useState(true);
  const [usageRange, setUsageRange] = useState<[number, number]>([0, 3]);
  const [showFilters, setShowFilters] = useState(false);
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
  
  // Filter out transfer payees if hideTransfers is true and apply usage filter
  const filteredPayees = unusedPayees
    .filter(payee => {
      const matchesSearch = payee.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isTransfer = payee.name.toLowerCase().startsWith("transfer : ");
      const usageCount = payee.transactionCount || 0;
      const withinUsageRange = usageCount >= usageRange[0] && usageCount <= usageRange[1];
      
      return matchesSearch && (!hideTransfers || !isTransfer) && withinUsageRange;
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
      "Usage Count": payee.transactionCount || 0,
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
      D: 10, // Usage Count
      E: 10  // Status
    };
    
    worksheet["!cols"] = [
      { wch: maxWidths.A },
      { wch: maxWidths.B },
      { wch: maxWidths.C },
      { wch: maxWidths.D },
      { wch: maxWidths.E }
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? "bg-muted" : ""}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
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
              
              {showFilters && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="hide-transfers-unused" 
                      checked={hideTransfers}
                      onCheckedChange={setHideTransfers}
                    />
                    <Label htmlFor="hide-transfers-unused">Hide Transfers</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Usage count range:</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3" /> {usageRange[0]}
                        </span>
                        <span>to</span>
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" /> {usageRange[1]}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={usageRange}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value: [number, number]) => setUsageRange(value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Payee Name</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Days Unused</TableHead>
                      <TableHead>Usage Count</TableHead>
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
                          <TableCell>{payee.transactionCount || 0}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${payee.isUnused ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                              {payee.isUnused ? "Unused" : "Active"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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
