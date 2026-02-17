"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  BookOpen,
  Loader2,
  ChevronRight,
  Target,
  Award,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

interface ExamHistoryItem {
  _id: string;
  examSessionId: string;
  course: string;
  area?: string;
  subject: string;
  score: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string;
  timeTaken: number;
  wasFlagged?: boolean;
  violationCount?: number;
}

interface Statistics {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalQuestions: number;
  totalCorrect: number;
}

export default function ExamHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  console.log(exams)

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userCourse = (user?.role === "student" || user?.role === "faculty") 
        ? (user as any).course 
        : undefined;
        
      const courseParam = userCourse ? `&course=${userCourse}` : "";
      const response = await fetch(
        `/api/exams/history?userId=${user?.id}${courseParam}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setExams(data.results);
        setStatistics(data.statistics);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error("Failed to fetch history:", data.error);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-blue-600";
    return "text-red-600";
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100";
    if (percentage >= 60) return "bg-blue-100";
    return "bg-red-100";
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="text-[#7d1a1a] flex-shrink-0" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                Your Performance • {(user.role === "student" || user.role === "faculty") ? (user as any).course : "All"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Exam History
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Track your progress and review past exams
            </p>
          </div>

          <button
            onClick={() => router.push("/student/exams")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold hover:bg-[#5a1313] transition-all"
          >
            <BookOpen size={16} />
            Take New Exam
          </button>
        </div>

        {/* STATISTICS */}
        {statistics && statistics.totalExams > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Trophy}
              label="Total Exams"
              value={statistics.totalExams.toString()}
              sublabel={`${statistics.totalQuestions} questions`}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              icon={Target}
              label="Average Score"
              value={`${Math.round(statistics.averageScore)}%`}
              sublabel={`${statistics.totalCorrect}/${statistics.totalQuestions} correct`}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              icon={Award}
              label="Highest Score"
              value={`${statistics.highestScore}%`}
              sublabel="Best performance"
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              icon={TrendingUp}
              label="Overall Progress"
              value={`${Math.round((statistics.totalCorrect / statistics.totalQuestions) * 100)}%`}
              sublabel="Accuracy rate"
              color="text-purple-600"
              bg="bg-purple-50"
            />
          </div>
        )}

        {/* EXAM LIST */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
            </div>
          ) : exams.length > 0 ? (
            <>
              <div className="divide-y divide-gray-200">
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => router.push(`/student/exams/results/${exam.examSessionId}`)}
                    className="w-full p-4 sm:p-6 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* ICON */}
                      <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-xl ${getScoreBg(exam.percentage)} flex items-center justify-center`}>
                          <span className={`text-xl font-black ${getScoreColor(exam.percentage)}`}>
                            {exam.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {exam.subject}
                              </h3>
                              {exam.wasFlagged && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center gap-1">
                                  <AlertTriangle size={12} />
                                  Flagged
                                </span>
                              )}
                            </div>
                            {exam.area && (
                              <p className="text-sm text-gray-500 truncate">{exam.area}</p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-lg ${getScoreBg(exam.percentage)} flex-shrink-0`}>
                            <span className={`text-sm font-bold ${getScoreColor(exam.percentage)}`}>
                              {exam.correctCount}/{exam.totalQuestions}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{formatDate(exam.completedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{exam.timeTaken} minutes</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Target size={14} />
                            <span>{exam.percentage}% accuracy</span>
                          </div>
                        </div>
                      </div>

                      {/* ARROW */}
                      <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                    </div>
                  </button>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
                <Trophy size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-4">No exams taken yet</p>
              <button
                onClick={() => router.push("/student/exams")}
                className="px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold hover:bg-[#5a1313] transition-all"
              >
                Take Your First Exam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// STAT CARD
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: string;
  sublabel: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{sublabel}</p>
    </div>
  );
}