"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  Video,
  User,
  IdCard,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Briefcase,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserType = "student" | "faculty" | "admin";
type CourseType = "BSGE" | "BSABEN";

const SignUpPage: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userType, setUserType] = useState<UserType>("student");
  
  const [formData, setFormData] = useState({
    fullName: "",
    studentNumber: "",
    email: "",
    password: "",
    course: "" as CourseType | "",
  });

  const primaryGradient = {
    background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        userType: userType,
        ...(userType === "student" && { studentNumber: formData.studentNumber }),
        ...((userType === "student" || userType === "faculty") && { course: formData.course }),
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Success
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      {/* LEFT SIDE: HERO SECTION */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[60%] p-12 flex-col justify-between relative overflow-hidden text-white"
        style={primaryGradient}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Image src="/basc_logo.png" alt="Logo" width={60} height={60} className="object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">BSAU ELRS</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Join the Engineering <br /> Review Community.
            </h1>
            <p className="text-[#f8f9fa]/80 text-lg mb-10">
              Create your account to start your journey. Access comprehensive reviewers, 
              mock exams, and high-quality video tutorials designed for BSAU engineers.
            </p>

            <div className="space-y-6">
              {[
                { icon: <FileText size={20} />, text: "Personalized Study Progress" },
                { icon: <Video size={20} />, text: "On-demand Video Lectures" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © 2026 Academia Educational System. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: SIGNUP FORM */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16 bg-[#f8f9fa]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:text-left">
            <div className="flex w-full justify-center md:justify-start gap-4 bg-white/20 rounded-lg mb-4">
              <Image src="/engr.png" alt="Logo" width={60} height={60} className="object-contain opacity-80" />
              <Image src="/syslogo.png" alt="Logo" width={50} height={50} className="object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Create Account</h2>
            <p className="text-[#6c757d]">Sign up to start your licensure preparation.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-green-800">
                Account created successfully! Redirecting to login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Account Type</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors z-10" size={18} />
                <select
                  value={userType}
                  onChange={(e) => {
                    setUserType(e.target.value as UserType);
                    // Reset course when changing user type
                    setFormData({...formData, course: ""});
                  }}
                  disabled={isLoading}
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236c757d' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Course Selection - Only for students and faculty */}
            {(userType === "student" || userType === "faculty") && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Course/Program</label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors z-10" size={18} />
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value as CourseType})}
                    disabled={isLoading}
                    required
                    className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236c757d' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="">Select Course</option>
                    <option value="BSGE">BS in Geodetic Engineering (BSGE)</option>
                    <option value="BSABEN">BS in Agricultural & Biosystems Engineering (BSABEN)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="John D. Doe"
                  value={formData.fullName}
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Student Number Input - Only shown for students */}
            {userType === "student" && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Student Number</label>
                <div className="relative group">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                  <input 
                    type="text"
                    required
                    placeholder="2026-XXXX-X"
                    value={formData.studentNumber}
                    className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-[#6c757d] mt-1 px-1">
                  Format: 2026-XXXX-X
                </p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Create Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={formData.password}
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-12 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#1a1a1a] disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-[#6c757d] mt-1 px-1">
                Must be at least 8 characters long
              </p>
            </div>

            <p className="text-[11px] text-[#6c757d] px-1">
              By signing up, you agree to our <span className="text-[#7d1a1a] underline cursor-pointer">Terms of Service</span> and <span className="text-[#7d1a1a] underline cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              style={primaryGradient}
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#dee2e6] text-center">
            <p className="text-[#6c757d] text-sm">
              Already have an account? <br />
              <Link href='/' className="text-[#1a1a1a] font-semibold cursor-pointer hover:text-[#7d1a1a]">
                Sign In instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;