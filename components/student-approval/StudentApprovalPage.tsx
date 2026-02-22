"use client";

import React, { useState, useEffect } from "react";
import {
  Check, X, Search,
  UserCheck, Calendar, Info,
  ShieldCheck, Loader2, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/authContext";

interface Student {
  _id: string;
  name: string;
  email: string;
  course: "BSABEN" | "BSGE";
  studentNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

export default function StudentApprovalPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ userId: user.id, status: "pending" });
      const res = await fetch(`/api/students/approve?${params}`);
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Failed to fetch students"); return; }
      setStudents(data.students);
    } catch {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [user?.id]);

  const handleAction = async (studentId: string, action: "approve" | "reject") => {
    if (!user?.id) return;

    setApproving(studentId);
    setError("");

    try {
      const res = await fetch("/api/students/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, userId: user.id, action }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || `Failed to ${action} student`); return; }
      await fetchStudents();
    } catch {
      setError(`Failed to ${action} student`);
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    if (!user?.id) return;

    const confirmMsg = user.role === "admin"
      ? "Approve all pending students across all courses?"
      : "Approve all pending students from your course?";

    if (!confirm(confirmMsg)) return;

    setApprovingAll(true);
    setError("");

    try {
      const res = await fetch("/api/students/approve-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "approve" }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to approve students"); return; }

      alert(data.message);
      await fetchStudents();
    } catch {
      setError("Failed to approve students");
    } finally {
      setApprovingAll(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });

  // ─── Shared sub-components ────────────────────────────────────────────────

  const ActionButtons = ({ student, mobile = false }: { student: Student; mobile?: boolean }) => {
    const base = mobile ? "p-2 xs:p-2.5" : "p-2";
    const isProcessing = approving === student._id;
    return (
      <div className={`flex items-center gap-2 ${mobile ? "" : "justify-end"}`}>
        <button
          onClick={() => handleAction(student._id, "approve")}
          disabled={isProcessing}
          className={`${mobile ? "flex-1 " : ""}flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-60`}
          aria-label="Approve student"
        >
          {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Approve
        </button>
        <button
          onClick={() => handleAction(student._id, "reject")}
          disabled={isProcessing}
          className={`${base} text-gray-400 hover:text-red-600 hover:bg-red-50 ${mobile ? "border border-gray-200 rounded-xl" : "rounded-lg"} transition-all active:scale-95 disabled:opacity-60`}
          aria-label="Reject student"
        >
          <X size={mobile ? 16 : 18} />
        </button>
        <button
          className={`${base} text-gray-400 hover:text-gray-900 ${mobile ? "hover:bg-gray-100 border border-gray-200 rounded-xl" : "rounded-lg"} transition-all active:scale-95`}
          aria-label="View details"
        >
          <Info size={mobile ? 16 : 18} />
        </button>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center opacity-30">
      <UserCheck size={48} className="text-gray-400" />
      <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">Queue is Clear</p>
      <p className="text-xs font-bold">No pending applications</p>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Student Approval
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 xs:mt-1">
            <span className="flex h-1.5 w-1.5 xs:h-2 xs:w-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.15em]">
              {filteredStudents.length} Pending Verifications
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
          </div>
        )}

        <button
          onClick={handleApproveAll}
          disabled={approvingAll || filteredStudents.length === 0}
          className="w-fit flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg xs:rounded-xl font-bold hover:bg-emerald-100 transition-all text-[10px] xs:text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {approvingAll
            ? <Loader2 size={14} className="animate-spin" />
            : <ShieldCheck size={14} />}
          {approvingAll ? "Approving..." : "Approve All"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="relative">
          <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by name, email or student number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
          />
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden min-h-[550px]">
        <div className="overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                <th className="px-8 py-4">Student Info</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin text-[#7d1a1a] mx-auto" />
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-[#7d1a1a]/20 transition-all">
                          <Image src="/engr.png" alt="Avatar" width={40} height={40} className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-1">{student.studentNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-700">{student.course}</span>
                      <p className="text-[10px] text-gray-400 font-medium">Engineering Dept</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} />
                        <span className="text-xs font-bold">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                        Pending
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <ActionButtons student={student} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div key={student._id} className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
                <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  <Image src="/engr.png" alt={student.name} width={56} height={56} className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 truncate">{student.name}</h3>
                  <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5">{student.studentNumber}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] xs:text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded uppercase">
                      {student.course}
                    </span>
                    <span className="inline-flex items-center px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full bg-amber-50 text-amber-700 text-[8px] xs:text-[9px] font-black uppercase">
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Email</span>
                  <span className="font-bold text-gray-700 text-[10px] xs:text-xs truncate ml-2">{student.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Applied</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="font-bold text-gray-700 text-[10px] xs:text-xs">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <ActionButtons student={student} mobile />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-3 xs:mb-4">
              <UserCheck size={32} className="text-gray-400 xs:w-10 xs:h-10" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">Queue is Clear</p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">No pending applications</p>
          </div>
        )}
      </div>
    </div>
  );
}