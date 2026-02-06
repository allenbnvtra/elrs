"use client";

import React, { useState } from "react";
import { 
  Plus, Search, Filter, FileText, Video, MoreVertical, 
  ExternalLink, Download, Trash2, Edit3, Clock, GraduationCap,
  LayoutGrid, List, X
} from "lucide-react";

export default function ReviewMaterialsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("BSABE");
  const [searchQuery, setSearchQuery] = useState("");

  const materials = [
    // BSABE Materials
    { id: 1, title: "Farm Power & Machinery Reviewer", type: "document", course: "BSABE", subject: "Area 1", date: "2026-02-01", size: "4.2 MB" },
    { id: 2, title: "Irrigation & Drainage Engineering", type: "video", course: "BSABE", subject: "Area 2", date: "2026-01-28", duration: "45:20" },
    { id: 3, title: "Post-Harvest Engineering Systems", type: "document", course: "BSABE", subject: "Area 3", date: "2026-01-26", size: "6.5 MB" },
    { id: 4, title: "Agricultural Structures Design", type: "video", course: "BSABE", subject: "Area 1", date: "2026-01-24", duration: "38:45" },
    
    // BSGE Materials
    { id: 5, title: "Cartography & Photogrammetry", type: "document", course: "BSGE", subject: "Laws & Ethics", date: "2026-01-25", size: "12.8 MB" },
    { id: 6, title: "Advanced Surveying Techniques", type: "video", course: "BSGE", subject: "Field Work", date: "2026-01-20", duration: "32:15" },
    { id: 7, title: "Geodetic Control Networks", type: "document", course: "BSGE", subject: "Surveying", date: "2026-01-18", size: "8.3 MB" },
    { id: 8, title: "GPS & Satellite Navigation", type: "video", course: "BSGE", subject: "Technology", date: "2026-01-15", duration: "52:30" },
  ];

  const filteredMaterials = materials.filter(item => {
    const matchesCourse = item.course === selectedCourse;
    const matchesTab = activeTab === "all" || item.type === activeTab;
    return matchesCourse && matchesTab;
  });

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 xs:gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <GraduationCap className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Academic Resources
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Review Materials
          </h1>
        </div>
        <button className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 text-xs xs:text-sm">
          <Plus size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
          <span className="truncate">Upload for {selectedCourse}</span>
        </button>
      </div>

      {/* COURSE SELECTOR TABS (BSABE vs BSGE) */}
      <div className="flex gap-2 xs:gap-3 sm:gap-4 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {["BSABE", "BSGE"].map((course) => (
          <button
            key={course}
            onClick={() => setSelectedCourse(course)}
            className={`pb-2.5 xs:pb-3 sm:pb-4 px-1 xs:px-2 text-[10px] xs:text-xs sm:text-sm font-black transition-all relative whitespace-nowrap flex-shrink-0 ${
              selectedCourse === course ? "text-[#7d1a1a]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="hidden sm:inline">
              {course === "BSABE" ? "Agricultural & Biosystems" : "Geodetic Engineering"}
            </span>
            <span className="sm:hidden">
              {course}
            </span>
            {selectedCourse === course && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 xs:h-1 bg-[#7d1a1a] rounded-t-full shadow-[0_-2px_10px_rgba(125,26,26,0.3)]" />
            )}
          </button>
        ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl sm:rounded-[24px] border border-gray-200/60 shadow-sm flex flex-col gap-3 xs:gap-4">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {["all", "document", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] xs:min-w-0 px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 xs:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${selectedCourse} materials...`}
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
          <button 
            className="p-2 xs:p-2.5 border border-gray-200 rounded-lg xs:rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0"
            aria-label="Filter materials"
          >
            <Filter size={16} className="xs:w-5 xs:h-5" />
          </button>
        </div>
      </div>

      {/* MATERIALS GRID */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          {filteredMaterials.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-gray-200/60 rounded-2xl xs:rounded-[24px] sm:rounded-[32px] overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className={`h-32 xs:h-36 sm:h-44 flex items-center justify-center relative ${
                item.type === 'video' ? 'bg-[#1A1A1A]' : 'bg-[#7d1a1a]/5'
              }`}>
                {item.type === 'video' ? (
                  <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                    <Video size={28} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white/20" />
                    <span className="bg-white/10 text-white text-[8px] xs:text-[9px] sm:text-[10px] px-1.5 xs:px-2 py-0.5 xs:py-1 rounded backdrop-blur-md">
                      Play Lesson
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                    <FileText size={28} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[#7d1a1a]/20" />
                    <span className="bg-[#7d1a1a]/10 text-[#7d1a1a] text-[8px] xs:text-[9px] sm:text-[10px] px-1.5 xs:px-2 py-0.5 xs:py-1 rounded font-bold">
                      PDF Manual
                    </span>
                  </div>
                )}
                
                {item.type === 'video' && (
                  <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 right-2 xs:right-3 sm:right-4 bg-black/60 backdrop-blur-md px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-white flex items-center gap-0.5 xs:gap-1">
                    <Clock size={10} className="xs:w-3 xs:h-3" /> {item.duration}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2 xs:mb-3">
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest px-1.5 xs:px-2 py-0.5 xs:py-1 bg-[#7d1a1a]/5 text-[#7d1a1a] rounded">
                    {item.subject}
                  </span>
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-gray-400">
                    {item.size || item.duration}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-sm xs:text-base sm:text-lg leading-tight mb-3 xs:mb-4 sm:mb-6 group-hover:text-[#7d1a1a] transition-colors min-h-[2.5rem] xs:min-h-[2.8rem] sm:min-h-[3rem] line-clamp-2">
                  {item.title}
                </h3>

                <div className="flex items-center justify-between pt-2.5 xs:pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex gap-0.5 xs:gap-1">
                    <button 
                      className="p-1.5 xs:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md xs:rounded-lg transition-all active:scale-95"
                      aria-label="Edit material"
                    >
                      <Edit3 size={14} className="xs:w-4 xs:h-4" />
                    </button>
                    <button 
                      className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md xs:rounded-lg transition-all active:scale-95"
                      aria-label="Delete material"
                    >
                      <Trash2 size={14} className="xs:w-4 xs:h-4" />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:shadow-lg hover:shadow-[#7d1a1a]/30 transition-all active:scale-95">
                    {item.type === 'video' ? (
                      <ExternalLink size={12} className="xs:w-3.5 xs:h-3.5" />
                    ) : (
                      <Download size={12} className="xs:w-3.5 xs:h-3.5" />
                    )}
                    <span>{item.type === 'video' ? 'Watch' : 'Download'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 xs:h-56 sm:h-64 bg-white rounded-2xl xs:rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 p-4">
          <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-2 xs:mb-3">
             <FileText size={24} className="xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
          </div>
          <p className="font-bold text-xs xs:text-sm text-center">
            No {activeTab}s found for {selectedCourse}
          </p>
          <p className="text-[10px] xs:text-xs text-gray-400 mt-1 text-center">
            Try uploading new materials or adjusting filters
          </p>
        </div>
      )}
    </div>
  );
}