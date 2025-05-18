
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import PayeeAnalysisGrid from "./PayeeAnalysisGrid";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const AnalysisDashboard = () => {
  const { payeeAnalysis, budgets, selectedBudgetId } = useYNAB();

  // Get selected budget name
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  const budgetName = selectedBudget?.name || "Selected Budget";

  // Prepare data for top payees chart
  const topPayeesData = payeeAnalysis
    .slice(0, 10)
    .map(payee => ({
      name: payee.name.length > 15 ? payee.name.substring(0, 15) + "..." : payee.name,
      fullName: payee.name,
      count: payee.transactionCount,
    }));

  const exportToCSV = () => {
    // Prepare CSV content
    const headers = [
      "Payee Name", 
      "Transaction Count", 
      "Total Amount", 
      "Average Amount", 
      "First Transaction", 
      "Last Transaction", 
      "Top Categories"
    ];
    
    const csvRows = [headers.join(",")];
    
    payeeAnalysis.forEach(payee => {
      const topCategories = payee.categoryBreakdown
        .slice(0, 3)
        .map(cat => `${cat.categoryName} (${cat.percentage.toFixed(1)}%)`)
        .join("; ");
      
      const row = [
        `"${payee.name}"`,
        payee.transactionCount,
        payee.totalAmount.toFixed(2),
        payee.averageAmount.toFixed(2),
        payee.firstTransaction || "N/A",
        payee.lastTransaction || "N/A",
        `"${topCategories}"`
      ];
      
      csvRows.push(row.join(","));
    });
    
    // Create and download the CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ynab-payee-analysis-${budgetName.replace(/\s+/g, '-').toLowerCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{budgetName} Analysis</h2>
          <p className="text-muted-foreground">
            Found {payeeAnalysis.length} payees with transactions
          </p>
        </div>
        <Button 
          onClick={exportToCSV} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {payeeAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Frequent Payees</CardTitle>
            <CardDescription>
              Payees with the highest number of transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPayeesData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickFormatter={(value) => value}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} transactions`, "Count"]}
                    labelFormatter={(label, data) => data[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="count" fill="#0091d9">
                    {topPayeesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0091d9" : "#41B952"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <PayeeAnalysisGrid />
    </div>
  );
};

export default AnalysisDashboard;
