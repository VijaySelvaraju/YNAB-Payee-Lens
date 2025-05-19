
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YNABBudget } from "@/services/ynabService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const BudgetComparison = () => {
  const { budgets, selectedBudgetId } = useYNAB();
  const [compareBudgetId, setCompareBudgetId] = useState<string>("");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("payees");
  
  // Filter out the currently selected budget from comparison options
  const availableBudgets = budgets.filter(b => b.id !== selectedBudgetId);
  
  const getCurrentBudget = (): YNABBudget | undefined => {
    return budgets.find(b => b.id === selectedBudgetId);
  };
  
  const getCompareBudget = (): YNABBudget | undefined => {
    return budgets.find(b => b.id === compareBudgetId);
  };
  
  const generateComparisonData = () => {
    if (!compareBudgetId) return;
    
    setIsComparing(true);
    
    // In a real implementation, we'd fetch data from both budgets
    // For now, we'll generate mock comparison data
    
    // Simulate API delay
    setTimeout(() => {
      const mockPayeeComparison = [
        { name: "Total Payees", current: 85, compare: 64 },
        { name: "Unused Payees", current: 23, compare: 17 },
        { name: "Transfer Payees", current: 14, compare: 10 },
        { name: "Active Payees", current: 48, compare: 37 }
      ];
      
      const mockCategoryComparison = [
        { name: "Groceries", current: 450.25, compare: 380.50 },
        { name: "Rent", current: 1200, compare: 1200 },
        { name: "Utilities", current: 230.18, compare: 195.75 },
        { name: "Entertainment", current: 120.50, compare: 95.20 },
        { name: "Dining Out", current: 285.30, compare: 310.45 }
      ];
      
      if (activeTab === "payees") {
        setComparisonData(mockPayeeComparison);
      } else {
        setComparisonData(mockCategoryComparison);
      }
      
      setIsComparing(false);
    }, 800);
  };
  
  // Clear comparison data when changing budget or tab
  React.useEffect(() => {
    setComparisonData([]);
  }, [compareBudgetId, activeTab]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Comparison</CardTitle>
        <CardDescription>
          Compare payee and category data across different budgets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Current Budget</label>
              <div className="p-2 border rounded-md bg-muted/30">
                {getCurrentBudget()?.name || "No budget selected"}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Compare With</label>
              <Select value={compareBudgetId} onValueChange={setCompareBudgetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget to compare" />
                </SelectTrigger>
                <SelectContent>
                  {availableBudgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={generateComparisonData}
              disabled={!compareBudgetId || isComparing}
            >
              {isComparing ? "Comparing..." : "Compare Budgets"}
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payees">Payees</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payees" className="space-y-4 pt-4">
              {comparisonData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="current" 
                        name={`${getCurrentBudget()?.name || "Current"}`}
                        fill="#8884d8" 
                      />
                      <Bar 
                        dataKey="compare" 
                        name={`${getCompareBudget()?.name || "Comparison"}`}
                        fill="#82ca9d" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/30 rounded-lg border">
                  <p className="text-muted-foreground">
                    {compareBudgetId 
                      ? "Click 'Compare Budgets' to generate comparison data" 
                      : "Select a budget to compare with"}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4 pt-4">
              {comparisonData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <h3 className="font-medium text-center mb-4">
                      {getCurrentBudget()?.name || "Current Budget"}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={comparisonData}
                          dataKey="current"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => entry.name}
                        >
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="h-[300px]">
                    <h3 className="font-medium text-center mb-4">
                      {getCompareBudget()?.name || "Comparison Budget"}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={comparisonData}
                          dataKey="compare"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#82ca9d"
                          label={(entry) => entry.name}
                        >
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/30 rounded-lg border">
                  <p className="text-muted-foreground">
                    {compareBudgetId 
                      ? "Click 'Compare Budgets' to generate comparison data" 
                      : "Select a budget to compare with"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetComparison;
