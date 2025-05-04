import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Coupon } from "@shared/schema";
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
  Plus,
  RotateCcw,
  Table as TableIcon,
  Ticket,
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

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [view, setView] = useState<"grid" | "table">("table");
  
  const { 
    data: coupons, 
    isLoading, 
    isError 
  } = useQuery<Coupon[]>({
    queryKey: ['/api/coupons'],
  });

  const { hasPermission } = useAdminPermissions();
  const canManageCoupons = hasPermission('canManageUsers');

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
      setIsCreating(false);
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
      setIsEditing(false);
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

  // Set up form
  const form = useForm<CouponFormValues>({
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

  const editForm = useForm<CouponFormValues & { id: number }>({
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

  // Handle form submission
  const onSubmit = (values: CouponFormValues) => {
    createCouponMutation.mutate(values);
  };

  const onEditSubmit = (values: CouponFormValues & { id: number }) => {
    updateCouponMutation.mutate(values);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    editForm.reset({
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
    setIsEditing(true);
  };

  const handleDeactivate = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this coupon?")) {
      deactivateCouponMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading the coupon data. Please try again later.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/coupons'] })}
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
            <h1 className="text-2xl font-bold">Coupon Management</h1>
            <p className="text-muted-foreground">
              Create and manage site-wide coupons for promotional discounts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center rounded-md border p-1">
              <button
                onClick={() => setView("table")}
                className={`p-1.5 rounded-sm ${
                  view === "table"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-sm ${
                  view === "grid"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button disabled={!canManageCoupons}>
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                        onClick={() => setIsCreating(false)}
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

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Coupon</DialogTitle>
                  <DialogDescription>
                    Update the details of an existing coupon
                  </DialogDescription>
                </DialogHeader>
                {selectedCoupon && (
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField
                        control={editForm.control}
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
                          control={editForm.control}
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
                          control={editForm.control}
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
                        control={editForm.control}
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
                          control={editForm.control}
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
                          control={editForm.control}
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
                        control={editForm.control}
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
                        control={editForm.control}
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
                            setIsEditing(false);
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
          </div>
        </div>

        {view === "table" ? (
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
                              onClick={() => handleEdit(coupon)}
                              disabled={!canManageCoupons}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {coupon.isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeactivate(coupon.id)}
                                disabled={!canManageCoupons}
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
                        onClick={() => handleEdit(coupon)}
                        disabled={!canManageCoupons}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {coupon.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(coupon.id)}
                          disabled={!canManageCoupons}
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
                    onClick={() => setIsCreating(true)}
                    disabled={!canManageCoupons}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Coupon
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}