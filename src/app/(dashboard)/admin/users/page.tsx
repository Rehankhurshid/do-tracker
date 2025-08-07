"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, UserCheck, UserX, Search, Mail, Key, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        toast({
          title: "Success",
          description: editingUser ? "User updated successfully" : "User created successfully",
        });
        setDialogOpen(false);
        setEditingUser(null);
        setFormData({ username: "", email: "", password: "", role: "AREA_OFFICE", sendInvite: false });
        fetchUserAndData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={editingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
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
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="AREA_OFFICE">Area Office</option>
                        <option value="PROJECT_OFFICE">Project Office</option>
                        <option value="ROAD_SALE">Road Sale</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingUser ? "Update" : "Create"}
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
                        <TableCell className="font-medium">{user.username}</TableCell>
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
                        <p className="font-semibold text-base">{user.username}</p>
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
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
}