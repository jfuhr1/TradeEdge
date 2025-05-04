import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Plus, 
  Calendar as CalendarIcon, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Info, 
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Link } from 'wouter';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { CoachingSession, GroupCoachingSession } from '@shared/schema';

export default function AdminCoaching() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch coaching sessions
  const { data: groupSessions, isLoading: isLoadingSessions, refetch: refetchGroupSessions } = useQuery<GroupCoachingSession[]>({
    queryKey: ['/api/admin/coaching/group-sessions'],
  });

  // Fetch individual sessions
  const { data: individualSessions, isLoading: isLoadingIndividualSessions, refetch: refetchIndividualSessions } = useQuery<CoachingSession[]>({
    queryKey: ['/api/admin/coaching/individual-sessions'],
  });

  // Handle refresh
  const handleRefresh = () => {
    refetchGroupSessions();
    refetchIndividualSessions();
    toast({
      title: "Refreshed",
      description: "Coaching sessions data has been refreshed",
    });
  };

  // Handle month navigation
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    if (!groupSessions) return [];
    return groupSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getDate() === date.getDate() && 
             sessionDate.getMonth() === date.getMonth() && 
             sessionDate.getFullYear() === date.getFullYear();
    });
  };

  // Mock data for development
  const mockGroupSessions: GroupCoachingSession[] = [
    {
      id: 1,
      title: "Market Analysis & Weekly Outlook",
      coach: "Jordan Phillips",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "7:00 PM - 8:30 PM ET",
      participants: 12,
      maxParticipants: 25,
      price: 49.99,
      description: "Join our weekly market analysis session to review recent market movements and prepare for the coming week.",
      zoomLink: "https://zoom.us/j/123456789",
      status: "scheduled",
      createdAt: new Date()
    },
    {
      id: 2,
      title: "Technical Analysis Masterclass",
      coach: "Sarah Chen",
      date: new Date(new Date().setDate(new Date().getDate() + 7)),
      time: "6:00 PM - 7:30 PM ET",
      participants: 18,
      maxParticipants: 20,
      price: 79.99,
      description: "Learn advanced technical analysis techniques for identifying high-probability trade setups.",
      zoomLink: "https://zoom.us/j/987654321",
      status: "scheduled",
      createdAt: new Date()
    },
    {
      id: 3,
      title: "Risk Management Workshop",
      coach: "David Martinez",
      date: new Date(new Date().setDate(new Date().getDate() + 14)),
      time: "5:00 PM - 6:30 PM ET",
      participants: 8,
      maxParticipants: 15,
      price: 59.99,
      description: "Master the essential risk management techniques that protect your capital and maximize returns.",
      zoomLink: "https://zoom.us/j/567891234",
      status: "scheduled",
      createdAt: new Date()
    }
  ];

  const mockIndividualSessions: CoachingSession[] = [
    {
      id: 1,
      userId: 123,
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      duration: 60,
      topic: "portfolio-review",
      notes: "Initial portfolio assessment and strategy review",
      price: 199.99,
      paymentStatus: "paid",
      paymentIntentId: "pi_123456789",
      zoomLink: "https://zoom.us/j/123456789",
      calendarEventId: "evt_123456",
      status: "scheduled",
      createdAt: new Date()
    },
    {
      id: 2,
      userId: 456,
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      duration: 30,
      topic: "technical-analysis",
      notes: "Focus on chart pattern recognition",
      price: 99.99,
      paymentStatus: "paid",
      paymentIntentId: "pi_987654321",
      zoomLink: "https://zoom.us/j/987654321",
      calendarEventId: "evt_987654",
      status: "scheduled",
      createdAt: new Date()
    }
  ];

  // Use mock data if no API data is available yet
  const displayGroupSessions = groupSessions || mockGroupSessions;
  const displayIndividualSessions = individualSessions || mockIndividualSessions;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Coaching Sessions</h1>
            <p className="text-muted-foreground">
              Schedule and manage coaching sessions for users
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {hasPermission("canScheduleSessions") && (
              <Button asChild>
                <Link href="/admin/coaching/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Session
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="group">Group Sessions</TabsTrigger>
            <TabsTrigger value="individual">Individual Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session Calendar</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 bg-muted p-3 mb-3 text-center font-medium text-muted-foreground">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const sessions = getSessionsForDate(day);
                    return (
                      <div 
                        key={day.toString()} 
                        className={`min-h-[100px] border rounded-md p-2 ${
                          sessions.length > 0 ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="font-medium mb-1">{format(day, 'd')}</div>
                        {sessions.map((session) => (
                          <div 
                            key={session.id} 
                            className="text-xs bg-primary text-primary-foreground rounded p-1 mb-1 truncate"
                          >
                            {format(new Date(session.date), 'h:mm a')} - {session.title}
                          </div>
                        ))}
                        {/* Add session button for empty days */}
                        {sessions.length === 0 && (
                          <Button 
                            asChild 
                            size="sm" 
                            variant="ghost" 
                            className="w-full h-6 mt-1 text-xs"
                          >
                            <Link href={`/admin/coaching/create?date=${format(day, 'yyyy-MM-dd')}`}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Link>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Group Coaching Sessions</CardTitle>
                  <Button asChild size="sm">
                    <Link href="/admin/coaching/create?type=group">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Group Session
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : groupSessions && groupSessions.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-7 font-medium text-sm bg-muted p-3 border-b">
                      <div className="col-span-2">Session Title</div>
                      <div>Date</div>
                      <div>Time</div>
                      <div>Capacity</div>
                      <div>Registrations</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {groupSessions.map((session) => (
                        <div key={session.id} className="grid grid-cols-7 py-3 px-3 items-center">
                          <div className="col-span-2 font-medium">{session.title}</div>
                          <div>{format(new Date(session.date), 'MMM d, yyyy')}</div>
                          <div>{format(new Date(session.date), 'h:mm a')}</div>
                          <div>{session.maxParticipants}</div>
                          <div>
                            <Badge variant="outline">
                              {session.participants || 0} / {session.maxParticipants}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/coaching/edit/${session.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  ...
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/coaching/attendees/${session.id}`}>
                                    <Users className="h-4 w-4 mr-2" />
                                    View Attendees
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    toast({
                                      title: "Demo Mode",
                                      description: "Deletion would remove this session in a production environment.",
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-md bg-muted/10">
                    <div className="flex flex-col items-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Group Sessions Scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        No group coaching sessions have been scheduled yet. Create your first session to get started.
                      </p>
                      <Button asChild>
                        <Link href="/admin/coaching/create?type=group">
                          <Plus className="mr-2 h-4 w-4" />
                          Schedule Group Session
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Individual Coaching Sessions</CardTitle>
                  <Button asChild size="sm">
                    <Link href="/admin/coaching/availability">
                      <Plus className="mr-2 h-4 w-4" />
                      Set Availability
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingIndividualSessions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : displayIndividualSessions && displayIndividualSessions.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-6 font-medium text-sm bg-muted p-3 border-b">
                      <div className="col-span-2">Member</div>
                      <div>Date</div>
                      <div>Duration</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {displayIndividualSessions.map((session) => (
                        <div key={session.id} className="grid grid-cols-6 py-3 px-3 items-center">
                          <div className="col-span-2 font-medium">User #{session.userId}</div>
                          <div>{format(new Date(session.date), 'MMM d, yyyy')}</div>
                          <div>{session.duration} min</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/coaching/session/${session.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                toast({
                                  title: "Send Reminder",
                                  description: "Reminder email sent to the user.",
                                });
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-md bg-muted/10">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Individual Sessions Booked</h3>
                      <p className="text-muted-foreground mb-4">
                        You have no upcoming individual coaching sessions. Set your availability to allow members to book sessions.
                      </p>
                      <Button asChild>
                        <Link href="/admin/coaching/availability">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Set Your Availability
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Session Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Group Session Best Practices</h3>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Limit group sessions to 10-15 participants for better engagement</li>
                  <li>Schedule sessions at least two weeks in advance</li>
                  <li>Send reminder emails 24 hours before the session</li>
                  <li>Allow 15 minutes for Q&A at the end of each session</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Individual Session Guidelines</h3>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Schedule 45-minute sessions with 15-minute breaks between</li>
                  <li>Ask members to complete a pre-session questionnaire</li>
                  <li>Follow up with a summary email and action items</li>
                  <li>Block off preparation time before each session</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayGroupSessions && displayGroupSessions.length > 0 ? (
                <div className="space-y-3">
                  {displayGroupSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.date), 'MMMM d, yyyy')} at {format(new Date(session.date), 'h:mm a')}
                        </p>
                      </div>
                      <Badge>
                        {session.participants} / {session.maxParticipants}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No upcoming sessions</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/coaching/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Session
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}