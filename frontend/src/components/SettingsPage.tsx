import React, { useState } from 'react';
import Navigation from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Settings, User, Bell, Shield, Globe, Save, UserPlus, Users, Edit, Trash2 } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Corporate Services Ltd',
    title: 'Company Secretary'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    deadlineReminders: true,
    weeklyDigest: true,
    collaborationUpdates: true,
    regulatoryNews: false
  });

  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    language: 'English'
  });

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    phone: ''
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const existingUsers = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      department: 'Management',
      phone: '+1 (555) 123-4567',
      status: 'Active',
      lastLogin: '2025-07-23'
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      role: 'Company Secretary',
      department: 'Legal',
      phone: '+1 (555) 234-5678',
      status: 'Active',
      lastLogin: '2025-07-22'
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      role: 'Compliance Officer',
      department: 'Compliance',
      phone: '+1 (555) 345-6789',
      status: 'Inactive',
      lastLogin: '2025-07-15'
    }
  ];

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNewUserChange = (field: string, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleAddUser = () => {
    // Logic to add new user
    console.log('Adding new user:', newUser);
    // Reset form
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      department: '',
      phone: ''
    });
  };

  const handleManageUser = (user: any) => {
    setSelectedUser(user);
    setShowManageDialog(true);
  };

  return (
    <div className="min-h-screen">
      <Navigation currentPage="settings" onNavigate={onNavigate} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                      <AvatarFallback className="text-lg">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline">Change Photo</Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={(e) => handleProfileChange('company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={profile.title}
                        onChange={(e) => handleProfileChange('title', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">SMS Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive urgent notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Deadline Reminders</h4>
                        <p className="text-sm text-muted-foreground">
                          Get reminded about upcoming compliance deadlines
                        </p>
                      </div>
                      <Switch
                        checked={notifications.deadlineReminders}
                        onCheckedChange={(checked) => handleNotificationChange('deadlineReminders', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Weekly Digest</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive a weekly summary of your compliance activities
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyDigest}
                        onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Collaboration Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when colleagues share documents or request reviews
                        </p>
                      </div>
                      <Switch
                        checked={notifications.collaborationUpdates}
                        onCheckedChange={(checked) => handleNotificationChange('collaborationUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Regulatory News</h4>
                        <p className="text-sm text-muted-foreground">
                          Stay updated with the latest regulatory changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.regulatoryNews}
                        onCheckedChange={(checked) => handleNotificationChange('regulatoryNews', checked)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Enable 2FA</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">Set Up 2FA</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">
                            Chrome on Mac • Last active now
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Sign Out</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Application Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="GMT">GMT (London)</SelectItem>
                          <SelectItem value="EST">EST (New York)</SelectItem>
                          <SelectItem value="PST">PST (Los Angeles)</SelectItem>
                          <SelectItem value="CET">CET (Paris)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={preferences.dateFormat} onValueChange={(value) => handlePreferenceChange('dateFormat', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Add New User
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newFirstName">First Name</Label>
                        <Input
                          id="newFirstName"
                          value={newUser.firstName}
                          onChange={(e) => handleNewUserChange('firstName', e.target.value)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newLastName">Last Name</Label>
                        <Input
                          id="newLastName"
                          value={newUser.lastName}
                          onChange={(e) => handleNewUserChange('lastName', e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newEmail">Email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => handleNewUserChange('email', e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPhone">Phone</Label>
                        <Input
                          id="newPhone"
                          value={newUser.phone}
                          onChange={(e) => handleNewUserChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newRole">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => handleNewUserChange('role', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="company_secretary">Company Secretary</SelectItem>
                            <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                            <SelectItem value="legal_counsel">Legal Counsel</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newDepartment">Department</Label>
                        <Select value={newUser.department} onValueChange={(value) => handleNewUserChange('department', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="corporate_governance">Corporate Governance</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button onClick={handleAddUser}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Existing Users</h3>
                    <div className="space-y-3">
                      {existingUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                              <p className="text-xs text-muted-foreground">Status: {user.status} • Last login: {user.lastLogin}</p>
                            </div>
                          </div>
                          <Dialog open={showManageDialog && selectedUser?.id === user.id} onOpenChange={setShowManageDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleManageUser(user)}
                              >
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Manage User - {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input defaultValue={selectedUser?.firstName} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input defaultValue={selectedUser?.lastName} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input defaultValue={selectedUser?.email} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input defaultValue={selectedUser?.phone} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select defaultValue={selectedUser?.role?.toLowerCase().replace(' ', '_')}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="company_secretary">Company Secretary</SelectItem>
                                        <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                                        <SelectItem value="legal_counsel">Legal Counsel</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select defaultValue={selectedUser?.department?.toLowerCase()}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="legal">Legal</SelectItem>
                                        <SelectItem value="compliance">Compliance</SelectItem>
                                        <SelectItem value="management">Management</SelectItem>
                                        <SelectItem value="corporate_governance">Corporate Governance</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="operations">Operations</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h4 className="font-medium">Account Status</h4>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <Switch defaultChecked={selectedUser?.status === 'Active'} />
                                      <Label>Active Account</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-medium">Permissions</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Switch defaultChecked />
                                      <Label>View Companies</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch defaultChecked={selectedUser?.role === 'Admin'} />
                                      <Label>Edit Companies</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch defaultChecked={selectedUser?.role === 'Admin'} />
                                      <Label>User Management</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch defaultChecked />
                                      <Label>Collaboration Features</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                  <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </Button>
                                  <div className="space-x-2">
                                    <Button variant="outline" onClick={() => setShowManageDialog(false)}>
                                      Cancel
                                    </Button>
                                    <Button>
                                      <Save className="mr-2 h-4 w-4" />
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}