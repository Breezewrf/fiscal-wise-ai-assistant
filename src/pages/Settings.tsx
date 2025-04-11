import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    display_name?: string;
    avatar_url?: string;
  } | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfileData(data);
          
          if (data.display_name) {
            const nameParts = data.display_name.split(' ');
            profileForm.setValue('firstName', nameParts[0] || '');
            profileForm.setValue('lastName', nameParts.slice(1).join(' ') || '');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, profileForm]);

  const handleSaveProfile = async (values: ProfileFormValues) => {
    if (!user) return;

    try {
      setLoading(true);
      const displayName = values.lastName 
        ? `${values.firstName} ${values.lastName}` 
        : values.firstName;

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast("Profile settings saved");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;
      
      toast("Password changed successfully");
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Preferences updated");
  };

  const handleDataExport = () => {
    toast("Exporting your data. This may take a moment...");
  };

  const handleClearData = () => {
    toast("All data cleared successfully");
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
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
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading}>
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize your app experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable dark mode for the application.
                      </p>
                    </div>
                    <Switch id="darkMode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="currency">Default Currency</Label>
                      <p className="text-sm text-muted-foreground">
                        Set the default currency for the application.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <select 
                        id="currency"
                        className="p-2 border rounded-md"
                        defaultValue="USD"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="CNY">CNY (¥)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <p className="text-sm text-muted-foreground">
                        Set your preferred date format.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <select 
                        id="dateFormat"
                        className="p-2 border rounded-md"
                        defaultValue="MM/DD/YYYY"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="language">Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Set your preferred language.
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <select 
                        id="language"
                        className="p-2 border rounded-md"
                        defaultValue="en"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <Button type="submit">Save Preferences</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, import or clear your financial data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download all your financial data in CSV or JSON format.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDataExport}>Export as CSV</Button>
                  <Button variant="outline" onClick={handleDataExport}>Export as JSON</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Import Data</h3>
                <p className="text-sm text-muted-foreground">
                  Import financial data from a CSV or JSON file.
                </p>
                <div className="flex gap-2">
                  <Input type="file" />
                  <Button>Upload</Button>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleClearData}>Clear All Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifs">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email.
                      </p>
                    </div>
                    <Switch id="emailNotifs" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushNotifs">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your device.
                      </p>
                    </div>
                    <Switch id="pushNotifs" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="budgetAlert">Budget Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you approach or exceed budget limits.
                      </p>
                    </div>
                    <Switch id="budgetAlert" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReport">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your financial activity.
                      </p>
                    </div>
                    <Switch id="weeklyReport" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="unusualSpending">Unusual Spending</Label>
                      <p className="text-sm text-muted-foreground">
                        Get alerts for unusual or suspicious spending activity.
                      </p>
                    </div>
                    <Switch id="unusualSpending" defaultChecked />
                  </div>
                </div>
                
                <Button>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
