"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Filter, Edit3, Trash2, Layers, ChevronLeft,
  ChevronRight, X, Download, AlertCircle,
  Loader2, FileSpreadsheet, BookOpen, ArrowLeft, FileText,
  GraduationCap, FolderTree, Power, FileUp,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import PDFImportModal from "@/components/bsaben-questions/PDFImportModal";
import AreaModal from "@/components/bsaben-questions/AreaModal";
import SubjectModal from "@/components/bsaben-questions/SubjectModal";
import ImportResultModal from "@/components/bsaben-questions/ImportResultModal";
import QuestionModal from "@/components/bsaben-questions/QuestionModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Area {
  _id: string;
  name: string;
  description?: string;
  timer: number; // in seconds
  subjectCount: number;
  questionCount: number;
  createdAt: string;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
  area: string;
  questionCount: number;
  createdAt: string;
}

interface Question {
  _id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  area: string;
  subject: string;
  explanation?: string;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; text: string }>;
  duplicatesInFile: Array<{ row: number; text: string }>;
  duplicatesInDb: Array<{ row: number; text: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTY_STYLES: Record<string, string> = {
  Hard: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Easy: "bg-emerald-50 text-emerald-600",
};

const DIFFICULTY_DOT: Record<string, string> = {
  Hard: "bg-red-500",
  Medium: "bg-amber-500",
  Easy: "bg-emerald-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const secondsToHMS = (total: number) => ({
  timerHH: String(Math.floor(total / 3600)).padStart(2, "0"),
  timerMM: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
  timerSS: String(total % 60).padStart(2, "0"),
});

const EMPTY_AREA_FORM = { name: "", description: "", timerHH: "00", timerMM: "00", timerSS: "00" };

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function BSABENQuestionsPage() {
  const { user } = useAuth();
  const USER_ID = user?.id;

  const [currentView, setCurrentView] = useState<"areas" | string>("areas");
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Areas state
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaForm, setAreaForm] = useState(EMPTY_AREA_FORM);
  const [savingArea, setSavingArea] = useState(false);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", timerHH: "00", timerMM: "00", timerSS: "00" });
  const [savingSubject, setSavingSubject] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState("");

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [showPDFImportModal, setShowPDFImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchAreas = useCallback(async () => {
    if (!USER_ID) return;
    setLoadingAreas(true);
    setError("");
    try {
      const params = new URLSearchParams({ course: "BSABEN" });
      if (areaSearchQuery) params.set("search", areaSearchQuery);
      const res = await fetch(`/api/areas?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch areas"); return; }
      setAreas(data.areas || []);
    } catch { setError("Failed to load areas"); }
    finally { setLoadingAreas(false); }
  }, [USER_ID, areaSearchQuery]);

  const fetchSubjects = useCallback(async () => {
    if (!USER_ID || !selectedArea) return;
    setLoadingSubjects(true);
    setError("");
    try {
      const params = new URLSearchParams({ course: "BSABEN", area: selectedArea.name });
      if (subjectSearchQuery) params.set("search", subjectSearchQuery);
      const res = await fetch(`/api/subjects?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch subjects"); return; }
      setSubjects(data.subjects || []);
    } catch { setError("Failed to load subjects"); }
    finally { setLoadingSubjects(false); }
  }, [USER_ID, selectedArea, subjectSearchQuery]);

  const fetchQuestions = useCallback(async () => {
    if (!USER_ID || !selectedSubject) return;
    setLoadingQuestions(true);
    setError("");
    try {
      const params = new URLSearchParams({
        course: "BSABEN",
        area: selectedSubject.area,
        subject: selectedSubject.name,
        page: String(currentPage),
        limit: "12",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (filterCategory) params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (filterStatus !== "all") params.set("isActive", filterStatus === "active" ? "true" : "false");
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch questions"); return; }
      setQuestions(data.questions || []);
      setPagination(data.pagination || null);
    } catch { setError("Failed to load questions"); }
    finally { setLoadingQuestions(false); }
  }, [USER_ID, selectedSubject, currentPage, searchQuery, filterCategory, filterDifficulty, filterStatus]);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { if (currentView === "areas") fetchAreas(); }, [currentView, fetchAreas]);
  useEffect(() => { if (currentView.startsWith("area-") && selectedArea) fetchSubjects(); }, [currentView, selectedArea, fetchSubjects]);
  useEffect(() => { if (currentView.startsWith("subject-") && selectedSubject) fetchQuestions(); }, [currentView, selectedSubject, fetchQuestions]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory, filterDifficulty, filterStatus]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (question: Question) => {
    if (!USER_ID) return;
    try {
      const res = await fetch(`/api/questions/${question._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, isActive: !question.isActive, userId: USER_ID }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to update question status"); return; }
      fetchQuestions();
    } catch { setError("Failed to update question status"); }
  };

  const handleBackNavigation = () => {
    if (currentView.startsWith("subject-")) {
      setCurrentView(`area-${selectedArea?.name}`);
      setSelectedSubject(null);
      setQuestions([]);
      setPagination(null);
    } else if (currentView.startsWith("area-")) {
      setCurrentView("areas");
      setSelectedArea(null);
      setSubjects([]);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!USER_ID || !confirm("Delete this question? This cannot be undone.")) return;
    await fetch(`/api/questions/${id}?userId=${USER_ID}`, { method: "DELETE" });
    fetchQuestions(); fetchSubjects(); fetchAreas();
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await fetch("/api/questions/template?course=BSABEN");
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "bsaben_questions_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloadingTemplate(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !USER_ID) return;
    e.target.value = "";
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("userId", USER_ID); fd.append("course", "BSABEN");
      const res = await fetch("/api/questions/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Import failed"); return; }
      setImportResult(data.result);
      fetchQuestions(); fetchSubjects(); fetchAreas();
    } finally { setImporting(false); }
  };

  // Area handlers
  const openAddArea = () => {
    setEditingArea(null);
    setAreaForm(EMPTY_AREA_FORM);
    setShowAreaModal(true);
  };

  const openEditArea = (area: Area) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, description: area.description || "", ...secondsToHMS(area.timer) });
    setShowAreaModal(true);
  };

  const handleSaveArea = async () => {
    if (!USER_ID) return;
    if (!areaForm.name.trim()) { setError("Area name is required"); return; }
    setSavingArea(true);
    setError("");
    try {
      const url = editingArea ? `/api/areas/${editingArea._id}` : "/api/areas";
      const res = await fetch(url, {
        method: editingArea ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...areaForm, course: "BSABEN", userId: USER_ID }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save area"); return; }
      setShowAreaModal(false);
      fetchAreas();
    } finally { setSavingArea(false); }
  };

  const handleDeleteArea = async (area: Area) => {
    if (!USER_ID || !confirm(`Delete "${area.name}"? ${area.questionCount > 0 ? `This area has ${area.questionCount} question(s).` : ""}`)) return;
    try {
      const res = await fetch(`/api/areas/${area._id}?userId=${USER_ID}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete area"); return; }
      fetchAreas();
    } catch { alert("Failed to delete area"); }
  };

  // Subject handlers
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", description: "", timerHH: "00", timerMM: "00", timerSS: "00" });
    setShowSubjectModal(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({ name: subject.name, description: subject.description || "", timerHH: "00", timerMM: "00", timerSS: "00" });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!USER_ID || !selectedArea) return;
    if (!subjectForm.name.trim()) { setError("Subject name is required"); return; }
    setSavingSubject(true);
    setError("");
    try {
      const url = editingSubject ? `/api/subjects/${editingSubject._id}` : "/api/subjects";
      const res = await fetch(url, {
        method: editingSubject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subjectForm, course: "BSABEN", area: selectedArea.name, userId: USER_ID }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save subject"); return; }
      setShowSubjectModal(false);
      fetchSubjects(); fetchAreas();
    } finally { setSavingSubject(false); }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!USER_ID || !confirm(`Delete "${subject.name}"? ${subject.questionCount > 0 ? `This subject has ${subject.questionCount} question(s).` : ""}`)) return;
    try {
      const res = await fetch(`/api/subjects/${subject._id}?userId=${USER_ID}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete subject"); return; }
      fetchSubjects(); fetchAreas();
    } catch { alert("Failed to delete subject"); }
  };

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = pagination?.totalPages ?? 1;
  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // ─── Misc helpers ─────────────────────────────────────────────────────────────
  const breadcrumbs = () => {
    if (currentView === "areas") return "Areas";
    if (currentView.startsWith("area-")) return `${selectedArea?.name || ""} / Subjects`;
    if (currentView.startsWith("subject-")) return `${selectedArea?.name || ""} / ${selectedSubject?.name || ""} / Questions`;
    return "";
  };
  const shortId = (id: string) => `ABE-${id.slice(-4).toUpperCase()}`;

  const formatTimer = (seconds: number): string | null => {
    if (!seconds || seconds <= 0) return null;
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    return [hh, mm, ss].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Modals ── */}
      {showQuestionModal && USER_ID && (
        <QuestionModal
          editQuestion={editingQuestion}
          onClose={() => { setShowQuestionModal(false); setEditingQuestion(null); }}
          onSaved={() => { fetchQuestions(); fetchSubjects(); fetchAreas(); }}
          userId={USER_ID}
          defaultArea={selectedArea?.name}
          defaultSubject={selectedSubject?.name}
        />
      )}

      {showAreaModal && (
        <AreaModal
          editingArea={editingArea}
          areaForm={areaForm}
          setAreaForm={setAreaForm}
          onClose={() => { setShowAreaModal(false); setError(""); }}
          onSave={handleSaveArea}
          saving={savingArea}
          error={error}
        />
      )}

      {showSubjectModal && (
        <SubjectModal
          editingSubject={editingSubject}
          selectedAreaName={selectedArea?.name || ""}
          subjectForm={subjectForm}
          setSubjectForm={setSubjectForm}
          onClose={() => { setShowSubjectModal(false); setError(""); }}
          onSave={handleSaveSubject}
          saving={savingSubject}
          error={error}
        />
      )}

      {importResult && (
        <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
      )}

      {showPDFImportModal && USER_ID && (
        <PDFImportModal
          isOpen={showPDFImportModal}
          onClose={() => setShowPDFImportModal(false)}
          onSuccess={() => { fetchQuestions(); fetchSubjects(); fetchAreas(); }}
          userId={USER_ID}
          course="BSABEN"
          defaultArea={selectedArea?.name}
          defaultSubject={selectedSubject?.name}
        />
      )}

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

      {/* ── Header ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            {currentView !== "areas" && (
              <button onClick={handleBackNavigation} className="p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0">
                <ArrowLeft size={20} className="text-slate-800 cursor-pointer" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="text-[#7d1a1a]" size={16} />
                <span className="text-[#7d1a1a] font-bold text-[10px] uppercase tracking-widest">BSABEN Question Bank</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{breadcrumbs()}</h1>
              {currentView.startsWith("subject-") && pagination && (
                <p className="text-sm text-gray-500 mt-1">{pagination.total} questions total</p>
              )}
            </div>
          </div>

          {currentView === "areas" && (
            <button onClick={openAddArea} className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all">
              <Plus size={18} /> Add Area
            </button>
          )}
          {currentView.startsWith("area-") && (
            <button onClick={openAddSubject} className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all">
              <Plus size={18} /> Add Subject
            </button>
          )}
          {currentView.startsWith("subject-") && (
            <div className="flex items-center gap-2.5">
              <button onClick={handleDownloadTemplate} disabled={downloadingTemplate} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60">
                {downloadingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />} Excel
              </button>
              <button onClick={() => setShowPDFImportModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all">
                <FileUp size={14} /> PDF
              </button>
              <button onClick={() => { setEditingQuestion(null); setShowQuestionModal(true); }} className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all">
                <Plus size={18} /> New Question
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* ── Areas View ── */}
      {currentView === "areas" && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text" placeholder="Search areas..." value={areaSearchQuery}
                onChange={(e) => setAreaSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAreas ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
              </div>
            ) : areas.length > 0 ? areas.map((area) => (
              <div key={area._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
                    <FolderTree size={24} className="text-[#7d1a1a]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditArea(area)} className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDeleteArea(area)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3
                  className="text-lg font-black text-gray-900 mb-2 cursor-pointer hover:text-[#7d1a1a] transition-colors"
                  onClick={() => { setSelectedArea(area); setCurrentView(`area-${area.name}`); }}
                >
                  {area.name}
                </h3>
                {area.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{area.description}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {area.subjectCount} subjects
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {area.questionCount} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {formatTimer(area.timer) && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#7d1a1a] bg-[#7d1a1a]/8 px-2 py-1 rounded-lg font-mono tracking-wide">
                        <Clock size={11} />
                        {formatTimer(area.timer)}
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedArea(area); setCurrentView(`area-${area.name}`); }}
                      className="text-xs font-bold text-[#7d1a1a] hover:underline"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <FolderTree size={48} className="text-gray-300 mb-4" />
                <p className="font-black uppercase tracking-widest text-sm text-gray-500 mb-1">No Areas Found</p>
                <p className="text-xs text-gray-400 mb-4">Create your first area to organize subjects</p>
                <button onClick={openAddArea} className="flex items-center gap-2 px-4 py-2 bg-[#7d1a1a] text-white rounded-xl font-bold text-xs hover:bg-[#5a1313] transition-all">
                  <Plus size={14} /> Add Area
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Subjects View ── */}
      {currentView.startsWith("area-") && selectedArea && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text" placeholder="Search subjects..." value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSubjects ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
              </div>
            ) : subjects.length > 0 ? subjects.map((subject) => (
              <div key={subject._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} className="text-[#7d1a1a]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditSubject(subject)} className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDeleteSubject(subject)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3
                  className="text-lg font-black text-gray-900 mb-2 cursor-pointer hover:text-[#7d1a1a] transition-colors"
                  onClick={() => { setSelectedSubject(subject); setCurrentView(`subject-${subject.name}`); }}
                >
                  {subject.name}
                </h3>
                {subject.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{subject.description}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-600">
                    {subject.questionCount} question{subject.questionCount !== 1 ? "s" : ""}
                  </div>
                  <button onClick={() => { setSelectedSubject(subject); setCurrentView(`subject-${subject.name}`); }} className="text-xs font-bold text-[#7d1a1a] hover:underline">
                    View →
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <BookOpen size={48} className="text-gray-300 mb-4" />
                <p className="font-black uppercase tracking-widest text-sm text-gray-500 mb-1">No Subjects Found</p>
                <p className="text-xs text-gray-400 mb-4">Add subjects to this area</p>
                <button onClick={openAddSubject} className="flex items-center gap-2 px-4 py-2 bg-[#7d1a1a] text-white rounded-xl font-bold text-xs hover:bg-[#5a1313] transition-all">
                  <Plus size={14} /> Add Subject
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Questions View ── */}
      {currentView.startsWith("subject-") && selectedSubject && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text" placeholder="Search questions..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 border rounded-xl transition-all ${showFilters ? "bg-[#7d1a1a] text-white" : "border-gray-200 text-gray-500"}`}
              >
                <Filter size={16} />
              </button>
            </div>

            {showFilters && (
              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="text" placeholder="Category..." value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
                  <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                    <option value="">All Difficulties</option>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                  <button onClick={() => { setFilterCategory(""); setFilterDifficulty(""); setFilterStatus("all"); }}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition-all">
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-5 w-[8%]">ID</th>
                  <th className="px-6 py-5 w-[32%]">Question</th>
                  <th className="px-6 py-5 w-[14%]">Category</th>
                  <th className="px-6 py-5 w-[10%]">Difficulty</th>
                  <th className="px-6 py-5 w-[10%]">Status</th>
                  <th className="px-6 py-5 w-[26%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingQuestions ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center"><Loader2 size={24} className="animate-spin text-[#7d1a1a] mx-auto" /></td></tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No questions found</p>
                    </td>
                  </tr>
                ) : questions.map((q) => (
                  <tr key={q._id} className={`hover:bg-gray-50/80 group ${!q.isActive ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4"><span className="text-xs font-black text-[#7d1a1a]">{shortId(q._id)}</span></td>
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-gray-700 line-clamp-2">{q.questionText}</p></td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2.5 py-1.5 rounded-lg">{q.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${DIFFICULTY_STYLES[q.difficulty]}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[q.difficulty]}`} />{q.difficulty}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${q.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${q.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {q.isActive ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleStatus(q)} title={q.isActive ? "Deactivate" : "Activate"}
                          className={`p-2 rounded-xl transition-all ${q.isActive ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                          <Power size={16} />
                        </button>
                        <button onClick={() => { setEditingQuestion(q); setShowQuestionModal(true); }}
                          className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-5 border-t bg-gray-50/50 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-gray-400 disabled:opacity-20">
                    <ChevronLeft size={20} />
                  </button>
                  {buildPageList().map((p, i) => (
                    <button key={i} onClick={() => typeof p === "number" && setCurrentPage(p)} disabled={typeof p !== "number"}
                      className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black border ${
                        p === currentPage ? "bg-[#7d1a1a] text-white border-[#7d1a1a]"
                        : typeof p === "number" ? "bg-white border-gray-200 text-gray-500"
                        : "bg-transparent border-transparent text-gray-400"
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-400 disabled:opacity-20">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}