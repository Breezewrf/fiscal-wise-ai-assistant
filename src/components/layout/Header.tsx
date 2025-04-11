
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, Bell, MessageCircle, User } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { toast } from "sonner";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(3);
  const [messageCount, setMessageCount] = useState(2);
  
  const handleNotificationClick = () => {
    toast.info("Notifications viewed");
    setNotificationCount(0);
  };
  
  const handleMessageClick = () => {
    toast.info("Messages viewed");
    setMessageCount(0);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container flex h-16 items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 md:hidden" 
          onClick={onToggleSidebar}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Notifications</h4>
                <div className="text-sm">
                  <div className="border-b pb-2 mb-2">
                    <p className="font-medium">Your monthly report is ready</p>
                    <p className="text-muted-foreground text-xs">View your April financial summary</p>
                  </div>
                  <div className="border-b pb-2 mb-2">
                    <p className="font-medium">Budget alert</p>
                    <p className="text-muted-foreground text-xs">You've reached 80% of your Food & Dining budget</p>
                  </div>
                  <div>
                    <p className="font-medium">New feature available</p>
                    <p className="text-muted-foreground text-xs">Try our new expense prediction tool</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleMessageClick}>
                <MessageCircle className="h-5 w-5" />
                {messageCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {messageCount}
                  </span>
                )}
                <span className="sr-only">Messages</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Messages</h4>
                <div className="text-sm">
                  <div className="border-b pb-2 mb-2">
                    <p className="font-medium">System</p>
                    <p className="text-muted-foreground text-xs">Welcome to the finance tracker! Need help getting started?</p>
                  </div>
                  <div>
                    <p className="font-medium">Support</p>
                    <p className="text-muted-foreground text-xs">Have questions about your account? We're here to help.</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="font-medium">My Account</p>
                  <p className="text-muted-foreground text-xs">Manage your account settings</p>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Button variant="ghost" className="w-full justify-start px-2 h-8">Profile</Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start px-2 h-8">Settings</Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start px-2 h-8">Help & Support</Button>
                  </li>
                  <li className="border-t pt-1 mt-1">
                    <Button variant="ghost" className="w-full justify-start px-2 h-8 text-destructive">
                      Sign out
                    </Button>
                  </li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
