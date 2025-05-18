
import Layout from "@/components/layout/Layout";
import ApiTokenForm from "@/components/auth/ApiTokenForm";
import BudgetSelector from "@/components/budgets/BudgetSelector";
import AnalysisDashboard from "@/components/analysis/AnalysisDashboard";
import { useYNAB } from "@/contexts/YNABContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAuthenticated, payeeAnalysis, reset } = useYNAB();

  // Show the appropriate view based on the authentication state
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              YNAB Payee Analyzer
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Analyze your YNAB payees by usage frequency and associated categories to understand your spending patterns.
            </p>
          </div>
          
          <ApiTokenForm />
          
          <div className="mt-8 text-sm text-muted-foreground text-center">
            <h3 className="font-medium text-base mb-2">How It Works</h3>
            <ol className="space-y-2 text-left list-decimal list-inside">
              <li>Enter your YNAB API token (available in your <a href="https://app.youneedabudget.com/settings/developer" target="_blank" rel="noopener noreferrer" className="text-ynab-blue hover:underline">YNAB Developer Settings</a>)</li>
              <li>Select a budget to analyze</li>
              <li>View detailed payee analysis with frequency, categories, and amounts</li>
              <li>Export results to CSV if needed</li>
            </ol>
            <p className="mt-4">
              All data processing happens in your browser. Your YNAB token and budget data are not stored on any server.
            </p>
          </div>
        </div>
      );
    } 
    
    if (isAuthenticated && payeeAnalysis.length === 0) {
      return (
        <div className="max-w-xl mx-auto py-8">
          <div className="flex justify-end mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={reset}
              className="text-ynab-gray hover:text-gray-900"
            >
              Disconnect
            </Button>
          </div>
          <BudgetSelector />
        </div>
      );
    }
    
    return (
      <div className="py-8">
        <div className="flex justify-end mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={reset}
            className="text-ynab-gray hover:text-gray-900"
          >
            Start Over
          </Button>
        </div>
        <AnalysisDashboard />
      </div>
    );
  };

  return <Layout>{renderContent()}</Layout>;
};

export default Index;
