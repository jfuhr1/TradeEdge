import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { TechnicalReason } from "@shared/schema";
import { Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Create a schema for stock alert form
const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.number().positive("Price must be positive"),
  buyZoneMin: z.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.number().positive("Buy zone maximum must be positive"),
  target1: z.number().positive("Target 1 must be positive"),
  target2: z.number().positive("Target 2 must be positive"),
  target3: z.number().positive("Target 3 must be positive"),
  technicalReasons: z.array(z.string()).min(1, "At least one technical reason is required"),
}).refine(data => data.buyZoneMax > data.buyZoneMin, {
  message: "Buy zone maximum must be greater than minimum",
  path: ["buyZoneMax"],
}).refine(data => data.target1 > data.currentPrice, {
  message: "Target 1 must be greater than current price",
  path: ["target1"],
}).refine(data => data.target2 > data.target1, {
  message: "Target 2 must be greater than Target 1",
  path: ["target2"],
}).refine(data => data.target3 > data.target2, {
  message: "Target 3 must be greater than Target 2",
  path: ["target3"],
});

type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>;

export default function StockAlertForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get technical reasons from the API
  const { data: technicalReasons, isLoading: isLoadingReasons } = useQuery<TechnicalReason[]>({
    queryKey: ["/api/technical-reasons"],
  });

  // Form setup
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      symbol: "",
      companyName: "",
      currentPrice: 0,
      buyZoneMin: 0,
      buyZoneMax: 0,
      target1: 0,
      target2: 0,
      target3: 0,
      technicalReasons: [],
    },
  });

  // Create stock alert mutation
  const createAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      const res = await apiRequest("POST", "/api/stock-alerts", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock alert created",
        description: "The stock alert has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      setLocation("/stock-alerts");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create stock alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: StockAlertFormValues) {
    createAlert.mutate(data);
  }

  if (isLoadingReasons) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Stock Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stock Symbol */}
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="AAPL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the stock ticker symbol (e.g., AAPL for Apple)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Apple Inc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full company name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Price */}
              <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Current market price of the stock
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buy Zone Range */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="buyZoneMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Zone Minimum ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyZoneMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Zone Maximum ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Target Prices */}
            <div className="space-y-4">
              <h3 className="font-medium">Target Prices</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="target1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target 1 (Conservative)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target 2 (Moderate)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target 3 (Aggressive)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Technical Reasons */}
            <div>
              <FormField
                control={form.control}
                name="technicalReasons"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Technical Reasons</FormLabel>
                      <FormDescription>
                        Select the technical indicators supporting this stock pick
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {technicalReasons?.map((reason) => (
                        <FormField
                          key={reason.id}
                          control={form.control}
                          name="technicalReasons"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={reason.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(reason.name)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, reason.name])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== reason.name
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {reason.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={createAlert.isPending}
            >
              {createAlert.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Stock Alert"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
