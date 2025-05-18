
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useYNAB } from "@/contexts/YNABContext";
import { toast } from "sonner";

const BudgetSelector = () => {
  const { budgets, selectedBudgetId, setSelectedBudgetId, analyzePayees } = useYNAB();
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedBudgetId) {
      toast.error("Please select a budget first");
      return;
    }

    setIsLoading(true);
    try {
      await analyzePayees();
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select a Budget</CardTitle>
        <CardDescription>
          Choose which budget you want to analyze payees from.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedBudgetId}
            onValueChange={setSelectedBudgetId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a budget" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAnalyze} 
          className="w-full bg-ynab-blue hover:bg-ynab-darkBlue"
          disabled={!selectedBudgetId || isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Payees"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BudgetSelector;
