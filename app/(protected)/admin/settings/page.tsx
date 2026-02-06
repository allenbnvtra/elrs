"use client";

import React, { useState } from "react";
import { 
  Settings, User, Bell, Shield, Database, Palette,
  Lock, Mail, Globe, Clock, Save, RotateCcw,
  Eye, EyeOff, Check, AlertCircle, Info,
  Moon, Sun, Monitor, Upload, Download,
  Trash2, Key, Smartphone, Zap, HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "system", label: "System", icon: Settings },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "backup", label: "Backup", icon: Database },
  ];

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mt-0.5 xs:mt-1">
            Configure Your Admin Panel
          </p>
        </div>
      </div>

      {/* SETTINGS CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-4 xs:gap-5 sm:gap-6">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-2 xs:p-3">
            <nav className="space-y-1 xs:space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-[#7d1a1a] text-white shadow-lg shadow-[#7d1a1a]/20"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} className="xs:w-[18px] xs:h-[18px] flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* QUICK INFO CARD */}
          <div className="hidden lg:block mt-4 xs:mt-5 sm:mt-6 bg-blue-50 rounded-xl xs:rounded-2xl border border-blue-200 p-4 xs:p-5">
            <div className="flex items-start gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Info size={16} className="xs:w-5 xs:h-5" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-xs xs:text-sm mb-1">Pro Tip</h4>
                <p className="text-[10px] xs:text-xs text-gray-600 leading-relaxed">
                  Enable two-factor authentication to enhance your account security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1">
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm">
            
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Profile Information</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Update your account profile and email address</p>
                </div>

                {/* Profile Picture */}
                <div>
                  <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2 xs:mb-3">Profile Picture</label>
                  <div className="flex items-center gap-3 xs:gap-4">
                    <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-xl xs:text-2xl shadow-lg flex-shrink-0">
                      AD
                    </div>
                    <div className="flex-1">
                      <button className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs transition-all active:scale-95">
                        <Upload size={14} className="inline mr-1.5 xs:mr-2 xs:w-4 xs:h-4" />
                        Change Photo
                      </button>
                      <p className="text-[9px] xs:text-[10px] text-gray-500 mt-1.5 xs:mt-2">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Administrator"
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Username</label>
                    <input 
                      type="text" 
                      defaultValue="admin"
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="admin@bsau.edu.ph"
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Bio</label>
                    <textarea 
                      rows={3}
                      defaultValue="System Administrator for BSAU ELRS"
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95">
                    <Save size={14} className="inline mr-1.5 xs:mr-2 xs:w-4 xs:h-4" />
                    Save Changes
                  </button>
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-gray-100 text-gray-700 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm hover:bg-gray-200 transition-all active:scale-95">
                    <RotateCcw size={14} className="inline mr-1.5 xs:mr-2 xs:w-4 xs:h-4" />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Security Settings</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage your password and security preferences</p>
                </div>

                {/* Change Password */}
                <div className="space-y-4 xs:space-y-5">
                  <h3 className="text-sm xs:text-base font-black text-gray-900">Change Password</h3>
                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} className="xs:w-[18px] xs:h-[18px]" /> : <Eye size={16} className="xs:w-[18px] xs:h-[18px]" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5">
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password"
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                      <input 
                        type="password"
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <div className="flex items-start justify-between gap-3 xs:gap-4 mb-3 xs:mb-4">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Smartphone size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Two-Factor Authentication</h3>
                        <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={`relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                        twoFactorAuth ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform ${
                          twoFactorAuth ? "translate-x-6 xs:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  {twoFactorAuth && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg xs:rounded-xl p-3 xs:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] xs:text-xs font-bold text-emerald-800 flex items-center gap-1.5 xs:gap-2">
                        <Check size={14} className="xs:w-4 xs:h-4" />
                        Two-factor authentication is enabled
                      </p>
                    </div>
                  )}
                </div>

                {/* Sessions */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Active Sessions</h3>
                  <div className="space-y-2 xs:space-y-3">
                    {[
                      { device: "Chrome on Windows", location: "Manila, Philippines", time: "Active now" },
                      { device: "Safari on iPhone", location: "Quezon City, Philippines", time: "2 hours ago" },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 xs:p-4 bg-gray-50 rounded-lg xs:rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                          <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-lg xs:rounded-xl flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <Monitor size={14} className="text-gray-600 xs:w-4 xs:h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs xs:text-sm font-bold text-gray-900 truncate">{session.device}</p>
                            <p className="text-[9px] xs:text-[10px] text-gray-500 truncate">{session.location} • {session.time}</p>
                          </div>
                        </div>
                        <button className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                          <Trash2 size={14} className="xs:w-4 xs:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Notification Preferences</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage how you receive notifications</p>
                </div>

                {/* Notification Items */}
                <div className="space-y-4 xs:space-y-5">
                  <div className="flex items-start justify-between gap-3 xs:gap-4 pb-4 xs:pb-5 border-b border-gray-100">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Mail size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Email Notifications</h3>
                        <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">Receive updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                        emailNotifications ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform ${
                          emailNotifications ? "translate-x-6 xs:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3 xs:gap-4 pb-4 xs:pb-5 border-b border-gray-100">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-purple-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
                        <Bell size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Push Notifications</h3>
                        <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">Receive browser push notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                        pushNotifications ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform ${
                          pushNotifications ? "translate-x-6 xs:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Notification Events */}
                  <div className="pt-2">
                    <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Event Notifications</h3>
                    <div className="space-y-2 xs:space-y-3">
                      {[
                        { label: "New student registrations", enabled: true },
                        { label: "Question submissions", enabled: true },
                        { label: "System updates", enabled: false },
                        { label: "Security alerts", enabled: true },
                      ].map((item, i) => (
                        <label key={i} className="flex items-center justify-between p-3 xs:p-4 bg-gray-50 rounded-lg xs:rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
                          <span className="text-xs xs:text-sm font-bold text-gray-700">{item.label}</span>
                          <input 
                            type="checkbox" 
                            defaultChecked={item.enabled}
                            className="w-4 h-4 xs:w-5 xs:h-5 text-[#7d1a1a] bg-gray-100 border-gray-300 rounded focus:ring-[#7d1a1a] focus:ring-2 flex-shrink-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === "system" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">System Configuration</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage system-wide settings and preferences</p>
                </div>

                {/* System Settings */}
                <div className="space-y-4 xs:space-y-5">
                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">System Language</label>
                    <select className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all cursor-pointer">
                      <option>English (US)</option>
                      <option>Filipino</option>
                      <option>Spanish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Timezone</label>
                    <select className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all cursor-pointer">
                      <option>(GMT+8:00) Manila</option>
                      <option>(GMT+0:00) UTC</option>
                      <option>(GMT-5:00) New York</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Date Format</label>
                    <select className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all cursor-pointer">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Items Per Page</label>
                    <select className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all cursor-pointer">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                      <option>100</option>
                    </select>
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg xs:rounded-xl p-4 xs:p-5">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 xs:w-5 xs:h-5" />
                      <div>
                        <h3 className="text-sm xs:text-base font-black text-amber-900 mb-1">Maintenance Mode</h3>
                        <p className="text-[10px] xs:text-xs text-amber-700 leading-relaxed mb-3">
                          Enable maintenance mode to perform system updates. Users will be temporarily unable to access the system.
                        </p>
                        <button className="px-3 xs:px-4 py-2 xs:py-2.5 bg-amber-600 text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-amber-700 transition-all active:scale-95">
                          Enable Maintenance Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Appearance</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Customize the look and feel of your admin panel</p>
                </div>

                {/* Theme Selection */}
                <div>
                  <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Theme Mode</h3>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ].map((theme) => {
                      const ThemeIcon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          className={`p-4 xs:p-5 border-2 rounded-lg xs:rounded-xl transition-all ${
                            theme.id === "light"
                              ? "border-[#7d1a1a] bg-[#7d1a1a]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <ThemeIcon size={24} className="mx-auto mb-2 xs:mb-3 text-gray-700 xs:w-7 xs:h-7" />
                          <p className="text-xs xs:text-sm font-bold text-gray-900">{theme.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Accent Color</h3>
                  <div className="flex flex-wrap gap-2 xs:gap-3">
                    {["#7d1a1a", "#1e40af", "#059669", "#d97706", "#7c3aed", "#dc2626"].map((color) => (
                      <button
                        key={color}
                        className={`w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl border-2 transition-all ${
                          color === "#7d1a1a" ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Compact Mode */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <div className="flex items-start justify-between gap-3 xs:gap-4">
                    <div>
                      <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Compact Mode</h3>
                      <p className="text-[10px] xs:text-xs text-gray-500">Reduce spacing and padding for a more dense layout</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full bg-gray-200 transition-colors flex-shrink-0"
                    >
                      <span className="inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95">
                    Apply Changes
                  </button>
                </div>
              </div>
            )}

            {/* BACKUP TAB */}
            {activeTab === "backup" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Backup & Restore</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage your system backups and data recovery</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <button className="p-4 xs:p-5 bg-blue-50 border border-blue-200 rounded-lg xs:rounded-xl text-left hover:bg-blue-100 transition-all active:scale-95">
                    <Database size={24} className="text-blue-600 mb-2 xs:mb-3 xs:w-7 xs:h-7" />
                    <h3 className="text-sm xs:text-base font-black text-gray-900 mb-1">Create Backup</h3>
                    <p className="text-[10px] xs:text-xs text-gray-600">Generate a full system backup</p>
                  </button>
                  <button className="p-4 xs:p-5 bg-emerald-50 border border-emerald-200 rounded-lg xs:rounded-xl text-left hover:bg-emerald-100 transition-all active:scale-95">
                    <RotateCcw size={24} className="text-emerald-600 mb-2 xs:mb-3 xs:w-7 xs:h-7" />
                    <h3 className="text-sm xs:text-base font-black text-gray-900 mb-1">Restore Data</h3>
                    <p className="text-[10px] xs:text-xs text-gray-600">Restore from a backup file</p>
                  </button>
                </div>

                {/* Recent Backups */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Recent Backups</h3>
                  <div className="space-y-2 xs:space-y-3">
                    {[
                      { name: "Full_Backup_2026-02-06.zip", size: "24.5 MB", date: "Feb 6, 2026" },
                      { name: "Full_Backup_2026-02-01.zip", size: "23.8 MB", date: "Feb 1, 2026" },
                      { name: "Full_Backup_2026-01-25.zip", size: "22.9 MB", date: "Jan 25, 2026" },
                    ].map((backup, i) => (
                      <div key={i} className="flex items-center justify-between p-3 xs:p-4 bg-gray-50 rounded-lg xs:rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                          <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-lg xs:rounded-xl flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <Database size={14} className="text-gray-600 xs:w-4 xs:h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs xs:text-sm font-bold text-gray-900 truncate">{backup.name}</p>
                            <p className="text-[9px] xs:text-[10px] text-gray-500">{backup.size} • {backup.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button className="p-1.5 xs:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Download size={14} className="xs:w-4 xs:h-4" />
                          </button>
                          <button className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} className="xs:w-4 xs:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto Backup Settings */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <div className="flex items-start justify-between gap-3 xs:gap-4 mb-3 xs:mb-4">
                    <div>
                      <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Automatic Backups</h3>
                      <p className="text-[10px] xs:text-xs text-gray-500">Schedule regular automated backups</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full bg-emerald-600 transition-colors flex-shrink-0">
                      <span className="inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform translate-x-6 xs:translate-x-6" />
                    </button>
                  </div>
                  <select className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all cursor-pointer">
                    <option>Daily at 2:00 AM</option>
                    <option>Weekly on Sunday</option>
                    <option>Monthly on 1st</option>
                  </select>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}