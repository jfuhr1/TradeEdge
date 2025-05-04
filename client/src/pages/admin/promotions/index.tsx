import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Coupon, UserDiscount, User } from "@shared/schema";
import AdminLayout from "@/components/admin/AdminLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Ban,
  Edit,
  LayoutGrid,
  Loader2,
  Percent,
  Plus,
  RotateCcw,
  Table as TableIcon,
  User as UserIcon,
  Ticket,
  BadgePercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Schema for coupon form validation
const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  discountPercentage: z.coerce.number().min(1).max(100, "Discount must be between 1 and 100%"),
  discountAmount: z.coerce.number().optional(),
  description: z.string().min(5, "Description must be at least 5 characters"),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

// Schema for discount form validation
const discountSchema = z.object({
  userId: z.coerce.number().int().positive(),
  discountPercentage: z.coerce.number().min(1).max(100, "Discount must be between 1 and 100%"),
  discountAmount: z.coerce.number().optional(),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().optional(),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;
type DiscountFormValues = z.infer<typeof discountSchema>;

export default function PromotionsPage() {
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"grid" | "table">("table");
  const [activeTab, setActiveTab] = useState<"coupons" | "discounts">("coupons");
  
  // Coupon state
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [isEditingCoupon, setIsEditingCoupon] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  // Discount state
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState<boolean>(false);
  const [selectedDiscount, setSelectedDiscount] = useState<UserDiscount | null>(null);
  
  // Fetch data
  const { 
    data: coupons, 
    isLoading: isLoadingCoupons, 
    isError: isErrorCoupons 
  } = useQuery<Coupon[]>({
    queryKey: ['/api/coupons'],
  });

  const { 
    data: allDiscounts, 
    isLoading: isLoadingDiscounts, 
    isError: isErrorDiscounts 
  } = useQuery<UserDiscount[]>({
    queryKey: ['/api/discounts'],
  });

  // Get all users for the user selection dropdown
  const { 
    data: users, 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get discount reasons for dropdown
  const { 
    data: discountReasons, 
    isLoading: isLoadingReasons 
  } = useQuery<{ reasons: string[] }>({
    queryKey: ['/api/discount-reasons'],
  });

  const { hasPermission } = useAdminPermissions();
  const canManagePromotions = hasPermission('canManageUsers');

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (coupon: CouponFormValues) => {
      const res = await apiRequest('POST', '/api/coupons', coupon);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coupon created",
        description: "The coupon has been successfully created",
      });
      setIsCreatingCoupon(false);
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create coupon",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, ...coupon }: CouponFormValues & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/coupons/${id}`, coupon);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coupon updated",
        description: "The coupon has been successfully updated",
      });
      setIsEditingCoupon(false);
      setSelectedCoupon(null);
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update coupon",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Deactivate coupon mutation
  const deactivateCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/coupons/${id}/deactivate`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coupon deactivated",
        description: "The coupon has been successfully deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to deactivate coupon",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (discount: DiscountFormValues) => {
      const res = await apiRequest('POST', `/api/users/${discount.userId}/discounts`, discount);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Discount created",
        description: "The user discount has been successfully created",
      });
      setIsCreatingDiscount(false);
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create discount",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Update discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async ({ id, ...discount }: DiscountFormValues & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/discounts/${id}`, discount);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Discount updated",
        description: "The user discount has been successfully updated",
      });
      setIsEditingDiscount(false);
      setSelectedDiscount(null);
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update discount",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Deactivate discount mutation
  const deactivateDiscountMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/discounts/${id}/deactivate`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Discount deactivated",
        description: "The user discount has been successfully deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to deactivate discount",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Set up coupon form
  const couponForm = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountPercentage: 10,
      discountAmount: undefined,
      description: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
      maxUses: 100,
      isActive: true,
    },
  });

  // Set up coupon edit form
  const couponEditForm = useForm<CouponFormValues & { id: number }>({
    resolver: zodResolver(couponSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      code: "",
      discountPercentage: 10,
      discountAmount: undefined,
      description: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
      maxUses: 100,
      isActive: true,
    },
  });

  // Set up discount form
  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      userId: undefined,
      discountPercentage: 10,
      discountAmount: undefined,
      reason: "",
      notes: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
      isActive: true,
    },
  });

  // Set up discount edit form
  const discountEditForm = useForm<DiscountFormValues & { id: number }>({
    resolver: zodResolver(discountSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      userId: undefined,
      discountPercentage: 10,
      discountAmount: undefined,
      reason: "",
      notes: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
      isActive: true,
    },
  });

  // Handle form submissions
  const onCouponSubmit = (values: CouponFormValues) => {
    createCouponMutation.mutate(values);
  };

  const onCouponEditSubmit = (values: CouponFormValues & { id: number }) => {
    updateCouponMutation.mutate(values);
  };

  const onDiscountSubmit = (values: DiscountFormValues) => {
    createDiscountMutation.mutate(values);
  };

  const onDiscountEditSubmit = (values: DiscountFormValues & { id: number }) => {
    updateDiscountMutation.mutate(values);
  };

  // Edit and deactivate handlers
  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    couponEditForm.reset({
      id: coupon.id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      discountAmount: coupon.discountAmount ? parseFloat(coupon.discountAmount.toString()) : undefined,
      description: coupon.description || "",
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 10) : undefined,
      maxUses: coupon.maxUses || undefined,
      isActive: coupon.isActive,
    });
    setIsEditingCoupon(true);
  };

  const handleDeactivateCoupon = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this coupon?")) {
      deactivateCouponMutation.mutate(id);
    }
  };

  const handleEditDiscount = (discount: UserDiscount) => {
    setSelectedDiscount(discount);
    discountEditForm.reset({
      id: discount.id,
      userId: discount.userId,
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount ? parseFloat(discount.discountAmount.toString()) : undefined,
      reason: discount.reason,
      notes: discount.notes || "",
      validFrom: discount.validFrom ? new Date(discount.validFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      validUntil: discount.validUntil ? new Date(discount.validUntil).toISOString().slice(0, 10) : undefined,
      isActive: discount.isActive,
    });
    setIsEditingDiscount(true);
  };

  const handleDeactivateDiscount = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this discount?")) {
      deactivateDiscountMutation.mutate(id);
    }
  };

  // Get user name by ID for display
  const getUserName = (userId: number) => {
    if (!users) return "Loading...";
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  // Get formatted reason text
  const getFormattedReason = (reason: string) => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Loading state
  const isLoading = isLoadingCoupons || isLoadingDiscounts || isLoadingUsers || isLoadingReasons;
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Error state
  const isError = isErrorCoupons || isErrorDiscounts;
  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading the promotion data. Please try again later.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Promotions Management</h1>
            <p className="text-muted-foreground">
              Manage coupons and user-specific discounts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center rounded-md border p-1">
              <button
                onClick={() => setViewType("table")}
                className={`p-1.5 rounded-sm ${
                  viewType === "table"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewType("grid")}
                className={`p-1.5 rounded-sm ${
                  viewType === "grid"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>

            {activeTab === "coupons" ? (
              <Dialog open={isCreatingCoupon} onOpenChange={setIsCreatingCoupon}>
                <DialogTrigger asChild>
                  <Button disabled={!canManagePromotions}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                    <DialogDescription>
                      Create a new coupon code for promotional discounts. Fill in all required fields.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...couponForm}>
                    <form onSubmit={couponForm.handleSubmit(onCouponSubmit)} className="space-y-4">
                      <FormField
                        control={couponForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coupon Code</FormLabel>
                            <FormControl>
                              <Input placeholder="WELCOME20" {...field} className="uppercase" />
                            </FormControl>
                            <FormDescription>
                              This is the code users will enter at checkout
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={couponForm.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Percentage (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={couponForm.control}
                          name="discountAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fixed Discount Amount (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value === undefined ? "" : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : parseFloat(val));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty to use percentage only
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={couponForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="20% off for new members"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={couponForm.control}
                          name="validFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid From</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={couponForm.control}
                          name="validUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid Until (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty for no expiration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={couponForm.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Uses (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="100"
                                {...field}
                                value={field.value === undefined ? "" : field.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(val === "" ? undefined : parseInt(val));
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty for unlimited uses
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={couponForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Status
                              </FormLabel>
                              <FormDescription>
                                Enable or disable this coupon
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
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreatingCoupon(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createCouponMutation.isPending}
                        >
                          {createCouponMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Coupon
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isCreatingDiscount} onOpenChange={setIsCreatingDiscount}>
                <DialogTrigger asChild>
                  <Button disabled={!canManagePromotions}>
                    <Plus className="h-4 w-4 mr-2" />
                    New User Discount
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New User Discount</DialogTitle>
                    <DialogDescription>
                      Create a special discount for an individual user. Fill in all required fields.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...discountForm}>
                    <form onSubmit={discountForm.handleSubmit(onDiscountSubmit)} className="space-y-4">
                      <FormField
                        control={discountForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select User</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users && users.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={discountForm.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Percentage (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={discountForm.control}
                          name="discountAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fixed Discount Amount (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value === undefined ? "" : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : parseFloat(val));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty to use percentage only
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={discountForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Reason</FormLabel>
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
                                {discountReasons && discountReasons.reasons.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {getFormattedReason(reason)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={discountForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Additional information about this discount"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={discountForm.control}
                          name="validFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid From</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={discountForm.control}
                          name="validUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid Until (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty for no expiration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={discountForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Status
                              </FormLabel>
                              <FormDescription>
                                Enable or disable this discount
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
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreatingDiscount(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createDiscountMutation.isPending}
                        >
                          {createDiscountMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Discount
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Coupon edit dialog */}
        <Dialog open={isEditingCoupon} onOpenChange={setIsEditingCoupon}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>
                Update the details of an existing coupon
              </DialogDescription>
            </DialogHeader>
            {selectedCoupon && (
              <Form {...couponEditForm}>
                <form onSubmit={couponEditForm.handleSubmit(onCouponEditSubmit)} className="space-y-4">
                  <FormField
                    control={couponEditForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code</FormLabel>
                        <FormControl>
                          <Input placeholder="WELCOME20" {...field} className="uppercase" />
                        </FormControl>
                        <FormDescription>
                          This is the code users will enter at checkout
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={couponEditForm.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={couponEditForm.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Discount Amount (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0.00"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? undefined : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty to use percentage only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={couponEditForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="20% off for new members"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={couponEditForm.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={couponEditForm.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for no expiration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={couponEditForm.control}
                    name="maxUses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Uses (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="100"
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : parseInt(val));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited uses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={couponEditForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Enable or disable this coupon
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
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingCoupon(false);
                        setSelectedCoupon(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateCouponMutation.isPending}
                    >
                      {updateCouponMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Coupon
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Discount edit dialog */}
        <Dialog open={isEditingDiscount} onOpenChange={setIsEditingDiscount}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User Discount</DialogTitle>
              <DialogDescription>
                Update the details of an existing user discount
              </DialogDescription>
            </DialogHeader>
            {selectedDiscount && (
              <Form {...discountEditForm}>
                <form onSubmit={discountEditForm.handleSubmit(onDiscountEditSubmit)} className="space-y-4">
                  <FormField
                    control={discountEditForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <FormControl>
                          <Input 
                            value={getUserName(field.value)}
                            disabled 
                          />
                        </FormControl>
                        <FormDescription>
                          User cannot be changed
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={discountEditForm.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={discountEditForm.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Discount Amount (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0.00"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? undefined : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty to use percentage only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={discountEditForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Reason</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {discountReasons && discountReasons.reasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {getFormattedReason(reason)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={discountEditForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information about this discount"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={discountEditForm.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={discountEditForm.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for no expiration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={discountEditForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Enable or disable this discount
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
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingDiscount(false);
                        setSelectedDiscount(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateDiscountMutation.isPending}
                    >
                      {updateDiscountMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Discount
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="coupons" onValueChange={(v) => setActiveTab(v as "coupons" | "discounts")} className="mt-6">
          <TabsList className="w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span>Site Coupons</span>
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Badge className="h-4 w-4" />
              <span>User Discounts</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Coupons Tab */}
          <TabsContent value="coupons" className="mt-4">
            {viewType === "table" ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="hidden md:table-cell">Valid Period</TableHead>
                        <TableHead className="hidden md:table-cell">Uses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons && coupons.length > 0 ? (
                        coupons.map((coupon) => (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-mono font-semibold">
                              {coupon.code}
                            </TableCell>
                            <TableCell>
                              {coupon.discountPercentage}%
                              {coupon.discountAmount && ` or $${coupon.discountAmount}`}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {coupon.description}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {format(new Date(coupon.validFrom), "MMM d, yyyy")}
                              {coupon.validUntil && (
                                <> - {format(new Date(coupon.validUntil), "MMM d, yyyy")}</>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {coupon.currentUses}
                              {coupon.maxUses && <>/{coupon.maxUses}</>}
                            </TableCell>
                            <TableCell>
                              {coupon.isActive ? (
                                <Badge className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCoupon(coupon)}
                                  disabled={!canManagePromotions}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {coupon.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeactivateCoupon(coupon.id)}
                                    disabled={!canManagePromotions}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No coupons found. Create a new coupon to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons && coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <Card key={coupon.id} className="overflow-hidden">
                      <div className={`h-2 ${coupon.isActive ? "bg-green-500" : "bg-muted"}`} />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-mono">
                            {coupon.code}
                          </CardTitle>
                          {coupon.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <CardDescription>{coupon.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium">Discount</div>
                          <div>{coupon.discountPercentage}%
                            {coupon.discountAmount && ` or $${coupon.discountAmount}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Valid Period</div>
                          <div>
                            {format(new Date(coupon.validFrom), "MMM d, yyyy")}
                            {coupon.validUntil && (
                              <> - {format(new Date(coupon.validUntil), "MMM d, yyyy")}</>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Usage</div>
                          <div>
                            {coupon.currentUses}
                            {coupon.maxUses && <>/{coupon.maxUses}</>} uses
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCoupon(coupon)}
                            disabled={!canManagePromotions}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {coupon.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateCoupon(coupon.id)}
                              disabled={!canManagePromotions}
                              className="flex-1"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-center">
                      <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Coupons Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create a new coupon to get started with promotional discounts.
                      </p>
                      <Button 
                        onClick={() => setIsCreatingCoupon(true)}
                        disabled={!canManagePromotions}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Coupon
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Discounts Tab */}
          <TabsContent value="discounts" className="mt-4">
            {viewType === "table" ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="hidden md:table-cell">Notes</TableHead>
                        <TableHead className="hidden md:table-cell">Valid Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDiscounts && allDiscounts.length > 0 ? (
                        allDiscounts.map((discount) => (
                          <TableRow key={discount.id}>
                            <TableCell>
                              {getUserName(discount.userId)}
                            </TableCell>
                            <TableCell>
                              {discount.discountPercentage}%
                              {discount.discountAmount && ` or $${discount.discountAmount}`}
                            </TableCell>
                            <TableCell>
                              {getFormattedReason(discount.reason)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {discount.notes || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {format(new Date(discount.validFrom), "MMM d, yyyy")}
                              {discount.validUntil && (
                                <> - {format(new Date(discount.validUntil), "MMM d, yyyy")}</>
                              )}
                            </TableCell>
                            <TableCell>
                              {discount.isActive ? (
                                <Badge className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditDiscount(discount)}
                                  disabled={!canManagePromotions}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {discount.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeactivateDiscount(discount.id)}
                                    disabled={!canManagePromotions}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No user discounts found. Create a new user discount to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDiscounts && allDiscounts.length > 0 ? (
                  allDiscounts.map((discount) => (
                    <Card key={discount.id} className="overflow-hidden">
                      <div className={`h-2 ${discount.isActive ? "bg-green-500" : "bg-muted"}`} />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              <UserIcon className="h-4 w-4 mr-2" />
                              {getUserName(discount.userId)}
                            </CardTitle>
                            <CardDescription>
                              {getFormattedReason(discount.reason)}
                            </CardDescription>
                          </div>
                          {discount.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium">Discount</div>
                          <div>{discount.discountPercentage}%
                            {discount.discountAmount && ` or $${discount.discountAmount}`}
                          </div>
                        </div>
                        {discount.notes && (
                          <div>
                            <div className="text-sm font-medium">Notes</div>
                            <div className="text-sm">{discount.notes}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">Valid Period</div>
                          <div>
                            {format(new Date(discount.validFrom), "MMM d, yyyy")}
                            {discount.validUntil && (
                              <> - {format(new Date(discount.validUntil), "MMM d, yyyy")}</>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDiscount(discount)}
                            disabled={!canManagePromotions}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {discount.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateDiscount(discount.id)}
                              disabled={!canManagePromotions}
                              className="flex-1"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-center">
                      <BadgePercent className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No User Discounts Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create a new user discount to provide special pricing for individual users.
                      </p>
                      <Button 
                        onClick={() => setIsCreatingDiscount(true)}
                        disabled={!canManagePromotions}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New User Discount
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}