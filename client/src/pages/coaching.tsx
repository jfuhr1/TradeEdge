import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { CoachingSession } from "@shared/schema";
import { Loader2, Calendar, Clock, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Coaching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Fetch user's coaching sessions
  const { data: coachingSessions, isLoading } = useQuery<CoachingSession[]>({
    queryKey: ["/api/coaching"],
  });

  // Book a coaching session
  const bookSession = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select both a date and time");
      }
      
      // Combine date and time for the API
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      const res = await apiRequest("POST", "/api/coaching", {
        date: dateTime.toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coaching session booked!",
        description: "Your session has been scheduled successfully.",
      });
      
      // Reset form and invalidate coaching sessions query
      setSelectedDate("");
      setSelectedTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/coaching"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Time slots
  const timeSlots = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
  
  // Pricing based on user tier
  const regularFee = 149;
  const discount = user?.tier === "premium" ? 50 : 0;
  const finalPrice = regularFee - discount;
  
  // Filter sessions by status
  const upcomingSessions = coachingSessions?.filter(
    session => session.status === "scheduled" && new Date(session.date) > new Date()
  ) || [];
  
  const pastSessions = coachingSessions?.filter(
    session => session.status === "completed" || new Date(session.date) < new Date()
  ) || [];

  if (isLoading) {
    return (
      <MainLayout title="1-on-1 Coaching">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="1-on-1 Coaching" 
      description="Get personalized guidance and mentoring from our expert trading coaches"
    >
      {/* Booking card */}
      <Card className="mb-10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3">Book a Session</h3>
              <p className="text-neutral-600 mb-4">
                Get personalized guidance from our expert trading coaches. Sessions are 45 minutes and focused on your specific trading goals.
              </p>

              <div className="mb-4">
                <p className="font-medium mb-2">Benefits:</p>
                <ul className="text-sm text-neutral-600 space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-profit mr-2 shrink-0" />
                    <span>Portfolio review and optimization</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-profit mr-2 shrink-0" />
                    <span>Custom trade strategies for your risk tolerance</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-profit mr-2 shrink-0" />
                    <span>Personalized education roadmap</span>
                  </li>
                </ul>
              </div>

              <div className="py-3 px-4 bg-blue-50 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">Session Fee:</span>
                  <span className="font-bold font-mono">${regularFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="font-medium">Premium Discount:</span>
                    <span className="font-bold font-mono text-profit">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between">
                  <span className="font-medium">Your Price:</span>
                  <span className="font-bold font-mono">${finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3">Select a Time</h3>
              <div className="mb-4">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full mt-1"
                />
              </div>

              <div className="mb-4">
                <Label>Available Times</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className={selectedTime === time ? "border-primary bg-primary text-white" : ""}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full py-6"
                onClick={() => bookSession.mutate()}
                disabled={!selectedDate || !selectedTime || bookSession.isPending}
              >
                {bookSession.isPending ? "Booking..." : "Book Session"}
              </Button>
              <p className="text-xs text-neutral-500 text-center mt-2">
                Cancellations must be made 24 hours in advance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
        
        {upcomingSessions.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-neutral-600">You don't have any upcoming coaching sessions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map(session => (
              <Card key={session.id} className="border-l-4 border-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-neutral-600 mr-2" />
                      <span className="font-medium">
                        {format(new Date(session.date), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-neutral-600 mr-2" />
                      <span className="font-medium font-mono">
                        {format(new Date(session.date), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-neutral-600">45 minute session</span>
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Past Sessions</h2>
          <div className="space-y-4">
            {pastSessions.map(session => (
              <Card key={session.id} className="border-l-4 border-neutral-300">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-neutral-600 mr-2" />
                      <span className="font-medium">
                        {format(new Date(session.date), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-neutral-600 mr-2" />
                      <span className="font-medium font-mono">
                        {format(new Date(session.date), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Completed</span>
                    <Button variant="outline" size="sm">
                      View Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
