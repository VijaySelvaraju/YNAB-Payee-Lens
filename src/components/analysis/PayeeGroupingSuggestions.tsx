
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useYNAB } from "@/contexts/YNABContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileSpreadsheet, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";
import { groupPayees, normalizePayeeName, PayeeGroup } from "@/lib/payeeGrouping";

const PayeeGroupingSuggestions = () => {
  const { payeeAnalysis, selectedBudgetId, budgets, currencyFormat } = useYNAB();
  const [payeeGroups, setPayeeGroups] = useState<PayeeGroup[]>([]);
  const [threshold, setThreshold] = useState(65);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalAmount");

  // Get selected budget name
  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";

  const findSimilarPayees = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const groups = groupPayees(payeeAnalysis, threshold);
        setPayeeGroups(groups);
      } catch (error) {
        console.error("Error finding similar payees:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  // Filter and sort payee groups
  const filteredGroups = payeeGroups
    .filter(
      (group) =>
        group.suggestedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.payees.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "groupSize":
          return b.payees.length - a.payees.length;
        case "name":
          return a.suggestedName.localeCompare(b.suggestedName);
        case "similarity":
          return b.similarity - a.similarity;
        case "totalAmount":
        default: {
          const aTotal = a.payees.reduce((sum, p) => sum + p.totalAmount, 0);
          const bTotal = b.payees.reduce((sum, p) => sum + p.totalAmount, 0);
          return bTotal - aTotal;
        }
      }
    });

  // Export to XLSX
  const exportToXLSX = () => {
    const worksheetData: Record<string, string | number>[] = [];

    filteredGroups.forEach((group, groupIndex) => {
      worksheetData.push({
        Group: `Group ${groupIndex + 1}`,
        "Suggested Name": group.suggestedName,
        Similarity: `${group.similarity}%`,
        "Payee Name": "",
        "Normalised Name": "",
        "Transaction Count": "",
        "Total Amount": "",
      });

      group.payees.forEach((payee) => {
        worksheetData.push({
          Group: "",
          "Suggested Name": "",
          Similarity: "",
          "Payee Name": payee.name,
          "Normalised Name": normalizePayeeName(payee.name),
          "Transaction Count": payee.transactionCount,
          "Total Amount": payee.totalAmount.toFixed(2),
        });
      });

      worksheetData.push({});
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payee Groups");

    worksheet["!cols"] = [
      { wch: 10 }, // Group
      { wch: 30 }, // Suggested Name
      { wch: 12 }, // Similarity
      { wch: 30 }, // Payee Name
      { wch: 30 }, // Normalised Name
      { wch: 18 }, // Transaction Count
      { wch: 15 }, // Total Amount
    ];

    XLSX.writeFile(
      workbook,
      `ynab-payee-groups-${budgetName.replace(/\s+/g, "-").toLowerCase()}.xlsx`
    );
  };

  useEffect(() => {
    if (payeeAnalysis.length > 0) {
      findSimilarPayees();
    }
  }, [payeeAnalysis, threshold]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Payee Grouping Suggestions</CardTitle>
            <CardDescription>
              Find similar payees that could be merged to simplify your budget
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground mt-1 cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p className="font-medium mb-1">How grouping works</p>
                <p>
                  Payee names are normalised (lowercased, stripped of IDs and corporate suffixes),
                  then compared using a blend of three signals: word-token Jaccard similarity (40%),
                  character-bigram Dice coefficient (35%), and common-prefix ratio (25%). A +15
                  bonus is added when one name contains the other. Union-Find is used to group
                  transitively similar names.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="w-full sm:w-auto space-y-1">
            <Label htmlFor="similarity-threshold">Similarity threshold: {threshold}%</Label>
            <Input
              id="similarity-threshold"
              type="range"
              min="40"
              max="90"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full sm:w-64"
            />
            <p className="text-xs text-muted-foreground">
              Lower = more groups (more aggressive merging), higher = fewer but more confident groups
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={findSimilarPayees}
              disabled={isCalculating || payeeAnalysis.length === 0}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              {isCalculating ? "Calculating..." : "Recalculate"}
            </Button>
            <Button
              onClick={exportToXLSX}
              disabled={payeeGroups.length === 0}
              className="flex items-center gap-2 bg-ynab-green hover:bg-ynab-darkGreen flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export XLSX
            </Button>
          </div>
        </div>

        {payeeGroups.length > 0 && (
          <>
            <div className="pt-4 flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalAmount">Total Amount</SelectItem>
                  <SelectItem value="groupSize">Group Size</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                  <SelectItem value="similarity">Similarity %</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredGroups.length > 0 ? (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.id} className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">
                          Suggested name:{" "}
                          <span className="text-ynab-blue">{group.suggestedName}</span>
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {group.payees.length} similar payees &middot; {group.similarity}% avg
                          similarity
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payee Name</TableHead>
                          <TableHead>Normalised</TableHead>
                          <TableHead>Transaction Count</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.payees.map((payee) => (
                          <TableRow key={payee.id} className="hover:bg-muted/30">
                            <TableCell>{payee.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {normalizePayeeName(payee.name)}
                            </TableCell>
                            <TableCell>{payee.transactionCount}</TableCell>
                            <TableCell>
                              {formatCurrency(payee.totalAmount, currencyFormat)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No payee groups found matching your search criteria. Try adjusting the similarity
                threshold or search term.
              </div>
            )}
          </>
        )}

        {payeeAnalysis.length > 0 && payeeGroups.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No similar payees found with the current threshold setting. Try decreasing the
            similarity threshold to find more potential matches.
          </div>
        )}

        {payeeAnalysis.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            First analyze your payees on the "Payee Analysis" tab to see grouping suggestions.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayeeGroupingSuggestions;
