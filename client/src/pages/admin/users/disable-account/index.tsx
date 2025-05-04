import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { ArrowLeft, Loader2, Ban, AlertTriangle, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { useLocation } from "wouter";

// Helper to get URL query parameters
function useQueryParams() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  return params;
}

// Schema for the disable account form
const disableAccountSchema = z.object({
  reason: z.enum(["violation", "spam", "inappropriate", "inactive", "requested", "other"], {
    required_error: "Please select a reason for disabling the account",
  }),
  explanation: z
    .string()
    .min(10, "Please provide a more detailed explanation")
    .max(500, "Explanation must be less than 500 characters"),
  notifyUser: z.boolean().default(true),
  permanentBan: z.boolean().default(false),
});

type DisableAccountFormValues = z.infer<typeof disableAccountSchema>;

export default function DisableAccount() {
  const params = useQueryParams();
  const id = params.get('id');
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [success, setSuccess] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  const form = useForm<DisableAccountFormValues>({
    resolver: zodResolver(disableAccountSchema),
    defaultValues: {
      reason: "violation",
      explanation: "",
      notifyUser: true,
      permanentBan: false,
    },
  });

  // Mutation to disable user account
  const disableAccountMutation = useMutation({
    mutationFn: async (data: DisableAccountFormValues) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/disable`, data);
      return await res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Account Disabled",
        description: "User account has been disabled successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DisableAccountFormValues) => {
    disableAccountMutation.mutate(data);
  };

  // Watch reason to generate a template explanation
  const watchReason = form.watch("reason");
  
  // Update explanation template when reason changes
  useEffect(() => {
    let template = "";
    switch (watchReason) {
      case "violation":
        template = "Your account has been disabled due to violations of our Terms of Service. Specifically, we've identified behavior that goes against our community guidelines.";
        break;
      case "spam":
        template = "Your account has been disabled because we detected spam or suspicious activity that violates our platform policies.";
        break;
      case "inappropriate":
        template = "Your account has been disabled because we received reports of inappropriate content or behavior that violates our community standards.";
        break;
      case "inactive":
        template = "Your account has been disabled due to prolonged inactivity. To protect our users' data, we periodically disable inactive accounts.";
        break;
      case "requested":
        template = "Your account has been disabled as per your request. If this was done in error, please contact our support team.";
        break;
      case "other":
        template = "Your account has been disabled. For more information, please contact our support team.";
        break;
    }
    form.setValue("explanation", template);
  }, [watchReason, form]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The user you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Check permission to manage users
  if (!hasPermission("canManageUsers")) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to disable user accounts.
            </p>
            <Button asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Success screen
  if (success) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Account Disabled</CardTitle>
                <CardDescription className="text-center">
                  {user.username}'s account has been disabled successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">
                  {form.getValues("notifyUser") 
                    ? "The user has been notified via email about the reason for their account being disabled."
                    : "The user has not been notified of this action."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.getValues("permanentBan")
                    ? "This is a permanent ban and the user will not be able to create a new account."
                    : "The user may contact support to request reinstatement of their account."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
          <div>
            <div className="flex items-center mb-1">
              <Button asChild variant="ghost" size="sm" className="mr-2">
                <Link href="/admin/users">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Disable User Account</h1>
            </div>
            <p className="text-muted-foreground">
              Disable access for user: {user.username}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/5">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                <CardTitle>Warning: This Action Cannot Be Undone</CardTitle>
              </div>
              <CardDescription>
                Disabling a user account will prevent them from accessing the platform and all its services.
                This action will be logged for audit purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="p-4 rounded-md bg-muted">
                    <h3 className="text-lg font-medium">User Information</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Username</span>
                        <p>{user.username}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Membership</span>
                        <p className="capitalize">{user.tier}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                        <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Disabling Account</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="violation">Terms of Service Violation</SelectItem>
                            <SelectItem value="spam">Spam or Suspicious Activity</SelectItem>
                            <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                            <SelectItem value="inactive">Account Inactivity</SelectItem>
                            <SelectItem value="requested">User Requested</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will determine the templated message sent to the user
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Explanation</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide a detailed explanation for disabling this account"
                            className="min-h-32"
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be sent to the user if notification is enabled
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="notifyUser"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Notify User via Email
                            </FormLabel>
                            <FormDescription>
                              Send an email explaining why their account was disabled
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permanentBan"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-destructive/30 bg-destructive/5">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-destructive">
                              Permanent Ban
                            </FormLabel>
                            <FormDescription>
                              Permanently ban this user from the platform (cannot be undone)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-end">
                    <Button asChild variant="outline">
                      <Link href="/admin/users">
                        Cancel
                      </Link>
                    </Button>
                    <Button 
                      type="submit" 
                      variant="destructive"
                      disabled={disableAccountMutation.isPending}
                      className="sm:w-auto"
                    >
                      {disableAccountMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4 mr-2" />
                      )}
                      Disable Account
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}