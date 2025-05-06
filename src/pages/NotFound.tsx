
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // List of valid routes in the application
  const validRoutes = ["/", "/transactions", "/import", "/reports", "/assistant", "/settings", "/notifications", "/voice"];

  useEffect(() => {
    // Check if the path (excluding any query parameters) is actually a valid route
    const path = location.pathname;
    
    if (validRoutes.includes(path)) {
      // This is a valid route that should work but we're getting a 404
      // Likely due to a page refresh - redirect the user back to the route
      setIsRedirecting(true);
      
      toast.info("Reconnecting to application...");
      
      // Short timeout to allow the toast to show
      setTimeout(() => {
        navigate(path);
      }, 500);
    } else {
      // Log the real 404 error
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname, navigate]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-lg text-gray-600">
            Reconnecting to the application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertTriangle className="h-12 w-12 text-amber-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-lg text-gray-600">
          We couldn't find the page you were looking for. The page might have been moved or deleted.
        </p>
        <div className="pt-4">
          <Button onClick={() => navigate('/')} className="mx-auto">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
