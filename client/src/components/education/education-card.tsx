import { EducationContent } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface EducationCardProps {
  content: EducationContent;
  userTier: string;
}

export default function EducationCard({ content, userTier }: EducationCardProps) {
  const isLocked = content.tier === "premium" && userTier !== "premium";
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative">
      {content.tier === "premium" && (
        <div className="absolute top-0 right-0 bg-premium text-white text-xs px-2 py-1 z-10">
          Premium
        </div>
      )}
      
      <div className="w-full h-40 bg-neutral-200 relative">
        <img 
          src={content.imageUrl} 
          alt={content.title} 
          className="w-full h-full object-cover"
        />
        {isLocked && (
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
            className={content.tier === "premium" 
              ? "bg-amber-100 text-premium border-0" 
              : "bg-green-100 text-profit border-0"
            }
          >
            {content.tier === "premium" ? "Premium" : "Free"}
          </Badge>
        </div>
        
        <Button 
          className={`mt-4 w-full ${
            isLocked
              ? "bg-premium hover:bg-premium/90"
              : "bg-primary hover:bg-primary/90"
          }`}
          disabled={isLocked}
        >
          {isLocked
            ? "Unlock Content"
            : content.type === "article" 
              ? "Read Article" 
              : "Start Learning"
          }
        </Button>
      </CardContent>
    </Card>
  );
}
