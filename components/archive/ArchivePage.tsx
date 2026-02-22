"use client";

import React, { useState, useEffect } from "react";
import {
  Archive, RotateCcw, Trash2, Search,
  Calendar, FolderOpen, FileText, Video, HelpCircle,
  ChevronLeft, ChevronRight, AlertTriangle,
  User, X, Download, Loader2,
  GraduationCap, Users, BookOpen, CheckSquare, Square,
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
  originalData: unknown;
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
  byCourse: { BSABEN: number; BSGE: number };
  recentlyArchived: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  exam:      FileText,
  material:  Video,
  questions: HelpCircle,
  subject:   BookOpen,
  student:   Users,
  faculty:   GraduationCap,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  exam:      { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  material:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  questions: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  subject:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  student:   { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"   },
  faculty:   { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
};

const DEFAULT_TYPE_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default function ArchivePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [selectedType, setSelectedType]     = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [archives, setArchives]             = useState<ArchiveItem[]>([]);
  const [stats, setStats]                   = useState<ArchiveStats | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState("");
  const [selectedItems, setSelectedItems]   = useState<string[]>([]);
  const [isRestoring, setIsRestoring]       = useState<string | null>(null);
  const [isDeleting, setIsDeleting]         = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [total, setTotal]                   = useState(0);

  const fetchArchives = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        userId: user.id,
        page:   currentPage.toString(),
        limit:  "20",
      });
      if (selectedType !== "all")   params.set("type",   selectedType);
      if (searchQuery)              params.set("search", searchQuery);
      // Only send course filter for admin — backend scopes faculty automatically
      if (isAdmin && selectedCourse !== "all") params.set("course", selectedCourse);

      const res  = await fetch(`/api/archives?${params}`);
      const data = await res.json();

      if (res.ok) {
        setArchives(data.archives);
        setStats(data.stats);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || "Failed to fetch archives");
      }
    } catch {
      setError("Failed to fetch archives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchArchives(); }, [selectedType, selectedCourse, searchQuery, currentPage, user?.id]);
  useEffect(() => { setCurrentPage(1); }, [selectedType, selectedCourse, searchQuery]);

  const handleRestore = async (archiveId: string) => {
    if (!confirm("Are you sure you want to restore this item?")) return;
    setIsRestoring(archiveId);
    try {
      const res  = await fetch("/api/archives/restore", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ archiveId, userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Item restored successfully!");
        setSelectedItems(prev => prev.filter(id => id !== archiveId));
        fetchArchives();
      } else {
        alert("❌ " + (data.error || "Failed to restore item"));
      }
    } catch {
      alert("❌ Failed to restore item. Please try again.");
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDelete = async (archiveId: string) => {
    if (!confirm("⚠️ Are you sure you want to permanently delete this archive?\n\nThis action cannot be undone!")) return;
    setIsDeleting(archiveId);
    try {
      const res  = await fetch(`/api/archives/${archiveId}?userId=${user?.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Archive permanently deleted");
        setSelectedItems(prev => prev.filter(id => id !== archiveId));
        fetchArchives();
      } else {
        alert("❌ " + (data.error || "Failed to delete archive"));
      }
    } catch {
      alert("❌ Failed to delete archive. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkAction = async (action: "restore" | "delete" | "export") => {
    if (selectedItems.length === 0) { alert("⚠️ Please select items first"); return; }

    if (action === "delete" && !confirm(`⚠️ Permanently delete ${selectedItems.length} item(s)? This cannot be undone!`)) return;
    if (action === "restore" && !confirm(`Restore ${selectedItems.length} item(s)?`)) return;

    setIsLoading(true);
    try {
      const res  = await fetch("/api/archives/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, archiveIds: selectedItems, userId: user?.id }),
      });
      const data = await res.json();

      if (res.ok) {
        if (action === "export") {
          const a = Object.assign(document.createElement("a"), {
            href:     URL.createObjectURL(new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" })),
            download: `archives-export-${new Date().toISOString().split("T")[0]}.json`,
          });
          a.click();
          URL.revokeObjectURL(a.href);
          alert(`✅ Exported ${data.count} archive(s)`);
        } else {
          alert("✅ " + data.message);
          setSelectedItems([]);
          fetchArchives();
        }
      } else {
        alert("❌ " + (data.error || "Bulk operation failed"));
      }
    } catch {
      alert("❌ Bulk operation failed. Please try again.");
    } finally {
      setIsLoading(false);
      setShowBulkActions(false);
    }
  };

  const toggleItemSelection = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedItems(selectedItems.length === archives.length && archives.length > 0 ? [] : archives.map(a => a._id));

  const isAllSelected = selectedItems.length === archives.length && archives.length > 0;

  // ─── Shared sub-components ────────────────────────────────────────────────

  const PaginationControls = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex items-center ${mobile ? "justify-center gap-2" : "gap-2"}`}>
      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
        className={`${mobile ? "p-2" : "p-2"} text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95`}>
        <ChevronLeft size={mobile ? 16 : 18} />
      </button>
      <span className="px-4 py-2 rounded-lg text-xs font-bold bg-[#7d1a1a] text-white min-w-[3rem] text-center">
        {currentPage} / {totalPages}
      </span>
      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
        className={`${mobile ? "p-2" : "p-2"} text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30 transition-all active:scale-95`}>
        <ChevronRight size={mobile ? 16 : 18} />
      </button>
    </div>
  );

  const ItemActions = ({ item, mobile = false }: { item: ArchiveItem; mobile?: boolean }) => (
    <div className={`flex items-center gap-2 ${mobile ? "" : "justify-end"}`}>
      <button onClick={() => handleRestore(item._id)} disabled={!item.canRestore || isRestoring === item._id}
        className={`${mobile ? "flex-1" : ""} flex items-center justify-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs uppercase tracking-wide hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}>
        {isRestoring === item._id
          ? <><Loader2 size={14} className="animate-spin" /><span>Restoring...</span></>
          : <><RotateCcw size={14} /><span>Restore</span></>}
      </button>
      <button onClick={() => handleDelete(item._id)} disabled={isDeleting === item._id}
        className={`${mobile ? "p-2 xs:p-2.5 border border-gray-200 rounded-xl" : "p-2 rounded-lg"} text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95 flex-shrink-0 disabled:opacity-50`}>
        {isDeleting === item._id ? <Loader2 size={mobile ? 16 : 18} className="animate-spin" /> : <Trash2 size={mobile ? 16 : 18} />}
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center opacity-30">
      <Archive size={48} className="text-gray-400" />
      <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">Archive Empty</p>
      <p className="text-xs font-bold text-gray-400 mt-1">No archived items found</p>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="space-y-4 xs:space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
              <AlertTriangle className="text-amber-500" size={16} />
              <span className="text-amber-600 font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-widest">
                Archived Content Management
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Archive Center</h1>
          </div>

          <div className="flex items-center gap-2 xs:gap-2.5 w-full sm:w-auto">
            <button onClick={() => handleBulkAction("export")} disabled={selectedItems.length === 0}
              className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 px-4 xs:px-5 py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={16} />
              Export
              {selectedItems.length > 0 && (
                <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-black ml-1">{selectedItems.length}</span>
              )}
            </button>
            <button onClick={() => setShowBulkActions(!showBulkActions)} disabled={selectedItems.length === 0}
              className="flex items-center justify-center gap-1.5 xs:gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 xs:px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold hover:bg-amber-100 transition-all text-xs xs:text-sm active:scale-95 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed">
              <AlertTriangle size={16} />
              Bulk Actions
              {selectedItems.length > 0 && (
                <span className="bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-black ml-1">{selectedItems.length}</span>
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
                <button onClick={() => handleBulkAction("restore")}
                  className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-4 py-2 xs:py-2.5 bg-emerald-600 text-white rounded-lg xs:rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95">
                  <RotateCcw size={14} /> Restore All
                </button>
                <button onClick={() => handleBulkAction("delete")}
                  className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-4 py-2 xs:py-2.5 bg-red-600 text-white rounded-lg xs:rounded-xl font-bold text-xs hover:bg-red-700 transition-all active:scale-95">
                  <Trash2 size={14} /> Delete All
                </button>
                <button onClick={() => { setSelectedItems([]); setShowBulkActions(false); }}
                  className="p-2 xs:p-2.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-all flex-shrink-0" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm font-semibold flex-1">{error}</p>
            <button onClick={() => setError("")} className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-all" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          {[
            { label: "Total Items", value: stats.totalArchived, icon: Archive,    bg: "bg-gray-900/5",   color: "text-gray-900"    },
            { label: "Exams",       value: stats.byType.exam,   icon: FileText,   bg: "bg-blue-50",      color: "text-blue-600"    },
            { label: "Materials",   value: stats.byType.material, icon: Video,    bg: "bg-purple-50",    color: "text-purple-600"  },
            { label: "Questions",   value: stats.byType.questions, icon: HelpCircle, bg: "bg-amber-50",  color: "text-amber-600",  span: true },
          ].map(({ label, value, icon: Icon, bg, color, span }) => (
            <div key={label} className={`bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4 ${span ? "xs:col-span-2 lg:col-span-1" : ""}`}>
              <div className={`w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 ${bg} rounded-xl xs:rounded-2xl flex items-center justify-center ${color} flex-shrink-0`}>
                <Icon size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</p>
                <h4 className="text-lg xs:text-xl font-black text-gray-900">{value}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {["all", "exam", "material", "questions", "subject", "student", "faculty"].map((type) => (
            <button key={type} onClick={() => setSelectedType(type)}
              className={`flex-1 min-w-[80px] xs:min-w-0 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedType === type ? "bg-white text-[#7d1a1a] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {type === "all" ? "All Items" : type}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search archive..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Course filter — admin only */}
          {isAdmin && (
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all">
              <option value="all">All Courses</option>
              <option value="BSABEN">BSABEN</option>
              <option value="BSGE">BSGE</option>
            </select>
          )}

          <button onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all whitespace-nowrap">
            {isAllSelected ? <CheckSquare size={14} className="text-[#7d1a1a]" /> : <Square size={14} />}
            <span className="hidden xs:inline">Select All</span>
            <span className="xs:hidden">All</span>
          </button>
        </div>
      </div>

      {/* DATA VIEW */}
      <div className="bg-white rounded-[24px] xs:rounded-[32px] sm:rounded-[48px] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px] xs:min-h-[500px] sm:min-h-[600px]">

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block">
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">
                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#7d1a1a] focus:ring-[#7d1a1a] cursor-pointer" />
                  </th>
                  {["Item Details", "Type", "Course", "Archived By", "Archive Date"].map((h) => (
                    <th key={h} className="px-6 py-4">{h}</th>
                  ))}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <Loader2 size={32} className="animate-spin text-[#7d1a1a] mx-auto" />
                    </td>
                  </tr>
                ) : archives.length > 0 ? archives.map((item) => {
                  const TypeIcon   = TYPE_ICONS[item.type] ?? FolderOpen;
                  const typeColors = TYPE_COLORS[item.type] ?? DEFAULT_TYPE_COLOR;
                  const isSelected = selectedItems.includes(item._id);
                  return (
                    <tr key={item._id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}>
                      <td className="px-6 py-5">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleItemSelection(item._id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#7d1a1a] focus:ring-[#7d1a1a] cursor-pointer" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${typeColors.bg} flex items-center justify-center ${typeColors.text} flex-shrink-0`}>
                            <TypeIcon size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 leading-none truncate">{item.title}</p>
                            {item.reason && <p className="text-[11px] text-gray-400 font-medium mt-1 italic truncate">{item.reason}</p>}
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
                      <td className="px-6 py-5">
                        <ItemActions item={item} />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="py-24 text-center"><EmptyState /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {archives.length > 0 && totalPages > 1 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {archives.length} of {total} Items
              </p>
              <PaginationControls />
            </div>
          )}
        </div>

        {/* MOBILE CARDS */}
        <div className="lg:hidden p-4 xs:p-6 sm:p-10">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
            </div>
          ) : archives.length > 0 ? (
            <>
              <div className="space-y-3 xs:space-y-4">
                {archives.map((item) => {
                  const TypeIcon   = TYPE_ICONS[item.type] ?? FolderOpen;
                  const typeColors = TYPE_COLORS[item.type] ?? DEFAULT_TYPE_COLOR;
                  const isSelected = selectedItems.includes(item._id);
                  return (
                    <div key={item._id}
                      className={`bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl xs:rounded-[24px] p-4 xs:p-5 transition-all ${isSelected ? "bg-blue-50/30 border-blue-200" : ""}`}>
                      <button onClick={() => toggleItemSelection(item._id)} className="flex items-center gap-2 mb-3">
                        {isSelected
                          ? <CheckSquare size={16} className="text-[#7d1a1a]" />
                          : <Square size={16} className="text-gray-400" />}
                        <span className="text-xs font-bold text-gray-600">{isSelected ? "Selected" : "Tap to select"}</span>
                      </button>

                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl ${typeColors.bg} flex items-center justify-center ${typeColors.text} flex-shrink-0`}>
                          <TypeIcon size={22} className="xs:w-6 xs:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm xs:text-base font-black text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
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

                      <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Archived By:</span>
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-gray-400" />
                            <span className="text-[10px] xs:text-xs font-bold text-gray-700 truncate max-w-[150px]">{item.archivedByName}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Date:</span>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            <span className="text-[10px] xs:text-xs font-bold text-gray-700">{formatDate(item.archivedAt)}</span>
                          </div>
                        </div>
                        {item.reason && (
                          <div className="flex items-start justify-between pt-1">
                            <span className="text-[10px] xs:text-xs text-gray-500 font-medium">Reason:</span>
                            <span className="text-[10px] xs:text-xs font-medium text-gray-600 italic text-right max-w-[60%] line-clamp-2">{item.reason}</span>
                          </div>
                        )}
                      </div>

                      <ItemActions item={item} mobile />
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
                  <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3 xs:mb-4">
                    Page {currentPage} of {totalPages} · {total} total items
                  </p>
                  <PaginationControls mobile />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Archive size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">Archive Empty</p>
              <p className="text-[10px] xs:text-xs font-bold text-gray-400">No archived items match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}