"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/authContext"; // adjust if your hook differs

const primaryGradient = { background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)" };

// ─── Role → base path mapping ───────────────────────────────────────────────
const ROLE_BASE: Record<string, string> = {
  admin:   "/admin/dashboard",
  faculty: "/faculty/dashboard",
  student: "/student/dashboard",   // keep existing student path
};

const ROLE_LINKS: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Student Info",       href: "/admin/student-info" },
    { label: "Results",     href: "/admin/results" },
    { label: "Settings",    href: "/admin/settings" },
    { label: "Sign In",     href: "/login" },
  ],
  faculty: [
    { label: "Student Info",  href: "/faculty/student-info" },
    { label: "My Profile",  href: "/faculty/settings" },
    { label: "Sign In",     href: "/login" },
  ],
  student: [
    { label: "Review Materials", href: "/student/review-materials" },
    { label: "My Profile",       href: "/student/settings" },
    { label: "Sign In",          href: "/login" },
  ],
};

export default function NotFound() {
  const { user } = useAuth(); // { role: "admin" | "faculty" | "student" | undefined }

  const role = (user?.role ?? "student").toLowerCase();
  const base = ROLE_BASE[role] ?? "/dashboard";
  const links = ROLE_LINKS[role] ?? ROLE_LINKS.student;

  const dashboardHref = `${base}`;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">

      {/* LEFT HERO */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[60%] p-12 flex-col justify-between relative overflow-hidden text-white"
        style={primaryGradient}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Giant 404 watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[22rem] font-black text-white/5 leading-none tracking-tighter">
            404
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Image src="/basc_logo.png" alt="Logo" width={60} height={60} className="object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">BSAU ELRS</span>
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 border border-white/20">
              <GraduationCap size={16} />
              Page Not Found
            </div>
            <h1 className="text-6xl font-extrabold leading-tight mb-6">
              Looks like you've <br /> gone off course.
            </h1>
            <p className="text-[#f8f9fa]/75 text-lg leading-relaxed">
              The page you're looking for doesn't exist or may have been moved.
              Let's get you back on track with your review.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © 2026 Academia Educational System. All rights reserved.
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#f8f9fa]">
        <div className="w-full max-w-md">

          {/* Logo row */}
          <div className="flex justify-center md:justify-start gap-4 mb-10">
            <Image src="/engr.png"    alt="Logo" width={60} height={60} className="object-contain opacity-80" />
            <Image src="/syslogo.png" alt="Logo" width={50} height={50} className="object-contain" />
          </div>

          {/* 404 badge (mobile only) */}
          <div className="md:hidden text-center mb-6">
            <span
              className="text-8xl font-black"
              style={{ WebkitTextStroke: "3px #7d1a1a", color: "transparent" }}
            >
              404
            </span>
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">Page Not Found</h2>
            <p className="text-[#6c757d] leading-relaxed">
              We couldn't find the page you were looking for. It may have been
              deleted, renamed, or never existed in the first place.
            </p>
          </div>

          {/* Divider with error code */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#dee2e6]" />
            <span className="text-xs font-bold text-[#adb5bd] uppercase tracking-widest">Error 404</span>
            <div className="flex-1 h-px bg-[#dee2e6]" />
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href={dashboardHref}
              className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)]"
              style={primaryGradient}
            >
              <Home size={18} />
              <span>Go to Dashboard</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base border-2 border-[#dee2e6] text-[#495057] hover:border-[#7d1a1a] hover:text-[#7d1a1a] transition-all active:scale-[0.98] bg-white"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>

          {/* Helpful links */}
          <div className="mt-10 pt-8 border-t border-[#dee2e6]">
            <p className="text-xs font-bold text-[#adb5bd] uppercase tracking-widest mb-4 text-center md:text-left">
              Quick Links
            </p>
            <div className="grid grid-cols-2 gap-2">
              {links.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:border-[#7d1a1a] hover:text-[#7d1a1a] transition-all group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7d1a1a] opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}