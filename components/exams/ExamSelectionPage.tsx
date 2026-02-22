"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen, Folder, Play, Clock, Trophy, Target,
  TrendingUp, Loader2, BarChart3, Award, Brain,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

interface Subject {
  subject: string;
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

interface Area {
  area: string;
  subjects: Subject[];
  totalQuestions: number;
  timer?: number;           // ← area-level timer from the DB (seconds)
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
}

export default function ExamSelectionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading]       = useState(true);
  const [subjects, setSubjects]     = useState<Subject[]>([]);
  const [areas, setAreas]           = useState<Area[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [statistics, setStatistics]   = useState<any>(null);

  const isBSGE =
    (user?.role === "student" || user?.role === "faculty") &&
    (user as any).course === "BSGE";

  const userCourse =
    user?.role === "student" || user?.role === "faculty"
      ? (user as any).course
      : "BSABEN";

  useEffect(() => {
    if (!user) return;
    fetchAvailableExams();
    fetchRecentExams();
  }, [user]);

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/exams/available?course=${userCourse}&userId=${user?.id}`);
      const data = await res.json();
      if (res.ok) {
        if (data.type === "subjects") setSubjects(data.data);
        else                          setAreas(data.data);
      }
    } catch (e) {
      console.error("Error fetching exams:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExams = async () => {
    try {
      const res  = await fetch(`/api/exams/history?userId=${user?.id}&course=${userCourse}&limit=5`);
      const data = await res.json();
      if (res.ok) {
        setRecentExams(data.results);
        setStatistics(data.statistics);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  /**
   * BSGE  → subject required, area optional
   * BSABEN → area required, NO subject (all subjects in area are combined)
   */
  const handleStartExam = async (subject: string, area?: string) => {
    try {
      const params = new URLSearchParams({
        userId: user?.id || "",
        course: userCourse,
        ...(subject && { subject }),
        ...(area    && { area }),
      });

      const res  = await fetch(`/api/exams/can-take?${params}`);
      const data = await res.json();

      if (!data.canTake) {
        alert(data.message);
        return;
      }

      const examParams = new URLSearchParams({
        course: userCourse,
        ...(subject && { subject }),
        ...(area    && { area }),
      });
      router.push(`/student/exams/take?${examParams}`);
    } catch (e) {
      console.error("Error checking eligibility:", e);
      alert("Failed to start exam. Please try again.");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="text-[#7d1a1a] flex-shrink-0" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                Practice & Assessment • {userCourse}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Take an Exam
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {isBSGE ? "Choose a subject to start practicing" : "Choose an area to start your exam"}
            </p>
          </div>

          <button
            onClick={() => router.push("/student/exams/history")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <BarChart3 size={16} />
            View History
          </button>
        </div>

        {/* STATISTICS */}
        {statistics && statistics.totalExams > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Trophy}    label="Total Exams"      value={statistics.totalExams}                  color="text-blue-600"   bg="bg-blue-50" />
            <StatCard icon={Target}    label="Average Score"    value={`${Math.round(statistics.averageScore)}%`} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={Award}     label="Highest Score"    value={`${statistics.highestScore}%`}          color="text-amber-600"  bg="bg-amber-50" />
            <StatCard icon={TrendingUp} label="Total Questions" value={statistics.totalQuestions}              color="text-purple-600" bg="bg-purple-50" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAIN SELECTION */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-gray-900">
              {isBSGE ? "Select Subject" : "Select Area"}
            </h2>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
              </div>
            ) : isBSGE ? (
              // ── BSGE: subject list ──────────────────────────────────────────
              <div className="space-y-3">
                {subjects.length > 0
                  ? subjects.map(s => (
                      <SubjectCard
                        key={s.subject}
                        subject={s}
                        onStart={() => handleStartExam(s.subject)}
                      />
                    ))
                  : <EmptyState message="No subjects available yet" />}
              </div>
            ) : (
              // ── BSABEN: area list — one Start button per area ───────────────
              <div className="space-y-3">
                {areas.length > 0
                  ? areas.map(a => (
                      <AreaCard
                        key={a.area}
                        area={a}
                        onStart={() => handleStartExam("", a.area)}
                      />
                    ))
                  : <EmptyState message="No areas available yet" />}
              </div>
            )}
          </div>

          {/* RECENT EXAMS SIDEBAR */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">Recent Exams</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              {recentExams.length > 0 ? (
                recentExams.map(exam => (
                  <div
                    key={exam._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#7d1a1a]/20 transition-all cursor-pointer"
                    onClick={() => router.push(`/student/exams/results/${exam.examSessionId}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {exam.subject || exam.area}
                        </p>
                        {exam.area && exam.subject && (
                          <p className="text-xs text-gray-500">{exam.area}</p>
                        )}
                      </div>
                      <div className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        exam.percentage >= 80 ? "bg-emerald-100 text-emerald-700" :
                        exam.percentage >= 60 ? "bg-blue-100 text-blue-700"       :
                                                "bg-red-100 text-red-700"
                      }`}>
                        {exam.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatDate(exam.completedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No exams taken yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SUBJECT CARD (BSGE) ────────────────────────────────────────────────────
function SubjectCard({ subject, onStart }: { subject: Subject; onStart: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-[#7d1a1a]/30 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[#7d1a1a]/10 rounded-lg group-hover:bg-[#7d1a1a]/20 transition-colors">
              <BookOpen size={18} className="text-[#7d1a1a]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{subject.subject}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DiffDot color="bg-green-500"  label={`${subject.easyCount} Easy`} />
            <DiffDot color="bg-yellow-500" label={`${subject.mediumCount} Medium`} />
            <DiffDot color="bg-red-500"    label={`${subject.hardCount} Hard`} />
          </div>

          <p className="text-sm text-gray-500 font-medium">{subject.totalQuestions} questions available</p>
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold text-sm hover:bg-[#5a1313] transition-all active:scale-95 flex-shrink-0 shadow-sm shadow-[#7d1a1a]/20"
        >
          <Play size={16} /> Start
        </button>
      </div>
    </div>
  );
}

// ── AREA CARD (BSABEN) — direct start, no subject drill-down ───────────────
function AreaCard({ area, onStart }: { area: Area; onStart: () => void }) {
  const easy   = area.easyCount   ?? area.subjects.reduce((s, x) => s + x.easyCount,   0);
  const medium = area.mediumCount ?? area.subjects.reduce((s, x) => s + x.mediumCount, 0);
  const hard   = area.hardCount   ?? area.subjects.reduce((s, x) => s + x.hardCount,   0);

  const formatTimer = (s?: number) => {
    if (!s) return null;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (sec) parts.push(`${sec}s`);
    return parts.join(" ");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-[#7d1a1a]/30 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Area name */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[#7d1a1a]/10 rounded-lg group-hover:bg-[#7d1a1a]/20 transition-colors">
              <Folder size={18} className="text-[#7d1a1a]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{area.area}</h3>
          </div>

          {/* Difficulty breakdown */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DiffDot color="bg-green-500"  label={`${easy} Easy`} />
            <DiffDot color="bg-yellow-500" label={`${medium} Medium`} />
            <DiffDot color="bg-red-500"    label={`${hard} Hard`} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-500 font-medium">
              {area.totalQuestions} questions • {area.subjects.length} subject{area.subjects.length !== 1 ? "s" : ""}
            </p>
            {formatTimer(area.timer) && (
              <div className="flex items-center gap-1 text-xs font-bold text-[#7d1a1a]">
                <Clock size={12} />
                {formatTimer(area.timer)}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold text-sm hover:bg-[#5a1313] transition-all active:scale-95 flex-shrink-0 shadow-sm shadow-[#7d1a1a]/20"
        >
          <Play size={16} /> Start
        </button>
      </div>
    </div>
  );
}

// ── SHARED HELPERS ─────────────────────────────────────────────────────────
function DiffDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
        <BookOpen size={32} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}