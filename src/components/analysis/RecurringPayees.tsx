import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet } from "lucide-react";
import { useYNAB } from "@/contexts/YNABContext";
import ynabService, { RecurringPayee, RecurringFrequency } from "@/services/ynabService";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const FREQUENCY_COLORS: Record<RecurringFrequency, string> = {
  weekly: "bg-purple-100 text-purple-800",
  fortnightly: "bg-blue-100 text-blue-800",
  monthly: "bg-green-100 text-green-800",
  quarterly: "bg-yellow-100 text-yellow-800",
  annual: "bg-orange-100 text-orange-800",
};

const RecurringPayees = () => {
  const { selectedBudgetId, budgets, currencyFormat } = useYNAB();
  const [payees, setPayees] = useState<RecurringPayee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("avgAmount");
  const [hideTransfers, setHideTransfers] = useState(true);

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";

  useEffect(() => {
    if (!selectedBudgetId) return;
    setIsLoading(true);
    ynabService
      .detectRecurringPayees(selectedBudgetId)
      .then(setPayees)
      .catch((err) => console.error("Error detecting recurring payees:", err))
      .finally(() => setIsLoading(false));
  }, [selectedBudgetId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const filteredPayees = payees
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFreq = frequencyFilter === "all" || p.frequency === frequencyFilter;
      const isTransfer = p.name.toLowerCase().startsWith("transfer : ");
      return matchesSearch && matchesFreq && (!hideTransfers || !isTransfer);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "nextExpected":
          if (!a.nextExpected && !b.nextExpected) return 0;
          if (!a.nextExpected) return 1;
          if (!b.nextExpected) return -1;
          return a.nextExpected.localeCompare(b.nextExpected);
        case "avgAmount":
        default:
          return b.avgAmount - a.avgAmount;
      }
    });

  const exportToXLSX = () => {
    const data = filteredPayees.map((p) => ({
      "Payee Name": p.name,
      Frequency: FREQUENCY_LABELS[p.frequency],
      "Avg Amount": formatCurrency(p.avgAmount, currencyFormat),
      "Last Charged": formatDate(p.lastCharged),
      "Next Expected": formatDate(p.nextExpected),
      "Confidence %": p.confidence,
      Transactions: p.transactionCount,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [
      { wch: 30 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Recurring Payees");
    XLSX.writeFile(wb, `ynab-recurring-${budgetName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Analysing transaction patterns…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription &amp; Recurring Payees</CardTitle>
        <CardDescription>
          Payees detected as recurring based on consistent transaction intervals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {payees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No recurring payees detected. You need at least 3 transactions per payee to detect a pattern.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <Input
                  placeholder="Search payees…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48"
                />
                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avgAmount">Avg Amount</SelectItem>
                    <SelectItem value="name">Name A→Z</SelectItem>
                    <SelectItem value="nextExpected">Next Expected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-transfers-recurring"
                    checked={hideTransfers}
                    onCheckedChange={setHideTransfers}
                  />
                  <Label htmlFor="hide-transfers-recurring" className="whitespace-nowrap">
                    Hide Transfers
                  </Label>
                </div>
              </div>
              <Button
                onClick={exportToXLSX}
                className="flex items-center gap-2 bg-ynab-green hover:bg-ynab-darkGreen"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export XLSX
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Payee</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Avg Amount</TableHead>
                    <TableHead>Last Charged</TableHead>
                    <TableHead>Next Expected</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayees.length > 0 ? (
                    filteredPayees.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${FREQUENCY_COLORS[p.frequency]}`}
                          >
                            {FREQUENCY_LABELS[p.frequency]}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(p.avgAmount, currencyFormat)}</TableCell>
                        <TableCell>{formatDate(p.lastCharged)}</TableCell>
                        <TableCell>{formatDate(p.nextExpected)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{p.confidence}%</span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No results found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Found {payees.length} recurring payees</span>
              {filteredPayees.length !== payees.length && (
                <span>Showing {filteredPayees.length} of {payees.length}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringPayees;
