"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Award, TrendingUp, TrendingDown, Users, Target,
  Download, Filter, Search, MoreHorizontal, 
  ChevronLeft, ChevronRight, FileBarChart, CheckCircle,
  Calendar, BookOpen, X, Loader2,
  GraduationCap
} from "lucide-react";

interface Score {
  studentId: string;
  name: string;
  course: "BSABE" | "BSGE";
  examsTaken: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  status: "excellent" | "good" | "needs-improvement";
  lastExam: string;
  grade: string;
}

interface Stats {
  totalStudents: number;
  averageScore: number;
  passRate: number;
  excellentCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ScoresPage() {
  const [selectedCourse, setSelectedCourse] = useState<"BSABE" | "BSGE">("BSABE");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [scores, setScores] = useState<Score[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/scores/stats?course=${selectedCourse}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedCourse]);

  // Fetch scores
  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        course: selectedCourse,
        page: String(currentPage),
        limit: "20"
      });

      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/scores?${params}`);
      const data = await res.json();

      if (res.ok) {
        setScores(data.scores);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, currentPage, filterStatus, searchQuery]);

  // Effects
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, filterStatus, searchQuery]);

  // Handle export
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ course: selectedCourse });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/scores/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scores-${selectedCourse}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export grades");
    } finally {
      setExporting(false);
    }
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "excellent": return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
      case "good": return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
      case "needs-improvement": return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
      default: return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes("A")) return "text-emerald-600";
    if (grade.includes("B")) return "text-blue-600";
    if (grade.includes("C")) return "text-amber-600";
    return "text-gray-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="space-y-4 xs:space-y-6 sm:space-y-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
              <GraduationCap className="text-[#7d1a1a]" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
                Student Assessment & Grade Tracking
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Performance Scores
            </h1>
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 xs:gap-2 bg-white border border-gray-200 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-xs xs:text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Download size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
            )}
            <span className="truncate">{exporting ? "Exporting..." : "Export Grades"}</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      {loadingStats ? (
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                <Users size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Total Students
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Target size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Avg. Score
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.averageScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-[#7d1a1a]/5 rounded-xl xs:rounded-2xl flex items-center justify-center text-[#7d1a1a] flex-shrink-0">
                <CheckCircle size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Pass Rate
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.passRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-amber-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                <Award size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Excellence
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.excellentCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full">
          {(["BSABE", "BSGE"] as const).map((course) => (
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all"
          >
            <option value="all">All Performance</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="needs-improvement">Needs Improvement</option>
          </select>

          <button 
            onClick={fetchScores}
            disabled={loading}
            className="p-2 xs:p-2.5 border border-gray-200 rounded-lg xs:rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0 disabled:opacity-50"
            aria-label="Apply filters"
          >
            <Filter size={16} className="xs:w-[18px] xs:h-[18px]" />
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Student</th>
                  <th className="px-6 py-5">Exams</th>
                  <th className="px-6 py-5">Average</th>
                  <th className="px-6 py-5">Range</th>
                  <th className="px-6 py-5">Grade</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.length > 0 ? scores.map((student, i) => {
                  const statusColors = getStatusColor(student.status);
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7d1a1a] to-[#3d0d0d] flex items-center justify-center text-white font-black text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-none">{student.name}</p>
                            <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-tight">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-700">{student.examsTaken} Taken</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px]">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  student.averageScore >= 90 ? 'bg-emerald-500' :
                                  student.averageScore >= 75 ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`}
                                style={{ width: `${student.averageScore}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-black text-gray-900 min-w-[45px]">
                            {student.averageScore.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col text-xs">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> {student.highestScore}%
                          </span>
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            <TrendingDown size={12} /> {student.lowestScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-2xl font-black ${getGradeColor(student.grade)}`}>
                          {student.grade}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusColors.bg} ${statusColors.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
                          {student.status.replace("-", " ")}
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
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <FileBarChart size={48} className="text-gray-400" />
                        <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">No Scores Found</p>
                        <p className="text-xs font-bold text-gray-400">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} Students
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              {buildPageList().map((page, i) => (
                <button
                  key={i}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  disabled={typeof page !== "number"}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                    page === currentPage 
                      ? "bg-[#7d1a1a] text-white"
                      : typeof page === "number"
                      ? "text-gray-600 hover:bg-gray-100"
                      : "text-gray-400 cursor-default"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#7d1a1a]" />
          </div>
        ) : scores.length > 0 ? scores.map((student, i) => {
          const statusColors = getStatusColor(student.status);
          return (
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
                    {student.studentId}
                  </p>
                  <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                    <span className={`text-xl xs:text-2xl font-black ${getGradeColor(student.grade)}`}>
                      {student.grade}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[8px] xs:text-[9px] font-black uppercase ${statusColors.bg} ${statusColors.text}`}>
                      <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${statusColors.dot}`} />
                      {student.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="mb-3 xs:mb-4">
                <div className="flex items-center justify-between mb-1.5 xs:mb-2">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Average Score</span>
                  <span className="text-sm xs:text-base font-black text-gray-900">{student.averageScore.toFixed(1)}%</span>
                </div>
                <div className="h-2 xs:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      student.averageScore >= 90 ? 'bg-emerald-500' :
                      student.averageScore >= 75 ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${student.averageScore}%` }}
                  />
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Exams Taken:</span>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <BookOpen size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                    <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                      {student.examsTaken}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Highest Score:</span>
                  <span className="text-[10px] xs:text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp size={12} className="xs:w-3.5 xs:h-3.5" /> {student.highestScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Lowest Score:</span>
                  <span className="text-[10px] xs:text-xs font-bold text-red-600 flex items-center gap-1">
                    <TrendingDown size={12} className="xs:w-3.5 xs:h-3.5" /> {student.lowestScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Last Exam:</span>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <Calendar size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                    <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                      {formatDate(student.lastExam)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between">
                <button className="text-[10px] xs:text-xs font-bold text-[#7d1a1a] hover:underline">
                  View Full Scorecard
                </button>
                <button 
                  className="p-2 xs:p-2.5 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg xs:rounded-xl transition-all active:scale-95"
                  aria-label="More options"
                >
                  <MoreHorizontal size={16} className="xs:w-[18px] xs:h-[18px]" />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-3 xs:mb-4">
              <FileBarChart size={32} className="text-gray-400 xs:w-10 xs:h-10" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">
              No Scores Found
            </p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">
              Try adjusting your filters for {selectedCourse}
            </p>
          </div>
        )}

        {/* Mobile Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
            <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] xs:tracking-widest text-center mb-3 xs:mb-4">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} Students
            </p>
            <div className="flex items-center justify-center gap-1.5 xs:gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
                aria-label="Previous page"
              >
                <ChevronLeft size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
              {buildPageList().map((page, i) => (
                <button
                  key={i}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  disabled={typeof page !== "number"}
                  className={`w-8 h-8 xs:w-9 xs:h-9 rounded-lg text-[10px] xs:text-xs font-bold ${
                    page === currentPage 
                      ? "bg-[#7d1a1a] text-white"
                      : typeof page === "number"
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="p-1.5 xs:p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
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