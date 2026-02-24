"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search, Download,
  ChevronLeft, ChevronRight,
  GraduationCap, MoreHorizontal, X, Loader2, AlertCircle,
  Mail, Copy, Eye, CheckCheck, ShieldOff, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentNumber: string;
  course: "BSABEN" | "BSGE";
  status: "pending" | "approved" | "rejected" | "deactivated";
  createdAt: string;
}

interface Stats {
  totalStudents: number;
  bsabenCount: number;
  bsgeCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type CourseFilter = "BSABEN" | "BSGE" | "all";

const COURSE_OPTIONS: { value: CourseFilter; label: string }[] = [
  { value: "all",    label: "All Courses" },
  { value: "BSABEN", label: "BSABEN" },
  { value: "BSGE",   label: "BSGE" },
];

// ─── Student Detail Modal ─────────────────────────────────────────────────────
function StudentDetailModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fields = [
    { label: "Full Name",       value: student.name,          key: "name" },
    { label: "Student Number",  value: student.studentNumber,  key: "sn" },
    { label: "Email",           value: student.email,          key: "email" },
    { label: "Course",          value: student.course,         key: "course" },
    { label: "Status",          value: student.status,         key: "status" },
    { label: "Joined",          value: new Date(student.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), key: "date" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-xl border-2 border-white/30">
              {student.name.charAt(0)}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <h2 className="text-xl font-black leading-tight">{student.name}</h2>
          <p className="text-white/70 text-sm font-bold mt-0.5">{student.studentNumber}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
              {student.course}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/30 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-400/30">
              {student.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2">
          {fields.map(({ label, value, key }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 group transition-colors"
            >
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-800">{value}</p>
              </div>
              {["name", "sn", "email"].includes(key) && (
                <button
                  onClick={() => copyToClipboard(value, key)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 transition-all"
                  aria-label={`Copy ${label}`}
                >
                  {copied === key ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-[#7d1a1a] hover:text-[#7d1a1a] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Deactivate Dialog ─────────────────────────────────────────────────
function ConfirmDialog({
  student,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  student: Student;
  action: "deactivate" | "activate";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isDeactivate = action === "deactivate";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-5 ${isDeactivate ? "bg-red-50 border-b border-red-100" : "bg-emerald-50 border-b border-emerald-100"}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isDeactivate ? "bg-red-100" : "bg-emerald-100"}`}>
            {isDeactivate
              ? <ShieldOff size={18} className="text-red-600" />
              : <ShieldCheck size={18} className="text-emerald-600" />}
          </div>
          <h3 className="text-base font-black text-gray-900">
            {isDeactivate ? "Deactivate Student?" : "Activate Student?"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isDeactivate
              ? <>This will revoke <span className="font-bold text-gray-700">{student.name}</span>'s access to the system. You can reactivate them later.</>
              : <>This will restore <span className="font-bold text-gray-700">{student.name}</span>'s access to the system.</>}
          </p>
        </div>
        <div className="p-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer ${
              isDeactivate
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : isDeactivate ? "Yes, Deactivate" : "Yes, Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Action Dropdown ───────────────────────────────────────────────────────
function ActionDropdown({
  student,
  onViewDetails,
  onStatusChange,
}: {
  student: Student;
  onViewDetails: () => void;
  onStatusChange: (student: Student, action: "deactivate" | "activate") => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const isDeactivated = student.status === "deactivated";

  const actions = [
    {
      icon: Eye,
      label: "View Profile",
      onClick: () => { setOpen(false); onViewDetails(); },
    },
    {
      icon: copied === "email" ? CheckCheck : Mail,
      label: copied === "email" ? "Copied!" : "Copy Email",
      onClick: () => copy(student.email, "email"),
      iconClass: copied === "email" ? "text-emerald-500" : "",
    },
    {
      icon: copied === "sn" ? CheckCheck : Copy,
      label: copied === "sn" ? "Copied!" : "Copy Student No.",
      onClick: () => copy(student.studentNumber, "sn"),
      iconClass: copied === "sn" ? "text-emerald-500" : "",
    },
    // separator handled by index in render
    {
      icon: isDeactivated ? ShieldCheck : ShieldOff,
      label: isDeactivated ? "Activate Student" : "Deactivate Student",
      onClick: () => {
        setOpen(false);
        onStatusChange(student, isDeactivated ? "activate" : "deactivate");
      },
      iconClass: isDeactivated ? "text-emerald-500" : "text-red-400",
      labelClass: isDeactivated ? "!text-emerald-600" : "!text-red-500",
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg transition-all cursor-pointer ${
          open ? "bg-[#7d1a1a]/10 text-[#7d1a1a]" : "text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5"
        }`}
        aria-label="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-56 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{student.name}</p>
          </div>
          {actions.map(({ icon: Icon, label, onClick, iconClass, labelClass, danger }, idx) => (
            <React.Fragment key={label}>
              {/* Separator before the danger action */}
              {danger && <div className="border-t border-gray-100 my-1" />}
              <button
                onClick={onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition-colors group cursor-pointer ${
                  danger
                    ? "text-gray-700 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#7d1a1a]"
                }`}
              >
                <Icon size={15} className={`text-gray-400 transition-colors ${iconClass ?? ""}`} />
                <span className={labelClass ?? ""}>{label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentInfoPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [selectedCourse, setSelectedCourse] = useState<CourseFilter>("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [students, setStudents]             = useState<Student[]>([]);
  const [stats, setStats]                   = useState<Stats>({ totalStudents: 0, bsabenCount: 0, bsgeCount: 0 });
  const [pagination, setPagination]         = useState<Pagination>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [currentPage, setCurrentPage]       = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ student: Student; action: "deactivate" | "activate" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        userId: user.id,
        status: "approved",
        page: String(currentPage),
        limit: "50",
      });
      if (isAdmin && selectedCourse !== "all") params.set("course", selectedCourse);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch students"); return; }
      setStudents(data.students);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmAction || !user?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: user.id,
          studentId: confirmAction.student._id,
          action: confirmAction.action,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update student"); return; }

      // Optimistically update list — remove deactivated from "approved" view
      setStudents((prev) =>
        prev.map((s) =>
          s._id === confirmAction.student._id ? { ...s, status: data.student.status } : s
        ).filter((s) => s.status === (searchParams_status ?? "approved"))
      );
      setConfirmAction(null);
    } catch {
      setError("Failed to update student status");
    } finally {
      setActionLoading(false);
    }
  };

  // track current status filter for optimistic removal
  const searchParams_status = "approved";

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, searchQuery]);
  useEffect(() => { fetchStudents(); }, [user?.id, selectedCourse, searchQuery, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Student Number", "Name", "Email", "Course", "Status"];
    const rows = students.map((s) => [s.studentNumber, s.name, s.email, s.course, s.status]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `students_${selectedCourse}_${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const buildPageList = () => {
    const t = pagination.totalPages;
    if (t <= 5) return Array.from({ length: t }, (_, i) => i + 1);
    if (currentPage <= 3)     return [1, 2, 3, "...", t];
    if (currentPage >= t - 2) return [1, "...", t - 2, t - 1, t];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", t];
  };

  const PaginationControls = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex items-center ${mobile ? "justify-center gap-1.5 xs:gap-2" : "gap-2"}`}>
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={`${mobile ? "p-1.5 xs:p-2" : "p-2"} text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all`}
      >
        <ChevronLeft size={mobile ? 16 : 18} />
      </button>
      <div className={`flex items-center ${mobile ? "gap-0.5 xs:gap-1 overflow-x-auto" : "gap-2"}`}>
        {buildPageList().map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === "number" && setCurrentPage(p)}
            disabled={typeof p !== "number"}
            className={`${mobile ? "min-w-[32px] xs:min-w-[36px] h-8 xs:h-9 text-[10px] xs:text-xs flex-shrink-0" : "min-w-[36px] h-9 text-xs"} px-2 rounded-lg font-bold border transition-all ${
              p === currentPage
                ? "bg-[#7d1a1a] text-white border-[#7d1a1a]"
                : typeof p === "number"
                ? "bg-white border-gray-200 text-gray-500 hover:border-[#7d1a1a] hover:text-[#7d1a1a]"
                : "bg-transparent border-transparent text-gray-400 cursor-default"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
        disabled={currentPage === pagination.totalPages}
        className={`${mobile ? "p-1.5 xs:p-2" : "p-2"} text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all`}
      >
        <ChevronRight size={mobile ? 16 : 18} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <GraduationCap className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.15em]">
              Master Student Database
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Student Registry
          </h1>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={students.length === 0}
          className="flex items-center justify-center gap-1.5 xs:gap-2 bg-white border border-gray-200 px-4 xs:px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-xs xs:text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* STATS */}
      <div className={`grid gap-2 xs:gap-3 sm:gap-4 ${isAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3"}`}>
        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">Total Students</p>
          <p className="text-base xs:text-lg sm:text-xl font-black text-blue-600">{stats.totalStudents.toLocaleString()}</p>
        </div>
        {(isAdmin || (user as any)?.course === "BSABEN") && (
          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">BSABEN Track</p>
            <p className="text-base xs:text-lg sm:text-xl font-black text-[#7d1a1a]">{stats.bsabenCount.toLocaleString()}</p>
          </div>
        )}
        {(isAdmin || (user as any)?.course === "BSGE") && (
          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">BSGE Track</p>
            <p className="text-base xs:text-lg sm:text-xl font-black text-emerald-600">{stats.bsgeCount.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">Showing</p>
          <p className="text-base xs:text-lg sm:text-xl font-black text-amber-600">{students.length}</p>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        {isAdmin && (
          <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
            {COURSE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedCourse(value)}
                className={`flex-1 px-6 xs:px-8 sm:px-10 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${
                  selectedCourse === value ? "bg-white text-[#7d1a1a] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="relative w-full">
          <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 text-slate-800 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden min-h-[550px]">
        <div className="overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Student Identity</th>
                <th className="px-6 py-5">Course</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin text-[#7d1a1a] mx-auto" />
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-1">{student.studentNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{student.course}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-gray-600">{student.email}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                        <div className="w-1 h-1 rounded-full bg-emerald-600" />
                        {student.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ActionDropdown
                        student={student}
                        onViewDetails={() => setSelectedStudent(student)}
                        onStatusChange={(s, action) => setConfirmAction({ student: s, action })}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-gray-400 font-bold">No students found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <PaginationControls />
          </div>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
          </div>
        ) : students.length > 0 ? (
          students.map((student) => (
            <div key={student._id} className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
                <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-sm xs:text-base shadow-lg flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 truncate">{student.name}</h3>
                  <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5">{student.studentNumber}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] xs:text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded uppercase">
                      {student.course}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[8px] xs:text-[9px] font-black uppercase bg-emerald-50 text-emerald-600">
                      <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-emerald-600" />
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pb-3 xs:pb-4 mb-3 xs:mb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Email</span>
                  <span className="text-[10px] xs:text-xs font-bold text-gray-700 truncate ml-2 max-w-[60%] text-right">{student.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="text-[10px] xs:text-xs font-bold text-[#7d1a1a] hover:underline"
                >
                  View Full Profile
                </button>
                <ActionDropdown
                  student={student}
                  onViewDetails={() => setSelectedStudent(student)}
                  onStatusChange={(s, action) => setConfirmAction({ student: s, action })}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">No Students Found</p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">Try adjusting your filters</p>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
            <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3 xs:mb-4">
              Page {currentPage} of {pagination.totalPages}
            </p>
            <PaginationControls mobile />
          </div>
        )}
      </div>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* CONFIRM DEACTIVATE / ACTIVATE DIALOG */}
      {confirmAction && (
        <ConfirmDialog
          student={confirmAction.student}
          action={confirmAction.action}
          onConfirm={handleStatusChange}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}