import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { EducationContent } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EducationCard from "@/components/education/education-card";
import { useAuth } from "@/hooks/use-auth";

export default function Education() {
  const { user } = useAuth();
  
  const { data: educationContent, isLoading } = useQuery<EducationContent[]>({
    queryKey: ["/api/education"],
  });

  if (isLoading) {
    return (
      <MainLayout title="Education">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Filter content by type and level
  const courses = educationContent?.filter(content => content.type === "course") || [];
  const articles = educationContent?.filter(content => content.type === "article") || [];
  
  const beginnerContent = educationContent?.filter(content => content.level === "beginner") || [];
  const intermediateContent = educationContent?.filter(content => content.level === "intermediate") || [];
  const advancedContent = educationContent?.filter(content => content.level === "advanced") || [];
  
  return (
    <MainLayout 
      title="Education Center" 
      description="Learn and master stock trading strategies and techniques"
    >
      {/* Membership Status Banner */}
      {user?.tier === "free" && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-primary">Free Member Access</h3>
              <p className="text-sm text-neutral-600">
                Upgrade to Premium to unlock all advanced courses and resources
              </p>
            </div>
            <button className="bg-premium text-white px-4 py-2 rounded-md text-sm font-medium">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="level">By Level</TabsTrigger>
        </TabsList>
        
        {/* All Content Tab */}
        <TabsContent value="all">
          {educationContent?.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No educational content available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {educationContent?.map(content => (
                <EducationCard 
                  key={content.id} 
                  content={content} 
                  userTier={user?.tier || "free"} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          {courses.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No courses available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {courses.map(course => (
                <EducationCard 
                  key={course.id} 
                  content={course} 
                  userTier={user?.tier || "free"} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Articles Tab */}
        <TabsContent value="articles">
          {articles.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No articles available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {articles.map(article => (
                <EducationCard 
                  key={article.id} 
                  content={article} 
                  userTier={user?.tier || "free"} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* By Level Tab */}
        <TabsContent value="level">
          {/* Beginner Content */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Beginner</h3>
            {beginnerContent.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">No beginner content available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {beginnerContent.map(content => (
                  <EducationCard 
                    key={content.id} 
                    content={content} 
                    userTier={user?.tier || "free"} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Intermediate Content */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-3">Intermediate</h3>
            {intermediateContent.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">No intermediate content available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {intermediateContent.map(content => (
                  <EducationCard 
                    key={content.id} 
                    content={content} 
                    userTier={user?.tier || "free"} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Advanced Content */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-3">Advanced</h3>
            {advancedContent.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">No advanced content available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advancedContent.map(content => (
                  <EducationCard 
                    key={content.id} 
                    content={content} 
                    userTier={user?.tier || "free"} 
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
