"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, User, Bell, Shield, Database, Palette,
  Lock, Mail, Globe, Clock, Save, RotateCcw,
  Eye, EyeOff, Check, AlertCircle, Info,
  Moon, Sun, Monitor, Upload, Download,
  Trash2, Key, Smartphone, Zap, HelpCircle,
  GraduationCap, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    bio: ""
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Loading and error states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        bio: (user as any).bio || ""
      });
    }
  }, [user]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setIsLoadingProfile(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...profileForm
        })
      });

      const data = await response.json();
      console.log(data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setIsLoadingPassword(true);

    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...passwordForm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // Reset profile form
  const handleProfileReset = () => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        bio: (user as any).bio || ""
      });
      setProfileError("");
      setProfileSuccess("");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <GraduationCap className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Configure Your Admin Panel
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            System Settings
          </h1>
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
                    className={`w-full flex items-center cursor-pointer gap-2 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm transition-all ${
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
              <form onSubmit={handleProfileUpdate} className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Profile Information</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Update your account profile and email address</p>
                </div>

                {/* Success/Error Messages */}
                {profileSuccess && (
                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Check size={16} className="shrink-0" />
                    <p className="text-sm font-semibold">{profileSuccess}</p>
                  </div>
                )}
                {profileError && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-sm font-semibold">{profileError}</p>
                  </div>
                )}

                {/* Profile Picture */}
                <div>
                  <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2 xs:mb-3">Profile Picture</label>
                  <div className="flex items-center gap-3 xs:gap-4">
                    <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-xl xs:text-2xl shadow-lg flex-shrink-0">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1">
                      <button 
                        type="button"
                        className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs transition-all active:scale-95"
                      >
                        <Upload size={14} className="inline mr-1.5 xs:mr-2 xs:w-4 xs:h-4" />
                        Change Photo
                      </button>
                      <p className="text-[9px] xs:text-[10px] text-gray-500 mt-1.5 xs:mt-2">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                    />
                  </div>
                  {(user?.role === "admin" || user?.role === "faculty") && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Bio</label>
                      <textarea 
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="submit"
                    disabled={isLoadingProfile}
                    className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoadingProfile ? (
                      <>
                        <Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} className="xs:w-4 xs:h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={handleProfileReset}
                    disabled={isLoadingProfile}
                    className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-gray-100 text-gray-700 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} className="xs:w-4 xs:h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </form>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Security Settings</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage your password and security preferences</p>
                </div>

                {/* Success/Error Messages */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Check size={16} className="shrink-0" />
                    <p className="text-sm font-semibold">{passwordSuccess}</p>
                  </div>
                )}
                {passwordError && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-sm font-semibold">{passwordError}</p>
                  </div>
                )}

                {/* Change Password */}
                <form onSubmit={handlePasswordUpdate} className="space-y-4 xs:space-y-5">
                  <h3 className="text-sm xs:text-base font-black text-gray-900">Change Password</h3>
                  <div>
                    <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                      />
                      <button
                        type="button"
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
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility"
                        >
                          {showNewPassword ? <EyeOff size={16} className="xs:w-[18px] xs:h-[18px]" /> : <Eye size={16} className="xs:w-[18px] xs:h-[18px]" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={16} className="xs:w-[18px] xs:h-[18px]" /> : <Eye size={16} className="xs:w-[18px] xs:h-[18px]" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4">
                    <button 
                      type="submit"
                      disabled={isLoadingPassword}
                      className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoadingPassword ? (
                        <>
                          <Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Key size={14} className="xs:w-4 xs:h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

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
                      type="button"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}