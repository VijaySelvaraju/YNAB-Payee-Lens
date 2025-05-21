
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { PayeeAnalysis } from "@/services/ynabService";

const CategoryCorrelation = () => {
  const { payeeAnalysis } = useYNAB();
  const [selectedPayee, setSelectedPayee] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  
  // Filter payees by search term
  const filteredPayees = payeeAnalysis.filter(payee => 
    payee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCorrelationData = () => {
    if (!selectedPayee) return;
    
    const payee = payeeAnalysis.find(p => p.id === selectedPayee);
    if (!payee) return;
    
    // Get all categories used with this payee
    const categories = payee.categoryBreakdown.map(category => ({
      category: category.categoryName,
      value: category.percentage,
      amount: category.total
    }));
    
    setCorrelationData(categories);
  };
  
  // Clear data when changing payee
  useEffect(() => {
    setCorrelationData([]);
  }, [selectedPayee]);

  const getPayeeDetails = (id: string): PayeeAnalysis | undefined => {
    return payeeAnalysis.find(p => p.id === id);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Category Correlation</CardTitle>
        <CardDescription>
          Analyze which categories are commonly used with specific payees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search payees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-80">
              <Select value={selectedPayee} onValueChange={setSelectedPayee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a payee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPayees.map(payee => (
                    <SelectItem key={payee.id} value={payee.id}>
                      {payee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={generateCorrelationData}
              disabled={!selectedPayee}
            >
              Analyze
            </Button>
          </div>
          
          {selectedPayee && getPayeeDetails(selectedPayee) && (
            <div className="p-4 border rounded-md">
              <h3 className="font-medium text-lg mb-2">
                {getPayeeDetails(selectedPayee)?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Transaction Count: {getPayeeDetails(selectedPayee)?.transactionCount}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Amount: ${getPayeeDetails(selectedPayee)?.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average Amount: ${getPayeeDetails(selectedPayee)?.averageAmount.toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Category Distribution:</h4>
                  {getPayeeDetails(selectedPayee)?.categoryBreakdown.slice(0, 3).map((cat, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{cat.categoryName}</span>
                      <span className="font-medium">{cat.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {correlationData.length > 0 && (
            <div className="h-[400px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={150} data={correlationData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Category Usage"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Category Details:</h4>
                {correlationData.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm border-b pb-1">
                    <span>{item.category}</span>
                    <div>
                      <span className="font-medium mr-4">${item.amount.toFixed(2)}</span>
                      <span className="text-muted-foreground">{item.value.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCorrelation;
