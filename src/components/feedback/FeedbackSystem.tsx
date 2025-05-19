
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useYNAB } from "@/contexts/YNABContext";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface FeedbackItem {
  id: string;
  type: "suggestion" | "payee-grouping" | "general";
  rating: number;
  comment: string;
  timestamp: string;
  feature?: string;
}

const FeedbackSystem = () => {
  const [feedback, setFeedback] = useState("");
  const [feature, setFeature] = useState("payee-analysis");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useLocalStorage<FeedbackItem[]>("ynab-feedback-history", []);
  const { toast } = useToast();
  const { isAuthenticated } = useYNAB();
  
  const features = [
    { id: "payee-analysis", name: "Payee Analysis" },
    { id: "unused-payees", name: "Unused Payees" },
    { id: "payee-grouping", name: "Payee Grouping" },
    { id: "time-analysis", name: "Time-Based Analysis" },
    { id: "category-correlation", name: "Category Correlation" },
    { id: "export-options", name: "Export Options" },
    { id: "budget-comparison", name: "Budget Comparison" },
    { id: "other", name: "Other" }
  ];
  
  const submitFeedback = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting",
        variant: "destructive"
      });
      return;
    }
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your experience before submitting",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send to a server
    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      type: "general",
      rating,
      comment: feedback,
      timestamp: new Date().toISOString(),
      feature
    };
    
    // Store in local history
    setFeedbackHistory([...feedbackHistory, newFeedback]);
    
    // Reset form
    setFeedback("");
    setRating(0);
    setFeature("payee-analysis");
    
    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback!",
    });
  };
  
  const getFeatureName = (featureId: string): string => {
    return features.find(f => f.id === featureId)?.name || featureId;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help Improve YNAB Payee Analyzer</CardTitle>
        <CardDescription>
          Your feedback helps us improve this tool and add new features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isAuthenticated ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="feature">Which feature are you giving feedback on?</Label>
                <select 
                  id="feature"
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {features.map(feat => (
                    <option key={feat.id} value={feat.id}>{feat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Rate your experience</Label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1 focus:outline-none"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    >
                      <StarIcon 
                        size={24} 
                        fill={(hoveredStar || rating) >= star ? "#FFD700" : "transparent"} 
                        color={(hoveredStar || rating) >= star ? "#FFD700" : "#6b7280"}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Your feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={submitFeedback}
                className="w-full md:w-auto"
              >
                Submit Feedback
              </Button>
              
              {feedbackHistory.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-medium text-lg mb-4">Your Previous Feedback</h3>
                  <div className="space-y-4">
                    {feedbackHistory.slice(-3).reverse().map(item => (
                      <div key={item.id} className="border rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">
                            {item.feature && getFeatureName(item.feature)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              size={16}
                              className="mr-1"
                              fill={item.rating >= star ? "#FFD700" : "transparent"}
                              color={item.rating >= star ? "#FFD700" : "#6b7280"}
                            />
                          ))}
                        </div>
                        <p className="text-sm">{item.comment}</p>
                      </div>
                    ))}
                    
                    {feedbackHistory.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Showing {Math.min(3, feedbackHistory.length)} of {feedbackHistory.length} feedback entries
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                Please connect to YNAB to provide feedback on the tool.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackSystem;
