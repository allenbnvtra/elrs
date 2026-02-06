'use client'

import React, { useState } from "react";
import { Plus, Search, Filter, Edit3, Trash2, Layers, ChevronLeft, ChevronRight, MoreHorizontal, X } from "lucide-react";

function QuestionsPage() {
  const [selectedCourse, setSelectedCourse] = useState("BSABE");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const questions = Array.from({ length: 12 }).map((_, i) => ({
    id: `${selectedCourse === "BSABE" ? "ABE" : "GE"}-${100 + i}`,
    text: i % 2 === 0
      ? "Calculate the total hydrostatic force acting on a submerged vertical rectangular gate with dimensions 2m × 3m, given that the top edge is 1.5m below the water surface..."
      : "Under the provisions of RA 8560, define the scope of Geodetic Engineering practice and enumerate the activities that fall under the exclusive domain of licensed geodetic engineers...",
    category: i % 2 === 0 ? "Engineering Science" : "Laws & Ethics",
    difficulty: i % 3 === 0 ? "Hard" : "Medium",
  }));

  return (
    <div className="flex flex-col gap-3 xs:gap-4 sm:gap-6 w-full max-w-full overflow-hidden">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Question Bank
          </h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-[0.2em] mt-0.5 xs:mt-1">
            Database Management
          </p>
        </div>
        <div className="flex items-center gap-1.5 xs:gap-2">
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 bg-white border border-gray-200 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-[10px] xs:text-xs transition-all flex-1 sm:flex-none">
            <Layers size={14} className="xs:w-4 xs:h-4" />
            <span className="hidden xs:inline">Bulk</span>
            <span className="xs:hidden">Import</span>
          </button>
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-2.5 xs:px-3 sm:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl font-bold shadow-lg hover:bg-[#5a1313] text-[10px] xs:text-xs transition-all flex-1 sm:flex-none">
            <Plus size={16} className="xs:w-[18px] xs:h-[18px]" />
            <span className="truncate">New Question</span>
          </button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 xs:gap-4">
          {/* Course Tabs */}
          <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
            {["BSABE", "BSGE"].map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`flex-1 px-3 xs:px-4 sm:px-8 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[10px] xs:text-xs font-black transition-all ${
                  selectedCourse === course 
                    ? "bg-white text-[#7d1a1a] shadow-sm" 
                    : "text-gray-500"
                }`}
              >
                {course}
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-1.5 xs:gap-2">
            <div className="relative flex-1">
              <Search 
                className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                size={14}
              />
              <input 
                type="text" 
                placeholder="Search questions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all placeholder:text-[10px] xs:placeholder:text-xs" 
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
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 xs:p-2.5 border rounded-lg xs:rounded-xl transition-all flex-shrink-0 ${
                showFilters 
                  ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" 
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
              aria-label="Toggle filters"
            >
              <Filter size={16} className="xs:w-5 xs:h-5" />
            </button>
          </div>

          {/* Advanced Filters (collapsible) */}
          {showFilters && (
            <div className="pt-3 xs:pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xs:gap-3">
                <select className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                  <option>All Categories</option>
                  <option>Engineering Science</option>
                  <option>Laws & Ethics</option>
                </select>
                <select className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                  <option>All Difficulties</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <button className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-900 text-white rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold hover:bg-gray-800 transition-all">
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW (hidden on mobile) --- */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-[10%]">ID</th>
                <th className="px-6 py-5 w-[45%]">Question Content</th>
                <th className="px-6 py-5 w-[18%]">Category</th>
                <th className="px-6 py-5 w-[12%]">Difficulty</th>
                <th className="px-6 py-5 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {questions.map((q, i) => (
                <tr key={i} className="hover:bg-gray-50/80 group transition-all">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-[#7d1a1a]">{q.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-700 line-clamp-2 leading-relaxed group-hover:line-clamp-none cursor-default">
                      {q.text}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2.5 py-1.5 rounded-lg">
                      {q.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      q.difficulty === "Hard" 
                        ? "bg-red-50 text-red-600" 
                        : "bg-emerald-50 text-emerald-600"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        q.difficulty === "Hard" ? "bg-red-600" : "bg-emerald-600"
                      }`} />
                      {q.difficulty}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all"
                        aria-label="Edit question"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        aria-label="Delete question"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        aria-label="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing 1-12 of 1,402
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              className="p-2 text-gray-400 disabled:opacity-20 hover:text-gray-900 transition-all" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            {[1, 2, 3, "...", 12].map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === 'number' && setCurrentPage(p)}
                disabled={typeof p !== 'number'}
                className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black border transition-all ${
                  p === currentPage 
                    ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" 
                    : typeof p === 'number'
                    ? "bg-white border-gray-200 text-gray-500 hover:border-[#7d1a1a] hover:text-[#7d1a1a]"
                    : "bg-transparent border-transparent text-gray-400 cursor-default"
                }`}
                aria-label={typeof p === 'number' ? `Page ${p}` : undefined}
              >
                {p}
              </button>
            ))}
            <button 
              className="p-2 text-gray-400 hover:text-gray-900 transition-all"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (visible only on mobile) --- */}
      <div className="lg:hidden space-y-2 xs:space-y-3">
        {questions.map((q, i) => (
          <div 
            key={i} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2 flex-wrap">
                  <span className="text-[10px] xs:text-xs font-black text-[#7d1a1a]">
                    {q.id}
                  </span>
                  <span className="text-[8px] xs:text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">
                    {q.category}
                  </span>
                </div>
                <p className="text-xs xs:text-sm font-semibold text-gray-700 leading-relaxed line-clamp-3">
                  {q.text}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 xs:pt-3 border-t border-gray-100">
              <div className={`inline-flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-[8px] xs:text-[10px] font-black uppercase ${
                q.difficulty === "Hard" 
                  ? "bg-red-50 text-red-600" 
                  : "bg-emerald-50 text-emerald-600"
              }`}>
                <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${
                  q.difficulty === "Hard" ? "bg-red-600" : "bg-emerald-600"
                }`} />
                {q.difficulty}
              </div>

              <div className="flex items-center gap-0.5 xs:gap-1">
                <button 
                  className="p-1.5 xs:p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-lg xs:rounded-xl transition-all active:scale-95"
                  aria-label="Edit question"
                >
                  <Edit3 size={14} className="xs:w-4 xs:h-4" />
                </button>
                <button 
                  className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg xs:rounded-xl transition-all active:scale-95"
                  aria-label="Delete question"
                >
                  <Trash2 size={14} className="xs:w-4 xs:h-4" />
                </button>
                <button 
                  className="p-1.5 xs:p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg xs:rounded-xl transition-all active:scale-95"
                  aria-label="More options"
                >
                  <MoreHorizontal size={14} className="xs:w-4 xs:h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
          <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
            Showing 1-12 of 1,402
          </p>
          <div className="flex items-center justify-center gap-1.5 xs:gap-2">
            <button 
              className="p-1.5 xs:p-2 text-gray-400 disabled:opacity-20 hover:text-gray-900 transition-all flex-shrink-0" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} className="xs:w-5 xs:h-5" />
            </button>
            <div className="flex items-center gap-0.5 xs:gap-1 overflow-x-auto no-scrollbar">
              {[1, 2, 3, "...", 12].map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  disabled={typeof p !== 'number'}
                  className={`min-w-[32px] xs:min-w-[36px] h-8 xs:h-9 px-1.5 xs:px-2 rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-black border transition-all flex-shrink-0 ${
                    p === currentPage 
                      ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" 
                      : typeof p === 'number'
                      ? "bg-white border-gray-200 text-gray-500 active:scale-95"
                      : "bg-transparent border-transparent text-gray-400 cursor-default"
                  }`}
                  aria-label={typeof p === 'number' ? `Page ${p}` : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              className="p-1.5 xs:p-2 text-gray-400 hover:text-gray-900 transition-all flex-shrink-0"
              aria-label="Next page"
            >
              <ChevronRight size={18} className="xs:w-5 xs:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionsPage;