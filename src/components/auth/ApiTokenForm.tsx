
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import { toast } from "sonner";

const ApiTokenForm = () => {
  const { setApiToken, fetchBudgets } = useYNAB();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Please enter a valid API token");
      return;
    }

    setIsLoading(true);
    try {
      setApiToken(token);
      await fetchBudgets();
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to YNAB</CardTitle>
        <CardDescription>
          Enter your YNAB API token to get started. You can find or create your token in the 
          <a 
            href="https://app.youneedabudget.com/settings/developer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-ynab-blue hover:text-ynab-darkBlue ml-1"
          >
            YNAB Developer Settings
          </a>.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your YNAB API token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Your API token is stored locally in your browser and is never sent to our servers.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-ynab-blue hover:bg-ynab-darkBlue"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ApiTokenForm;
