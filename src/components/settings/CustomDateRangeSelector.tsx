
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { SaveIcon, Trash } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface SavedDateRange {
  id: string;
  name: string;
  range: DateRange;
}

const CustomDateRangeSelector = () => {
  const [currentRange, setCurrentRange] = useState<DateRange | undefined>();
  const [rangeName, setRangeName] = useState("");
  const [savedRanges, setSavedRanges] = useLocalStorage<SavedDateRange[]>("ynab-saved-date-ranges", []);
  const { toast } = useToast();

  const saveCurrentRange = () => {
    if (!currentRange?.from || !rangeName.trim()) {
      toast({
        title: "Cannot save range",
        description: "Please select a date range and enter a name",
        variant: "destructive"
      });
      return;
    }

    const newRange: SavedDateRange = {
      id: Date.now().toString(),
      name: rangeName.trim(),
      range: currentRange
    };

    setSavedRanges([...savedRanges, newRange]);
    setRangeName("");

    toast({
      title: "Date range saved",
      description: `"${rangeName}" has been saved to your custom ranges`
    });
  };

  const deleteRange = (id: string) => {
    setSavedRanges(savedRanges.filter(range => range.id !== id));
    
    toast({
      title: "Range deleted",
      description: "The date range has been removed"
    });
  };

  const loadRange = (savedRange: SavedDateRange) => {
    setCurrentRange(savedRange.range);
    
    toast({
      title: "Range loaded",
      description: `"${savedRange.name}" has been loaded`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Date Ranges</CardTitle>
        <CardDescription>
          Save and reuse your frequently used date ranges for analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Select a date range</label>
            <DateRangePicker 
              value={currentRange} 
              onChange={setCurrentRange} 
            />
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Enter a name for this range"
                value={rangeName}
                onChange={(e) => setRangeName(e.target.value)}
              />
            </div>
            <Button onClick={saveCurrentRange} className="flex items-center gap-2">
              <SaveIcon className="h-4 w-4" />
              Save Range
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Saved Ranges</h3>
            {savedRanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved ranges yet. Save a range above to see it here.
              </p>
            ) : (
              <div className="space-y-2">
                {savedRanges.map(savedRange => (
                  <div 
                    key={savedRange.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30"
                  >
                    <button
                      onClick={() => loadRange(savedRange)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium">{savedRange.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {savedRange.range.from && new Date(savedRange.range.from).toLocaleDateString()} - {' '}
                        {savedRange.range.to && new Date(savedRange.range.to).toLocaleDateString()}
                      </div>
                    </button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteRange(savedRange.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomDateRangeSelector;
