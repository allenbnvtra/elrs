"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen, Trophy, TrendingUp, ArrowUpRight,
  PlayCircle, LayoutDashboard, Clock, Target,
  CheckCircle, BarChart3, Brain, FileText,
  ChevronRight, AlertTriangle, Loader2, Award,
  History, Settings
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

interface RecentExam {
  _id: string;
  examSessionId: string;
  subject: string;
  area?: string;
  score: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  timeTaken: number;
  wasFlagged?: boolean;
}

interface Statistics {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalQuestions: number;
  totalCorrect: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loadingStats, setLoadingStats] = useState(true);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const userCourse = (user as any).course || "";
      const res = await fetch(
        `/api/exams/history?userId=${user?.id}&course=${userCourse}&limit=5`
      );
      const data = await res.json();
      if (res.ok) {
        setRecentExams(data.results || []);
        setStatistics(data.statistics || null);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (pct: number) =>
    pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-red-600";

  const getScoreBadge = (pct: number) =>
    pct >= 80
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 60
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  const getPerformanceLabel = (avg: number) => {
    if (avg >= 85) return { label: "Excellent", color: "text-emerald-600" };
    if (avg >= 70) return { label: "Good", color: "text-blue-600" };
    if (avg >= 55) return { label: "Needs Improvement", color: "text-amber-600" };
    return { label: "Needs Attention", color: "text-red-600" };
  };

  const perf = statistics ? getPerformanceLabel(statistics.averageScore) : null;

  return (
    <div className="space-y-6 xs:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div className="min-w-0 flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-[#7d1a1a] flex-shrink-0" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
              My Learning Hub • {(user as any)?.course || "Student"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
            Welcome Back, {user?.name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {perf
              ? <span>Performance: <span className={`font-bold ${perf.color}`}>{perf.label}</span></span>
              : "Here's a summary of your activity"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push("/student/exams/history")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all text-xs sm:text-sm shadow-sm"
          >
            <History size={16} className="flex-shrink-0" />
            <span>History</span>
          </button>
          <button
            onClick={() => router.push("/student/exams")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#7d1a1a] text-white font-bold rounded-lg sm:rounded-xl hover:bg-[#5a1313] transition-all active:scale-95 text-xs sm:text-sm shadow-lg shadow-[#7d1a1a]/20"
          >
            <Brain size={16} className="flex-shrink-0" />
            <span>Take Exam</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 xs:p-5 rounded-2xl border border-gray-200 shadow-sm animate-pulse h-28" />
          ))
        ) : (
          <>
            {[
              {
                label: "Total Exams",
                value: statistics?.totalExams ?? 0,
                icon: Trophy,
                color: "text-blue-600",
                bg: "bg-blue-50",
                sub: "attempts",
              },
              {
                label: "Average Score",
                value: statistics ? `${Math.round(statistics.averageScore)}%` : "—",
                icon: Target,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                sub: "overall",
              },
              {
                label: "Best Score",
                value: statistics ? `${statistics.highestScore}%` : "—",
                icon: Award,
                color: "text-amber-600",
                bg: "bg-amber-50",
                sub: "highest",
              },
              {
                label: "Accuracy Rate",
                value: statistics && statistics.totalQuestions > 0
                  ? `${Math.round((statistics.totalCorrect / statistics.totalQuestions) * 100)}%`
                  : "—",
                icon: CheckCircle,
                color: "text-purple-600",
                bg: "bg-purple-50",
                sub: `${statistics?.totalCorrect ?? 0}/${statistics?.totalQuestions ?? 0} correct`,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-4 xs:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 xs:p-2.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon size={18} />
                  </div>
                  {statistics && statistics.totalExams > 0 && (
                    <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px] xs:text-xs bg-emerald-50 px-1.5 xs:px-2 py-0.5 rounded-md">
                      <ArrowUpRight size={12} />
                    </div>
                  )}
                </div>
                <h3 className="text-xl xs:text-2xl font-black text-gray-900 tracking-tight">
                  {item.value}
                </h3>
                <p className="text-[10px] xs:text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-[9px] xs:text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── MAIN 2-COL AREA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6">

        {/* RECENT EXAMS */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 xs:px-6 py-4 xs:py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#7d1a1a]" />
              <h3 className="text-sm xs:text-base font-black text-gray-900">Recent Exam Results</h3>
            </div>
            <button
              onClick={() => router.push("/student/exams/history")}
              className="text-[#7d1a1a] font-bold text-xs hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#7d1a1a]" size={28} />
            </div>
          ) : recentExams.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentExams.map((exam) => (
                <button
                  key={exam._id}
                  onClick={() => router.push(`/student/exams/results/${exam.examSessionId}`)}
                  className="w-full px-5 xs:px-6 py-3 xs:py-4 hover:bg-gray-50 transition-all text-left flex items-center gap-4"
                >
                  {/* Score badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getScoreBadge(exam.percentage).replace("text-", "").replace("emerald-700", "").replace("blue-700","").replace("red-700","")} bg-opacity-20`}>
                    <span className={`text-sm font-black ${getScoreColor(exam.percentage)}`}>
                      {exam.percentage}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{exam.subject}</p>
                      {exam.wasFlagged && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold flex-shrink-0">
                          <AlertTriangle size={10} />
                          Flagged
                        </span>
                      )}
                    </div>
                    {exam.area && <p className="text-[10px] text-gray-400 truncate">{exam.area}</p>}
                    <div className="flex items-center gap-3 mt-1 text-[10px] xs:text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} />
                        {exam.correctCount}/{exam.totalQuestions} correct
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {exam.timeTaken} min
                      </span>
                      <span>{formatDate(exam.completedAt)}</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="bg-gray-50 p-5 rounded-full mb-3">
                <Trophy size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">No exams taken yet</p>
              <p className="text-xs text-gray-400 mb-4">Start practicing to see your results here</p>
              <button
                onClick={() => router.push("/student/exams")}
                className="px-5 py-2 bg-[#7d1a1a] text-white rounded-xl font-bold text-xs hover:bg-[#5a1313] transition-all"
              >
                Take Your First Exam
              </button>
            </div>
          )}
        </div>

        {/* SIDE COLUMN */}
        <div className="space-y-4 xs:space-y-5">

          {/* QUICK ACTIONS */}
          <div className="bg-[#1A1A1A] rounded-2xl p-5 xs:p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <Brain size={90} />
            </div>
            <h4 className="text-base font-black mb-1 relative z-10">Ready to Practice?</h4>
            <p className="text-white/60 text-xs mb-5 font-medium leading-relaxed relative z-10">
              Select a subject and start a mock exam to sharpen your skills.
            </p>
            <button
              onClick={() => router.push("/student/exams")}
              className="w-full py-2.5 bg-[#7d1a1a] rounded-xl font-bold text-xs hover:bg-[#a02323] transition-all active:scale-95 relative z-10"
            >
              Start Exam
            </button>
          </div>

          {/* REVIEW MATERIALS SHORTCUT */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 xs:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-[#7d1a1a]" />
              <h4 className="text-sm font-black text-gray-900">Review Materials</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Access PDF documents and video lectures uploaded for your course.
            </p>
            <button
              onClick={() => router.push("/student/review-materials")}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs border border-gray-200 transition-all"
            >
              <BookOpen size={14} />
              Browse Materials
            </button>
          </div>

          {/* PERFORMANCE SUMMARY */}
          {statistics && statistics.totalExams > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 xs:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[#7d1a1a]" />
                <h4 className="text-sm font-black text-gray-900">Performance Summary</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Average Score", value: `${Math.round(statistics.averageScore)}%`, color: "bg-emerald-500", pct: statistics.averageScore },
                  { label: "Highest Score", value: `${statistics.highestScore}%`, color: "bg-blue-500", pct: statistics.highestScore },
                  { label: "Accuracy Rate", value: `${Math.round((statistics.totalCorrect / statistics.totalQuestions) * 100)}%`, color: "bg-purple-500", pct: (statistics.totalCorrect / statistics.totalQuestions) * 100 },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] xs:text-xs font-bold text-gray-500">{row.label}</span>
                      <span className="text-xs font-black text-gray-900">{row.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-700`}
                        style={{ width: `${Math.min(row.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/student/exams/history")}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-[#7d1a1a] bg-[#7d1a1a]/5 hover:bg-[#7d1a1a]/10 rounded-xl font-bold text-xs transition-all"
              >
                <History size={14} />
                Full History
              </button>
            </div>
          )}

          {/* SETTINGS SHORTCUT */}
          <button
            onClick={() => router.push("/student/settings")}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-[#7d1a1a]/20 hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-[#7d1a1a]/10 transition-colors">
                <Settings size={14} className="text-gray-500 group-hover:text-[#7d1a1a] transition-colors" />
              </div>
              <span className="text-xs font-bold text-gray-700">Account Settings</span>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}