
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChartBar } from "lucide-react";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("w-full py-4 px-6 flex items-center justify-between border-b", className)}>
      <div className="flex items-center gap-3">
        <ChartBar className="h-6 w-6 text-ynab-blue" />
        <h1 className="text-xl font-semibold">YNAB Payee Analyzer</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="link" 
          className="text-ynab-blue hover:text-ynab-darkBlue"
          onClick={() => window.open("https://api.youneedabudget.com/", "_blank")}
        >
          YNAB API Docs
        </Button>
      </div>
    </header>
  );
};

export default Header;
