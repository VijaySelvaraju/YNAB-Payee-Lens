
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useYNAB } from "@/contexts/YNABContext";
import { toast } from "sonner";
import {
  getRememberToken,
  setRememberToken,
  loadApiToken,
  saveApiToken,
  clearApiToken,
} from "@/lib/storage";

const ApiTokenForm = () => {
  const { setApiToken, fetchBudgets } = useYNAB();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  // On mount: read preferences from storage
  useEffect(() => {
    const shouldRemember = getRememberToken();
    setRemember(shouldRemember);
    if (shouldRemember) {
      const saved = loadApiToken();
      if (saved) setToken(saved);
    }
  }, []);

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked);
    setRememberToken(checked);
    if (checked) {
      if (token.trim()) saveApiToken(token.trim());
    } else {
      clearApiToken();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Please enter a valid API token");
      return;
    }

    if (remember) {
      saveApiToken(token.trim());
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

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-token"
                  checked={remember}
                  onCheckedChange={(checked) => handleRememberChange(checked === true)}
                />
                <label
                  htmlFor="remember-token"
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  Remember my API key
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Saves the token in your browser's local storage so you don't have to re-enter it.
                Only use this on a device you trust.
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
