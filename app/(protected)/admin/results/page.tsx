"use client";

import React, { useState } from "react";
import { 
  BarChart3, CheckCircle2, XCircle, Users, HelpCircle, 
  Download, Filter, RotateCcw, GraduationCap, 
  Book, ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  ArrowUpRight, Calendar, X
} from "lucide-react";

export default function ResultsPage() {
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 1. DYNAMIC HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Results
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mt-0.5 xs:mt-1">
            Student Results
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3">
          <button className="group flex items-center justify-center gap-1.5 xs:gap-2 border px-4 xs:px-5 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl font-bold transition-all backdrop-blur-md text-xs active:scale-95">
            <Download size={16} className="xs:w-[18px] xs:h-[18px] group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[10px] xs:text-xs uppercase tracking-widest">Export CSV</span>
          </button>
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 bg-white text-[#7d1a1a] px-4 xs:px-6 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl font-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-all active:scale-95 text-[10px] xs:text-xs uppercase">
            <Calendar size={16} className="xs:w-[18px] xs:h-[18px]" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* 2. MODERN KPI GRID - BOLD & LEGIBLE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-5">
        {[
          { label: "Total Questions", val: "1,995", icon: HelpCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Correct Answers", val: "396", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Wrong Answers", val: "1,599", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Unique Students", val: "12", icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Overall Score", val: "19.85%", icon: BarChart3, color: "text-white", bg: "bg-white/10" },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`bg-white p-3 xs:p-4 sm:p-6 rounded-2xl xs:rounded-[24px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-start transition-all hover:-translate-y-1 ${
              i === 4 ? 'col-span-2 md:col-span-1' : ''
            }`}
          >
            <div className={`p-2 xs:p-2.5 sm:p-3 ${stat.bg} ${stat.color} rounded-xl xs:rounded-2xl mb-2 xs:mb-3 sm:mb-4`}>
              <stat.icon size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-0.5 xs:mb-1">
              {stat.label}
            </p>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {stat.val}
            </h3>
          </div>
        ))}
      </div>

      {/* 3. COMPARATIVE STATS - REDEFINED FOR CLARITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8">
        {/* BSABE Card */}
        <div className="bg-white p-5 xs:p-7 sm:p-10 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 xs:p-6 sm:p-8 text-[#7d1a1a]/10 group-hover:scale-110 transition-transform">
            <GraduationCap size={80} className="xs:w-[100px] xs:h-[100px] sm:w-[120px] sm:h-[120px]" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 bg-[#7d1a1a]/5 text-[#7d1a1a] rounded-full mb-3 xs:mb-4 sm:mb-6">
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
                Engineering Department
              </span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 mb-4 xs:mb-6 sm:mb-8 tracking-tight">
              BSABE <span className="text-[#7d1a1a]">Stats</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 xs:gap-6 sm:gap-10">
              <div className="border-l-2 xs:border-l-4 border-gray-100 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Total Pool
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">588</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-[#7d1a1a] pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Success Rate
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">20.92%</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-emerald-500 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Correct
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">123</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-red-500 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Wrong
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">465</p>
              </div>
            </div>
          </div>
        </div>

        {/* BSGE Card */}
        <div className="bg-white p-5 xs:p-7 sm:p-10 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 xs:p-6 sm:p-8 text-emerald-600/10 group-hover:scale-110 transition-transform">
            <Book size={80} className="xs:w-[100px] xs:h-[100px] sm:w-[120px] sm:h-[120px]" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 bg-emerald-50 text-emerald-600 rounded-full mb-3 xs:mb-4 sm:mb-6">
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
                Geodetic Department
              </span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 mb-4 xs:mb-6 sm:mb-8 tracking-tight">
              BSGE <span className="text-emerald-600">Stats</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 xs:gap-6 sm:gap-10">
              <div className="border-l-2 xs:border-l-4 border-gray-100 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Total Pool
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">1407</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-emerald-600 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Success Rate
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">19.4%</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-emerald-500 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Correct
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">273</p>
              </div>
              <div className="border-l-2 xs:border-l-4 border-red-500 pl-2 xs:pl-3 sm:pl-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                  Wrong
                </p>
                <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">1134</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REVOLUTIONIZED FILTERING SYSTEM */}
      <div className="bg-white/80 backdrop-blur-xl p-4 xs:p-6 sm:p-8 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] border border-gray-200 shadow-xl">
        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-5 sm:mb-6">
          <div className="p-1.5 xs:p-2 bg-gray-900 text-white rounded-lg">
            <SlidersHorizontal size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-black text-gray-900 text-[10px] xs:text-xs sm:text-sm uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
            Filter Records
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
          <div className="relative group">
            <Search className="absolute left-3 xs:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7d1a1a] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Student ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 xs:pl-12 pr-3 xs:pr-4 py-2.5 xs:py-3 sm:py-4 bg-gray-50 border-2 border-transparent focus:border-[#7d1a1a]/10 focus:bg-white rounded-xl xs:rounded-2xl sm:rounded-[24px] text-xs xs:text-sm font-bold text-gray-900 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X size={14} className="xs:w-4 xs:h-4" />
              </button>
            )}
          </div>
          
          <select className="px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl xs:rounded-2xl sm:rounded-[24px] text-[10px] xs:text-xs font-black uppercase text-gray-700 cursor-pointer outline-none transition-all appearance-none">
            <option>All Departments</option>
            <option>BSABE Engineering</option>
            <option>BSGE Geodetic</option>
          </select>

          <select className="px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl xs:rounded-2xl sm:rounded-[24px] text-[10px] xs:text-xs font-black uppercase text-gray-700 cursor-pointer outline-none transition-all appearance-none">
            <option>All Responses</option>
            <option>Correct Answers</option>
            <option>Incorrect Answers</option>
          </select>

          <div className="flex gap-2">
            <button className="flex-1 bg-gray-900 text-white px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-xl xs:rounded-2xl sm:rounded-[24px] font-black uppercase text-[9px] xs:text-[10px] sm:text-xs shadow-lg hover:bg-black transition-all active:scale-95">
              Apply Filters
            </button>
            <button 
              className="p-2.5 xs:p-3 sm:p-4 bg-gray-100 text-gray-500 rounded-xl xs:rounded-2xl sm:rounded-[24px] hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              aria-label="Reset filters"
            >
              <RotateCcw size={18} className="xs:w-5 xs:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. ORGANIZED DATA VIEW */}
      <div className="bg-white rounded-[24px] xs:rounded-[32px] sm:rounded-[48px] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px] xs:min-h-[500px] sm:min-h-[600px]">
        <div className="p-4 xs:p-6 sm:p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Detailed Breakdown
            </h3>
            <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-[0.15em] xs:tracking-[0.2em] mt-0.5 xs:mt-1">
              Found 1,995 specific instances
            </p>
          </div>
          <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-xl xs:rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => setViewMode("card")}
              className={`flex-1 sm:flex-none px-4 xs:px-5 sm:px-6 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[9px] xs:text-[10px] font-black uppercase transition-all ${
                viewMode === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              Card View
            </button>
            <button 
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-none px-4 xs:px-5 sm:px-6 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-[9px] xs:text-[10px] font-black uppercase transition-all ${
                viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* MOCKUP OF MODERN DATA LISTING */}
        <div className="p-4 xs:p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="group flex items-center justify-between p-4 xs:p-5 sm:p-6 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl xs:rounded-[24px] sm:rounded-[32px] transition-all duration-300"
            >
              <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 min-w-0">
                <div className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-xl xs:rounded-2xl flex items-center justify-center font-black text-base xs:text-lg flex-shrink-0 ${
                  i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {i % 2 === 0 ? 'A' : 'X'}
                </div>
                <div className="min-w-0">
                  <h5 className="font-black text-gray-900 leading-none mb-0.5 xs:mb-1 text-sm xs:text-base truncate">
                    2023-100{i+1}
                  </h5>
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest truncate">
                    Question ID: Q-ARC-50{i}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`block px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 rounded-lg xs:rounded-xl text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest ${
                  i % 2 === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {i % 2 === 0 ? 'Valid' : 'Invalid'}
                </span>
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 xs:mt-2 italic hidden xs:block">
                  05 Feb 2026
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 xs:p-6 sm:p-10 border-t border-gray-50 flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-4">
          <button className="text-[9px] xs:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.15em] xs:tracking-[0.2em] flex items-center gap-1.5 xs:gap-2 hover:underline">
            <ChevronLeft size={14} className="xs:w-4 xs:h-4" /> Previous Page
          </button>
          <div className="flex gap-1.5 xs:gap-2 font-black text-[10px] xs:text-xs">
            <span className="w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg">1</span>
            <span className="w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 cursor-pointer transition-colors">2</span>
            <span className="w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center text-gray-400">...</span>
            <span className="w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center text-gray-400 cursor-pointer hover:text-gray-900 transition-colors">99</span>
          </div>
          <button className="text-[9px] xs:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.15em] xs:tracking-[0.2em] flex items-center gap-1.5 xs:gap-2 hover:underline">
            Next Page <ChevronRight size={14} className="xs:w-4 xs:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}