"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, CheckCircle2, XCircle, Users, HelpCircle, 
  Download, Filter, RotateCcw, GraduationCap, 
  Book, ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  Calendar, X, Loader2, FileSpreadsheet
} from "lucide-react";

interface Result {
  _id: string;
  studentId: string;
  studentName?: string;
  questionId: string;
  questionText: string;
  subject: string;
  category: string;
  course: "BSABEN" | "BSGE";
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  submittedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Stats {
  overall: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    uniqueStudents: number;
    overallScore: number;
  };
  bsaben: {
    totalPool: number;
    correct: number;
    wrong: number;
    successRate: number;
  };
  bsge: {
    totalPool: number;
    correct: number;
    wrong: number;
    successRate: number;
  };
}

export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedResponse, setSelectedResponse] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/results/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "12"
      });
      
      if (selectedCourse !== "All") params.set("course", selectedCourse);
      if (selectedResponse === "Correct") params.set("isCorrect", "true");
      if (selectedResponse === "Incorrect") params.set("isCorrect", "false");
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setResults(data.results);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCourse, selectedResponse, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedResponse, searchQuery]);

  // Handle export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedCourse !== "All") params.set("course", selectedCourse);
      if (selectedResponse === "Correct") params.set("isCorrect", "true");
      if (selectedResponse === "Incorrect") params.set("isCorrect", "false");
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/results/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCourse("All");
    setSelectedResponse("All");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Pagination helpers
  const buildPageList = () => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const shortQuestionId = (id: string) => `Q-${id.slice(-6).toUpperCase()}`;

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 1. DYNAMIC HEADER SECTION */}
      <div className="space-y-4 xs:space-y-6 sm:space-y-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
              <GraduationCap className="text-[#7d1a1a]" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
                Student Results
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Results
            </h1>
          </div>

          <div className="flex items-center gap-2 xs:gap-2.5 w-full sm:w-auto">
            <button 
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 px-4 xs:px-5 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} className="xs:w-[18px] xs:h-[18px]" />
              )}
              <span className="truncate">
                {exporting ? "Exporting..." : "Export CSV"}
              </span>
            </button>
            <button 
              className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 text-xs xs:text-sm flex-1 sm:flex-none"
            >
              <Calendar size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
              <span className="truncate">Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MODERN KPI GRID */}
      {loadingStats ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-5">
          {[
            { label: "Total Questions", val: stats.overall.totalQuestions.toLocaleString(), icon: HelpCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Correct Answers", val: stats.overall.correctAnswers.toLocaleString(), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Wrong Answers", val: stats.overall.wrongAnswers.toLocaleString(), icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "Unique Students", val: stats.overall.uniqueStudents.toString(), icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Overall Score", val: `${stats.overall.overallScore.toFixed(2)}%`, icon: BarChart3, color: "text-white", bg: "bg-white/10" },
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
      )}

      {/* 3. COMPARATIVE STATS */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8">
          {/* BSABEN Card */}
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
                BSABEN <span className="text-[#7d1a1a]">Stats</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4 xs:gap-6 sm:gap-10">
                <div className="border-l-2 xs:border-l-4 border-gray-100 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Total Pool
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsaben.totalPool.toLocaleString()}
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-[#7d1a1a] pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Success Rate
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsaben.successRate.toFixed(2)}%
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-emerald-500 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Correct
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsaben.correct.toLocaleString()}
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-red-500 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Wrong
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsaben.wrong.toLocaleString()}
                  </p>
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
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsge.totalPool.toLocaleString()}
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-emerald-600 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Success Rate
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsge.successRate.toFixed(2)}%
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-emerald-500 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Correct
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsge.correct.toLocaleString()}
                  </p>
                </div>
                <div className="border-l-2 xs:border-l-4 border-red-500 pl-2 xs:pl-3 sm:pl-4">
                  <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest mb-1 xs:mb-2">
                    Wrong
                  </p>
                  <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {stats.bsge.wrong.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FILTERING SYSTEM */}
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
          
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl xs:rounded-2xl sm:rounded-[24px] text-[10px] xs:text-xs font-black uppercase text-gray-700 cursor-pointer outline-none transition-all appearance-none"
          >
            <option value="All">All Departments</option>
            <option value="BSABEN">BSABE Engineering</option>
            <option value="BSGE">BSGE Geodetic</option>
          </select>

          <select 
            value={selectedResponse}
            onChange={(e) => setSelectedResponse(e.target.value)}
            className="px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl xs:rounded-2xl sm:rounded-[24px] text-[10px] xs:text-xs font-black uppercase text-gray-700 cursor-pointer outline-none transition-all appearance-none"
          >
            <option value="All">All Responses</option>
            <option value="Correct">Correct Answers</option>
            <option value="Incorrect">Incorrect Answers</option>
          </select>

          <div className="flex gap-2">
            <button 
              onClick={fetchResults}
              disabled={loading}
              className="flex-1 bg-gray-900 text-white px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-xl xs:rounded-2xl sm:rounded-[24px] font-black uppercase text-[9px] xs:text-[10px] sm:text-xs shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button 
              onClick={handleResetFilters}
              className="p-2.5 xs:p-3 sm:p-4 bg-gray-100 text-gray-500 rounded-xl xs:rounded-2xl sm:rounded-[24px] hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              aria-label="Reset filters"
            >
              <RotateCcw size={18} className="xs:w-5 xs:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. DATA VIEW */}
      <div className="bg-white rounded-[24px] xs:rounded-[32px] sm:rounded-[48px] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px] xs:min-h-[500px] sm:min-h-[600px]">
        <div className="p-4 xs:p-6 sm:p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Detailed Breakdown
            </h3>
            <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-[0.15em] xs:tracking-[0.2em] mt-0.5 xs:mt-1">
              Found {pagination?.total.toLocaleString() || 0} specific instances
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

        {/* CARD VIEW */}
        {viewMode === "card" && (
          <div className="p-4 xs:p-6 sm:p-10">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-400">No results found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
                {results.map((result) => (
                  <div 
                    key={result._id} 
                    className="group flex items-center justify-between p-4 xs:p-5 sm:p-6 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl xs:rounded-[24px] sm:rounded-[32px] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 min-w-0">
                      <div className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-xl xs:rounded-2xl flex items-center justify-center font-black text-base xs:text-lg flex-shrink-0 ${
                        result.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {result.selectedAnswer}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-black text-gray-900 leading-none mb-0.5 xs:mb-1 text-sm xs:text-base truncate">
                          {result.studentId}
                        </h5>
                        <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest truncate">
                          {shortQuestionId(result.questionId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`block px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 rounded-lg xs:rounded-xl text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest ${
                        result.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {result.isCorrect ? 'Correct' : 'Wrong'}
                      </span>
                      <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 xs:mt-2 italic hidden xs:block">
                        {formatDate(result.submittedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-400">No results found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-[10px] xs:text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Question</th>
                    <th className="px-6 py-4 text-left">Subject</th>
                    <th className="px-6 py-4 text-left">Answer</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{result.studentId}</p>
                          {result.studentName && (
                            <p className="text-xs text-gray-500">{result.studentName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 line-clamp-2">{result.questionText}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {result.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${result.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {result.selectedAnswer}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500 text-xs">{result.correctAnswer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          result.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {result.isCorrect ? 'Correct' : 'Wrong'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatDate(result.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 xs:p-6 sm:p-10 border-t border-gray-50 flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-[9px] xs:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.15em] xs:tracking-[0.2em] flex items-center gap-1.5 xs:gap-2 hover:underline disabled:opacity-50 disabled:no-underline"
            >
              <ChevronLeft size={14} className="xs:w-4 xs:h-4" /> Previous Page
            </button>
            <div className="flex gap-1.5 xs:gap-2 font-black text-[10px] xs:text-xs">
              {buildPageList().map((page, i) => (
                <button
                  key={i}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  disabled={typeof page !== "number"}
                  className={`w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-gray-900 text-white"
                      : typeof page === "number"
                      ? "text-gray-400 hover:text-gray-900 cursor-pointer"
                      : "text-gray-400 cursor-default"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="text-[9px] xs:text-[10px] font-black text-[#7d1a1a] uppercase tracking-[0.15em] xs:tracking-[0.2em] flex items-center gap-1.5 xs:gap-2 hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Next Page <ChevronRight size={14} className="xs:w-4 xs:h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}