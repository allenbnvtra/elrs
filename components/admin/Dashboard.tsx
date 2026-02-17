"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, HelpCircle, LayoutDashboard,
  CheckCircle, XCircle, ShieldCheck, Archive,
  BookOpen, Award, BarChart3, AlertTriangle,
  ChevronRight, RefreshCw, Loader2, Activity,
  GraduationCap, Target, Video
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

// ─── Types ─────────────────────────────────────────────────────────────────
type Course = "BSABEN" | "BSGE";

interface CourseStats {
  totalStudents: number;
  averageScore: number;
  passRate: number;
  excellentCount: number;
  successRate: number;
  correct: number;
  wrong: number;
  questionPool: number;
  materials: number;
  documents: number;
  videos: number;
  pendingStudents: number;
}

interface DashboardData {
  role: "admin" | "faculty";
  // shared / per-course
  courses: Partial<Record<Course, CourseStats>>;
  // overall (populated for admin; mirrors single course for faculty)
  overall: {
    totalStudents: number;
    totalAnswered: number;
    correct: number;
    wrong: number;
    overallScore: number;
    uniqueStudents: number;
    totalContributions: number;
    coordinators: number;
    archivedTotal: number;
  };
  pendingStudents: PendingStudent[];
}

interface PendingStudent {
  _id: string;
  name: string;
  studentNumber: string;
  course: string;
  createdAt: string;
}

const EMPTY_COURSE: CourseStats = {
  totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0,
  successRate: 0, correct: 0, wrong: 0, questionPool: 0,
  materials: 0, documents: 0, videos: 0, pendingStudents: 0,
};

// ─── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <span className="text-xs font-black text-gray-900">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function CoursePerfCard({ course, stats, accentColor, accentBg }: {
  course: Course; stats: CourseStats; accentColor: string; accentBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
        <div className={`w-3 h-3 rounded-full ${accentBg}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${accentColor}`}>{course}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Avg Score", val: `${stats.averageScore.toFixed(1)}%` },
          { label: "Pass Rate", val: `${stats.passRate.toFixed(0)}%` },
          { label: "Students", val: stats.totalStudents },
          { label: "Excellent", val: stats.excellentCount },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900">{val}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        <ProgressBar label="Success Rate" value={stats.successRate} color={`${accentBg}`} />
        <ProgressBar label="Pass Rate" value={stats.passRate} color={accentBg === "bg-[#7d1a1a]" ? "bg-red-300" : "bg-emerald-300"} />
      </div>
    </div>
  );
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────
async function safeJson(url: string): Promise<any> {
  try {
    const r = await fetch(url);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function fetchCourseStats(course: Course, userId: string): Promise<CourseStats> {
  const [scores, results, materialsBsaben, pending] = await Promise.all([
    safeJson(`/api/scores/stats?course=${course}`),
    safeJson(`/api/results/stats`),
    safeJson(`/api/review-materials?course=${course}`),
    safeJson(`/api/students/approve?userId=${userId}&status=pending&course=${course}&limit=1`),
  ]);

  const mats: any[] = materialsBsaben?.materials ?? [];
  const courseResult = results?.[course?.toLowerCase()] ?? {};

  return {
    totalStudents: scores?.totalStudents ?? 0,
    averageScore: scores?.averageScore ?? 0,
    passRate: scores?.passRate ?? 0,
    excellentCount: scores?.excellentCount ?? 0,
    successRate: courseResult.successRate ?? 0,
    correct: courseResult.correct ?? 0,
    wrong: courseResult.wrong ?? 0,
    questionPool: courseResult.totalPool ?? 0,
    materials: mats.length,
    documents: mats.filter(m => m.type === "document").length,
    videos: mats.filter(m => m.type === "video").length,
    pendingStudents: pending?.students?.length ?? 0,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const facultyCourse = user?.course as Course | undefined;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const coursesToFetch: Course[] = isAdmin ? ["BSABEN", "BSGE"] : [facultyCourse!];

      // Fetch per-course stats
      const courseResults = await Promise.all(
        coursesToFetch.map(c => fetchCourseStats(c, user.id))
      );
      const courses: Partial<Record<Course, CourseStats>> = {};
      coursesToFetch.forEach((c, i) => { courses[c] = courseResults[i]; });

      // Shared endpoints
      const [studentsData, resultsData, pendingData] = await Promise.all([
        safeJson(`/api/students?userId=${user.id}&status=approved&limit=1`),
        safeJson(`/api/results/stats`),
        safeJson(`/api/students/approve?userId=${user.id}&status=pending&limit=5${!isAdmin ? `&course=${facultyCourse}` : ""}`),
      ]);

      // Admin-only endpoints
      const [coordinatorsData, archivesData] = isAdmin
        ? await Promise.all([
            safeJson(`/api/coordinators?userId=${user.id}&status=approved`),
            safeJson(`/api/archives?limit=1`),
          ])
        : [null, null];

      // Compute overall from fetched courses
      const allCourseStats = Object.values(courses) as CourseStats[];
      const totalCorrect = allCourseStats.reduce((s, c) => s + c.correct, 0);
      const totalWrong = allCourseStats.reduce((s, c) => s + c.wrong, 0);
      const totalAnswered = totalCorrect + totalWrong;

      setData({
        role: isAdmin ? "admin" : "faculty",
        courses,
        overall: {
          totalStudents: studentsData?.stats?.totalStudents ?? 0,
          totalAnswered,
          correct: totalCorrect,
          wrong: totalWrong,
          overallScore: resultsData?.overall?.overallScore ?? 0,
          uniqueStudents: resultsData?.overall?.uniqueStudents ?? 0,
          coordinators: coordinatorsData?.stats?.totalCoordinators ?? 0,
          totalContributions: coordinatorsData?.stats?.totalContributions ?? 0,
          archivedTotal: archivesData?.stats?.totalArchived ?? 0,
        },
        pendingStudents: pendingData?.students?.slice(0, 5) ?? [],
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, facultyCourse]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleQuickApprove = async (studentId: string) => {
    if (!user?.id) return;
    setApproving(studentId);
    try {
      await fetch("/api/students/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, userId: user.id, action: "approve" }),
      });
      fetchAll();
    } finally {
      setApproving(null);
    }
  };

  const totalPending = data
    ? Object.values(data.courses).reduce((s, c) => s + (c?.pendingStudents ?? 0), 0)
    : 0;

  const activeCourses = data ? (Object.entries(data.courses) as [Course, CourseStats][]) : [];
  const singleCourse = !isAdmin && activeCourses.length === 1 ? activeCourses[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[10px] uppercase tracking-widest">
              {isAdmin ? "System Overview" : `${facultyCourse} Department Overview`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          {lastUpdated && (
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── PENDING ALERT ──────────────────────────────────────────────────── */}
      {!loading && totalPending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-900">
              {totalPending} student{totalPending > 1 ? "s" : ""} awaiting approval
            </p>
          </div>
          <a href="/admin/students/pending"
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-amber-700 transition-all">
            Review <ChevronRight size={12} />
          </a>
        </div>
      )}

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: isAdmin ? 8 : 6 }).map((_, i) => (
            <div key={i} className="bg-white h-28 rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Always visible */}
          <KpiCard
            label="Total Students"
            value={data.overall.totalStudents.toLocaleString()}
            icon={Users} color="text-blue-600" bg="bg-blue-50"
            sub={totalPending > 0 ? `${totalPending} pending` : undefined}
          />
          <KpiCard
            label="Question Bank"
            value={activeCourses.reduce((s, [, c]) => s + c.questionPool, 0).toLocaleString()}
            icon={HelpCircle} color="text-[#7d1a1a]" bg="bg-[#7d1a1a]/5"
            sub={isAdmin ? "BSABEN + BSGE" : facultyCourse}
          />
          <KpiCard
            label="Review Materials"
            value={activeCourses.reduce((s, [, c]) => s + c.materials, 0)}
            icon={BookOpen} color="text-purple-600" bg="bg-purple-50"
            sub={`${activeCourses.reduce((s, [, c]) => s + c.documents, 0)} docs · ${activeCourses.reduce((s, [, c]) => s + c.videos, 0)} videos`}
          />
          <KpiCard
            label="Avg Score"
            value={singleCourse
              ? `${singleCourse[1].averageScore.toFixed(1)}%`
              : `${((activeCourses.reduce((s, [, c]) => s + c.averageScore, 0)) / Math.max(activeCourses.length, 1)).toFixed(1)}%`
            }
            icon={Target} color="text-emerald-600" bg="bg-emerald-50"
            sub={`${data.overall.overallScore.toFixed(1)}% overall`}
          />
          <KpiCard
            label="Questions Answered"
            value={data.overall.totalAnswered.toLocaleString()}
            icon={BarChart3} color="text-indigo-600" bg="bg-indigo-50"
            sub={`${data.overall.uniqueStudents} active students`}
          />
          <KpiCard
            label="Correct Answers"
            value={data.overall.correct.toLocaleString()}
            icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50"
          />
          <KpiCard
            label="Wrong Answers"
            value={data.overall.wrong.toLocaleString()}
            icon={XCircle} color="text-red-500" bg="bg-red-50"
          />
          {/* Admin-only extras */}
          {isAdmin && (
            <>
              <KpiCard
                label="Coordinators"
                value={data.overall.coordinators.toString().padStart(2, "0")}
                icon={ShieldCheck} color="text-teal-600" bg="bg-teal-50"
                sub={`${data.overall.totalContributions.toLocaleString()} contributions`}
              />
            </>
          )}
        </div>
      )}

      {/* ── BOTTOM ROW ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>

        {/* Course performance cards */}
        <div className={isAdmin ? "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 content-start" : ""}>
          {!loading && activeCourses.map(([course, stats]) => (
            <CoursePerfCard
              key={course}
              course={course}
              stats={stats}
              accentColor={course === "BSABEN" ? "text-[#7d1a1a]" : "text-emerald-600"}
              accentBg={course === "BSABEN" ? "bg-[#7d1a1a]" : "bg-emerald-500"}
            />
          ))}
          {loading && (
            <div className={`${isAdmin ? "col-span-2" : ""} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
              {Array.from({ length: isAdmin ? 2 : 1 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          )}
        </div>

        {/* Pending approvals + admin-only archive */}
        <div className="space-y-4 sm:space-y-6">
          {/* Pending quick-approve */}
          <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900">Pending Approvals</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-widest">New registrations</p>
              </div>
              {totalPending > 0 && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">
                  {totalPending}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
              </div>
            ) : data?.pendingStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle size={20} className="text-emerald-500" />
                </div>
                <p className="text-xs font-black text-gray-500">All clear!</p>
                <p className="text-[10px] text-gray-400 mt-0.5">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data?.pendingStudents.map(s => (
                  <div key={s._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#7d1a1a] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{s.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{s.course} · {s.studentNumber}</p>
                    </div>
                    <button
                      onClick={() => handleQuickApprove(s._id)}
                      disabled={approving === s._id}
                      className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all flex-shrink-0 disabled:opacity-50"
                      title="Approve"
                    >
                      {approving === s._id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle size={14} />}
                    </button>
                  </div>
                ))}
                {totalPending > 5 && (
                  <a href="/admin/students/pending" className="block text-center text-[10px] font-black text-[#7d1a1a] hover:underline pt-1">
                    View all {totalPending} pending →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Admin-only: Archive summary */}
          {isAdmin && !loading && data && (
            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Archive Summary</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-widest">Archived content</p>
                </div>
                <Archive size={16} className="text-gray-300" />
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">{data.overall.archivedTotal}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">Total Archived Items</p>
              <a href="/admin/archives"
                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-xs font-bold text-gray-600 group">
                Manage Archives
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK NAV ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>
          {[
            { label: "Question Bank", href: "/admin/questions", icon: HelpCircle, color: "text-[#7d1a1a]", bg: "bg-[#7d1a1a]/5" },
            { label: "Review Materials", href: "/admin/materials", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Results", href: "/admin/results", icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Scores", href: "/admin/scores", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
            ...(isAdmin ? [
              { label: "Coordinators", href: "/admin/coordinators", icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-50" },
              { label: "Archive", href: "/admin/archives", icon: Archive, color: "text-gray-600", bg: "bg-gray-100" },
            ] : []),
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <a key={href} href={href}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`p-2 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800 leading-tight">{label}</p>
                <p className="text-[9px] text-gray-400 font-medium mt-0.5 flex items-center gap-0.5">
                  Manage <ChevronRight size={10} />
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}