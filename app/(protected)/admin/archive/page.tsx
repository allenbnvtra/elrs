"use client";

import React, { useState, useEffect } from "react";
import { 
  Archive, RotateCcw, Trash2, Search, Filter, 
  Calendar, FolderOpen, FileText, Video, HelpCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, AlertTriangle,
  Clock, User, X, Download, Eye, Loader2, Check,
  GraduationCap, Users, BookOpen, CheckSquare, Square
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface ArchiveItem {
  _id: string;
  type: string;
  title: string;
  description?: string;
  course?: string;
  originalId: string;
  originalCollection: string;
  archivedBy: string;
  archivedByName: string;
  archivedByRole: string;
  archivedAt: string;
  reason?: string;
  originalData: any;
  itemCount?: number;
  tags?: string[];
  canRestore: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArchiveStats {
  totalArchived: number;
  byType: {
    exam: number;
    material: number;
    questions: number;
    subject: number;
    student: number;
    faculty: number;
  };
  byCourse: {
    BSABEN: number;
    BSGE: number;
  };
  recentlyArchived: number;
}

export default function ArchivePage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch archives
  const fetchArchives = async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(selectedType !== "all" && { type: selectedType }),
        ...(selectedCourse !== "all" && { course: selectedCourse }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/archives?${params}`);
      const data = await response.json();

      if (response.ok) {
        setArchives(data.archives);
        setStats(data.stats);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || "Failed to fetch archives");
      }
    } catch (error) {
      console.error("Error fetching archives:", error);
      setError("Failed to fetch archives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, [selectedType, selectedCourse, searchQuery, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedCourse, searchQuery]);

  // Handle restore
  const handleRestore = async (archiveId: string) => {
    if (!confirm("Are you sure you want to restore this item?")) return;

    try {
      setIsRestoring(archiveId);
      const response = await fetch("/api/archives/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId, userId: user?.id })
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Item restored successfully!");
        fetchArchives();
        setSelectedItems(prev => prev.filter(id => id !== archiveId));
      } else {
        alert("❌ " + (data.error || "Failed to restore item"));
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      alert("❌ Failed to restore item. Please try again.");
    } finally {
      setIsRestoring(null);
    }
  };

  // Handle delete
  const handleDelete = async (archiveId: string) => {
    if (!confirm("⚠️ Are you sure you want to permanently delete this archive?\n\nThis action cannot be undone!")) return;

    try {
      setIsDeleting(archiveId);
      const response = await fetch(`/api/archives/${archiveId}?userId=${user?.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Archive permanently deleted");
        fetchArchives();
        setSelectedItems(prev => prev.filter(id => id !== archiveId));
      } else {
        alert("❌ " + (data.error || "Failed to delete archive"));
      }
    } catch (error) {
      console.error("Error deleting archive:", error);
      alert("❌ Failed to delete archive. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: "restore" | "delete" | "export") => {
    if (selectedItems.length === 0) {
      alert("⚠️ Please select items first");
      return;
    }

    if (action === "delete") {
      if (!confirm(`⚠️ Are you sure you want to permanently delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?\n\nThis action cannot be undone!`)) {
        return;
      }
    } else if (action === "restore") {
      if (!confirm(`✅ Restore ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`)) {
        return;
      }
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/archives/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          archiveIds: selectedItems,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (action === "export") {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `archives-export-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          alert(`✅ Exported ${data.count} archive${data.count > 1 ? 's' : ''}`);
        } else {
          alert("✅ " + data.message);
          setSelectedItems([]);
          fetchArchives();
        }
      } else {
        alert("❌ " + (data.error || "Bulk operation failed"));
      }
    } catch (error) {
      console.error("Error in bulk operation:", error);
      alert("❌ Bulk operation failed. Please try again.");
    } finally {
      setIsLoading(false);
      setShowBulkActions(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all visible items
  const toggleSelectAll = () => {
    if (selectedItems.length === archives.length && archives.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(archives.map(a => a._id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "exam": return FileText;
      case "material": return Video;
      case "questions": return HelpCircle;
      case "subject": return BookOpen;
      case "student": return Users;
      case "faculty": return GraduationCap;
      default: return FolderOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "exam": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "material": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
      case "questions": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "subject": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
      case "student": return { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" };
      case "faculty": return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
      default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const isAllSelected = selectedItems.length === archives.length && archives.length > 0;

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <AlertTriangle className="text-amber-500" size={16} />
            <span className="text-amber-600 font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Archived Content Management
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Archive Center
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 xs:gap-2.5 w-full sm:w-auto">
          <button 
            onClick={() => handleBulkAction("export")}
            disabled={selectedItems.length === 0}
            className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 px-4 xs:px-5 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} className="xs:w-[18px] xs:h-[18px]" />
            <span className="truncate">Export</span>
            {selectedItems.length > 0 && (
              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-black ml-1">
                {selectedItems.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={selectedItems.length === 0}
            className="flex items-center justify-center gap-1.5 xs:gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold hover:bg-amber-100 transition-all text-xs xs:text-sm active:scale-95 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
            <span className="truncate">Bulk Actions</span>
            {selectedItems.length > 0 && (
              <span className="bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-black ml-1">
                {selectedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl xs:rounded-2xl p-3 xs:p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-4">
            <p className="text-xs xs:text-sm font-bold text-amber-900">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button
                onClick={() => handleBulkAction("restore")}
                className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-4 py-2 xs:py-2.5 bg-emerald-600 text-white rounded-lg xs:rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Restore All</span>
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-4 py-2 xs:py-2.5 bg-red-600 text-white rounded-lg xs:rounded-xl font-bold text-xs hover:bg-red-700 transition-all active:scale-95"
              >
                <Trash2 size={14} />
                <span>Delete All</span>
              </button>
              <button
                onClick={() => {
                  setSelectedItems([]);
                  setShowBulkActions(false);
                }}
                className="p-2 xs:p-2.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-all flex-shrink-0"
                aria-label="Close bulk actions"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 animate-in slide-in-from-top-2 duration-300">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold flex-1">{error}</p>
          <button onClick={() => setError("")} className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-all" aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gray-900/5 rounded-xl xs:rounded-2xl flex items-center justify-center text-gray-900 flex-shrink-0">
                <Archive size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Total Items
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.totalArchived}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                <FileText size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Exams
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.byType.exam}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-purple-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
                <Video size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Materials
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.byType.material}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-amber-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                <HelpCircle size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Questions
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {stats.byType.questions}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Type Filter Tabs */}
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar gap-0.5">
          {["all", "exam", "material", "questions", "subject", "student", "faculty"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-shrink-0 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedType === type 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "all" ? "All Items" : type}
            </button>
          ))}
        </div>

        {/* Search and Course Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search archive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all"
          >
            <option value="all">All Courses</option>
            <option value="BSABEN">BSABEN</option>
            <option value="BSGE">BSGE</option>
          </select>

          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all whitespace-nowrap"
          >
            {isAllSelected ? (
              <CheckSquare size={14} className="text-[#7d1a1a]" />
            ) : (
              <Square size={14} />
            )}
            <span className="hidden xs:inline">Select All</span>
            <span className="xs:hidden">All</span>
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile/tablet) */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
            <p className="text-sm font-medium text-gray-500">Loading archives...</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-5 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#7d1a1a] focus:ring-[#7d1a1a] cursor-pointer"
                      />
                    </th>
                    <th className="px-8 py-5">Item Details</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Course</th>
                    <th className="px-6 py-5">Archived By</th>
                    <th className="px-6 py-5">Archive Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {archives.length > 0 ? archives.map((item, i) => {
                    const TypeIcon = getTypeIcon(item.type);
                    const typeColors = getTypeColor(item.type);
                    const isSelected = selectedItems.includes(item._id);
                    return (
                      <tr key={i} className={`hover:bg-gray-50/50 transition-colors group ${isSelected ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item._id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#7d1a1a] focus:ring-[#7d1a1a] cursor-pointer"
                          />
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${typeColors.bg} flex items-center justify-center ${typeColors.text} flex-shrink-0`}>
                              <TypeIcon size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-900 leading-none truncate">{item.title}</p>
                              {item.reason && (
                                <p className="text-[11px] text-gray-400 font-medium mt-1 italic truncate">{item.reason}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-gray-700">{item.course || "N/A"}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">{item.archivedByName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar size={14} />
                            <span className="text-xs font-bold">{formatDate(item.archivedAt)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleRestore(item._id)}
                              disabled={!item.canRestore || isRestoring === item._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Restore item"
                            >
                              {isRestoring === item._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RotateCcw size={14} />
                              )}
                              Restore
                            </button>
                            <button 
                              onClick={() => handleDelete(item._id)}
                              disabled={isDeleting === item._id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 active:scale-95"
                              aria-label="Delete permanently"
                            >
                              {isDeleting === item._id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30">
                          <Archive size={48} className="text-gray-400" />
                          <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">Archive Empty</p>
                          <p className="text-xs font-bold text-gray-400 mt-1">No archived items found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {archives.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {archives.length} of {total} Items
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95" 
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-2 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white min-w-[3rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95" 
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MOBILE/TABLET CARD VIEW (visible only on mobile/tablet) */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-[#7d1a1a]" size={28} />
            <p className="text-xs xs:text-sm font-medium text-gray-500">Loading archives...</p>
          </div>
        ) : archives.length > 0 ? (
          <>
            {archives.map((item, i) => {
              const TypeIcon = getTypeIcon(item.type);
              const typeColors = getTypeColor(item.type);
              const isSelected = selectedItems.includes(item._id);
              return (
                <div 
                  key={i} 
                  className={`bg-white rounded-xl xs:rounded-2xl border shadow-sm p-3 xs:p-4 hover:shadow-md transition-all ${isSelected ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-200' : 'border-gray-200'}`}
                >
                  {/* Selection Checkbox */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => toggleItemSelection(item._id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[#7d1a1a] flex-shrink-0" />
                      ) : (
                        <Square size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-600">
                        {isSelected ? "Selected" : "Tap to select"}
                      </span>
                    </button>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
                    <div className={`w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl ${typeColors.bg} flex items-center justify-center ${typeColors.text} flex-shrink-0`}>
                      <TypeIcon size={22} className="xs:w-6 xs:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm xs:text-base font-black text-gray-900 leading-tight mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border text-[8px] xs:text-[9px] font-black uppercase ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}>
                          {item.type}
                        </span>
                        {item.course && (
                          <span className="text-[8px] xs:text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded uppercase">
                            {item.course}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-2 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Archived By:</span>
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                        <span className="text-[10px] xs:text-xs font-bold text-gray-700 truncate max-w-[150px]">
                          {item.archivedByName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Date:</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                        <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                          {formatDate(item.archivedAt)}
                        </span>
                      </div>
                    </div>
                    {item.itemCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Items:</span>
                        <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                          {item.itemCount} item{item.itemCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {item.reason && (
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Reason:</span>
                        <span className="text-[10px] xs:text-xs font-medium text-gray-600 italic text-right max-w-[60%] line-clamp-2">
                          {item.reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRestore(item._id)}
                      disabled={!item.canRestore || isRestoring === item._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRestoring === item._id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Restoring...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      disabled={isDeleting === item._id}
                      className="p-2 xs:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0 disabled:opacity-50"
                      aria-label="Delete permanently"
                    >
                      {isDeleting === item._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
                <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3 xs:mb-4">
                  Page {currentPage} of {totalPages} • {total} total items
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95" 
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white min-w-[5rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95" 
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Archive size={32} className="text-gray-400" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">
              Archive Empty
            </p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">
              No archived items match your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}