import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Sliders,
  CheckSquare,
  Bell,
  History,
  Settings,
  ChevronDown,
  UserCheck,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewRiskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewRiskModal }) => {
  const { user, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await api.getNotifications({ status: 'SENT' });
        setRecentNotifs(notifs.slice(0, 5));
      } catch (err) {
        // silent
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'risks', label: 'Risk Register', icon: FileSpreadsheet },
    { id: 'controls', label: 'Control Library', icon: Sliders },
    { id: 'actions', label: 'Action Plans', icon: CheckSquare },
    { id: 'notifications', label: 'Alerts & Reminders', icon: Bell },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'system', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#1A1A1A] text-white border-b border-[#333333] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-[#E6E6E1] hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <span className="text-xl font-serif italic tracking-tight text-[#E6E6E1]">RCSA.</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#888883] ml-2 font-mono">Enterprise</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
            className="p-1.5 text-white/70 hover:text-white relative"
          >
            <Bell className="h-4 w-4" />
            {recentNotifs.length > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#FF6321]"></span>
            )}
          </button>

          {/* New Risk CTA Button */}
          <button
            onClick={onOpenNewRiskModal}
            className="bg-[#FF6321] text-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest hover:bg-[#E5591D]"
          >
            + New
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-13 z-50 bg-[#1A1A1A] text-white flex flex-col p-6 space-y-4">
          <nav className="flex-1 space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xs flex items-center gap-3 text-xs uppercase tracking-widest font-semibold transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#FF6321]' : 'bg-transparent'}`}></div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Active User</p>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-[11px] text-white/60">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Editorial Aesthetic) */}
      <aside className="w-64 bg-[#1A1A1A] text-white hidden md:flex flex-col shrink-0 border-r border-[#262626] h-screen sticky top-0 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-serif italic tracking-tight text-[#E6E6E1]">RCSA.</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#888883] mt-2 font-mono">
            Enterprise Risk Mgmt
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 mt-4">
          <ul className="space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-4 py-3 rounded-xs flex items-center gap-3 text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer text-left ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                        isActive ? 'bg-[#FF6321]' : 'bg-transparent'
                      }`}
                    ></div>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Notifications Dropdown Trigger */}
        <div className="px-6 py-2">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xs text-[11px] text-[#E6E6E1] font-mono transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-[#FF6321]" />
              <span className="uppercase tracking-wider">Alerts</span>
            </div>
            {recentNotifs.length > 0 && (
              <span className="bg-[#FF6321] text-white text-[9px] px-1.5 py-0.2 font-bold">
                {recentNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="mt-2 bg-[#262626] border border-white/10 text-[#E6E6E1] p-3 text-xs space-y-2 shadow-2xl">
              <div className="flex justify-between items-center text-[10px] text-[#888883] uppercase tracking-wider border-b border-white/10 pb-1">
                <span>Recent System Alerts</span>
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-[#FF6321] hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentNotifs.length === 0 ? (
                  <p className="text-[11px] text-white/50">No recent alerts</p>
                ) : (
                  recentNotifs.map(n => (
                    <div key={n.id} className="text-[11px] border-b border-white/5 pb-1">
                      <div className="font-semibold text-white truncate">{n.subject}</div>
                      <div className="text-[10px] text-[#888883] truncate">{n.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active User Card & Persona Switcher */}
        <div className="p-6 border-t border-white/10 relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Active User</p>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-[10px] text-[#FF6321] hover:underline font-mono uppercase tracking-wider cursor-pointer"
            >
              Switch Role
            </button>
          </div>
          <p className="text-sm font-medium text-white truncate">{user?.name || 'Loading...'}</p>
          <p className="text-[11px] text-white/60 mt-0.5">{user?.role?.replace('_', ' ')}</p>
          <p className="text-[10px] text-[#888883] truncate mt-0.5">{user?.unit?.name || 'Headquarters'}</p>

          {/* User Persona Switcher Popup */}
          {showUserMenu && (
            <div className="absolute bottom-20 left-4 right-4 bg-[#262626] border border-white/15 text-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#888883] border-b border-white/10 pb-1.5 mb-2">
                Simulate Enterprise Role
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {DEMO_PERSONAS.map(p => (
                  <button
                    key={p.email}
                    onClick={async () => {
                      await switchUser(p.email);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs transition-colors flex flex-col cursor-pointer ${
                      user?.email === p.email ? 'bg-[#FF6321] text-white font-semibold' : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
