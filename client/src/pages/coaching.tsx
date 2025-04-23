import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistance, format, addDays, isAfter, isFuture } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, Calendar as CalendarIcon, Clock, Video, DollarSign, AlertCircle, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GroupCoachingSession } from "@shared/schema";

export default function CoachingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCoachingSlot, setSelectedCoachingSlot] = useState<{
    date: Date;
    available: boolean;
  } | null>(null);
  const [bookingType, setBookingType] = useState<"individual" | "group">("individual");
  const [openDialog, setOpenDialog] = useState(false);
  
  // Calculate date range for availability (today + 2 weeks)
  const startDate = new Date();
  const endDate = addDays(startDate, 14);
  
  // Coach availability query
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["/api/coaching/availability", selectedDate?.toISOString().split('T')[0]],
    enabled: !!selectedDate && !!user,
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/coaching/availability?date=${dateString}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    }
  });
  
  // Group coaching sessions query
  const { data: groupSessions, isLoading: groupSessionsLoading } = useQuery({
    queryKey: ["/api/coaching/group-sessions"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/coaching/group-sessions");
      if (!response.ok) throw new Error("Failed to fetch group sessions");
      return response.json();
    }
  });
  
  // User's booked sessions query
  const { data: userSessions, isLoading: userSessionsLoading } = useQuery({
    queryKey: ["/api/coaching/my-sessions"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/coaching/my-sessions");
      if (!response.ok) throw new Error("Failed to fetch user sessions");
      return response.json();
    }
  });
  
  // Handle booking slot
  const handleBookSlot = (slot: { date: Date; available: boolean }) => {
    if (!slot.available) {
      toast({
        title: "Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedCoachingSlot(slot);
    setOpenDialog(true);
  };
  
  // State for coaching type and form data
  const [coachingType, setCoachingType] = useState<string>("portfolio-review");
  const [portfolioHoldings, setPortfolioHoldings] = useState<string>("");
  const [coachingTopic, setCoachingTopic] = useState<string>("");
  
  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedCoachingSlot) return;
    
    try {
      // Determine the coaching package details based on selected type
      let duration = 60; // All options are 1 hour
      let topic = "";
      let price = 0;
      let additionalData = {};
      
      switch (coachingType) {
        case "portfolio-consult":
          topic = "Portfolio Consultation + Pre-Call Review";
          price = 250;
          additionalData = { portfolioHoldings };
          break;
        case "portfolio-review":
          topic = "Portfolio Review";
          price = 100;
          break;
        case "coaching-session":
          topic = `Coaching Session: ${coachingTopic}`;
          price = 100;
          additionalData = { customTopic: coachingTopic };
          break;
        default:
          topic = "Portfolio Review";
          price = 100;
      }
      
      const response = await fetch("/api/coaching/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: selectedCoachingSlot.date,
          duration,
          topic,
          price,
          ...additionalData
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to book session");
      }
      
      toast({
        title: "Booking Successful",
        description: `Your coaching session has been scheduled for ${format(selectedCoachingSlot.date, "MMMM dd, yyyy 'at' h:mm a")}`,
        variant: "default"
      });
      
      // Reset state
      setOpenDialog(false);
      setSelectedCoachingSlot(null);
      setPortfolioHoldings("");
      setCoachingTopic("");
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle group session registration
  const handleRegisterGroupSession = async (sessionId: number) => {
    try {
      const response = await fetch("/api/coaching/register-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error("Failed to register for group session");
      }
      
      toast({
        title: "Registration Successful",
        description: "You have been registered for the group coaching session",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error registering for the session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Format time display from Date object
  const formatTimeSlot = (date: Date) => {
    return format(date, "h:mm a");
  };
  
  // Check if user is already registered for a group session
  const isRegisteredForSession = (sessionId: number): boolean => {
    if (!userSessions?.groupSessions) return false;
    return userSessions.groupSessions.some(
      (session: any) => session.registration.sessionId === sessionId
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Coaching Sessions</h1>
      <p className="text-gray-500 mb-6">
        Book one-on-one coaching or join group sessions with our expert traders
      </p>
      
      <Tabs defaultValue="individual" onValueChange={(value) => setBookingType(value as "individual" | "group")}>
        <TabsList className="mb-6">
          <TabsTrigger value="individual" className="flex gap-2 items-center">
            <CalendarIcon size={16} />
            Individual Coaching
          </TabsTrigger>
          <TabsTrigger value="group" className="flex gap-2 items-center">
            <Users size={16} />
            Group Sessions
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex gap-2 items-center">
            <Clock size={16} />
            Your Sessions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>
                  Choose a date for your coaching session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    date < new Date() || // Past dates
                    date > addDays(new Date(), 14) || // More than 2 weeks ahead
                    date.getDay() === 0 || // Sunday
                    date.getDay() === 6 // Saturday
                  }
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                  <CardDescription>
                    {selectedDate
                      ? `Select a time on ${format(selectedDate, "MMMM dd, yyyy")}`
                      : "Please select a date to see available times"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availabilityLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : availabilityData?.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p>No available slots for the selected date. Please choose another date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availabilityData?.map((slot: {date: string, available: boolean}, index: number) => {
                        const slotDate = new Date(slot.date);
                        return (
                          <Button
                            key={index}
                            variant={slot.available ? "outline" : "ghost"}
                            className={`h-12 ${
                              slot.available 
                                ? "hover:border-primary" 
                                : "opacity-50 cursor-not-allowed"
                            }`}
                            disabled={!slot.available}
                            onClick={() => handleBookSlot({
                              date: slotDate,
                              available: slot.available
                            })}
                          >
                            {formatTimeSlot(slotDate)}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-primary/10">Premium Feature</Badge>
                    <span>Available for Executive tier and above</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Sessions are 30 minutes by default</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
              </DialogHeader>
              
              {selectedCoachingSlot && (
                <div className="space-y-4">
                  <div className="grid gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <span>{format(selectedCoachingSlot.date, "MMMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{formatTimeSlot(selectedCoachingSlot.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      <span>1 Hour Session via Zoom</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Choose Coaching Type:</h3>
                    
                    <RadioGroup 
                      value={coachingType} 
                      onValueChange={setCoachingType}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div>
                        <RadioGroupItem 
                          value="portfolio-consult" 
                          id="portfolio-consult"
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor="portfolio-consult" 
                          className="flex flex-col space-y-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium leading-none">Portfolio Consultation + Pre-Call Review</span>
                            <span className="text-sm font-medium">$250</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Our expert will review your holdings before the call and provide detailed recommendations.</span>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="portfolio-review" 
                          id="portfolio-review"
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor="portfolio-review" 
                          className="flex flex-col space-y-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium leading-none">1 Hour Portfolio Review</span>
                            <span className="text-sm font-medium">$100</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Review as many holdings as possible during a 1-hour live call.</span>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="coaching-session" 
                          id="coaching-session"
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor="coaching-session" 
                          className="flex flex-col space-y-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium leading-none">1 Hour Coaching Session</span>
                            <span className="text-sm font-medium">$100</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Custom coaching on a trading topic of your choice.</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {coachingType === "portfolio-consult" && (
                      <div className="space-y-2">
                        <Label htmlFor="portfolio-holdings">Your Current Portfolio Holdings</Label>
                        <Textarea 
                          id="portfolio-holdings"
                          placeholder="List your top 10 holdings with ticker symbols and approximate position sizes..."
                          rows={5}
                          value={portfolioHoldings}
                          onChange={(e) => setPortfolioHoldings(e.target.value)}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">This information will help our coach prepare a thorough analysis before your call.</p>
                      </div>
                    )}
                    
                    {coachingType === "coaching-session" && (
                      <div className="space-y-2">
                        <Label htmlFor="coaching-topic">What would you like to discuss?</Label>
                        <Textarea 
                          id="coaching-topic"
                          placeholder="Describe the topic you'd like to cover in your coaching session..."
                          rows={4}
                          value={coachingTopic}
                          onChange={(e) => setCoachingTopic(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirmBooking}
                      disabled={(coachingType === "portfolio-consult" && !portfolioHoldings) || 
                               (coachingType === "coaching-session" && !coachingTopic)}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="group" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {groupSessionsLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : groupSessions?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Upcoming Group Sessions</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new group coaching opportunities
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              groupSessions?.map((session: GroupCoachingSession) => (
                <Card key={session.id} className={`${isFuture(new Date(session.date)) ? "" : "opacity-60"}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{session.title}</CardTitle>
                        <CardDescription className="mt-1">
                          With {session.coach} • {session.participants}/{session.maxParticipants} registered
                        </CardDescription>
                      </div>
                      <Badge variant={isFuture(new Date(session.date)) ? "default" : "secondary"}>
                        {isFuture(new Date(session.date)) ? "Upcoming" : "Past Session"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span>{format(new Date(session.date), "MMMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>${session.price.toFixed(2)} USD</span>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <p className="text-sm">
                        {session.description || "Join this group coaching session to learn trading strategies and get your questions answered in a collaborative environment."}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1">
                    {isRegisteredForSession(session.id) ? (
                      <Button disabled variant="outline" className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Registered
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleRegisterGroupSession(session.id)}
                        disabled={!isFuture(new Date(session.date)) || session.participants >= session.maxParticipants}
                        className="w-full"
                      >
                        {session.participants >= session.maxParticipants 
                          ? "Session Full" 
                          : "Register Now"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {userSessionsLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (!userSessions?.individual?.length && !userSessions?.groupSessions?.length) ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Upcoming Sessions</h3>
                    <p className="text-muted-foreground">
                      You don't have any coaching sessions booked. 
                      Book individual coaching or join a group session to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {userSessions?.individual?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Individual Sessions
                    </h3>
                    
                    {userSessions.individual.map((session: any) => (
                      <Card key={session.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle>
                              {session.topic || "Portfolio Review"}
                            </CardTitle>
                            <Badge variant={session.status === "scheduled" ? "outline" : "secondary"}>
                              {session.status === "scheduled" ? "Upcoming" : session.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              <span>
                                {format(new Date(session.date), "MMMM dd, yyyy")} at {format(new Date(session.date), "h:mm a")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{session.duration} minutes</span>
                            </div>
                            {session.zoomLink && (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-primary" />
                                <a 
                                  href={session.zoomLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Join Zoom Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="w-full text-right text-sm text-muted-foreground">
                            {isAfter(new Date(session.date), new Date()) && (
                              <span>
                                Starting in {formatDistance(new Date(session.date), new Date(), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
                
                {userSessions?.groupSessions?.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Group Sessions
                    </h3>
                    
                    {userSessions.groupSessions.map((item: any) => (
                      <Card key={item.registration.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle>
                              {item.session.title}
                            </CardTitle>
                            <Badge variant={item.session.status === "scheduled" ? "outline" : "secondary"}>
                              {item.session.status === "scheduled" ? "Upcoming" : item.session.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              <span>
                                {format(new Date(item.session.date), "MMMM dd, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{item.session.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <span>With {item.session.coach} ({item.session.participants} participants)</span>
                            </div>
                            {item.session.zoomLink && (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-primary" />
                                <a 
                                  href={item.session.zoomLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Join Zoom Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="w-full text-right text-sm text-muted-foreground">
                            {isAfter(new Date(item.session.date), new Date()) && (
                              <span>
                                Starting in {formatDistance(new Date(item.session.date), new Date(), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}