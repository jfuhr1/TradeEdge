import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { EducationContent } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function EducationResources() {
  const { user } = useAuth();
  const { data: educationContent, isLoading } = useQuery<EducationContent[]>({
    queryKey: ["/api/education"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get up to 3 education items, with at least one premium if available
  const filteredContent = educationContent || [];
  
  // Put premium content first in a free user's view
  let sortedContent = [...filteredContent];
  if (user?.tier === 'free') {
    sortedContent = sortedContent.sort((a, b) => {
      if (a.tier === 'premium' && b.tier !== 'premium') return -1;
      if (a.tier !== 'premium' && b.tier === 'premium') return 1;
      return 0;
    });
  }
  
  const displayContent = sortedContent.slice(0, 3);

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Education & Resources</h2>
        <Link href="/education" className="text-primary text-sm font-medium">
          Browse Library
        </Link>
      </div>

      {displayContent.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-neutral-600">No educational content available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayContent.map((content) => (
            <Card 
              key={content.id}
              className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative"
            >
              {content.tier === 'premium' && (
                <div className="absolute top-0 right-0 bg-premium text-white text-xs px-2 py-1 z-10">
                  Premium
                </div>
              )}
              
              <div className="w-full h-40 bg-neutral-200 relative">
                {content.imageUrl && (
                  <img 
                    src={content.imageUrl} 
                    alt={content.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                {content.tier === 'premium' && user?.tier !== 'premium' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-white opacity-80" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-bold">{content.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">{content.description}</p>
                
                <div className="flex items-center mt-4 justify-between">
                  <Badge variant="outline" className="bg-blue-100 text-primary border-0">
                    {content.level}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={content.tier === 'premium' 
                      ? "bg-amber-100 text-premium border-0" 
                      : "bg-green-100 text-profit border-0"
                    }
                  >
                    {content.tier === 'premium' ? 'Premium' : 'Free'}
                  </Badge>
                </div>
                
                <Button 
                  className={`mt-4 w-full ${
                    content.tier === 'premium' && user?.tier !== 'premium'
                      ? 'bg-premium hover:bg-premium/90'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  disabled={content.tier === 'premium' && user?.tier !== 'premium'}
                >
                  {content.tier === 'premium' && user?.tier !== 'premium'
                    ? 'Unlock Course'
                    : content.type === 'article' 
                      ? 'Read Article' 
                      : 'Start Learning'
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
