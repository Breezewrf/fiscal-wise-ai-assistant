
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  MessageCircle, 
  Settings,
  Upload,
  VolumeX,
  Bell,
  Database
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

const NavItem = ({ to, icon, label, isActive, onClick, disabled }: NavItemProps) => {
  if (disabled) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground opacity-60 cursor-not-allowed"
        )}
        title={`${label} - Coming soon`}
        onClick={() => toast.info(`${label} feature coming soon!`)}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    );
  }

  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-secondary/20 text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

interface SidebarProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, onCloseSidebar }: SidebarProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      onCloseSidebar();
    }
  };

  const handleDisabledClick = (feature: string) => {
    toast.info(`${feature} feature coming soon!`);
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transition-transform duration-300 ease-in-out",
        isMobile && !isSidebarOpen && "-translate-x-full",
        isMobile && isSidebarOpen && "translate-x-0"
      )}
    >
      <div className="flex flex-col h-full py-6">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-primary">FiscalWise</h1>
          <p className="text-sm text-muted-foreground">AI-Powered Finance</p>
        </div>
        
        <div className="flex-1 px-3 space-y-1">
          <NavItem 
            to="/" 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            onClick={handleNavClick}
          />
          <NavItem 
            to="/transactions" 
            icon={<PlusCircle size={20} />} 
            label="Transactions" 
            onClick={handleNavClick}
          />
          <NavItem 
            to="/import" 
            icon={<Upload size={20} />} 
            label="Import Data" 
            onClick={handleNavClick}
          />
          <NavItem 
            to="/reports" 
            icon={<BarChart3 size={20} />} 
            label="Reports" 
            onClick={handleNavClick}
          />
          <NavItem 
            to="/assistant" 
            icon={<MessageCircle size={20} />} 
            label="AI Assistant" 
            onClick={handleNavClick}
          />
        </div>
        
        <div className="px-3 pt-6 mt-auto border-t">
          <div className="px-3 py-2">
            <h3 className="text-sm font-medium text-muted-foreground">Settings & Tools</h3>
          </div>
          <div className="space-y-1">
            <NavItem 
              to="#" 
              icon={<Database size={20} />} 
              label="Database" 
              disabled={true}
            />
            <NavItem 
              to="#" 
              icon={<Bell size={20} />} 
              label="Notifications" 
              disabled={true}
            />
            <NavItem 
              to="#" 
              icon={<VolumeX size={20} />} 
              label="Voice" 
              disabled={true}
            />
            <NavItem 
              to="/settings" 
              icon={<Settings size={20} />} 
              label="Settings" 
              onClick={handleNavClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
