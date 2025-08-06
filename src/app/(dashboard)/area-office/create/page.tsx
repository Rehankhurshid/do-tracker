"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Loader2, Plus, X, CheckCircle2, Package, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  doNumber: z.string().min(1, "DO Number is required"),
  partyId: z.string().min(1, "Party is required"),
  authorizedPerson: z.string().min(1, "Authorized person is required"),
  validTo: z.string().min(1, "Valid to date is required"),
  notes: z.string().optional(),
});

export default function CreateDOPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [parties, setParties] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDO, setCreatedDO] = useState<any>(null);
  const [showSimpleSuccess, setShowSimpleSuccess] = useState(false);

  // Generate a unique DO number
  const generateDONumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DO-${year}${month}${day}-${random}`;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doNumber: generateDONumber(),
      partyId: "",
      authorizedPerson: "",
      validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      notes: "",
    },
  });

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties");
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submitting form with values:", values);
    
    // Validate party selection
    if (!values.partyId) {
      toast({
        title: "❌ Error",
        description: "Please select a party",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Show immediate feedback
    toast({
      title: "Creating Delivery Order...",
      description: "Please wait while we process your request.",
    });
    
    const payload = {
      doNumber: values.doNumber,
      partyId: values.partyId,
      authorizedPerson: values.authorizedPerson,
      validTo: values.validTo,
      notes: values.notes || ""
    };
    
    console.log("Sending payload:", payload);
    
    try {
      const response = await fetch("/api/delivery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        // Find party name for display
        const partyName = parties.find(p => p.id === values.partyId)?.name || "";
        
        setCreatedDO({
          ...data,
          partyName
        });
        setShowSuccess(true);
        setShowSimpleSuccess(true);
        
        // Optional: Play a simple success sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.1;
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          // Ignore audio errors - not critical for functionality
          console.log("Audio notification skipped");
        }
        
        // Show detailed success toast with animation
        toast({
          title: "✅ DO Created Successfully!",
          description: `DO #${values.doNumber} has been created for ${partyName}.`,
          duration: 5000,
        });
        
        // Reset loading state after showing success
        setIsLoading(false);
        
        // Optional: Auto-redirect after a delay (can be removed if you prefer manual navigation)
        // setTimeout(() => {
        //   router.push("/area-office/process?from=create");
        // }, 3000);
      } else {
        console.error("Error response:", response.status, data);
        setIsLoading(false);
        
        // Check for specific error types
        let errorMessage = "Failed to create delivery order";
        if (data.error) {
          errorMessage = data.error;
        }
        if (data.details) {
          // Show validation errors
          const errors = Object.entries(data.details)
            .filter(([_, value]) => value)
            .map(([_, value]) => value)
            .join(", ");
          if (errors) {
            errorMessage = errors;
          }
        }
        
        toast({
          title: "❌ Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setIsLoading(false);
      
      // Try to parse error response
      let errorMessage = "Something went wrong. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setShowSuccess(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl font-bold">Delivery Order Created!</h2>
                  <p className="text-lg font-semibold text-primary">DO #{createdDO?.doNumber}</p>
                  <p className="text-muted-foreground">Party: {createdDO?.partyName}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium">What's next?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can now forward this DO to the Project Office for processing.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="default"
                      onClick={() => {
                        router.push("/area-office/process");
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Process DOs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSuccess(false);
                        setShowSimpleSuccess(false);
                        form.reset({
                          doNumber: generateDONumber(),
                          partyId: "",
                          authorizedPerson: "",
                          validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                          notes: "",
                        });
                        setCreatedDO(null);
                      }}
                    >
                      Create Another
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Create Delivery Order</CardTitle>
            </div>
            <CardDescription>
              Create a new delivery order for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showSimpleSuccess && createdDO && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Success! Delivery Order Created
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        DO Number: <strong>{createdDO.doNumber}</strong>
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Party: <strong>{createdDO.partyName}</strong>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push("/area-office/process");
                          }}
                          className="border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Go to Process DOs
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            form.reset({
                              doNumber: generateDONumber(),
                              partyId: "",
                              authorizedPerson: "",
                              validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                              notes: "",
                            });
                            setShowSimpleSuccess(false);
                            setShowSuccess(false);
                            setCreatedDO(null);
                          }}
                        >
                          Create Another
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                toast({
                  title: "Validation Error",
                  description: "Please check all required fields",
                  variant: "destructive",
                });
              })} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="doNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DO Number</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="DO-2024-001" {...field} />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newNumber = generateDONumber();
                                form.setValue("doNumber", newNumber);
                              }}
                              title="Generate new DO number"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Unique delivery order number (auto-generated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a party" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parties.length === 0 ? (
                              <SelectItem value="loading" disabled>
                                Loading parties...
                              </SelectItem>
                            ) : (
                              parties.map((party) => (
                                <SelectItem key={party.id} value={party.id}>
                                  {party.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the receiving party
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorizedPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription>
                          Person authorized to receive the order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid To</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Expiry date for this delivery order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or instructions..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || showSuccess}
                    className="relative"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Delivery Order
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}