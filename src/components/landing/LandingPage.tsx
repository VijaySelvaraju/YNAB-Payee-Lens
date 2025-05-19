
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ApiTokenForm from "@/components/auth/ApiTokenForm";
import { ChartBar, ArrowRight, BookOpen, FileText, Search, FileChartLine } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const LandingPage = () => {
  const [showApiForm, setShowApiForm] = useState(false);

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="bg-ynab-blue/10 p-3 rounded-full">
            <ChartBar className="h-12 w-12 text-ynab-blue" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">YNAB Payee Analyzer</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Clean up your YNAB budget by identifying unused payees and finding opportunities to simplify.
        </p>
        {showApiForm ? (
          <div className="mt-8 max-w-md mx-auto">
            <ApiTokenForm />
            <Button 
              variant="link" 
              className="mt-4"
              onClick={() => setShowApiForm(false)}
            >
              Go back to info
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setShowApiForm(true)} 
            size="lg" 
            className="mt-8 bg-ynab-blue hover:bg-ynab-darkBlue"
          >
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Features Section */}
      {!showApiForm && (
        <>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto px-4">
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-ynab-blue/10">
                  <Search className="h-6 w-6 text-ynab-blue" />
                </div>
                <h3 className="text-xl font-semibold">Find Unused Payees</h3>
                <p className="text-muted-foreground mt-2">
                  Identify payees you haven't used in months, making it easier to clean up your budget.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-ynab-blue/10">
                  <FileChartLine className="h-6 w-6 text-ynab-blue" />
                </div>
                <h3 className="text-xl font-semibold">Payee Analysis</h3>
                <p className="text-muted-foreground mt-2">
                  Analyze your payee usage with detailed frequency and transaction data.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-ynab-blue/10">
                  <FileText className="h-6 w-6 text-ynab-blue" />
                </div>
                <h3 className="text-xl font-semibold">Grouping Suggestions</h3>
                <p className="text-muted-foreground mt-2">
                  Get smart suggestions for similar payees that could be grouped together.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works Section */}
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-center p-4 rounded-lg border bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ynab-blue text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Connect your YNAB account</h3>
                  <p className="text-muted-foreground">
                    Enter your YNAB API token (available in your <a href="https://app.youneedabudget.com/settings/developer" target="_blank" rel="noopener noreferrer" className="text-ynab-blue hover:underline">YNAB Developer Settings</a>)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-center p-4 rounded-lg border bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ynab-blue text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Select a budget to analyze</h3>
                  <p className="text-muted-foreground">Choose which of your YNAB budgets you want to analyze</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-center p-4 rounded-lg border bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ynab-blue text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Review unused payees</h3>
                  <p className="text-muted-foreground">Find payees that haven't been used recently and consider hiding them in YNAB</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-center p-4 rounded-lg border bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ynab-blue text-white">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Explore payee grouping suggestions</h3>
                  <p className="text-muted-foreground">Get recommendations for similar payees that could be merged</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-center p-4 rounded-lg border bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ynab-blue text-white">
                  5
                </div>
                <div>
                  <h3 className="font-semibold">Export results</h3>
                  <p className="text-muted-foreground">Export your analysis to XLSX for reference</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  Yes! All data processing happens in your browser. Your YNAB token and budget data are never stored on any server.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I get a YNAB API token?</AccordionTrigger>
                <AccordionContent>
                  Log in to your YNAB account, go to Account Settings → Developer Settings, and create a new personal access token.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Can this tool modify my YNAB budget?</AccordionTrigger>
                <AccordionContent>
                  No, this tool is read-only. It analyzes your data but cannot make any changes to your budget. You'll need to make any payee cleanup actions manually in YNAB.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>What are "unused payees"?</AccordionTrigger>
                <AccordionContent>
                  Unused payees are those that haven't been used in transactions for a specified period. The tool helps you identify these so you can hide or clean them up in YNAB for a more streamlined experience.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => setShowApiForm(true)} 
              className="bg-ynab-blue hover:bg-ynab-darkBlue"
            >
              Get Started Now
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              YNAB Payee Analyzer is not affiliated with YouNeedABudget.com
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LandingPage;
