
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

export default function Settings() {
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Profile settings saved");
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
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Alex" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Smith" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="alex@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                
                <Button type="submit">Save Changes</Button>
              </form>
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
