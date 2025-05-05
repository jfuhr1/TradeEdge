import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

type RecoverDraftHandlerProps = {
  alertId: number;
};

/**
 * This component handles the recovery of a draft alert that was lost due to server restart
 * It performs a fetch to create a recovery draft and then redirects to the edit page
 */
export default function RecoverDraftHandler({ alertId }: RecoverDraftHandlerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const recoverDraft = async () => {
      try {
        // Make a request to the recovery endpoint
        const response = await fetch(`/api/stock-alerts/999?demo=true&draftRecovery=true`);
        
        if (!response.ok) {
          throw new Error('Failed to recover draft alert');
        }
        
        const recoveredAlert = await response.json();
        
        // Redirect to the edit page for the recovered alert
        navigate(`/admin/stock-alerts/edit/${recoveredAlert.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    recoverDraft();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          className="px-4 py-2 bg-primary text-white rounded" 
          onClick={() => navigate('/admin/stock-alerts')}
        >
          Back to Stock Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <div>Recovering draft alert...</div>
      <div className="text-sm text-muted-foreground mt-2">This will only take a moment</div>
    </div>
  );
}