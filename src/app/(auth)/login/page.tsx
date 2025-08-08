"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogIn, Shield, Building, Briefcase, Truck, User, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username.length >= 3) {
        checkUsername();
      } else {
        setUserInfo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const checkUsername = async () => {
    setIsCheckingUser(true);
    try {
      const data = await api.post("/api/auth/check-user", { username: formData.username });
      if (data.exists) {
        setUserInfo(data.user);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      setUserInfo(null);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-5 w-5" />;
      case "AREA_OFFICE":
        return <Building className="h-5 w-5" />;
      case "PROJECT_OFFICE":
        return <Briefcase className="h-5 w-5" />;
      case "CISF":
        return <Shield className="h-5 w-5" />;
      case "ROAD_SALE":
        return <Truck className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.username, formData.password);
  };

  const performLogin = async (username: string, password: string) => {
    setIsLoading(true);
    console.log('Starting login for user:', username);

    try {
      const data = await api.post("/api/auth/login", { username, password });
      console.log('Login response received:', data);

      if (data.success) {
        toast({
          title: "Success",
          description: "Login successful! Redirecting...",
        });
        
        // Add a small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect based on user role
        const redirectPath = (() => {
          switch (data.user.role) {
            case "ADMIN":
              return "/admin";
            case "AREA_OFFICE":
              return "/area-office";
            case "PROJECT_OFFICE":
              return "/project-office";
            case "CISF":
              return "/cisf";
            case "ROAD_SALE":
              return "/road-sale";
            default:
              return "/dashboard";
          }
        })();
        
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (username: string) => {
    setFormData({ username, password: "admin123" });
    performLogin(username, "admin123");
  };

  const testUsers = [
    {
      username: "admin",
      role: "Administrator",
      icon: Shield,
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Full system access"
    },
    {
      username: "area_office",
      role: "Area Office",
      icon: Building,
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Create & manage DOs"
    },
    {
      username: "project_office",
      role: "Project Office",
      icon: Briefcase,
      color: "bg-green-500 hover:bg-green-600",
      description: "Process & forward orders"
    },
    {
      username: "cisf",
      role: "CISF Security",
      icon: Shield,
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Security approval"
    },
    {
      username: "road_sale",
      role: "Road Sale",
      icon: Truck,
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Final delivery point"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
        <Card className="relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <CardHeader className="space-y-1 relative">
            <CardTitle className="text-2xl font-bold text-center">
              OrderFlow Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 relative">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  {isCheckingUser && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isCheckingUser && userInfo && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </div>

                {/* Delightful Role Indicator */}
                <AnimatePresence mode="wait">
                  {userInfo && (
                    <motion.div
                      key={userInfo.username}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                      className={`rounded-lg border p-3 ${userInfo.roleInfo.bgColor} ${userInfo.roleInfo.borderColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <motion.div
                          initial={{ rotate: -180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className={`mt-1 ${userInfo.roleInfo.color}`}
                        >
                          {getRoleIcon(userInfo.role)}
                        </motion.div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Welcome back, {userInfo.username}!
                            </span>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, type: "spring" }}
                            >
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                            </motion.div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`${userInfo.roleInfo.color} ${userInfo.roleInfo.bgColor} border ${userInfo.roleInfo.borderColor}`}
                            >
                              <span className="mr-1">{userInfo.roleInfo.icon}</span>
                              {userInfo.roleInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {userInfo.roleInfo.description}
                          </p>
                          {!userInfo.isActive && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-destructive font-medium"
                            >
                              ⚠️ Account is inactive. Please contact admin.
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Link
                  href="/reset-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
                <Link
                  href="/consumer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Consumer Portal →
                </Link>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full relative overflow-hidden group"
                disabled={isLoading || (userInfo && !userInfo.isActive)}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {userInfo && !userInfo.isActive ? "Account Inactive" : "Login"}
                    </>
                  )}
                </span>
                {/* Animated gradient on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Quick Login Section for Testing - Always visible for demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full"
      >
        <Card className="border-dashed border-2 bg-muted/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-sm">Quick Login (Test Mode)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Click any user below for instant login with test credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {testUsers.map((user) => {
                const Icon = user.icon;
                return (
                  <motion.button
                    key={user.username}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => quickLogin(user.username)}
                    disabled={isLoading}
                    className={`${user.color} text-white rounded-lg p-3 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{user.role}</span>
                      <span className="text-[10px] opacity-80">{user.username}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <Separator className="my-3" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">
                All test accounts use password: <code className="bg-muted px-1 rounded">admin123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}