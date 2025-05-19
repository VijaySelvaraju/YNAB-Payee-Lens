
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import BudgetSelector from "@/components/budgets/BudgetSelector";
import AnalysisDashboard from "@/components/analysis/AnalysisDashboard";
import UnusedPayeesAnalysis from "@/components/analysis/UnusedPayeeAnalysis";
import PayeeGroupingSuggestions from "@/components/analysis/PayeeGroupingSuggestions";
import { useYNAB } from "@/contexts/YNABContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingPage from "@/components/landing/LandingPage";
import CustomDateRangeSelector from "@/components/settings/CustomDateRangeSelector";
import BudgetComparison from "@/components/integration/BudgetComparison";
import ExportOptions from "@/components/export/ExportOptions";
import FeedbackSystem from "@/components/feedback/FeedbackSystem";

const Index = () => {
  const { isAuthenticated, payeeAnalysis, reset } = useYNAB();
  const [activeTab, setActiveTab] = useState<string>("unused-payees");

  // Show the appropriate view based on the authentication state
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="max-w-6xl mx-auto py-8 px-4">
          <LandingPage />
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="unused-payees">Unused Payees</TabsTrigger>
            <TabsTrigger value="payee-frequency">Payee Analysis</TabsTrigger>
            <TabsTrigger value="payee-grouping">Payee Grouping</TabsTrigger>
            <TabsTrigger value="budget-tools">Budget Tools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unused-payees" className="space-y-4">
            <UnusedPayeesAnalysis />
          </TabsContent>
          
          <TabsContent value="payee-frequency" className="space-y-4">
            <AnalysisDashboard />
          </TabsContent>
          
          <TabsContent value="payee-grouping" className="space-y-4">
            <PayeeGroupingSuggestions />
          </TabsContent>
          
          {/* New Budget Tools Tab */}
          <TabsContent value="budget-tools" className="space-y-6">
            <BudgetComparison />
            <ExportOptions />
          </TabsContent>
          
          {/* New Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <CustomDateRangeSelector />
            <FeedbackSystem />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return <Layout>{renderContent()}</Layout>;
};

export default Index;
