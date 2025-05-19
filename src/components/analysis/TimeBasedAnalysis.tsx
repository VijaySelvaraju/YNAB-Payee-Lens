
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, parseISO } from "date-fns";

const TimeBasedAnalysis = () => {
  const { payeeAnalysis } = useYNAB();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]);
  const [timeGrouping, setTimeGrouping] = useState<"monthly" | "quarterly">("monthly");
  const [chartData, setChartData] = useState<any[]>([]);

  // Find top 5 payees by transaction count for default selection
  const topPayees = [...payeeAnalysis]
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 5)
    .map(p => p.id);

  // Initialize with top payees
  useState(() => {
    if (topPayees.length > 0 && selectedPayees.length === 0) {
      setSelectedPayees(topPayees);
    }
  });

  const generateTimeData = () => {
    if (!dateRange?.from || !dateRange?.to || selectedPayees.length === 0) return;

    // This is a simplified version - in a real implementation, we would fetch 
    // time-based transaction data from the API
    // For now, we'll generate mock data based on existing payee analysis
    
    const startDate = dateRange.from;
    const endDate = dateRange.to;
    
    const months = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      months.push(format(currentDate, "yyyy-MM"));
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
    
    const selectedPayeeData = payeeAnalysis.filter(p => selectedPayees.includes(p.id));
    
    const mockData = months.map(month => {
      const dataPoint: any = { month: format(parseISO(`${month}-01`), "MMM yyyy") };
      
      selectedPayeeData.forEach(payee => {
        // Generate consistent but somewhat random data for demo purposes
        const hash = payee.name.split("").reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const monthNum = parseInt(month.split("-")[1]);
        const seed = (hash + monthNum) % 100;
        const value = Math.max(0, Math.floor(payee.transactionCount / 6 * (0.5 + Math.sin(seed) * 0.5)));
        
        dataPoint[payee.id] = value;
        dataPoint[`${payee.id}_name`] = payee.name;
      });
      
      return dataPoint;
    });
    
    setChartData(mockData);
  };

  const getRandomColor = (index: number) => {
    const colors = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", 
      "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Time-Based Analysis</CardTitle>
        <CardDescription>
          Analyze how payee usage changes over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Time Grouping</label>
              <Select value={timeGrouping} onValueChange={(value: "monthly" | "quarterly") => setTimeGrouping(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateTimeData}>Generate Chart</Button>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Select Payees to Compare (up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {payeeAnalysis.slice(0, 10).map(payee => (
                <Button
                  key={payee.id}
                  variant={selectedPayees.includes(payee.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (selectedPayees.includes(payee.id)) {
                      setSelectedPayees(selectedPayees.filter(id => id !== payee.id));
                    } else if (selectedPayees.length < 5) {
                      setSelectedPayees([...selectedPayees, payee.id]);
                    }
                  }}
                  className="text-xs"
                >
                  {payee.name.length > 20 ? `${payee.name.substring(0, 20)}...` : payee.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedPayees.length}/5 payees selected
            </p>
          </div>
          
          {chartData.length > 0 && (
            <div className="h-[400px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const nameIndex = chartData[0] ? chartData[0][`${name}_name`] : name;
                      return [value, nameIndex];
                    }}
                  />
                  <Legend />
                  {selectedPayees.map((payeeId, index) => (
                    <Bar 
                      key={payeeId} 
                      dataKey={payeeId} 
                      fill={getRandomColor(index)}
                      name={chartData[0] ? chartData[0][`${payeeId}_name`] : payeeId}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeBasedAnalysis;
