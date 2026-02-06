"use client";

import React, { useState } from "react";
import { 
  Archive, RotateCcw, Trash2, Search, Filter, 
  Calendar, FolderOpen, FileText, Video, HelpCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, AlertTriangle,
  Clock, User, X, Download, Eye
} from "lucide-react";

export default function ArchivePage() {
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Mock archived data
  const archivedItems = [
    {
      id: "ARC-001",
      title: "Farm Machinery Quiz - Set A",
      type: "exam",
      course: "BSABE",
      archivedBy: "Admin User",
      archivedDate: "2026-01-15",
      itemCount: 25,
      reason: "Outdated content"
    },
    {
      id: "ARC-002",
      title: "Irrigation Systems Video Tutorial",
      type: "material",
      course: "BSABE",
      archivedBy: "Engr. Thompson",
      archivedDate: "2026-01-20",
      itemCount: 1,
      reason: "Updated version available"
    },
    {
      id: "ARC-003",
      title: "Advanced Surveying Techniques",
      type: "material",
      course: "BSGE",
      archivedBy: "Admin User",
      archivedDate: "2026-01-10",
      itemCount: 1,
      reason: "Curriculum change"
    },
    {
      id: "ARC-004",
      title: "Cartography Question Bank",
      type: "questions",
      course: "BSGE",
      archivedBy: "Engr. Miller",
      archivedDate: "2026-01-25",
      itemCount: 48,
      reason: "Replaced by new version"
    },
    {
      id: "ARC-005",
      title: "Post-Harvest Engineering Exam",
      type: "exam",
      course: "BSABE",
      archivedBy: "Admin User",
      archivedDate: "2026-01-18",
      itemCount: 30,
      reason: "Semester ended"
    },
    {
      id: "ARC-006",
      title: "GPS Navigation Questions",
      type: "questions",
      course: "BSGE",
      archivedBy: "Engr. Miller",
      archivedDate: "2026-01-28",
      itemCount: 35,
      reason: "Content review"
    },
  ];

  const filteredItems = archivedItems.filter(item => {
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesCourse = selectedCourse === "all" || item.course === selectedCourse;
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCourse && matchesSearch;
  });

  // Calculate stats
  const totalArchived = archivedItems.length;
  const examsArchived = archivedItems.filter(i => i.type === "exam").length;
  const materialsArchived = archivedItems.filter(i => i.type === "material").length;
  const questionsArchived = archivedItems.filter(i => i.type === "questions").length;

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "exam": return FileText;
      case "material": return Video;
      case "questions": return HelpCircle;
      default: return FolderOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "exam": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "material": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
      case "questions": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
    }
  };

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Archive Center
          </h1>
          <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
            <AlertTriangle size={14} className="text-amber-500 xs:w-4 xs:h-4" />
            <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Archived Content Management
            </p>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2">
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-white border border-gray-200 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-[10px] xs:text-xs active:scale-95">
            <Download size={14} className="xs:w-4 xs:h-4" />
            <span>Export Archive</span>
          </button>
          <button className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg xs:rounded-xl font-bold hover:bg-amber-100 transition-all text-[10px] xs:text-xs active:scale-95">
            <AlertTriangle size={14} className="xs:w-4 xs:h-4" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gray-900/5 rounded-xl xs:rounded-2xl flex items-center justify-center text-gray-900 flex-shrink-0">
              <Archive size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Total Items
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                {totalArchived}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <FileText size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Exams
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                {examsArchived}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-purple-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
              <Video size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Materials
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                {materialsArchived}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-amber-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
              <HelpCircle size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Questions
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                {questionsArchived}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Type Filter Tabs */}
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {["all", "exam", "material", "questions"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 min-w-[70px] xs:min-w-0 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedType === type 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "all" ? "All Items" : type + "s"}
            </button>
          ))}
        </div>

        {/* Search and Course Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search archive..." 
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

          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all"
          >
            <option value="all">All Courses</option>
            <option value="BSABE">BSABE</option>
            <option value="BSGE">BSGE</option>
          </select>

          <button 
            className="p-2 xs:p-2.5 border border-gray-200 rounded-lg xs:rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0"
            aria-label="More filters"
          >
            <Filter size={16} className="xs:w-[18px] xs:h-[18px]" />
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile) */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Item Details</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Course</th>
                <th className="px-6 py-5">Archived By</th>
                <th className="px-6 py-5">Archive Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? filteredItems.map((item, i) => {
                const TypeIcon = getTypeIcon(item.type);
                const typeColors = getTypeColor(item.type);
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${typeColors.bg} flex items-center justify-center ${typeColors.text}`}>
                          <TypeIcon size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 leading-none truncate">{item.title}</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-tight">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-700">{item.course}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{item.archivedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} />
                        <span className="text-xs font-bold">{item.archivedDate}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-100 transition-all active:scale-95"
                          aria-label="Restore item"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                          aria-label="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          aria-label="Delete permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Archive size={48} className="text-gray-400" />
                      <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">Archive Empty</p>
                      <p className="text-xs font-bold text-gray-400">No archived items found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing {filteredItems.length} of {archivedItems.length} Items
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white">1</button>
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
        {filteredItems.length > 0 ? filteredItems.map((item, i) => {
          const TypeIcon = getTypeIcon(item.type);
          const typeColors = getTypeColor(item.type);
          return (
            <div 
              key={i} 
              className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
                <div className={`w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl ${typeColors.bg} flex items-center justify-center ${typeColors.text} flex-shrink-0`}>
                  <TypeIcon size={22} className="xs:w-6 xs:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5 xs:mb-2">
                    {item.id}
                  </p>
                  <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border text-[8px] xs:text-[9px] font-black uppercase ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                      {item.type}
                    </span>
                    <span className="text-[8px] xs:text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded uppercase">
                      {item.course}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Archived By:</span>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <User size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                    <span className="text-[10px] xs:text-xs font-bold text-gray-700 truncate max-w-[150px]">
                      {item.archivedBy}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Archive Date:</span>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <Calendar size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                    <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                      {item.archivedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Items Count:</span>
                  <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                    {item.itemCount} item{item.itemCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-start justify-between pt-1">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Reason:</span>
                  <span className="text-[10px] xs:text-xs font-medium text-gray-600 italic text-right max-w-[60%]">
                    {item.reason}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-1.5 xs:gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-emerald-100 transition-all active:scale-95">
                  <RotateCcw size={14} className="xs:w-4 xs:h-4" />
                  <span>Restore</span>
                </button>
                <button 
                  className="p-2 xs:p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
                  aria-label="View details"
                >
                  <Eye size={16} className="xs:w-[18px] xs:h-[18px]" />
                </button>
                <button 
                  className="p-2 xs:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
                  aria-label="Delete permanently"
                >
                  <Trash2 size={16} className="xs:w-[18px] xs:h-[18px]" />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-3 xs:mb-4">
              <Archive size={32} className="text-gray-400 xs:w-10 xs:h-10" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">
              Archive Empty
            </p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">
              No archived items match your filters
            </p>
          </div>
        )}

        {/* Mobile Pagination */}
        {filteredItems.length > 0 && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
            <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
              Showing {filteredItems.length} of {archivedItems.length} Items
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
        )}
      </div>
    </div>
  );
}