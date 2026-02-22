"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock, ChevronLeft, ChevronRight, Flag,
  AlertCircle, Loader2, BookOpen, AlertTriangle, Shield,
  Eye, Maximize, Lock, Folder,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter, useSearchParams } from "next/navigation";

interface Question {
  _id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  difficulty: string;
  category: string;
  subject?: string;
}

const VIOLATION_DEBOUNCE_MS = 2000;

export default function TakeExamPage() {
  const { user }       = useAuth();
  const router         = useRouter();
  const searchParams   = useSearchParams();

  const course  = searchParams.get("course");
  const subject = searchParams.get("subject");   // null for BSABEN area exams
  const area    = searchParams.get("area");

  // ── Core state ─────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [examSessionId, setExamSessionId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<Record<string, string>>({});
  const [flagged, setFlagged]           = useState<Set<number>>(new Set());
  const [timeElapsed, setTimeElapsed]   = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ── Countdown timer ────────────────────────────────────────────────────────
  const [examTimer, setExamTimer]         = useState(0);   // 0 = unlimited
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerExpired, setTimerExpired]   = useState(false);
  const timerExpiredRef                   = useRef(false);

  // ── Anti-cheat ─────────────────────────────────────────────────────────────
  const [violations, setViolations]                     = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage]         = useState("");
  const [isFullscreen, setIsFullscreen]                 = useState(false);
  const [showFullscreenBlock, setShowFullscreenBlock]   = useState(false);
  const [autoSubmitting, setAutoSubmitting]             = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const pageRef              = useRef<HTMLDivElement>(null);
  const examSessionIdRef     = useRef("");
  const violationsRef        = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const warningTimerRef      = useRef<NodeJS.Timeout | null>(null);
  const answersRef           = useRef<Record<string, string>>({});

  // Keep refs in sync
  useEffect(() => { examSessionIdRef.current = examSessionId; }, [examSessionId]);
  useEffect(() => { violationsRef.current    = violations;    }, [violations]);
  useEffect(() => { answersRef.current       = answers;       }, [answers]);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = pageRef.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
  }, []);

  // ── Core submit (manual + violations + timer) ──────────────────────────────
  const forceSubmit = useCallback(async (snap?: Record<string, string>) => {
    const sessionId = examSessionIdRef.current;
    if (!sessionId) return;
    const finalAnswers = snap ?? answersRef.current;
    try {
      setSubmitting(true);
      const res  = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examSessionId: sessionId, answers: finalAnswers, userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        if (document.fullscreenElement) await document.exitFullscreen();
        router.push(`/student/exams/results/${sessionId}`);
      } else {
        alert(data.error || "Failed to submit exam");
      }
    } catch {
      alert("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Countdown effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!examTimer || questions.length === 0) return;
    const id = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (!timerExpiredRef.current) {
            timerExpiredRef.current = true;
            setTimerExpired(true);
            setAutoSubmitting(true);
            setTimeout(() => forceSubmit(answersRef.current), 3000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTimer, questions.length]);

  // ── Elapsed timer (always ticking) ────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Start exam ─────────────────────────────────────────────────────────────
  const startExam = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/exams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          area,
          ...(subject && { subject }), 
          userId: user?.id,
          questionCount: 50,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions);
        setExamSessionId(data.examSessionId);
        examSessionIdRef.current = data.examSessionId;
        if (data.timer && data.timer > 0) {
          setExamTimer(data.timer);
          setTimeRemaining(data.timer);
        }
      } else {
        alert(data.error || "Failed to start exam");
        router.back();
      }
    } catch {
      alert("Failed to start exam");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !course || (!subject && !area)) return;
    startExam();
    const t = setTimeout(enterFullscreen, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, course, subject, area]);

  // ── Violation logger ───────────────────────────────────────────────────────
  const logViolation = useCallback(async (type: string) => {
    const now = Date.now();
    if (now - lastViolationTimeRef.current < VIOLATION_DEBOUNCE_MS) return;
    if (violationsRef.current >= 3) return;
    lastViolationTimeRef.current = now;
    const sessionId = examSessionIdRef.current;
    if (!sessionId) return;
    try {
      const res  = await fetch("/api/exams/log-violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examSessionId: sessionId, userId: user?.id, violationType: type, timestamp: new Date() }),
      });
      const data = await res.json();
      if (res.ok) {
        const n: number = data.violationCount;
        setViolations(n);
        violationsRef.current = n;
        const msg = n >= 3
          ? "Maximum violations reached! Your exam will be submitted automatically."
          : `Violation #${n} recorded. ${3 - n} warning(s) remaining before auto-submit.`;
        showViolationToast(msg);
        if (data.shouldAutoSubmit) {
          setAutoSubmitting(true);
          setTimeout(() => forceSubmit(), 3000);
        }
      }
    } catch (e) { console.error("Violation log error:", e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const showViolationToast = (msg: string) => {
    setViolationMessage(msg);
    setShowViolationWarning(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => setShowViolationWarning(false), 5000);
  };

  // ── Anti-cheat event listeners ─────────────────────────────────────────────
  useEffect(() => {
    const h = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) { setShowFullscreenBlock(true); logViolation("exit_fullscreen"); }
      else      { setShowFullscreenBlock(false); }
    };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, [logViolation]);

  useEffect(() => {
    const h = () => { if (document.hidden) logViolation("tab_switch"); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [logViolation]);

  useEffect(() => {
    const h = () => logViolation("window_blur");
    window.addEventListener("blur", h);
    return () => window.removeEventListener("blur", h);
  }, [logViolation]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const bad =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u") ||
        (e.metaKey && e.altKey && ["i","j"].includes(e.key)) ||
        (e.altKey && e.key === "Tab") ||
        (e.metaKey && e.key !== "v");
      if (bad) { e.preventDefault(); logViolation("dev_tools_attempt"); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") { e.preventDefault(); showViolationToast("Copying is disabled during the exam."); }
      if (e.key === "PrintScreen") { e.preventDefault(); showViolationToast("Screenshots are disabled during the exam."); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [logViolation]);

  useEffect(() => {
    const h = (e: MouseEvent) => { e.preventDefault(); showViolationToast("Right-click is disabled during the exam."); };
    document.addEventListener("contextmenu", h);
    return () => document.removeEventListener("contextmenu", h);
  }, []);

  useEffect(() => {
    const h = (e: Event) => e.preventDefault();
    document.addEventListener("selectstart", h);
    document.addEventListener("dragstart", h);
    return () => { document.removeEventListener("selectstart", h); document.removeEventListener("dragstart", h); };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleAnswerSelect = (answer: string) =>
    setAnswers(prev => ({ ...prev, [questions[currentIndex]._id]: answer }));

  const toggleFlag = () =>
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(currentIndex) ? next.delete(currentIndex) : next.add(currentIndex);
      return next;
    });

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    await forceSubmit();
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  // Timer urgency
  const timerUrgency = (() => {
    if (!examTimer || timeRemaining <= 0) return "none";
    const pct = timeRemaining / examTimer;
    if (pct > 0.5)  return "safe";
    if (pct > 0.25) return "warning";
    return "danger";
  })();

  const timerCls: Record<string, string> = {
    none:    "bg-gray-100 text-gray-700",
    safe:    "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger:  "bg-red-100 text-red-800 animate-pulse",
  };
  const timerBarCls: Record<string, string> = {
    none: "", safe: "bg-emerald-600", warning: "bg-amber-500", danger: "bg-red-600",
  };

  const violationBg = ["bg-emerald-100","bg-yellow-100","bg-orange-100","bg-red-100"];
  const violationTx = ["text-emerald-600","text-yellow-600","text-orange-600","text-red-600"];
  const violationHd = ["text-emerald-900","text-yellow-900","text-orange-900","text-red-900"];
  const vIdx = Math.min(violations, 3);

  const examLabel = subject || area || "Exam";   // display name for BSABEN area exams

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center">
        <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
        <p className="text-white font-bold text-lg">Preparing your exam…</p>
        <p className="text-gray-400 text-sm mt-1">Please wait</p>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-lg font-bold text-gray-900">No questions available</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-[#7d1a1a] text-white rounded-lg font-bold">
          Go Back
        </button>
      </div>
    </div>
  );

  const q           = questions[currentIndex];
  const curAnswer   = answers[q._id];
  const isFlagged   = flagged.has(currentIndex);
  const answeredCnt = Object.keys(answers).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={pageRef} className="min-h-screen flex flex-col select-none bg-gray-50">

      {/* ── TIMER EXPIRED OVERLAY ─────────────────────────────────────────── */}
      {timerExpired && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="bg-red-600 p-5 rounded-full mb-6 animate-bounce">
            <Clock size={48} />
          </div>
          <h2 className="text-3xl font-black mb-3">Time's Up!</h2>
          <p className="text-white/70 text-base max-w-md mb-2">
            Your exam time has expired. Submitting your answers now…
          </p>
          <p className="text-white/50 text-sm max-w-md mb-8">
            Score will be based on{" "}
            <span className="font-bold text-white">{Object.keys(answersRef.current).length}</span>{" "}
            answered question(s) out of {questions.length} •{" "}
            <span className="font-bold text-white">{examLabel}</span>
          </p>
          <Loader2 className="animate-spin text-red-400" size={36} />
        </div>
      )}

      {/* ── FULLSCREEN BLOCK ──────────────────────────────────────────────── */}
      {showFullscreenBlock && !timerExpired && (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center text-white text-center p-6">
          <div className="bg-red-600 p-5 rounded-full mb-6">
            <Lock size={48} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Fullscreen Required</h2>
          <p className="text-white/70 text-sm sm:text-base max-w-md mb-2">
            You exited fullscreen mode. A violation has been recorded.
          </p>
          <p className="text-white/50 text-xs sm:text-sm max-w-md mb-8">
            Violations remaining:{" "}
            <span className="font-black text-red-400">{3 - violations}</span>. After 3 violations your exam will be auto-submitted.
          </p>
          <button
            onClick={enterFullscreen}
            className="flex items-center gap-3 px-8 py-4 bg-[#7d1a1a] hover:bg-[#5a1313] rounded-2xl font-black text-lg transition-all active:scale-95 shadow-2xl shadow-[#7d1a1a]/40"
          >
            <Maximize size={22} />
            Re-enter Fullscreen to Continue
          </button>
        </div>
      )}

      {/* ── AUTO-SUBMIT OVERLAY (violations) ─────────────────────────────── */}
      {autoSubmitting && !timerExpired && (
        <div className="fixed inset-0 z-[998] bg-black/90 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="bg-red-600 p-5 rounded-full mb-6 animate-pulse">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-black mb-3">Maximum Violations Reached</h2>
          <p className="text-white/70 mb-6">Your exam is being submitted automatically…</p>
          <Loader2 className="animate-spin" size={36} />
        </div>
      )}

      {/* ── VIOLATION TOAST ───────────────────────────────────────────────── */}
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 w-full max-w-sm px-4">
          <div className="bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
            <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Violation Recorded!</p>
              <p className="text-xs mt-1 text-white/80 leading-relaxed">{violationMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">

          {/* Left: exam label */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-[#7d1a1a]/10 rounded-lg flex-shrink-0">
              {subject
                ? <BookOpen size={18} className="text-[#7d1a1a]" />
                : <Folder   size={18} className="text-[#7d1a1a]" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {examLabel}
              </h1>
              {subject && area && (
                <p className="text-xs text-gray-500 truncate">{area}</p>
              )}
              {!subject && area && (
                <p className="text-xs text-gray-500">All subjects in area</p>
              )}
            </div>
          </div>

          {/* Right: indicators */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Fullscreen badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
              isFullscreen ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}>
              <Maximize size={14} />
              {isFullscreen ? "Fullscreen" : "Not Fullscreen"}
            </div>

            {/* Violations */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${violationBg[vIdx]}`}>
              <Shield size={15} className={violationTx[vIdx]} />
              <span className={`text-xs font-black ${violationHd[vIdx]}`}>{violations}/3</span>
            </div>

            {/* Timer */}
            {examTimer > 0 ? (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${timerCls[timerUrgency]}`}>
                <Clock size={15} />
                <span className="text-sm font-black tabular-nums">{formatTime(timeRemaining)}</span>
                {timerUrgency === "danger" && <AlertTriangle size={13} className="text-red-600" />}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Clock size={15} className="text-gray-600" />
                <span className="text-sm font-black text-gray-900 tabular-nums">{formatTime(timeElapsed)}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>

        {/* Low-time warning bar */}
        {examTimer > 0 && timerUrgency === "danger" && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">
                Less than {Math.ceil((examTimer * 0.25) / 60)} minutes remaining! The exam will auto-submit when time runs out.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── QUESTION PANEL ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Anti-cheat notice */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Eye size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-amber-900 mb-1">Anti-Cheating System Active</p>
                  <ul className="text-xs text-amber-800 space-y-1 leading-relaxed">
                    <li>• Exiting fullscreen is a violation</li>
                    <li>• Switching tabs or apps is a violation</li>
                    <li>• Right-click, copy, and print screen are disabled</li>
                    <li>• After <strong>3 violations</strong>, your exam auto-submits</li>
                    {examTimer > 0 && (
                      <li>• Exam will <strong>auto-submit</strong> when the countdown reaches 0:00</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                      {currentIndex + 1} / {questions.length}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      q.difficulty === "Easy"   ? "bg-green-100 text-green-700"  :
                      q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                                  "bg-red-100 text-red-700"
                    }`}>
                      {q.difficulty}
                    </span>
                    {/* Show subject badge when exam is area-wide (BSABEN) */}
                    {!subject && q.subject && (
                      <span className="px-2.5 py-1 bg-[#7d1a1a]/10 text-[#7d1a1a] rounded-lg text-xs font-bold">
                        {q.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
                    {q.questionText}
                  </p>
                </div>

                <button
                  onClick={toggleFlag}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    isFlagged ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={isFlagged ? "Unflag" : "Flag for review"}
                >
                  <Flag size={18} fill={isFlagged ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3 mt-4">
                {(["A","B","C","D"] as const).map(opt => {
                  const text = q[`option${opt}` as keyof Question] as string | undefined;
                  if (!text) return null;
                  const sel = curAnswer === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswerSelect(opt)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        sel
                          ? "border-[#7d1a1a] bg-[#7d1a1a]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-sm font-black transition-all ${
                          sel
                            ? "border-[#7d1a1a] bg-[#7d1a1a] text-white"
                            : "border-gray-300 text-gray-600"
                        }`}>
                          {opt}
                        </div>
                        <p className="flex-1 text-sm sm:text-base text-gray-900 font-medium">{text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span className="text-sm text-gray-500 font-medium">
                {answeredCnt}/{questions.length} answered
              </span>
              <button
                onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold text-sm hover:bg-[#5a1313] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sticky top-24 space-y-4">
              <h3 className="text-sm font-black text-gray-900">Question Overview</h3>

              {/* Countdown in sidebar */}
              {examTimer > 0 && (
                <div className={`rounded-xl p-3 text-center ${timerCls[timerUrgency]}`}>
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <Clock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Time Remaining</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums">{formatTime(timeRemaining)}</p>
                  <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${timerBarCls[timerUrgency]}`}
                      style={{ width: `${(timeRemaining / examTimer) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Question grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, idx) => {
                  const ans  = !!answers[questions[idx]._id];
                  const fl   = flagged.has(idx);
                  const cur  = idx === currentIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                        cur ? "bg-[#7d1a1a] text-white ring-2 ring-[#7d1a1a] ring-offset-1" :
                        ans ? "bg-emerald-100 text-emerald-700" :
                        fl  ? "bg-amber-100 text-amber-700"     :
                              "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {[
                  { color: "bg-emerald-100", label: "Answered",   count: answeredCnt },
                  { color: "bg-amber-100",   label: "Flagged",    count: flagged.size },
                  { color: "bg-gray-100",    label: "Unanswered", count: questions.length - answeredCnt },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded ${row.color}`} />
                      <span className="text-gray-600">{row.label}</span>
                    </div>
                    <span className="font-black text-gray-900">{row.count}</span>
                  </div>
                ))}
              </div>

              {/* Violations */}
              <div className={`rounded-xl p-3 ${violationBg[vIdx]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className={violationTx[vIdx]} />
                  <span className={`text-xs font-black ${violationHd[vIdx]}`}>
                    {violations === 0 ? "No Violations" : `${violations} Violation${violations > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i < violations ? "bg-red-500" : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className={`text-[10px] mt-1.5 ${violationTx[vIdx]}`}>
                  {violations === 0 ? "Stay focused!" :
                   violations >= 3  ? "Submitting…"    :
                                      `${3 - violations} remaining before auto-submit`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBMIT CONFIRM MODAL ──────────────────────────────────────────── */}
      {showSubmitConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setShowSubmitConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-black text-gray-900 mb-5">Submit Exam?</h3>

              <div className="space-y-2.5 mb-6">
                {([
                  { label: "Total Questions", value: questions.length,               bg: "bg-gray-50",    tx: "text-gray-900",    lx: "text-gray-600" },
                  { label: "Answered",        value: answeredCnt,                    bg: "bg-emerald-50", tx: "text-emerald-900", lx: "text-emerald-700" },
                  { label: "Unanswered",      value: questions.length - answeredCnt, bg: "bg-red-50",     tx: "text-red-900",     lx: "text-red-700" },
                  ...(examTimer > 0  ? [{ label: "Time Remaining", value: formatTime(timeRemaining), bg: "bg-blue-50",   tx: "text-blue-900",   lx: "text-blue-700" }] : []),
                  ...(violations > 0 ? [{ label: "Violations",     value: violations,                bg: "bg-orange-50", tx: "text-orange-900", lx: "text-orange-700" }] : []),
                ] as { label: string; value: string | number; bg: string; tx: string; lx: string }[]).map(row => (
                  <div key={row.label} className={`flex items-center justify-between p-3 ${row.bg} rounded-xl`}>
                    <span className={`text-sm ${row.lx}`}>{row.label}</span>
                    <span className={`text-sm font-black ${row.tx}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Once submitted, you cannot change your answers. Make sure you've answered as many questions as possible.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Keep Answering
                </button>
                <button
                  onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Now"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}