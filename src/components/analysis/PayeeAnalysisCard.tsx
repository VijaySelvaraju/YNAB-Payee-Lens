
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayeeAnalysis } from "@/services/ynabService";
import { format } from "date-fns";

interface PayeeAnalysisCardProps {
  payee: PayeeAnalysis;
  onViewDetails: (payee: PayeeAnalysis) => void;
}

const PayeeAnalysisCard = ({ payee, onViewDetails }: PayeeAnalysisCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Get top 2 categories
  const topCategories = payee.categoryBreakdown.slice(0, 2);
  
  // Check if it's a transfer payee
  const isTransferPayee = payee.name.toLowerCase().startsWith("transfer : ");

  return (
    <Card className={`h-full flex flex-col hover:border-ynab-blue transition-colors ${isTransferPayee ? "border-blue-200 bg-blue-50" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg ${isTransferPayee ? "text-blue-700" : ""}`}>{payee.name}</CardTitle>
        <CardDescription>
          {payee.transactionCount} transaction{payee.transactionCount !== 1 ? 's' : ''}
          {isTransferPayee && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Transfer</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <div className="text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(payee.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-medium">{formatCurrency(payee.averageAmount)}</span>
          </div>
          {topCategories.length > 0 && (
            <div className="mt-3">
              <p className="text-muted-foreground text-xs mb-1">Top Categories:</p>
              {topCategories.map(category => (
                <div key={category.categoryId} className="flex justify-between items-center text-xs">
                  <span className="truncate mr-2">{category.categoryName}</span>
                  <span className="text-ynab-gray whitespace-nowrap">{Math.round(category.percentage)}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">First:</span>
              <span>{formatDate(payee.firstTransaction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last:</span>
              <span>{formatDate(payee.lastTransaction)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <Button 
          onClick={() => onViewDetails(payee)} 
          variant="outline" 
          size="sm" 
          className="w-full hover:bg-ynab-blue hover:text-white transition-colors"
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};

export default PayeeAnalysisCard;
