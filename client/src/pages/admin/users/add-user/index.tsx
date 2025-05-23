import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { ArrowLeft, Loader2, UserPlus, CheckCircle2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

// Extend the schema with additional validation rules
const addUserSchema = insertUserSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
  isAdmin: z.boolean().default(false),
  isEmployee: z.boolean().default(false),
  adminRoles: z.array(z.string()).default([]),
  sendWelcomeEmail: z.boolean().default(true),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function AddUser() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ id: number; username: string } | null>(null);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      tier: "free",
      phone: "",
      profilePicture: "",
      isEmployee: false,
      isAdmin: false,
      adminRoles: [],
      sendWelcomeEmail: true,
    },
  });

  // Watch employee and admin status to conditionally show fields
  const watchIsEmployee = form.watch("isEmployee");
  const watchIsAdmin = form.watch("isAdmin");
  const watchTier = form.watch("tier");

  // Mutation to create user
  const createUserMutation = useMutation({
    mutationFn: async (data: AddUserFormValues) => {
      // Set tier to employee if employee status is confirmed
      // Reset employee-specific values if not an employee
      let userData = { ...data };
      
      if (userData.tier === "employee" && userData.isEmployee) {
        // If employee with admin privileges, include admin roles
        if (userData.isAdmin) {
          // Keep adminRoles array as is
        } else {
          userData.adminRoles = []; // Empty admin roles if not an admin
        }
      } else {
        // Reset employee-specific fields for non-employees
        userData.isEmployee = false;
        userData.isAdmin = false;
        userData.adminRoles = [];
      }
      
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setCreatedUser({
        id: data.id,
        username: data.username
      });
      toast({
        title: "User Created",
        description: "New user has been created successfully",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddUserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Check permission to manage users/admins
  const canManageUsers = hasPermission("canManageUsers");
  const canManageAdmins = hasPermission("canManageAdmins");

  if (!canManageUsers) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to add users.
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
  if (success && createdUser) {
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
                <CardTitle className="text-center text-2xl">User Created Successfully</CardTitle>
                <CardDescription className="text-center">
                  The new user account has been created
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-1 font-medium">{form.getValues("username")}</p>
                <p className="text-muted-foreground mb-4">{form.getValues("email")}</p>
                
                {form.getValues("sendWelcomeEmail") && (
                  <div className="p-4 bg-muted rounded-md mt-4 text-sm">
                    A welcome email has been sent to the user with their login credentials.
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center space-x-4">
                <Button asChild variant="outline">
                  <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/users/edit-permissions?id=${createdUser.id}`}>
                    Set Permissions
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
              <h1 className="text-3xl font-bold">Add New User</h1>
            </div>
            <p className="text-muted-foreground">
              Create a new user account
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create User Account</CardTitle>
              <CardDescription>
                Enter the details for the new user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            Must be unique across the platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormDescription>
                            Minimum 8 characters
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
                            User will receive notifications at this email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            Used for SMS alerts if enabled
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Tier</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="paid">Paid ($29.99/month)</SelectItem>
                              <SelectItem value="premium">Premium ($999/year)</SelectItem>
                              <SelectItem value="mentorship">Mentorship ($5,000 one-time)</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Determines access level and available features
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave blank to use initials as profile image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Only show the isEmployee toggle when tier is set to "employee" */}
                  {watchTier === "employee" && (
                    <FormField
                      control={form.control}
                      name="isEmployee"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Employee Status</FormLabel>
                            <FormDescription>
                              Confirm this user is an employee of TradeEdge Pro
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                // Reset admin status if employee status is toggled off
                                if (!checked) {
                                  form.setValue("isAdmin", false);
                                }
                              }}
                              disabled={!canManageAdmins}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Only show the isAdmin toggle for employees */}
                  {watchIsEmployee && watchTier === "employee" && (
                    <FormField
                      control={form.control}
                      name="isAdmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Administrator Account</FormLabel>
                            <FormDescription>
                              Grant admin privileges to this employee
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canManageAdmins}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Show admin roles UI when isAdmin is enabled */}
                  {watchIsAdmin && watchIsEmployee && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="text-base font-medium mb-1">Admin Roles</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Select one or more administrative roles for this user
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {canManageAdmins && (
                          <FormField
                            control={form.control}
                            name="adminRoles"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes("super_admin")}
                                    onCheckedChange={(checked: boolean | "indeterminate") => {
                                      const updatedRoles = checked === true
                                        ? [...field.value, "super_admin"]
                                        : field.value.filter(role => role !== "super_admin");
                                      field.onChange(updatedRoles);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Super Admin <span className="text-muted-foreground">(All permissions)</span>
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes("content_admin")}
                                  onCheckedChange={(checked: boolean | "indeterminate") => {
                                    const updatedRoles = checked === true
                                      ? [...field.value, "content_admin"]
                                      : field.value.filter(role => role !== "content_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Content Admin <span className="text-muted-foreground">(Manage site content)</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes("alerts_admin")}
                                  onCheckedChange={(checked: boolean | "indeterminate") => {
                                    const updatedRoles = checked === true
                                      ? [...field.value, "alerts_admin"]
                                      : field.value.filter(role => role !== "alerts_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Alerts Admin <span className="text-muted-foreground">(Manage stock alerts)</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes("education_admin")}
                                  onCheckedChange={(checked: boolean | "indeterminate") => {
                                    const updatedRoles = checked === true
                                      ? [...field.value, "education_admin"]
                                      : field.value.filter(role => role !== "education_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Education Admin <span className="text-muted-foreground">(Manage educational content)</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes("coaching_admin")}
                                  onCheckedChange={(checked: boolean | "indeterminate") => {
                                    const updatedRoles = checked === true
                                      ? [...field.value, "coaching_admin"]
                                      : field.value.filter(role => role !== "coaching_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Coaching Admin <span className="text-muted-foreground">(Manage coaching sessions)</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="sendWelcomeEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Send Welcome Email</FormLabel>
                          <FormDescription>
                            Send an email with login credentials to the user
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button asChild variant="outline">
                      <Link href="/admin/users">
                        Cancel
                      </Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Create User
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