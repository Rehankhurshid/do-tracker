"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, UserCheck, UserX, Search, Mail, Key, RefreshCw, AlertTriangle, Shield, Loader2, User, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole } from "@/types";

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "AREA_OFFICE" as UserRole,
    sendInvite: false,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    userId: "",
    username: "",
    hasData: false,
    isCorrupted: false,
    forceDelete: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    general?: string;
  }>({});

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();

      if (!userData.user || userData.user.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setCurrentUser(userData.user);

      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    setIsCreatingUser(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Rich success toast
        toast({
          title: editingUser ? "✅ User Updated" : "✅ User Created Successfully",
          description: (
            <div className="space-y-1">
              <p className="font-medium">{userData.username}</p>
              <p className="text-sm text-muted-foreground">
                Role: {userData.role.replace('_', ' ')}
              </p>
              {formData.sendInvite && formData.email && (
                <p className="text-sm text-muted-foreground">
                  📧 Invitation sent to {formData.email}
                </p>
              )}
            </div>
          ) as any,
        });
        
        setDialogOpen(false);
        setEditingUser(null);
        setFormData({ username: "", email: "", password: "", role: "AREA_OFFICE", sendInvite: false });
        setFormErrors({});
        fetchUserAndData();
      } else {
        const error = await response.json();
        
        // Handle specific error cases
        if (response.status === 409) {
          // Conflict - duplicate username or email
          if (error.field === 'username') {
            setFormErrors({ username: error.error || "Username already exists" });
          } else if (error.field === 'email') {
            setFormErrors({ email: error.error || "Email already in use" });
          } else {
            setFormErrors({ general: error.error || "User already exists" });
          }
        } else if (response.status === 400) {
          // Validation error
          setFormErrors({ general: error.error || "Invalid input data" });
        } else {
          // General error
          setFormErrors({ general: error.error || "Failed to save user" });
        }
        
        // Error toast
        toast({
          title: "❌ Error Creating User",
          description: error.error || "Failed to save user",
          variant: "destructive",
        });
      }
    } catch (error) {
      setFormErrors({ general: "Network error. Please try again." });
      toast({
        title: "❌ Network Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${isActive ? "deactivated" : "activated"} successfully`,
        });
        fetchUserAndData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!deleteDialog.userId) return;
    
    setIsDeleting(true);
    try {
      // Add force parameter if this is a corrupted record or force delete is enabled
      const forceParam = deleteDialog.forceDelete ? '?force=true' : '';
      const response = await fetch(`/api/admin/users/${deleteDialog.userId}/delete${forceParam}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ User Removed",
          description: data.wasDeleted 
            ? `${deleteDialog.username} has been permanently deleted`
            : `${deleteDialog.username} has been deactivated (had associated data)`,
        });
        fetchUserAndData();
        setDeleteDialog({ 
          open: false, 
          userId: "", 
          username: "", 
          hasData: false, 
          isCorrupted: false, 
          forceDelete: false 
        });
      } else {
        console.error("Delete user error:", data);
        
        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          // Optionally redirect to login
          // router.push("/login");
        } else if (response.status === 403) {
          toast({
            title: "Permission Denied",
            description: "Only administrators can delete users.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to delete user",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Delete user exception:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resendPasswordEmail = async (userId: string, username: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/send-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Email Sent",
          description: `Password setup email sent to ${email}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "❌ Error",
          description: error.error || "Failed to send email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  // Helper to check if username is corrupted (has multiple deleted_ prefixes)
  const isCorruptedUsername = (username: string) => {
    const deleteCount = (username.match(/deleted_/g) || []).length;
    return deleteCount > 1 || username.length > 50;
  };
  
  // Helper to display username (clean up corrupted ones)
  const displayUsername = (username: string) => {
    if (isCorruptedUsername(username)) {
      // Extract the original username if possible
      const match = username.match(/deleted_\d+_(.*?)(?:_\d+)?$/);
      if (match && match[1]) {
        return (
          <span className="flex items-center gap-1">
            <span className="text-red-600">[Corrupted]</span>
            <span>{match[1]}</span>
          </span>
        );
      }
      return (
        <span className="text-red-600" title={username}>
          [Corrupted User]
        </span>
      );
    }
    return username;
  };
  
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage system users and their roles
              </p>
            </div>
            <Dialog 
              open={dialogOpen} 
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setEditingUser(null);
                  setFormData({ username: "", email: "", password: "", role: "AREA_OFFICE", sendInvite: false });
                  setFormErrors({});
                  setIsCreatingUser(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingUser(null);
                  setFormData({ username: "", email: "", password: "", role: "AREA_OFFICE", sendInvite: false });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Update user information" : "Create a new system user"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* General Error Alert */}
                    {formErrors.general && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{formErrors.general}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="username" className={formErrors.username ? "text-destructive" : ""}>Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value });
                          if (formErrors.username) {
                            setFormErrors({ ...formErrors, username: undefined });
                          }
                        }}
                        required
                        disabled={editingUser || isCreatingUser}
                        className={formErrors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {formErrors.username && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {formErrors.username}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className={formErrors.email ? "text-destructive" : ""}>Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (formErrors.email) {
                            setFormErrors({ ...formErrors, email: undefined });
                          }
                        }}
                        disabled={isCreatingUser}
                        className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                    {!editingUser && (
                      <div className="space-y-4">
                        <Tabs defaultValue="manual" onValueChange={(value) => setFormData({ ...formData, sendInvite: value === "invite" })}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">
                              <Key className="mr-2 h-4 w-4" />
                              Set Password
                            </TabsTrigger>
                            <TabsTrigger value="invite">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Invite
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="manual" className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required={!formData.sendInvite}
                              disabled={isCreatingUser}
                            />
                            <p className="text-xs text-muted-foreground">
                              User can login immediately with this password
                            </p>
                          </TabsContent>
                          
                          <TabsContent value="invite" className="space-y-2">
                            <Alert>
                              <Mail className="h-4 w-4" />
                              <AlertDescription>
                                An email will be sent to the user with a link to set their password.
                                Make sure the email address is correct.
                              </AlertDescription>
                            </Alert>
                            {!formData.email && (
                              <p className="text-sm text-destructive">
                                Email is required for sending invitations
                              </p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        disabled={isCreatingUser}
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="AREA_OFFICE">Area Office</option>
                        <option value="PROJECT_OFFICE">Project Office</option>
                        <option value="CISF">CISF (Security)</option>
                        <option value="ROAD_SALE">Road Sale</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingUser(null);
                        setFormData({ username: "", email: "", password: "", role: "AREA_OFFICE", sendInvite: false });
                        setFormErrors({});
                      }}
                      disabled={isCreatingUser}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingUser}>
                      {isCreatingUser ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingUser ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          {editingUser ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Update User
                            </>
                          ) : (
                            <>
                              <User className="mr-2 h-4 w-4" />
                              Create User
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>All system users</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{displayUsername(user.username)}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isPasswordSet ? "outline" : "destructive"}>
                            {user.isPasswordSet ? "Set" : "Not Set"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!user.isPasswordSet && user.email && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resendPasswordEmail(user.id, user.username, user.email)}
                                title="Resend password setup email"
                              >
                                <Mail className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUser(user);
                                setFormData({
                                  username: user.username,
                                  email: user.email || "",
                                  password: "",
                                  role: user.role,
                                  sendInvite: false,
                                });
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4 text-red-600" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const corrupted = isCorruptedUsername(user.username);
                                  setDeleteDialog({
                                    open: true,
                                    userId: user.id,
                                    username: user.username,
                                    hasData: false,
                                    isCorrupted: corrupted,
                                    forceDelete: corrupted, // Auto-enable force delete for corrupted records
                                  });
                                }}
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-lg border p-4 space-y-3"
                  >
                    {/* Header with Username and Status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-base">{displayUsername(user.username)}</p>
                        <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
                      </div>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role:</span>
                        <Badge variant="outline">
                          {user.role.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Password:</span>
                        <Badge variant={user.isPasswordSet ? "outline" : "destructive"}>
                          {user.isPasswordSet ? "Set" : "Not Set"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-3 border-t">
                      {!user.isPasswordSet && user.email && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => resendPasswordEmail(user.id, user.username, user.email)}
                          className="w-full"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Password Setup Email
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({
                              username: user.username,
                              email: user.email || "",
                              password: "",
                              role: user.role,
                              sendInvite: false,
                            });
                            setDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-2">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className="flex-1"
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 text-red-600" />
                              <span className="ml-2">Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="ml-2">Activate</span>
                            </>
                          )}
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const corrupted = isCorruptedUsername(user.username);
                              setDeleteDialog({
                                open: true,
                                userId: user.id,
                                username: user.username,
                                hasData: false,
                                isCorrupted: corrupted,
                                forceDelete: corrupted, // Auto-enable force delete for corrupted records
                              });
                            }}
                            className="px-3"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !isDeleting && setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete User Account
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {deleteDialog.isCorrupted ? (
                    <>
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                          🔴 Corrupted User Record Detected
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          This user record appears to be corrupted with multiple deletion attempts.
                          Username: <code className="text-xs bg-red-200 dark:bg-red-800 px-1 rounded break-all">{deleteDialog.username}</code>
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          ✅ <strong>Recommended:</strong> This record will be permanently deleted to clean up the database.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Are you sure you want to delete the user <strong>{deleteDialog.username}</strong>?
                      </p>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          ⚠️ This action is irreversible
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-5">
                          <li className="list-disc">If the user has created delivery orders or reported issues, they will be deactivated instead</li>
                          <li className="list-disc">If the user has no associated data, they will be permanently deleted</li>
                          <li className="list-disc">The username will become available for future use</li>
                        </ul>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Alternative:</strong> Consider deactivating the user instead if you might need to restore access later.
                        </p>
                      </div>
                      
                      {/* Force Delete Option */}
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                          id="forceDelete"
                          checked={deleteDialog.forceDelete}
                          onCheckedChange={(checked) => setDeleteDialog({ ...deleteDialog, forceDelete: checked === true })}
                        />
                        <label htmlFor="forceDelete" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          Force permanent deletion (even if user has associated data)
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}