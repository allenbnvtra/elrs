"use client";

import React, { useState, Suspense } from "react";
import {
  Lock, Eye, EyeOff, ArrowRight, CheckCircle,
  AlertCircle, Loader2, ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const primaryGradient = { background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)" };

// ── Inner component: uses useSearchParams — must be inside Suspense ──────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");
  const [done, setDone]                 = useState(false);

  const passwordsMatch = password === confirm;
  const strongEnough   = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) return setError("Passwords do not match.");
    if (!strongEnough)   return setError("Password must be at least 8 characters.");

    setError("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Missing / invalid token ──
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="p-5 rounded-full bg-red-50 border border-red-200">
              <ShieldAlert size={48} className="text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Invalid Link</h2>
          <p className="text-[#6c757d] text-sm">
            This password reset link is missing or malformed. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
            style={primaryGradient}
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">

      {/* LEFT HERO */}
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
              Create a new <br /> password.
            </h1>
            <p className="text-[#f8f9fa]/80 text-lg">
              Choose a strong password that you haven't used before.
              Your account security is important to us.
            </p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-white/60">
          © 2026 Academia Educational System. All rights reserved.
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#f8f9fa]">
        <div className="w-full max-w-md">

          <div className="flex justify-center md:justify-start gap-4 mb-8">
            <Image src="/engr.png" alt="Logo" width={60} height={60} className="object-contain opacity-80" />
            <Image src="/syslogo.png" alt="Logo" width={50} height={50} className="object-contain" />
          </div>

          {done ? (
            /* ── Success state ── */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-5 rounded-full bg-green-50 border border-green-200">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Password Updated!</h2>
                <p className="text-[#6c757d] text-sm">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold"
                style={primaryGradient}
              >
                <ArrowRight size={18} /> Go to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">New Password</h2>
                <p className="text-[#6c757d]">Must be at least 8 characters.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a1a1a]">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full bg-white border border-[#dee2e6] rounded-xl py-4 pl-12 pr-12 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#1a1a1a]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= lvl * 3
                              ? lvl <= 1 ? "bg-red-400"
                              : lvl <= 2 ? "bg-yellow-400"
                              : lvl <= 3 ? "bg-blue-400"
                              : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a1a1a]">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d] group-focus-within:text-[#7d1a1a] transition-colors" size={20} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className={`w-full bg-white border rounded-xl py-4 pl-12 pr-12 text-[#1a1a1a] focus:outline-none focus:ring-2 transition-all shadow-sm disabled:opacity-50 ${
                        confirm && !passwordsMatch
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[#dee2e6] focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#1a1a1a]"
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirm && !passwordsMatch && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !passwordsMatch || !strongEnough}
                  className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={primaryGradient}
                >
                  {isLoading ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Updating...</span></>
                  ) : (
                    <><span>Reset Password</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export: wraps inner component in Suspense ───────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
          <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}