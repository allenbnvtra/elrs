"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  User,
  IdCard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SignUpPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    email: "",
    password: "",
  });

  const primaryGradient = {
    background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for registration - Backend handles whether this is a student or faculty based on ID/Email
    console.log("Registering...", formData);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      {/* LEFT SIDE: HERO SECTION (Same as Login) */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="John D. Doe"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            {/* ID Number Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Student / Faculty ID</label>
              <div className="relative group">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="2026-XXXX-X"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="example@email.com"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-3.5 pl-12 pr-12 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#1a1a1a]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#6c757d] px-1">
              By signing up, you agree to our <span className="text-[#7d1a1a] underline cursor-pointer">Terms of Service</span> and <span className="text-[#7d1a1a] underline cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)] mt-4"
              style={primaryGradient}
            >
              <span>Create Account</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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