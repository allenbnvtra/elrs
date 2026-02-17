"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, HelpCircle, Video, LayoutDashboard,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  Clock, ShieldCheck, Archive, BookOpen, Target,
  AlertTriangle, ArrowUpRight, Loader2, RefreshCw,
  GraduationCap, Award, BarChart3, FolderOpen,
  ChevronRight, Activity
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  students: {
    total: number;
    bsaben: number;
    bsge: number;
    pending: number;
  };
  results: {
    totalAnswered: number;
    correct: number;
    wrong: number;
    uniqueStudents: number;
    overallScore: number;
    bsaben: { totalPool: number; successRate: number; correct: number; wrong: number };
    bsge: { totalPool: number; successRate: number; correct: number; wrong: number };
  };
  scores: {
    bsaben: { totalStudents: number; averageScore: number; passRate: number; excellentCount: number };
    bsge: { totalStudents: number; averageScore: number; passRate: number; excellentCount: number };
  };
  coordinators: {
    total: number;
    totalContributions: number;
  };
  archives: {
    total: number;
    exams: number;
    materials: number;
    questions: number;
  };
  materials: {
    total: number;
    documents: number;
    videos: number;
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

const INITIAL: DashboardData = {
  students: { total: 0, bsaben: 0, bsge: 0, pending: 0 },
  results: { totalAnswered: 0, correct: 0, wrong: 0, uniqueStudents: 0, overallScore: 0, bsaben: { totalPool: 0, successRate: 0, correct: 0, wrong: 0 }, bsge: { totalPool: 0, successRate: 0, correct: 0, wrong: 0 } },
  scores: { bsaben: { totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0 }, bsge: { totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0 } },
  coordinators: { total: 0, totalContributions: 0 },
  archives: { total: 0, exams: 0, materials: 0, questions: 0 },
  materials: { total: 0, documents: 0, videos: 0 },
  pendingStudents: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bg, sub }: {
  label: string; value: string | number; icon: any;
  color: string; bg: string; sub?: string;
}) => (
  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
    </div>
    <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

const CourseBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div>
    <div className="flex justify-between mb-1.5">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <span className="text-xs font-black text-gray-900">{value.toFixed(1)}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const json = async (r: PromiseSettledResult<Response>) =>
        r.status === "fulfilled" && r.value.ok ? r.value.json() : null;

      const [
        studentsRes, pendingRes, resultsRes,
        scoresBsabenRes, scoresBsgeRes,
        coordinatorsRes, archivesRes,
        matBsabenRes, matBsgeRes,
      ] = await Promise.allSettled([
        fetch(`/api/students?userId=${user.id}&status=approved&limit=1`),
        fetch(`/api/students/approve?userId=${user.id}&status=pending&limit=5`),
        fetch("/api/results/stats"),
        fetch("/api/scores/stats?course=BSABEN"),
        fetch("/api/scores/stats?course=BSGE"),
        fetch(`/api/coordinators?userId=${user.id}&status=approved`),
        fetch("/api/archives?limit=1"),
        fetch("/api/review-materials?course=BSABEN"),
        fetch("/api/review-materials?course=BSGE"),
      ]);

      const [
        students, pending, results,
        scoresBsaben, scoresBsge,
        coordinators, archives,
        matBsaben, matBsge,
      ] = await Promise.all([
        json(studentsRes), json(pendingRes), json(resultsRes),
        json(scoresBsabenRes), json(scoresBsgeRes),
        json(coordinatorsRes), json(archivesRes),
        json(matBsabenRes), json(matBsgeRes),
      ]);

      const allMaterials = [
        ...((matBsaben?.materials ?? []) as any[]),
        ...((matBsge?.materials ?? []) as any[]),
      ];

      setData({
        students: {
          total: students?.stats?.totalStudents ?? 0,
          bsaben: students?.stats?.bsabenCount ?? 0,
          bsge: students?.stats?.bsgeCount ?? 0,
          pending: pending?.students?.length ?? 0,
        },
        results: {
          totalAnswered: results?.overall?.totalQuestions ?? 0,
          correct: results?.overall?.correctAnswers ?? 0,
          wrong: results?.overall?.wrongAnswers ?? 0,
          uniqueStudents: results?.overall?.uniqueStudents ?? 0,
          overallScore: results?.overall?.overallScore ?? 0,
          bsaben: results?.bsaben ?? { totalPool: 0, successRate: 0, correct: 0, wrong: 0 },
          bsge: results?.bsge ?? { totalPool: 0, successRate: 0, correct: 0, wrong: 0 },
        },
        scores: {
          bsaben: scoresBsaben ?? { totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0 },
          bsge: scoresBsge ?? { totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0 },
        },
        coordinators: {
          total: coordinators?.stats?.totalCoordinators ?? 0,
          totalContributions: coordinators?.stats?.totalContributions ?? 0,
        },
        archives: {
          total: archives?.stats?.totalArchived ?? 0,
          exams: archives?.stats?.byType?.exam ?? 0,
          materials: archives?.stats?.byType?.material ?? 0,
          questions: archives?.stats?.byType?.questions ?? 0,
        },
        materials: {
          total: allMaterials.length,
          documents: allMaterials.filter((m: any) => m.type === "document").length,
          videos: allMaterials.filter((m: any) => m.type === "video").length,
        },
        pendingStudents: pending?.students?.slice(0, 5) ?? [],
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  const totalQuestions = data.results.bsaben.totalPool + data.results.bsge.totalPool;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[10px] uppercase tracking-widest">System Overview</span>
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

      {/* ── PENDING ALERT ────────────────────────────────────────────────────── */}
      {data.students.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-900">
              {data.students.pending} student{data.students.pending > 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">
              Review and approve new registrations
            </p>
          </div>
          <a
            href="/admin/students/pending"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-amber-700 transition-all"
          >
            Review <ChevronRight size={12} />
          </a>
        </div>
      )}

      {/* ── PRIMARY KPI CARDS ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white h-28 rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Students" value={data.students.total.toLocaleString()} icon={Users} color="text-blue-600" bg="bg-blue-50" sub={`${data.students.pending} pending`} />
          <StatCard label="Question Bank" value={totalQuestions.toLocaleString()} icon={HelpCircle} color="text-[#7d1a1a]" bg="bg-[#7d1a1a]/5" sub={`BSABEN + BSGE`} />
          <StatCard label="Review Materials" value={data.materials.total} icon={FileText} color="text-purple-600" bg="bg-purple-50" sub={`${data.materials.documents} docs · ${data.materials.videos} videos`} />
          <StatCard label="Coordinators" value={data.coordinators.total.toString().padStart(2, "0")} icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" sub={`${data.coordinators.totalContributions.toLocaleString()} contributions`} />
          <StatCard label="Questions Answered" value={data.results.totalAnswered.toLocaleString()} icon={BarChart3} color="text-indigo-600" bg="bg-indigo-50" sub={`${data.results.uniqueStudents} students active`} />
          <StatCard label="Correct Answers" value={data.results.correct.toLocaleString()} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" sub={`${data.results.overallScore.toFixed(1)}% overall`} />
          <StatCard label="Wrong Answers" value={data.results.wrong.toLocaleString()} icon={XCircle} color="text-red-500" bg="bg-red-50" />
          <StatCard label="Archived Items" value={data.archives.total} icon={Archive} color="text-amber-600" bg="bg-amber-50" sub={`${data.archives.exams}E · ${data.archives.materials}M · ${data.archives.questions}Q`} />
        </div>
      )}

      {/* ── BOTTOM ROW: Course Comparison + Pending Approvals ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Course Performance */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-gray-900">Course Performance</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-widest">Success rates & scores</p>
            </div>
            <Activity size={18} className="text-gray-300" />
          </div>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* BSABEN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-3 h-3 rounded-full bg-[#7d1a1a]" />
                  <span className="text-xs font-black text-gray-700 uppercase tracking-widest">BSABEN</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsaben.averageScore.toFixed(1)}%</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Avg Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsaben.passRate.toFixed(0)}%</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pass Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsaben.totalStudents}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Students</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-emerald-700">{data.scores.bsaben.excellentCount}</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Excellent</p>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <CourseBar label="Success Rate" value={data.results.bsaben.successRate} max={100} color="bg-[#7d1a1a]" />
                  <CourseBar label="Pass Rate" value={data.scores.bsaben.passRate} max={100} color="bg-red-400" />
                </div>
              </div>

              {/* BSGE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black text-gray-700 uppercase tracking-widest">BSGE</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsge.averageScore.toFixed(1)}%</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Avg Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsge.passRate.toFixed(0)}%</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pass Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{data.scores.bsge.totalStudents}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Students</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-emerald-700">{data.scores.bsge.excellentCount}</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Excellent</p>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <CourseBar label="Success Rate" value={data.results.bsge.successRate} max={100} color="bg-emerald-500" />
                  <CourseBar label="Pass Rate" value={data.scores.bsge.passRate} max={100} color="bg-emerald-300" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pending Students Quick-Approve */}
        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-gray-900">Pending Approvals</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-widest">New registrations</p>
            </div>
            {data.students.pending > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">
                {data.students.pending}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse flex-1">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
            </div>
          ) : data.pendingStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={22} className="text-emerald-500" />
              </div>
              <p className="text-sm font-black text-gray-500">All clear!</p>
              <p className="text-[10px] text-gray-400 mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {data.pendingStudents.map(s => (
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
                    title="Quick Approve"
                  >
                    {approving === s._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <CheckCircle size={14} />}
                  </button>
                </div>
              ))}
              {data.students.pending > 5 && (
                <a href="/admin/students/pending" className="block text-center text-[10px] font-black text-[#7d1a1a] hover:underline pt-1">
                  View all {data.students.pending} pending →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK NAV CARDS ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Question Bank", href: "/admin/questions", icon: HelpCircle, color: "text-[#7d1a1a]", bg: "bg-[#7d1a1a]/5" },
            { label: "Review Materials", href: "/admin/materials", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Results", href: "/admin/results", icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Scores", href: "/admin/scores", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Coordinators", href: "/admin/coordinators", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Archive", href: "/admin/archives", icon: Archive, color: "text-gray-600", bg: "bg-gray-100" },
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <a
              key={href}
              href={href}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
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