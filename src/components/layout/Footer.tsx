
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn("w-full py-4 px-6 border-t text-center text-sm text-gray-500", className)}>
      <p>
        YNAB Payee Analyzer is not affiliated with YouNeedABudget.com. 
        YNAB and YouNeedABudget are trademarks of YouNeedABudget LLC.
      </p>
      <p className="mt-1">
        © {new Date().getFullYear()} YNAB Payee Analyzer
      </p>
    </footer>
  );
};

export default Footer;
