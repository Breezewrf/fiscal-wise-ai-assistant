
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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
