import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRoute } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, insertUserSchema } from "@shared/schema";
import { ArrowLeft, Loader2, Save, UserRoundCog } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

// Extend the schema with additional validation rules
const editUserSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
}).omit({ password: true }); // Remove password from edit form

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function EditUserProfile() {
  const [match, routeParams] = useRoute("/admin/users/edit-profile/:id");
  const id = routeParams?.id || new URLSearchParams(window.location.search).get("id");
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      tier: "free",
      phone: "",
      profilePicture: "",
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        tier: user.tier,
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user, form]);

  // Mutation to update user
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "User profile has been updated successfully",
      });
      // Invalidate user query to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile",
        variant: "destructive",
      });
    },
  });

  // Mutation to reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setIsPasswordReset(true);
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    updateUserMutation.mutate(data);
  };

  const handleResetPassword = () => {
    if (window.confirm("Are you sure you want to reset this user's password? They will receive an email with reset instructions.")) {
      resetPasswordMutation.mutate();
    }
  };

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

  // Check permission to edit users
  if (!hasPermission("canManageUsers")) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to edit user profiles.
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
              <h1 className="text-3xl font-bold">Edit User Profile</h1>
            </div>
            <p className="text-muted-foreground">
              Update profile information for {user.username}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || isPasswordReset}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isPasswordReset ? "Password Reset Sent" : "Reset Password"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The username must be unique across the platform.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormDescription>
                            The user will receive notifications at this email address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Used for SMS alerts if enabled.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Tier</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="mentorship">Mentorship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Changing the tier will affect the user's access to content and features.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profilePicture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for the user's profile picture.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateUserMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {updateUserMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
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
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-2xl text-primary-foreground">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={`${user.firstName || ''} ${user.lastName || ''}`} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.firstName?.charAt(0) || user.username.charAt(0)
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Member Since</h3>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Current Tier</h3>
                  <p className="capitalize">{user.tier}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Admin Status</h3>
                  <p>{user.isAdmin ? 'Admin' : 'Regular User'}</p>
                  {user.isAdmin && user.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Roles:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {user.adminRoles.map((role, index) => (
                          <li key={index} className="capitalize">{role.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Link href={`/admin/users/edit-permissions?id=${id}`}>
                    <Button variant="outline" className="w-full">
                      <UserRoundCog className="h-4 w-4 mr-2" />
                      Edit Permissions
                    </Button>
                  </Link>
                  <Link href={`/admin/users/change-tier?id=${id}`}>
                    <Button variant="outline" className="w-full">
                      Change Tier
                    </Button>
                  </Link>
                  <Link href={`/admin/users/disable-account?id=${id}`}>
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                      Disable Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}