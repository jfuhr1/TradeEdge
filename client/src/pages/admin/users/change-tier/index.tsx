import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { ArrowLeft, Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { useRoute, useLocation, Link } from "wouter";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

// Schema for the change tier form
const changeTierSchema = z.object({
  tier: z.enum(["free", "paid", "premium", "mentorship"], {
    required_error: "Please select a membership tier",
  }),
  reason: z.enum(["upgrade", "downgrade", "retention", "promotion", "other"], {
    required_error: "Please select a reason for changing tier",
  }),
  notifyUser: z.boolean().default(true),
});

type ChangeTierFormValues = z.infer<typeof changeTierSchema>;

// Pricing and feature information for each tier
const tierInfo = {
  free: {
    price: "$0",
    billing: "Free",
    features: [
      "Access to basic stock alerts",
      "Limited educational content",
      "Public chat participation",
      "Delayed market data",
    ]
  },
  paid: {
    price: "$29.99",
    billing: "Monthly",
    features: [
      "All Free features",
      "Full access to stock alerts",
      "Most educational content",
      "Basic portfolio tracking",
      "Email alerts",
    ]
  },
  premium: {
    price: "$999",
    billing: "Yearly",
    features: [
      "All Paid features",
      "Priority stock alerts",
      "Complete educational library",
      "Advanced portfolio tracking",
      "Email and SMS alerts",
      "Monthly group coaching sessions",
    ]
  },
  mentorship: {
    price: "$5,000",
    billing: "One-time purchase",
    features: [
      "All Premium features",
      "One-on-one coaching sessions",
      "Private Discord channel access",
      "Direct message support",
      "Custom alert setup",
      "Lifetime updates",
    ]
  }
};

export default function ChangeTier() {
  const [match, routeParams] = useRoute("/admin/users/change-tier");
  // Check both route params and query params for the ID
  const id = routeParams?.id || new URLSearchParams(window.location.search).get("id");
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [success, setSuccess] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  const form = useForm<ChangeTierFormValues>({
    resolver: zodResolver(changeTierSchema),
    defaultValues: {
      tier: "free",
      reason: "upgrade",
      notifyUser: true,
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.setValue("tier", user.tier as any);
    }
  }, [user, form]);

  // Mutation to update user tier
  const updateTierMutation = useMutation({
    mutationFn: async (data: ChangeTierFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/change-tier`, data);
      return await res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Tier Updated",
        description: "User's membership tier has been updated successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update membership tier",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangeTierFormValues) => {
    updateTierMutation.mutate(data);
  };

  // Watch current tier selection to display appropriate information
  const watchTier = form.watch("tier");

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
              You don't have permission to change user membership tiers.
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
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Tier Updated Successfully</CardTitle>
                <CardDescription className="text-center">
                  {user.username}'s membership has been updated to the {watchTier} tier.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">
                  {form.getValues("notifyUser") 
                    ? "The user has been notified of this change."
                    : "The user has not been notified of this change."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center space-x-4">
                <Button asChild variant="outline">
                  <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/users/edit-profile?id=${id}`}>
                    View User Profile
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
              <h1 className="text-3xl font-bold">Change Membership Tier</h1>
            </div>
            <p className="text-muted-foreground">
              Update membership tier for {user.username}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Membership Tier</CardTitle>
                <CardDescription>
                  Choose the appropriate membership level for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Membership Tier</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="free" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Free</span>
                                    <span className="text-muted-foreground text-sm">$0</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">Basic access with limited features</p>
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="paid" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Paid</span>
                                    <span className="text-muted-foreground text-sm">$29.99/month</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">Standard access with most features</p>
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="premium" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Premium</span>
                                    <span className="text-muted-foreground text-sm">$999/year</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">Full access with premium features and group coaching</p>
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                <FormControl>
                                  <RadioGroupItem value="mentorship" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Mentorship</span>
                                    <span className="text-muted-foreground text-sm">$5,000 one-time</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">All features plus one-on-one coaching and direct support</p>
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Change</FormLabel>
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
                              <SelectItem value="upgrade">Customer Upgrade</SelectItem>
                              <SelectItem value="downgrade">Customer Downgrade</SelectItem>
                              <SelectItem value="retention">Customer Retention</SelectItem>
                              <SelectItem value="promotion">Special Promotion</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps track reasons for membership changes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              Notify User of Change
                            </FormLabel>
                            <FormDescription>
                              Send an email notification to the user about this tier change
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={updateTierMutation.isPending}
                      >
                        {updateTierMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Update Membership
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Current Membership</CardTitle>
                <CardDescription>
                  User's current membership information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-md">
                  <h3 className="font-medium text-lg capitalize">{user.tier} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Active since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Selected Plan Features</h3>
                  <div className="space-y-2">
                    {tierInfo[watchTier as keyof typeof tierInfo].features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Pricing Information</h3>
                  <p className="text-2xl font-bold">
                    {tierInfo[watchTier as keyof typeof tierInfo].price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tierInfo[watchTier as keyof typeof tierInfo].billing}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Note: Changing a user's tier manually here will not automatically process any payments
                or refunds. This should be handled separately through your payment processor if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}