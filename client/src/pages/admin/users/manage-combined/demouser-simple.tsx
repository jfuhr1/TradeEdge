import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function DemoUserSimplePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Step 1: Check if we're authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check auth state first
        const authRes = await fetch('/api/user');
        const authData = await authRes.json();
        setAuthStatus(authData);

        if (authRes.status === 401) {
          setStatus('error');
          setErrorMessage('Not authenticated. Please log in first.');
          return;
        }
        
        // Try to fetch the demouser data
        const res = await fetch('/api/admin/users/1');
        
        if (!res.ok) {
          setStatus('error');
          setErrorMessage(`Failed to fetch demouser data: ${res.statusText}`);
          console.error('API response:', await res.text());
          return;
        }
        
        const data = await res.json();
        setUserData(data);
        setStatus('success');
      } catch (error: any) {
        console.error('Error in demouser page:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Unknown error occurred');
      }
    };
    
    checkAuth();
  }, []);

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    window.location.reload();
  };

  const handleGoBack = () => {
    setLocation('/admin/users');
  };

  const handleGoToLoginPage = () => {
    setLocation('/auth');
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={handleGoBack} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Demo User Management</CardTitle>
            <CardDescription>Diagnostic page for demouser access</CardDescription>
          </CardHeader>
          
          <CardContent>
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={40} className="animate-spin mb-4 text-primary" />
                <p className="text-lg">Loading user data...</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle size={40} className="mb-4 text-destructive" />
                <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-6 text-center">{errorMessage}</p>
                
                <div className="flex flex-col space-y-3">
                  <Button onClick={handleRetry} variant="default">
                    Try Again
                  </Button>
                  
                  {errorMessage.includes('authenticated') && (
                    <Button onClick={handleGoToLoginPage} variant="outline">
                      Go to Login Page
                    </Button>
                  )}
                </div>
                
                <div className="mt-8 border p-4 rounded-md bg-muted/50 w-full">
                  <h4 className="font-medium mb-2">Auth Status:</h4>
                  <pre className="text-xs overflow-auto p-2 bg-background rounded">
                    {JSON.stringify(authStatus, null, 2) || 'No auth data available'}
                  </pre>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 size={40} className="mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-6">Successfully loaded user data</h3>
                
                <Button 
                  onClick={() => setLocation(`/admin/users/manage-combined/1`)}
                  className="mb-4"
                >
                  Continue to Full User Management
                </Button>
                
                <div className="mt-4 border p-4 rounded-md bg-muted/50 w-full">
                  <h4 className="font-medium mb-2">User Data Preview:</h4>
                  <pre className="text-xs overflow-auto p-2 bg-background rounded">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-xs text-gray-500">
              This is a diagnostic page to help troubleshoot user data access issues.
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}