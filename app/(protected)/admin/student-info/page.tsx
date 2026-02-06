"use client";

import React, { useState } from "react";
import { 
  Search, Filter, MoreVertical, Download, 
  Mail, Phone, Calendar, User, Hash,
  ChevronLeft, ChevronRight, CheckCircle, 
  Clock, FileBarChart, GraduationCap,
  MoreHorizontal, X
} from "lucide-react";
import Image from "next/image";

export default function StudentInfoPage() {
  const [selectedCourse, setSelectedCourse] = useState("BSABE");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const students = [
    { 
      id: "2023-10041", 
      name: "Juan Paolo Cruz", 
      email: "p.cruz@student.edu.ph", 
      course: "BSABE", 
      year: "4th Year",
      averageScore: "88%",
      status: "active",
      examsTaken: 14
    },
    { 
      id: "2022-20052", 
      name: "Maria Leonora Santos", 
      email: "m.santos@student.edu.ph", 
      course: "BSGE", 
      year: "3rd Year",
      averageScore: "92%",
      status: "active",
      examsTaken: 22
    },
    { 
      id: "2023-10088", 
      name: "Roberto Gomez", 
      email: "r.gomez@student.edu.ph", 
      course: "BSABE", 
      year: "4th Year",
      averageScore: "76%",
      status: "inactive",
      examsTaken: 5
    },
    { 
      id: "2023-10095", 
      name: "Ana Maria Reyes", 
      email: "a.reyes@student.edu.ph", 
      course: "BSABE", 
      year: "3rd Year",
      averageScore: "91%",
      status: "active",
      examsTaken: 18
    }
  ];

  const filteredStudents = students.filter(s => s.course === selectedCourse);

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Student Registry
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mt-0.5 xs:mt-1">
            Master Student Database
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-white border border-gray-200 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-[10px] xs:text-xs active:scale-95">
            <Download size={14} className="xs:w-4 xs:h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TOP ANALYTICS MINI-STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        {[
          { label: "Total Students", value: "1,240", color: "text-blue-600" },
          { label: "BSABE Track", value: "780", color: "text-[#7d1a1a]" },
          { label: "BSGE Track", value: "460", color: "text-emerald-600" },
          { label: "Avg. Passing", value: "84%", color: "text-amber-600" },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm"
          >
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">
              {stat.label}
            </p>
            <p className={`text-base xs:text-lg sm:text-xl font-black ${stat.color} truncate`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* SEARCH & COURSE NAVIGATION */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
          {["BSABE", "BSGE"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`flex-1 px-6 xs:px-8 sm:px-10 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${
                selectedCourse === course 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {course}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Search name, ID, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X size={14} className="xs:w-4 xs:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile) */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[550px]">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Student Identity</th>
                <th className="px-6 py-5">Year Level</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-tight">{student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{student.year}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-800">
                        <FileBarChart size={14} className="text-emerald-600" />
                        {student.averageScore} Avg.
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{student.examsTaken} Exams Completed</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${student.status === 'active' ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                      {student.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg transition-all"
                      aria-label="View details"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing records for Academic Year 2025-2026
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white">
              1
            </button>
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
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
        {filteredStudents.map((student, i) => (
          <div 
            key={i} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-sm xs:text-base shadow-lg flex-shrink-0">
                {student.name.charAt(0)}
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
                  <span className={`inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[8px] xs:text-[9px] font-black uppercase ${
                    student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${
                      student.status === 'active' ? 'bg-emerald-600' : 'bg-gray-400'
                    }`} />
                    {student.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Email:
                </span>
                <span className="text-[10px] xs:text-xs font-bold text-gray-700 truncate ml-2 max-w-[60%] text-right">
                  {student.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Year Level:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <GraduationCap size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                    {student.year}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Average Score:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <FileBarChart size={12} className="text-emerald-600 xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-black text-gray-800">
                    {student.averageScore}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Exams Taken:
                </span>
                <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                  {student.examsTaken} Completed
                </span>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between">
              <button className="text-[10px] xs:text-xs font-bold text-[#7d1a1a] hover:underline">
                View Full Profile
              </button>
              <button 
                className="p-2 xs:p-2.5 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg xs:rounded-xl transition-all active:scale-95"
                aria-label="More options"
              >
                <MoreHorizontal size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
          <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
            Academic Year 2025-2026
          </p>
          <div className="flex items-center justify-center gap-1.5 xs:gap-2">
            <button 
              className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={16} className="xs:w-[18px] xs:h-[18px]" />
            </button>
            <button className="w-8 h-8 xs:w-9 xs:h-9 rounded-lg text-[10px] xs:text-xs font-bold bg-[#7d1a1a] text-white">
              1
            </button>
            <button 
              className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Next page"
            >
              <ChevronRight size={16} className="xs:w-[18px] xs:h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}