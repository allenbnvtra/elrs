"use client";

import React, { useState } from "react";
import { 
  Check, X, Search, Filter, UserCheck, UserX, 
  MoreHorizontal, Mail, Calendar, Info, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldAlert, GraduationCap
} from "lucide-react";
import Image from "next/image";

export default function StudentApprovalPage() {
  const [selectedCourse, setSelectedCourse] = useState("BSABE");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data for pending students
  const students = [
    { 
      id: "ST-2026-001", 
      name: "Juan Dela Cruz", 
      email: "juan.dc@bsau.edu.ph", 
      course: "BSABE", 
      dateApplied: "2026-02-01", 
      status: "pending",
      image: "/engr.png" 
    },
    { 
      id: "ST-2026-005", 
      name: "Maria Santos", 
      email: "m.santos@bsau.edu.ph", 
      course: "BSGE", 
      dateApplied: "2026-01-30", 
      status: "pending",
      image: "/engr.png" 
    },
    { 
      id: "ST-2026-012", 
      name: "Ricardo Reyes", 
      email: "r.reyes@bsau.edu.ph", 
      course: "BSABE", 
      dateApplied: "2026-02-03", 
      status: "pending",
      image: "/engr.png" 
    },
    { 
      id: "ST-2026-018", 
      name: "Ana Garcia", 
      email: "a.garcia@bsau.edu.ph", 
      course: "BSABE", 
      dateApplied: "2026-02-04", 
      status: "pending",
      image: "/engr.png" 
    },
  ];

  const filteredStudents = students.filter(s => s.course === selectedCourse);

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
              {students.length} Pending Verifications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg xs:rounded-xl font-bold hover:bg-emerald-100 transition-all text-[10px] xs:text-xs active:scale-95">
            <ShieldCheck size={14} className="xs:w-4 xs:h-4" />
            <span>Approve All</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
          {["BSABE", "BSGE"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
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

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
            />
          </div>
          <button 
            className="p-2 xs:p-2.5 border border-gray-200 rounded-lg xs:rounded-xl text-gray-500 hover:bg-gray-50 flex-shrink-0"
            aria-label="Filter students"
          >
            <Filter size={16} className="xs:w-[18px] xs:h-[18px]" />
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile) */}
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
              {filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-[#7d1a1a]/20 transition-all">
                        <Image src={student.image} alt="Avatar" width={40} height={40} className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-tight">{student.id}</p>
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
                      <span className="text-xs font-bold">{student.dateApplied}</span>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95"
                        aria-label="Approve student"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                      <p className="text-xs font-bold">No pending {selectedCourse} applications</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing <span className="text-gray-900">{filteredStudents.length}</span> of {filteredStudents.length} Students
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white shadow-md shadow-[#7d1a1a]/20">
              1
            </button>
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all disabled:opacity-30" 
              disabled
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW (visible only on mobile) */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
          <div 
            key={i} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <Image 
                  src={student.image} 
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
                  {student.id}
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
                <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Department:</span>
                <span className="font-bold text-gray-700 text-[10px] xs:text-xs">
                  Engineering Dept
                </span>
              </div>
              <div className="flex items-center justify-between text-xs xs:text-sm">
                <span className="text-gray-500 font-medium text-[10px] xs:text-xs">Applied:</span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <Calendar size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                  <span className="font-bold text-gray-700 text-[10px] xs:text-xs">
                    {student.dateApplied}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-600 text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-emerald-700 transition-all active:scale-95">
                <Check size={14} className="xs:w-4 xs:h-4" />
                <span>Approve</span>
              </button>
              <button 
                className="p-2 xs:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
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
              No pending {selectedCourse} applications
            </p>
          </div>
        )}

        {/* Mobile Pagination */}
        {filteredStudents.length > 0 && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
            <p className="text-[9px] xs:text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
              Showing <span className="text-gray-900">{filteredStudents.length}</span> of {filteredStudents.length} Students
            </p>
            <div className="flex items-center justify-center gap-1.5 xs:gap-2">
              <button 
                className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all disabled:opacity-30" 
                disabled
                aria-label="Previous page"
              >
                <ChevronLeft size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
              <button className="w-8 h-8 xs:w-9 xs:h-9 rounded-lg text-[10px] xs:text-xs font-bold bg-[#7d1a1a] text-white shadow-md shadow-[#7d1a1a]/20">
                1
              </button>
              <button 
                className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all disabled:opacity-30" 
                disabled
                aria-label="Next page"
              >
                <ChevronRight size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}