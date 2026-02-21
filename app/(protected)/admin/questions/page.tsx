"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Filter, Edit3, Trash2, Layers, ChevronLeft,
  ChevronRight, X, Download, Loader2, FileSpreadsheet,
  BookOpen, ArrowLeft, FileText, GraduationCap, Power, FileUp,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import type { Subject, Question, Pagination, ImportResult } from "@/types/bsge-questions";
import { DIFFICULTY_STYLES, DIFFICULTY_DOT } from "@/components/bsge-questions/constants";
import { QuestionModal } from "@/components/bsge-questions/QuestionModal";
import { ImportResultModal } from "@/components/bsge-questions/ImportResultModal";
import { PDFImportModal } from "@/components/bsge-questions/PDFImportModal";
import { SubjectModal } from "@/components/bsge-questions/SubjectModal";

export default function BSGEQuestionsPage() {
  const { user } = useAuth();
  const USER_ID = user?.id;

  const [currentView, setCurrentView] = useState<"subjects" | string>("subjects");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "" });
  const [savingSubject, setSavingSubject] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showPDFImportModal, setShowPDFImportModal] = useState(false);
  const [error, setError] = useState("");

  // Import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchSubjects = useCallback(async () => {
    if (!USER_ID) return;
    setLoadingSubjects(true);
    setError("");
    try {
      const params = new URLSearchParams({ course: "BSGE" });
      if (subjectSearchQuery) params.set("search", subjectSearchQuery);
      const res = await fetch(`/api/subjects?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch subjects"); return; }
      setSubjects(data.subjects || []);
    } catch { setError("Failed to load subjects"); }
    finally { setLoadingSubjects(false); }
  }, [USER_ID, subjectSearchQuery]);

  const fetchQuestions = useCallback(async () => {
    if (!USER_ID || !selectedSubject) return;
    setLoadingQuestions(true);
    setError("");
    try {
      const params = new URLSearchParams({ course: "BSGE", subject: selectedSubject.name, page: String(currentPage), limit: "12" });
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

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { if (currentView === "subjects") fetchSubjects(); }, [currentView, fetchSubjects]);
  useEffect(() => { if (currentView !== "subjects" && selectedSubject) fetchQuestions(); }, [currentView, selectedSubject, fetchQuestions]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory, filterDifficulty, filterStatus]);

  // ── Subject Handlers ──────────────────────────────────────────────────────

  const openAddSubject = () => { setEditingSubject(null); setSubjectForm({ name: "", description: "" }); setShowSubjectModal(true); };
  const openEditSubject = (s: Subject) => { setEditingSubject(s); setSubjectForm({ name: s.name, description: s.description || "" }); setShowSubjectModal(true); };

  const handleSaveSubject = async () => {
    if (!USER_ID || !subjectForm.name.trim()) { setError("Subject name is required"); return; }
    setSavingSubject(true);
    setError("");
    try {
      const url = editingSubject ? `/api/subjects/${editingSubject._id}` : "/api/subjects";
      const res = await fetch(url, {
        method: editingSubject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subjectForm, course: "BSGE", userId: USER_ID }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save subject"); return; }
      setShowSubjectModal(false);
      fetchSubjects();
    } finally { setSavingSubject(false); }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!USER_ID) return;
    if (!confirm(`Delete "${subject.name}"?${subject.questionCount > 0 ? ` This subject has ${subject.questionCount} question(s).` : ""}`)) return;
    try {
      const res = await fetch(`/api/subjects/${subject._id}?userId=${USER_ID}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete subject"); return; }
      fetchSubjects();
    } catch { alert("Failed to delete subject"); }
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentView(subject.name);
    setCurrentPage(1);
    setSearchQuery(""); setFilterCategory(""); setFilterDifficulty(""); setFilterStatus("all");
  };

  const handleBackToSubjects = () => { setCurrentView("subjects"); setSelectedSubject(null); setQuestions([]); setPagination(null); };

  // ── Question Handlers ─────────────────────────────────────────────────────

  const openAddQuestion = () => { setEditingQuestion(null); setShowQuestionModal(true); };
  const openEditQuestion = (q: Question) => { setEditingQuestion(q); setShowQuestionModal(true); };
  const closeQuestionModal = () => { setShowQuestionModal(false); setEditingQuestion(null); };

  const handleDeleteQuestion = async (id: string) => {
    if (!USER_ID || !confirm("Delete this question? This cannot be undone.")) return;
    await fetch(`/api/questions/${id}?userId=${USER_ID}`, { method: "DELETE" });
    fetchQuestions(); fetchSubjects();
  };

  const handleToggleStatus = async (q: Question) => {
    if (!USER_ID) return;
    try {
      const res = await fetch(`/api/questions/${q._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...q, isActive: !q.isActive, userId: USER_ID }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to update status"); return; }
      fetchQuestions();
    } catch { setError("Failed to update question status"); }
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await fetch("/api/questions/template?course=BSGE");
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "bsge_questions_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloadingTemplate(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !USER_ID) return;
    e.target.value = "";
    setImporting(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("userId", USER_ID); fd.append("course", "BSGE");
      const res = await fetch("/api/questions/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Import failed"); return; }
      setImportResult(data.result); fetchQuestions(); fetchSubjects();
    } finally { setImporting(false); }
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = pagination?.totalPages ?? 1;
  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const shortId = (id: string) => `GE-${id.slice(-4).toUpperCase()}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Modals */}
      {showQuestionModal && USER_ID && (
        <QuestionModal editQuestion={editingQuestion} onClose={closeQuestionModal}
          onSaved={() => { fetchQuestions(); fetchSubjects(); }} userId={USER_ID} defaultSubject={selectedSubject?.name} />
      )}
      {importResult && <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />}
      {showPDFImportModal && USER_ID && (
        <PDFImportModal isOpen={showPDFImportModal} onClose={() => setShowPDFImportModal(false)}
          onSuccess={() => { fetchQuestions(); fetchSubjects(); }} userId={USER_ID} defaultSubject={selectedSubject?.name} />
      )}
      <SubjectModal isOpen={showSubjectModal} isEditing={!!editingSubject} form={subjectForm}
        saving={savingSubject} onChange={setSubjectForm} onSave={handleSaveSubject} onClose={() => setShowSubjectModal(false)} />
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            {currentView !== "subjects" && (
              <button onClick={handleBackToSubjects} className="p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0">
                <ArrowLeft size={20} className="text-slate-800 cursor-pointer" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="text-[#7d1a1a]" size={16} />
                <span className="text-[#7d1a1a] font-bold text-[10px] uppercase tracking-widest">
                  {currentView === "subjects" ? "BSGE Question Bank" : `${pagination?.total || 0} Questions`}
                </span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {currentView === "subjects" ? "Subjects" : selectedSubject?.name}
              </h1>
            </div>
          </div>

          {currentView === "subjects" ? (
            <button onClick={openAddSubject} className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all">
              <Plus size={18} /> Add Subject
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button onClick={handleDownloadTemplate} disabled={downloadingTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60">
                {downloadingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />} Excel
              </button>
              <button onClick={() => setShowPDFImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all">
                <FileUp size={14} /> PDF
              </button>
              <button onClick={openAddQuestion} className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all">
                <Plus size={18} /> New Question
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <X size={16} /><p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Search / Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        {currentView === "subjects" ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search subjects..." value={subjectSearchQuery}
              onChange={(e) => setSubjectSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Search questions..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 border rounded-xl transition-all ${showFilters ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <Filter size={16} />
              </button>
            </div>
            {showFilters && (
              <div className="pt-4 border-t border-gray-100 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="text" placeholder="Filter by category…" value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
                  <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                    <option value="">All Difficulties</option>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
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
          </>
        )}
      </div>

      {/* Content */}
      {currentView === "subjects" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingSubjects ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
            </div>
          ) : subjects.length > 0 ? subjects.map((subject) => (
            <div key={subject._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} className="text-[#7d1a1a]" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditSubject(subject)} className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg transition-all"><Edit3 size={16} /></button>
                  <button onClick={() => handleDeleteSubject(subject)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2">{subject.name}</h3>
              {subject.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{subject.description}</p>}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText size={14} />
                  <span className="text-xs font-bold">{subject.questionCount} Question{subject.questionCount !== 1 ? "s" : ""}</span>
                </div>
                <button onClick={() => handleViewSubject(subject)} className="text-xs font-bold text-[#7d1a1a] hover:underline">View Questions →</button>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center">
              <BookOpen size={48} className="text-gray-300 mb-4" />
              <p className="font-black uppercase tracking-widest text-sm text-gray-500 mb-1">No Subjects Found</p>
              <p className="text-xs text-gray-400 mb-4">Create your first subject to get started</p>
              <button onClick={openAddSubject} className="flex items-center gap-2 px-4 py-2 bg-[#7d1a1a] text-white rounded-xl font-bold text-xs hover:bg-[#5a1313] transition-all">
                <Plus size={14} /> Add Subject
              </button>
            </div>
          )}
        </div>
      ) : (
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
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No questions found</p>
                </td></tr>
              ) : questions.map((q) => (
                <tr key={q._id} className={`hover:bg-gray-50/80 ${!q.isActive ? "opacity-50" : ""}`}>
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
                      <div className={`w-1.5 h-1.5 rounded-full ${q.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />{q.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggleStatus(q)} title={q.isActive ? "Deactivate" : "Activate"}
                        className={`p-2 rounded-xl transition-all ${q.isActive ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                        <Power size={16} />
                      </button>
                      <button onClick={() => openEditQuestion(q)} className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteQuestion(q._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-gray-400 disabled:opacity-20"><ChevronLeft size={20} /></button>
                {buildPageList().map((p, i) => (
                  <button key={i} onClick={() => typeof p === "number" && setCurrentPage(p)} disabled={typeof p !== "number"}
                    className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black border ${p === currentPage ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : typeof p === "number" ? "bg-white border-gray-200 text-gray-500" : "bg-transparent border-transparent text-gray-400"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-400 disabled:opacity-20"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}