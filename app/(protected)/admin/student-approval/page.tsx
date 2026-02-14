"use client";

import React, { useState, useEffect } from "react";
import { 
  Check, X, Search, Filter, UserCheck, UserX, 
  MoreHorizontal, Mail, Calendar, Info, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldAlert, GraduationCap, Loader2, AlertCircle
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
  const [selectedCourse, setSelectedCourse] = useState<"BSABEN" | "BSGE">("BSABEN");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [error, setError] = useState("");

  // Fetch pending students
  const fetchStudents = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        userId: user.id,
        status: "pending",
      });

      // Only add course filter if user is admin
      if (user.role === "admin") {
        params.set("course", selectedCourse);
      }

      const res = await fetch(`/api/students/approve?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch students");
        return;
      }

      setStudents(data.students);
    } catch (err) {
      setError("Failed to load students");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user?.id, selectedCourse]);

  // Approve/Reject single student
  const handleAction = async (studentId: string, action: "approve" | "reject") => {
    if (!user?.id) return;

    setApproving(studentId);
    setError("");

    try {
      const res = await fetch("/api/students/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          userId: user.id,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${action} student`);
        return;
      }

      // Refresh the list
      await fetchStudents();
    } catch (err) {
      setError(`Failed to ${action} student`);
      console.error(err);
    } finally {
      setApproving(null);
    }
  };

  // Approve all pending students
  const handleApproveAll = async () => {
    if (!user?.id) return;
    
    const confirmMsg = user.role === "admin" 
      ? `Approve all pending ${selectedCourse} students?`
      : `Approve all pending students from your course?`;

    if (!confirm(confirmMsg)) return;

    setApprovingAll(true);
    setError("");

    try {
      const payload: any = {
        userId: user.id,
        action: "approve",
      };

      // Only include course if user is admin
      if (user.role === "admin") {
        payload.course = selectedCourse;
      }

      const res = await fetch("/api/students/approve-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to approve students");
        return;
      }

      alert(data.message);
      await fetchStudents();
    } catch (err) {
      setError("Failed to approve students");
      console.error(err);
    } finally {
      setApprovingAll(false);
    }
  };

  // Filter students by search query
  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.studentNumber.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Student Approval
          </h1>
          <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
            <span className="flex h-1.5 w-1.5 xs:h-2 xs:w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              {filteredStudents.length} Pending Verifications
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={handleApproveAll}
            disabled={approvingAll || filteredStudents.length === 0}
            className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg xs:rounded-xl font-bold hover:bg-emerald-100 transition-all text-[10px] xs:text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approvingAll ? (
              <Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" />
            ) : (
              <ShieldCheck size={14} className="xs:w-4 xs:h-4" />
            )}
            <span>{approvingAll ? "Approving..." : "Approve All"}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Course tabs - only show for admin */}
        {user?.role === "admin" && (
          <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
            {["BSABEN", "BSGE"].map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course as "BSABEN" | "BSGE")}
                className={`flex-1 px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${
                  selectedCourse === course 
                  ? "bg-white text-[#7d1a1a] shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {course}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[550px]">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                <th className="px-8 py-4">Student Info</th>
                <th className="px-6 py-4">Course/Major</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4">Verification</th>
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
              ) : filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-[#7d1a1a]/20 transition-all">
                        <Image src="/engr.png" alt="Avatar" width={40} height={40} className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-tight">{student.studentNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-700">{student.course}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Engineering Dept</span>
                    </div>
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
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAction(student._id, "approve")}
                        disabled={approving === student._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-60"
                        aria-label="Approve student"
                      >
                        {approving === student._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(student._id, "reject")}
                        disabled={approving === student._id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-60"
                        aria-label="Reject student"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-all"
                        aria-label="View details"
                      >
                        <Info size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <UserCheck size={48} className="text-gray-400" />
                      <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">Queue is Clear</p>
                      <p className="text-xs font-bold">No pending applications</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
          </div>
        ) : filteredStudents.length > 0 ? filteredStudents.map((student) => (
          <div 
            key={student._id} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <Image 
                  src="/engr.png" 
                  alt={student.name} 
                  width={56} 
                  height={56} 
                  className="object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 truncate">
                  {student.name}
                </h3>
                <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5 xs:mb-2">
                  {student.studentNumber}
                </p>
                <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                  <span className="text-[9px] xs:text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded uppercase">
                    {student.course}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full bg-amber-50 text-amber-700 text-[8px] xs:text-[9px] font-black uppercase">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between text-xs xs:text-sm">
                <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Email:</span>
                <span className="font-bold text-gray-700 text-[10px] xs:text-xs truncate ml-2">
                  {student.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs xs:text-sm">
                <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Applied:</span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <Calendar size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                  <span className="font-bold text-gray-700 text-[10px] xs:text-xs">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button 
                onClick={() => handleAction(student._id, "approve")}
                disabled={approving === student._id}
                className="flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-600 text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60"
              >
                {approving === student._id ? (
                  <Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" />
                ) : (
                  <Check size={14} className="xs:w-4 xs:h-4" />
                )}
                <span>Approve</span>
              </button>
              <button 
                onClick={() => handleAction(student._id, "reject")}
                disabled={approving === student._id}
                className="p-2 xs:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0 disabled:opacity-60"
                aria-label="Reject student"
              >
                <X size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
              <button 
                className="p-2 xs:p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
                aria-label="View details"
              >
                <Info size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-3 xs:mb-4">
              <UserCheck size={32} className="text-gray-400 xs:w-10 xs:h-10" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">
              Queue is Clear
            </p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">
              No pending applications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}