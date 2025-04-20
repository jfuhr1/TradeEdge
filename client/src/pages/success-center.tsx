import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Award,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
// Custom PageHeader component
const PageHeader = ({ heading, description }: { heading: string, description?: string }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
      {description && (
        <p className="text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  </div>
);

// Types based on our schema
interface AchievementBadge {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  unlockCriteria: string;
}

interface UserAchievementProgress {
  id: number;
  userId: number;
  badgeId: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt: Date | null;
}

interface SuccessCard {
  id: number;
  userId: number;
  stockAlertId: number;
  percentGained: number;
  daysToTarget: number;
  targetHit: number;
  imageUrl: string;
  shared: boolean;
  sharedPlatform: string | null;
  dateCreated: string;
}

// Badge component
const Badge = ({ badge, progress }: { 
  badge: AchievementBadge, 
  progress: UserAchievementProgress 
}) => {
  return (
    <Card className={progress.completed ? "border-primary" : "border-muted opacity-70"}>
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
          {progress.completed ? (
            <Trophy className="h-8 w-8 text-primary" />
          ) : (
            <Trophy className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-lg">{badge.name}</CardTitle>
        <CardDescription>{badge.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <div className="text-sm text-muted-foreground">
          {progress.completed ? (
            <span className="text-primary font-semibold">Unlocked</span>
          ) : (
            <span>{progress.progress} / {progress.maxProgress}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Success card component
const SuccessCardComponent = ({ card, onShare }: { 
  card: SuccessCard, 
  onShare: (id: number, platform: string) => void 
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [stockInfo, setStockInfo] = useState<{symbol: string, companyName: string} | null>(null);
  
  // Fetch stock info based on stockAlertId
  useQuery({
    queryKey: [`/api/stock-alerts/${card.stockAlertId}`],
    enabled: !!card.stockAlertId,
    onSuccess: (data) => {
      if (data && data.symbol) {
        setStockInfo({
          symbol: data.symbol,
          companyName: data.companyName
        });
      }
    }
  });
  
  // Helper function to format a date as MM/DD/YYYY
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <Card className="border-primary overflow-hidden">
      <div 
        className="relative h-40 bg-gradient-to-r from-blue-500 to-primary"
        style={{
          backgroundImage: card.imageUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${card.imageUrl})` : 'linear-gradient(to right, #1E88E5, #64B5F6)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-between p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold shadow-sm">{stockInfo?.symbol || 'Loading...'}</h3>
              <p className="text-sm opacity-90 shadow-sm">{stockInfo?.companyName || ''}</p>
            </div>
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">
              +{card.percentGained.toFixed(2)}%
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80 shadow-sm">Held for {card.daysToTarget} days</p>
              <p className="text-xs opacity-80 shadow-sm">Created on {formatDate(card.dateCreated)}</p>
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: card.targetHit }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <CardFooter className="flex justify-between pt-4">
        <div className="text-sm">
          <div>Target {card.targetHit} Reached!</div>
          <div>TradeEdge Pro Success</div>
        </div>
        
        {!showShareOptions ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowShareOptions(true)}
            disabled={card.shared}
          >
            <Share2 className="h-4 w-4 mr-1" />
            {card.shared ? 'Shared' : 'Share'}
          </Button>
        ) : (
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
              onClick={() => onShare(card.id, 'twitter')}
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
              onClick={() => onShare(card.id, 'facebook')}
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"
              onClick={() => onShare(card.id, 'linkedin')}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// Badge categories
const BADGE_CATEGORIES = [
  { id: 'education', name: 'Education', icon: <Award className="h-4 w-4" /> },
  { id: 'alerts', name: 'Stock Alerts', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 'performance', name: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function SuccessCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch user achievements
  const { 
    data: achievements = [], 
    isLoading: achievementsLoading 
  } = useQuery({
    queryKey: ['/api/user-achievements']
  });
  
  // Fetch all badges
  const { 
    data: badges = [], 
    isLoading: badgesLoading 
  } = useQuery({
    queryKey: ['/api/achievement-badges']
  });
  
  // Fetch success cards
  const { 
    data: successCards = [], 
    isLoading: cardsLoading,
    refetch: refetchCards
  } = useQuery({
    queryKey: ['/api/success-cards']
  });
  
  // Filter badges by category
  const filteredBadges = badges?.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  );
  
  // Share a success card
  const handleShareCard = async (cardId: number, platform: string) => {
    try {
      await apiRequest('PUT', `/api/success-cards/${cardId}/share`, { platform });
      toast({
        title: 'Success card shared!',
        description: `Your success has been shared on ${platform}.`
      });
      refetchCards();
    } catch (error) {
      toast({
        title: 'Failed to share',
        description: 'An error occurred while sharing your success card.',
        variant: 'destructive'
      });
    }
  };
  
  // Loading states
  const isLoading = achievementsLoading || badgesLoading || cardsLoading;
  
  // Get combined badge and progress data
  const badgesWithProgress = badges && achievements 
    ? badges.map(badge => {
        const progress = achievements.find(a => a.badgeId === badge.id) || {
          progress: 0,
          maxProgress: 100,
          completed: false
        };
        return { badge, progress };
      })
    : [];
  
  // Filter badges by selected category
  const filteredBadgesWithProgress = selectedCategory === 'all'
    ? badgesWithProgress
    : badgesWithProgress.filter(({ badge }) => badge.category === selectedCategory);
  
  return (
    <div className="container py-6">
      <PageHeader
        heading="Personal Success Center"
        description="Track your achievements and share your trading successes"
      />
      
      <Tabs defaultValue="achievements" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="achievements">Achievement Badges</TabsTrigger>
          <TabsTrigger value="success-cards">Success Cards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              
              {BADGE_CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  <span className="ml-1">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading your achievements...</p>
            </div>
          ) : filteredBadgesWithProgress.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No badges found</h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' 
                  ? "You don't have any badges yet. Start using the platform to earn them!" 
                  : "No badges found in this category. Try another one."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBadgesWithProgress.map(({ badge, progress }) => (
                <Badge key={badge.id} badge={badge} progress={progress} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="success-cards">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading your success cards...</p>
            </div>
          ) : !successCards || successCards.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No success cards yet</h3>
              <p className="text-muted-foreground">
                When you successfully sell a stock and hit a target, a success card will be created.
              </p>
              <p className="text-muted-foreground">
                Add stocks to your portfolio and sell them when they hit targets to create success cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {successCards.map(card => (
                <SuccessCardComponent
                  key={card.id}
                  card={card}
                  onShare={handleShareCard}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}