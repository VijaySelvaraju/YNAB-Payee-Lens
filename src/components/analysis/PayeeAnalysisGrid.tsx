
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useYNAB } from "@/contexts/YNABContext";
import PayeeAnalysisCard from "./PayeeAnalysisCard";
import PayeeDetailsDialog from "./PayeeDetailsDialog";
import { PayeeAnalysis } from "@/services/ynabService";

const PayeeAnalysisGrid = () => {
  const { payeeAnalysis } = useYNAB();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("transactionCount");
  const [selectedPayee, setSelectedPayee] = useState<PayeeAnalysis | null>(null);

  const filteredPayees = payeeAnalysis.filter(
    (payee) => payee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPayees = [...filteredPayees].sort((a, b) => {
    switch (sortBy) {
      case "transactionCount":
        return b.transactionCount - a.transactionCount;
      case "name":
        return a.name.localeCompare(b.name);
      case "totalAmount":
        return b.totalAmount - a.totalAmount;
      case "averageAmount":
        return b.averageAmount - a.averageAmount;
      case "recent":
        const aDate = a.lastTransaction ? new Date(a.lastTransaction).getTime() : 0;
        const bDate = b.lastTransaction ? new Date(b.lastTransaction).getTime() : 0;
        return bDate - aDate;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search payees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactionCount">Most Frequent</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="totalAmount">Total Amount</SelectItem>
              <SelectItem value="averageAmount">Average Amount</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedPayees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPayees.map((payee) => (
            <PayeeAnalysisCard
              key={payee.id}
              payee={payee}
              onViewDetails={setSelectedPayee}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No payees found matching your search criteria.</p>
        </div>
      )}

      {selectedPayee && (
        <PayeeDetailsDialog
          payee={selectedPayee}
          onClose={() => setSelectedPayee(null)}
        />
      )}
    </div>
  );
};

export default PayeeAnalysisGrid;
