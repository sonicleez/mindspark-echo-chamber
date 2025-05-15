
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "rive-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Rive animation setup
  const { RiveComponent, rive } = useRive({
    src: "https://public.rive.app/community/runtime-files/2244-4463-404-page.riv",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => setIsLoading(false),
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">Page Not Found</CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center">
          <div className="w-full h-64 mb-4">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <RiveComponent />
            )}
          </div>
          
          <p className="text-center text-muted-foreground mb-4">
            We couldn't find the page you were looking for.
            The requested URL <span className="font-mono bg-gray-100 px-2 py-1 rounded">{location.pathname}</span> does not exist.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFound;
