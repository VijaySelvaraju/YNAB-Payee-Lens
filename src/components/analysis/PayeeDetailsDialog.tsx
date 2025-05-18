
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PayeeAnalysis } from "@/services/ynabService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PayeeDetailsDialogProps {
  payee: PayeeAnalysis;
  onClose: () => void;
}

const COLORS = ['#41B952', '#0091d9', '#f9c120', '#dd4b39', '#5F6A7A', '#8A2BE2', '#FF6347', '#20B2AA', '#9932CC'];

const PayeeDetailsDialog = ({ payee, onClose }: PayeeDetailsDialogProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Prepare data for pie chart
  const chartData = payee.categoryBreakdown.map((category, index) => ({
    name: category.categoryName,
    value: category.count,
    percentage: category.percentage,
  }));

  return (
    <Dialog open={!!payee} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{payee.name}</DialogTitle>
          <DialogDescription>
            Transaction analysis from {formatDate(payee.firstTransaction)} to {formatDate(payee.lastTransaction)}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-ynab-blue/20">
                <CardHeader className="pb-2 bg-muted/30 rounded-t-lg">
                  <CardTitle className="text-base">Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Transactions:</span>
                      <span className="font-medium">{payee.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Spent:</span>
                      <span className="font-medium">{formatCurrency(payee.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Transaction:</span>
                      <span className="font-medium">{formatCurrency(payee.averageAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First Transaction:</span>
                      <span>{formatDate(payee.firstTransaction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Transaction:</span>
                      <span>{formatDate(payee.lastTransaction)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-ynab-blue/20">
                <CardHeader className="pb-2 bg-muted/30 rounded-t-lg">
                  <CardTitle className="text-base">Category Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] pt-4">
                  {payee.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} transactions`, name]}
                          labelFormatter={() => ""}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No category data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-ynab-blue/20">
              <CardHeader className="pb-2 bg-muted/30 rounded-t-lg">
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {payee.categoryBreakdown.map((category) => (
                    <div key={category.categoryId} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div>
                        <span className="font-medium">{category.categoryName}</span>
                        <div className="text-xs text-muted-foreground">
                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(category.total)}</span>
                        <div className="text-xs text-muted-foreground">
                          {category.percentage.toFixed(1)}% of transactions
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {payee.categoryBreakdown.length === 0 && (
                    <p className="text-muted-foreground text-center py-2">No category data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PayeeDetailsDialog;
