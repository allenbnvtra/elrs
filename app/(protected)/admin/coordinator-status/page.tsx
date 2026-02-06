"use client";

import React, { useState } from "react";
import { 
  Search, Filter, MoreVertical, ShieldCheck, ShieldAlert, 
  Mail, Phone, Clock, FilePlus, UserPlus, ChevronLeft, 
  ChevronRight, Activity, Zap, X
} from "lucide-react";
import Image from "next/image";

export default function CoordinatorStatusPage() {
  const [selectedCourse, setSelectedCourse] = useState("BSABE");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for Coordinators
  const coordinators = [
    { 
      id: "COORD-001", 
      name: "Engr. Alice Thompson", 
      email: "a.thompson@bsau.edu.ph", 
      course: "BSABE", 
      contributions: 142, 
      lastActive: "2 mins ago",
      status: "online" 
    },
    { 
      id: "COORD-002", 
      name: "Engr. Bob Miller", 
      email: "b.miller@bsau.edu.ph", 
      course: "BSGE", 
      contributions: 89, 
      lastActive: "4 hours ago",
      status: "offline" 
    },
    { 
      id: "COORD-003", 
      name: "Engr. Clara Vinz", 
      email: "c.vinz@bsau.edu.ph", 
      course: "BSABE", 
      contributions: 215, 
      lastActive: "Active Now",
      status: "online" 
    },
    { 
      id: "COORD-004", 
      name: "Engr. David Chen", 
      email: "d.chen@bsau.edu.ph", 
      course: "BSABE", 
      contributions: 178, 
      lastActive: "1 hour ago",
      status: "offline" 
    },
  ];

  const filteredCoordinators = coordinators.filter(c => c.course === selectedCourse);

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Coordinator Management
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mt-0.5 xs:mt-1">
            Department Leads & Content Moderators
          </p>
        </div>
        <button className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all text-[10px] xs:text-xs active:scale-95">
          <UserPlus size={16} className="xs:w-[18px] xs:h-[18px]" />
          <span>Invite New Coordinator</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4">
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-[#7d1a1a]/5 rounded-xl xs:rounded-2xl flex items-center justify-center text-[#7d1a1a] flex-shrink-0">
            <ShieldCheck size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Active Leads
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">08</h4>
          </div>
        </div>
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <Activity size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Sync Frequency
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">High</h4>
          </div>
        </div>
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4 xs:col-span-3 sm:col-span-1">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Zap size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Total Contribs
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">1.2k</h4>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {["BSABE", "BSGE"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`flex-1 min-w-[120px] xs:min-w-0 px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCourse === course 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {course} Department
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Search coordinators..." 
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
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">Coordinator</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Questions Added</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-8 py-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCoordinators.map((coord, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7d1a1a] flex items-center justify-center text-white font-black text-xs shadow-inner">
                        {coord.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">{coord.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{coord.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${coord.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[11px] font-bold text-gray-700 capitalize">{coord.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <FilePlus size={14} className="text-[#7d1a1a]" />
                      <span className="text-xs font-black text-gray-700">{coord.contributions}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold">{coord.lastActive}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-[#7d1a1a] hover:text-white transition-all"
                        aria-label="Revoke access"
                      >
                        Revoke Access
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-all"
                        aria-label="More options"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Audit logs updated in real-time
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
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
        {filteredCoordinators.map((coord, i) => (
          <div 
            key={i} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl bg-[#7d1a1a] flex items-center justify-center text-white font-black text-xs xs:text-sm shadow-inner flex-shrink-0">
                {coord.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 truncate">
                  {coord.name}
                </h3>
                <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5 xs:mb-2 truncate">
                  {coord.email}
                </p>
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <div className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${
                    coord.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className="text-[9px] xs:text-[10px] font-bold text-gray-600 capitalize">
                    {coord.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Department:
                </span>
                <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                  {coord.course}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Questions Added:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <FilePlus size={12} className="text-[#7d1a1a] xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-black text-gray-700">
                    {coord.contributions}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Last Sync:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <Clock size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-bold text-gray-600">
                    {coord.lastActive}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-100 text-gray-600 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-[#7d1a1a] hover:text-white transition-all active:scale-95">
                <ShieldAlert size={14} className="xs:w-4 xs:h-4" />
                <span>Revoke Access</span>
              </button>
              <button 
                className="p-2 xs:p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
                aria-label="More options"
              >
                <MoreVertical size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
          <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
            Audit logs updated in real-time
          </p>
          <div className="flex items-center justify-center gap-1.5 xs:gap-2">
            <button 
              className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={16} className="xs:w-[18px] xs:h-[18px]" />
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