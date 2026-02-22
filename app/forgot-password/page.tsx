"use client";

import React, { useState } from "react";
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const primaryGradient = { background: "linear-gradient(135deg, #7d1a1a 0%, #5a1313 100%)" };

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState("");
  const [sent, setSent]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

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
              Forgot your <br /> password?
            </h1>
            <p className="text-[#f8f9fa]/80 text-lg">
              No worries — enter your registered email address and we'll send
              you a secure link to reset your password.
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

          {/* Logo row (mobile) */}
          <div className="flex justify-center md:justify-start gap-4 mb-8">
            <Image src="/engr.png" alt="Logo" width={60} height={60} className="object-contain opacity-80" />
            <Image src="/syslogo.png" alt="Logo" width={50} height={50} className="object-contain" />
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-5 rounded-full bg-green-50 border border-green-200">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Check your inbox</h2>
                <p className="text-[#6c757d] text-sm leading-relaxed">
                  We sent a password reset link to <br />
                  <span className="font-semibold text-[#1a1a1a]">{email}</span>.<br />
                  The link expires in <strong>1 hour</strong>.
                </p>
              </div>
              <p className="text-xs text-[#6c757d]">
                Didn't receive it?{" "}
                <button
                  onClick={() => { setSent(false); setError(""); }}
                  className="text-[#a02323] font-semibold hover:underline"
                >
                  Try again
                </button>
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#7d1a1a]"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Reset Password</h2>
                <p className="text-[#6c757d]">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a1a1a]">Email Address</label>
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
                      disabled={isLoading}
                      className="w-full bg-white border border-[#dee2e6] rounded-xl py-4 pl-12 pr-4 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full group flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(125,26,26,0.2)] hover:shadow-[0_8px_24px_rgba(125,26,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={primaryGradient}
                >
                  {isLoading ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Sending...</span></>
                  ) : (
                    <><span>Send Reset Link</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#dee2e6] text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#7d1a1a]"
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}