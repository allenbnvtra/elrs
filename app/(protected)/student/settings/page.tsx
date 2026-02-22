"use client";

import React, { useState, useEffect } from "react";
import {
  User, Shield, Bell,
  Lock, Save, RotateCcw,
  Eye, EyeOff, Check, AlertCircle,
  Upload, Key, Smartphone, Monitor,
  Trash2, GraduationCap, Loader2, Info,
  BookOpen, Hash, Calendar, Mail
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

export default function StudentSettingsPage() {
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
    studentNumber: "",
    course: "",
    yearLevel: "",
    section: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Loading & message states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        studentNumber: (user as any).studentNumber || "",
        course: (user as any).course || "",
        yearLevel: (user as any).yearLevel || "",
        section: (user as any).section || "",
      });
    }
  }, [user]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setIsLoadingProfile(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...profileForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setIsLoadingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...passwordForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleProfileReset = () => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        studentNumber: (user as any).studentNumber || "",
        course: (user as any).course || "",
        yearLevel: (user as any).yearLevel || "",
        section: (user as any).section || "",
      });
      setProfileError("");
      setProfileSuccess("");
    }
  };

  // Reusable alert component
  const Alert = ({ type, msg }: { type: "success" | "error"; msg: string }) => (
    <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
      type === "success"
        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
        : "bg-red-50 border border-red-200 text-red-700"
    }`}>
      {type === "success" ? <Check size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
      <p className="text-sm font-semibold">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in duration-700">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <GraduationCap className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Manage Your Account
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Account Settings
          </h1>
        </div>
      </div>

      {/* SETTINGS CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-4 xs:gap-5 sm:gap-6">

        {/* SIDEBAR */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-2 xs:p-3">
            <nav className="space-y-1 xs:space-y-1.5">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center cursor-pointer gap-2 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm transition-all ${
                    activeTab === id
                      ? "bg-[#7d1a1a] text-white shadow-lg shadow-[#7d1a1a]/20"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} className="xs:w-[18px] xs:h-[18px] flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* STUDENT INFO CARD */}
          <div className="hidden lg:block mt-5 sm:mt-6 bg-[#7d1a1a]/5 rounded-xl xs:rounded-2xl border border-[#7d1a1a]/15 p-4 xs:p-5">
            <div className="flex items-start gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-9 h-9 xs:w-10 xs:h-10 bg-[#7d1a1a] rounded-lg xs:rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <BookOpen size={16} className="xs:w-5 xs:h-5" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-xs xs:text-sm mb-1">Student Portal</h4>
                <p className="text-[10px] xs:text-xs text-gray-600 leading-relaxed">
                  Keep your profile up to date so your instructors can reach you easily.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm">

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Profile Information</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Update your personal details and student information</p>
                </div>

                {profileSuccess && <Alert type="success" msg={profileSuccess} />}
                {profileError && <Alert type="error" msg={profileError} />}

                {/* Personal Details */}
                <div>
                  <h3 className="text-xs xs:text-sm font-black text-gray-700 uppercase tracking-wider mb-3 xs:mb-4 flex items-center gap-2">
                    <User size={14} className="text-[#7d1a1a]" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                        placeholder="e.g. Juan Dela Cruz"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">
                        <Mail size={12} className="inline mr-1.5" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                        placeholder="you@school.edu.ph"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Details */}
                <div>
                  <h3 className="text-xs xs:text-sm font-black text-gray-700 uppercase tracking-wider mb-3 xs:mb-4 flex items-center gap-2">
                    <GraduationCap size={14} className="text-[#7d1a1a]" />
                    Academic Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">
                        <Hash size={12} className="inline mr-1.5" />
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={profileForm.studentNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, studentNumber: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-100 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-500 cursor-not-allowed"
                        placeholder="e.g. 2024-00001"
                        disabled
                      />
                      <p className="text-[9px] xs:text-[10px] text-gray-400 mt-1.5">Student ID cannot be changed. Contact your registrar for corrections.</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">
                        <BookOpen size={12} className="inline mr-1.5" />
                        Course / Program
                      </label>
                      <select
                        value={profileForm.course}
                        onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                      >
                        <option value="">Select course</option>
                        <option value="BSABEN">BSABEN — Agricultural & Biosystems Engineering</option>
                        <option value="BSGE">BSGE — Geodetic Engineering</option>
                      </select>
                      {profileForm.course && (
                        <p className="text-[9px] xs:text-[10px] text-gray-400 mt-1.5">
                          {profileForm.course === "BSABEN"
                            ? "Bachelor of Science in Agricultural and Biosystems Engineering"
                            : "Bachelor of Science in Geodetic Engineering"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">
                        <Calendar size={12} className="inline mr-1.5" />
                        Year Level
                      </label>
                      <select
                        value={profileForm.yearLevel}
                        onChange={(e) => setProfileForm({ ...profileForm, yearLevel: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                      >
                        <option value="">Select year level</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Section</label>
                      <input
                        type="text"
                        value={profileForm.section}
                        onChange={(e) => setProfileForm({ ...profileForm, section: e.target.value })}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all"
                        placeholder="e.g. A"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isLoadingProfile}
                    className="flex-1 xs:flex-none px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoadingProfile ? (
                      <><Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" /><span>Saving...</span></>
                    ) : (
                      <><Save size={14} className="xs:w-4 xs:h-4" /><span>Save Changes</span></>
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

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div className="p-4 xs:p-6 sm:p-8 space-y-5 xs:space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg xs:text-xl font-black text-gray-900 mb-1">Security Settings</h2>
                  <p className="text-[10px] xs:text-xs text-gray-500">Manage your password and account security</p>
                </div>

                {passwordSuccess && <Alert type="success" msg={passwordSuccess} />}
                {passwordError && <Alert type="error" msg={passwordError} />}

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
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Toggle password visibility">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                          minLength={8}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs xs:text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 focus:border-[#7d1a1a] transition-all pr-10 xs:pr-12"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility">
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg xs:rounded-xl p-3 xs:p-4">
                    <p className="text-[10px] xs:text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1.5">
                      <Info size={12} /> Password Requirements
                    </p>
                    <ul className="text-[9px] xs:text-[10px] text-blue-700 space-y-0.5 list-disc list-inside">
                      <li>Minimum 8 characters</li>
                      <li>At least one uppercase and one lowercase letter</li>
                      <li>At least one number or special character</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoadingPassword}
                      className="px-4 xs:px-6 py-2.5 xs:py-3 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingPassword ? (
                        <><Loader2 size={14} className="animate-spin" /><span>Updating...</span></>
                      ) : (
                        <><Key size={14} /><span>Update Password</span></>
                      )}
                    </button>
                  </div>
                </form>

                {/* 2FA */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <div className="flex items-start justify-between gap-3 xs:gap-4 mb-3 xs:mb-4">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Smartphone size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm xs:text-base font-black text-gray-900 mb-0.5 xs:mb-1">Two-Factor Authentication</h3>
                        <p className="text-[10px] xs:text-xs text-gray-500 leading-relaxed">Add an extra layer of security to your student account</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={`relative inline-flex h-6 w-11 xs:h-7 xs:w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                        twoFactorAuth ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 xs:h-5 xs:w-5 transform rounded-full bg-white transition-transform ${
                        twoFactorAuth ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="border-t border-gray-100 pt-5 xs:pt-6">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 mb-3 xs:mb-4">Active Sessions</h3>
                  <div className="space-y-2 xs:space-y-3">
                    {[
                      { device: "Chrome on Windows", location: "Manila, Philippines", time: "Active now" },
                      { device: "Safari on iPhone", location: "Quezon City, Philippines", time: "3 hours ago" },
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
                        {i !== 0 && (
                          <button className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                            <Trash2 size={14} className="xs:w-4 xs:h-4" />
                          </button>
                        )}
                        {i === 0 && (
                          <span className="text-[9px] xs:text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex-shrink-0">Current</span>
                        )}
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