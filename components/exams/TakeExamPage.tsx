"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  AlertTriangle,
  Shield,
  Eye,
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
}

export default function TakeExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const course = searchParams.get("course");
  const subject = searchParams.get("subject");
  const area = searchParams.get("area");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examSessionId, setExamSessionId] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Anti-cheating state
  const [violations, setViolations] = useState<number>(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [isTabActive, setIsTabActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const wasInactiveRef = useRef(false);

  // Start exam
  useEffect(() => {
    if (!user || !course || !subject) return;
    startExam();
    requestFullscreen();
  }, [user, course, subject, area]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Anti-cheating: Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
        wasInactiveRef.current = true;
      } else {
        setIsTabActive(true);
        if (wasInactiveRef.current && violations < 3) {
          logViolation("tab_switch");
          wasInactiveRef.current = false;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [violations]);

  // Anti-cheating: Fullscreen exit detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && violations < 3) {
        logViolation("exit_fullscreen");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [violations]);

  // Anti-cheating: Right-click prevention
  useEffect(() => {
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      showWarning("Right-click is disabled during the exam");
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (
        e.key === "F12" || // Dev tools
        (e.ctrlKey && e.shiftKey && e.key === "I") || // Dev tools
        (e.ctrlKey && e.shiftKey && e.key === "J") || // Console
        (e.ctrlKey && e.key === "u") || // View source
        (e.ctrlKey && e.shiftKey && e.key === "C") || // Inspect element
        (e.metaKey && e.altKey && e.key === "i") || // Mac dev tools
        (e.metaKey && e.altKey && e.key === "j") // Mac console
      ) {
        e.preventDefault();
        if (violations < 3) {
          logViolation("dev_tools_attempt");
        }
      }

      // Prevent copy (but allow paste for answers)
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        showWarning("Copying is disabled during the exam");
      }
    };

    document.addEventListener("contextmenu", preventRightClick);
    document.addEventListener("keydown", preventKeyboardShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventRightClick);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, [violations]);

  // Anti-cheating: Blur detection (leaving window)
  useEffect(() => {
    const handleBlur = () => {
      if (violations < 3) {
        logViolation("window_blur");
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [violations]);

  const requestFullscreen = () => {
    if (pageRef.current && !document.fullscreenElement) {
      pageRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    }
  };

  const showWarning = (message: string) => {
    setViolationMessage(message);
    setShowViolationWarning(true);
    setTimeout(() => setShowViolationWarning(false), 3000);
  };

  const logViolation = async (violationType: string) => {
    if (!examSessionId) return;

    try {
      const response = await fetch("/api/exams/log-violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examSessionId,
          userId: user?.id,
          violationType,
          timestamp: new Date(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setViolations(data.violationCount);
        setViolationMessage(data.message);
        setShowViolationWarning(true);

        setTimeout(() => setShowViolationWarning(false), 5000);

        // Auto-submit if violations reached limit
        if (data.shouldAutoSubmit) {
          setTimeout(() => {
            handleSubmit(true); // Force submit
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  };

  const startExam = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/exams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          subject,
          area,
          userId: user?.id,
          questionCount: 50,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQuestions(data.questions);
        setExamSessionId(data.examSessionId);
      } else {
        alert(data.error || "Failed to start exam");
        router.back();
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("Failed to start exam");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questions[currentIndex];
    setAnswers({
      ...answers,
      [currentQuestion._id]: answer,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentIndex)) {
      newFlagged.delete(currentIndex);
    } else {
      newFlagged.add(currentIndex);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = async (forceSubmit = false) => {
    if (!examSessionId) return;

    if (!forceSubmit) {
      const unansweredCount = questions.length - Object.keys(answers).length;
      if (unansweredCount > 0) {
        const confirmed = confirm(
          `You have ${unansweredCount} unanswered question(s). Submit anyway?`
        );
        if (!confirmed) return;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examSessionId,
          answers,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Exit fullscreen before navigating
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        router.push(`/student/exams/results/${examSessionId}`);
      } else {
        alert(data.error || "Failed to submit exam");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;
  const getFlaggedCount = () => flagged.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white font-bold">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-900">No questions available</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-[#7d1a1a] text-white rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion._id];
  const isFlagged = flagged.has(currentIndex);

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50 flex flex-col select-none">
      {/* VIOLATION WARNING OVERLAY */}
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Violation Warning!</p>
              <p className="text-xs mt-1">{violationMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-[#7d1a1a]/10 rounded-lg">
              <BookOpen size={18} className="text-[#7d1a1a]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {subject}
              </h1>
              {area && <p className="text-xs text-gray-500 truncate">{area}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* VIOLATION INDICATOR */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              violations === 0 ? "bg-emerald-100" :
              violations === 1 ? "bg-yellow-100" :
              violations === 2 ? "bg-orange-100" :
              "bg-red-100"
            }`}>
              <Shield size={16} className={
                violations === 0 ? "text-emerald-600" :
                violations === 1 ? "text-yellow-600" :
                violations === 2 ? "text-orange-600" :
                "text-red-600"
              } />
              <span className={`text-xs font-bold ${
                violations === 0 ? "text-emerald-900" :
                violations === 1 ? "text-yellow-900" :
                violations === 2 ? "text-orange-900" :
                "text-red-900"
              }`}>
                {violations}/3 Violations
              </span>
            </div>

            {/* TIMER */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Clock size={16} className="text-gray-600" />
              <span className="text-sm font-bold text-gray-900">
                {formatTime(timeElapsed)}
              </span>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ANTI-CHEATING STATUS BAR */}
      {!isTabActive && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold">
          ⚠️ RETURN TO THE EXAM TAB IMMEDIATELY - Violations are being logged
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* QUESTION PANEL */}
          <div className="lg:col-span-3 space-y-4">
            {/* ANTI-CHEATING NOTICE */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Eye size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    Anti-Cheating System Active
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>• Switching tabs or windows will be logged as a violation</li>
                    <li>• Exiting fullscreen will be logged as a violation</li>
                    <li>• After 3 violations, your exam will auto-submit</li>
                    <li>• Stay focused on this exam window only</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* QUESTION CARD */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        currentQuestion.difficulty === "Easy"
                          ? "bg-green-100 text-green-700"
                          : currentQuestion.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>

                <button
                  onClick={toggleFlag}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    isFlagged
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={isFlagged ? "Unflag question" : "Flag for review"}
                >
                  <Flag size={18} fill={isFlagged ? "currentColor" : "none"} />
                </button>
              </div>

              {/* OPTIONS */}
              <div className="space-y-3 mt-6">
                {["A", "B", "C", "D"].map((option) => {
                  const optionText = currentQuestion[`option${option}` as keyof Question];
                  if (!optionText) return null;

                  const isSelected = currentAnswer === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-[#7d1a1a] bg-[#7d1a1a]/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                            isSelected
                              ? "border-[#7d1a1a] bg-[#7d1a1a] text-white"
                              : "border-gray-300 text-gray-600"
                          }`}
                        >
                          <span className="text-sm font-bold">{option}</span>
                        </div>
                        <p className="flex-1 text-sm sm:text-base text-gray-900 font-medium">
                          {optionText as string}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold text-sm hover:bg-[#5a1313] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* SIDEBAR - QUESTION NAVIGATOR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sticky top-24">
              <h3 className="text-sm font-black text-gray-900 mb-4">
                Question Overview
              </h3>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((_, index) => {
                  const isAnswered = answers[questions[index]._id];
                  const isFlaggedQ = flagged.has(index);
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[#7d1a1a] text-white ring-2 ring-[#7d1a1a] ring-offset-2"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-700"
                          : isFlaggedQ
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span className="text-gray-600">Answered</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {getAnsweredCount()}/{questions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-amber-600" />
                    <span className="text-gray-600">Flagged</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {getFlaggedCount()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setShowSubmitConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-black text-gray-900 mb-4">
                Submit Exam?
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Questions</span>
                  <span className="text-sm font-bold text-gray-900">
                    {questions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-700">Answered</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {getAnsweredCount()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-red-700">Unanswered</span>
                  <span className="text-sm font-bold text-red-900">
                    {questions.length - getAnsweredCount()}
                  </span>
                </div>
                {violations > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700">Violations</span>
                    <span className="text-sm font-bold text-orange-900">
                      {violations}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Once submitted, you cannot change your answers. Are you sure you
                want to continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}