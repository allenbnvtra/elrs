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
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const primaryGradient = {
    background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Roles are managed at the backend; simply post credentials here
    console.log("Authenticating...", { email, password });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      {/* LEFT SIDE: HERO SECTION */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[60%] p-12 flex-col justify-between relative overflow-hidden text-white"
        style={primaryGradient}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Image
                src="/basc_logo.png"
                alt="Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">BSAU ELRS</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              BSAU Engineering Licensure <br /> Review System.
            </h1>
            <p className="text-[#f8f9fa]/80 text-lg mb-10">
              Stay on top of your exam prep with your personal dashboard—review
              helpful study resources, take practice tests, and watch video
              lessons that break down tough topics.
            </p>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                {
                  icon: <FileText size={20} />,
                  text: "Custom Exams & Reviewers",
                },
                { icon: <Video size={20} />, text: "Video Learning Sources" },
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

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#f8f9fa]">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <div className="flex w-full justify-center bg-white/20 p-2 rounded-lg backdrop-blur-sm mb-3">
              <Image
                src="/engr.png"
                alt="Logo"
                width={80}
                height={80}
                className="object-contain"
              />
              <Image
                src="/sl.png"
                alt="Logo"
                width={80}
                height={80}
                className="object-contain"
              />
              <Image
                src="/syslogo.png"
                alt="Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">
              Welcome Back
            </h2>
            <p className="text-[#6c757d]">
              Please enter your credentials to access the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#1a1a1a]">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. example@email.com"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-4 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-semibold text-[#1a1a1a]">
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-[#a02323] hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#dee2e6] rounded-xl py-4 pl-12 pr-12 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#1a1a1a]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)]"
              style={primaryGradient}
            >
              <span>Sign In</span>
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#dee2e6] text-center">
            <p className="text-[#6c757d] text-sm">
              New faculty or student? <br />
              <Link href='/signup' className="text-[#1a1a1a] font-semibold cursor-pointer hover:text-[#7d1a1a]">
                Request access from the Registrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
