
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useYNAB } from "@/contexts/YNABContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { PayeeAnalysis } from "@/services/ynabService";

interface PayeeGroup {
  id: string;
  payees: PayeeAnalysis[];
  similarity: number;
  suggestedName: string;
}

const PayeeGroupingSuggestions = () => {
  const { payeeAnalysis, selectedBudgetId, budgets } = useYNAB();
  const [payeeGroups, setPayeeGroups] = useState<PayeeGroup[]>([]);
  const [threshold, setThreshold] = useState(70);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get selected budget name
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";

  // Calculate string similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Trivial case: if strings are identical
    if (s1 === s2) return 100;
    
    // Trivial case: if one string is empty
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Levenshtein distance calculation
    const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,        // deletion
          matrix[i][j - 1] + 1,        // insertion
          matrix[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    
    // Convert distance to similarity percentage
    const maxLength = Math.max(s1.length, s2.length);
    const distance = matrix[s1.length][s2.length];
    return Math.round((1 - distance / maxLength) * 100);
  };

  // Find similar payees
  const findSimilarPayees = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const groups: PayeeGroup[] = [];
        const processedPayees = new Set<string>();
        
        // Skip transfer payees and only include payees used at least once
        const activePayees = payeeAnalysis.filter(
          p => p.transactionCount > 0 && !p.name.toLowerCase().startsWith("transfer :")
        );
        
        // Compare each payee with all others
        for (let i = 0; i < activePayees.length; i++) {
          if (processedPayees.has(activePayees[i].id)) continue;
          
          const similarPayees: PayeeAnalysis[] = [activePayees[i]];
          
          for (let j = i + 1; j < activePayees.length; j++) {
            if (processedPayees.has(activePayees[j].id)) continue;
            
            const similarity = calculateSimilarity(activePayees[i].name, activePayees[j].name);
            
            // If similarity is above threshold, add to group
            if (similarity >= threshold) {
              similarPayees.push(activePayees[j]);
              processedPayees.add(activePayees[j].id);
            }
          }
          
          // Only add groups with more than 1 payee
          if (similarPayees.length > 1) {
            // Find most frequent payee name as suggested name
            const mostFrequentPayee = similarPayees.reduce((prev, current) => 
              (prev.transactionCount > current.transactionCount) ? prev : current
            );
            
            groups.push({
              id: `group-${i}`,
              payees: similarPayees,
              similarity: threshold,
              suggestedName: mostFrequentPayee.name
            });
          }
          
          processedPayees.add(activePayees[i].id);
        }
        
        setPayeeGroups(groups);
      } catch (error) {
        console.error("Error finding similar payees:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 100); // Add a small delay to allow UI to update
  };

  // Filter payee groups based on search term
  const filteredGroups = payeeGroups.filter(group =>
    group.suggestedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.payees.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Export to XLSX
  const exportToXLSX = () => {
    const worksheetData: any[] = [];
    
    filteredGroups.forEach((group, groupIndex) => {
      // Add group header
      worksheetData.push({
        "Group": `Group ${groupIndex + 1}`,
        "Suggested Name": group.suggestedName,
        "Similarity": `${group.similarity}%`,
        "Payee Name": "",
        "Transaction Count": "",
        "Total Amount": ""
      });
      
      // Add payees in group
      group.payees.forEach(payee => {
        worksheetData.push({
          "Group": "",
          "Suggested Name": "",
          "Similarity": "",
          "Payee Name": payee.name,
          "Transaction Count": payee.transactionCount,
          "Total Amount": payee.totalAmount.toFixed(2)
        });
      });
      
      // Add empty row between groups
      worksheetData.push({});
    });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payee Groups");
    
    // Add column widths for better appearance
    worksheet["!cols"] = [
      { wch: 10 },  // Group
      { wch: 30 },  // Suggested Name
      { wch: 15 },  // Similarity
      { wch: 30 },  // Payee Name
      { wch: 15 },  // Transaction Count
      { wch: 15 }   // Total Amount
    ];
    
    XLSX.writeFile(workbook, `ynab-payee-groups-${budgetName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };

  useEffect(() => {
    if (payeeAnalysis.length > 0) {
      findSimilarPayees();
    }
  }, [payeeAnalysis, threshold]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Payee Grouping Suggestions</CardTitle>
        <CardDescription>
          Find similar payees that could be merged to simplify your budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="w-full sm:w-auto space-y-2">
            <Label htmlFor="similarity-threshold">Similarity threshold: {threshold}%</Label>
            <Input
              id="similarity-threshold"
              type="range"
              min="50"
              max="90"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full sm:w-64"
            />
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
            <div className="pt-4">
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            
            {filteredGroups.length > 0 ? (
              <div className="space-y-6">
                {filteredGroups.map((group, index) => (
                  <div key={group.id} className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">
                          Suggested name: <span className="text-ynab-blue">{group.suggestedName}</span>
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {group.payees.length} similar payees
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payee Name</TableHead>
                          <TableHead>Transaction Count</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.payees.map((payee) => (
                          <TableRow key={payee.id} className="hover:bg-muted/30">
                            <TableCell>{payee.name}</TableCell>
                            <TableCell>{payee.transactionCount}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              }).format(payee.totalAmount)}
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
                No payee groups found matching your search criteria.
                Try adjusting the similarity threshold or search term.
              </div>
            )}
          </>
        )}
        
        {payeeAnalysis.length > 0 && payeeGroups.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No similar payees found with the current threshold setting.
            Try decreasing the similarity threshold to find more potential matches.
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
