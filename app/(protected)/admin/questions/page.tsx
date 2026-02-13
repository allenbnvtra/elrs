'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Filter, Edit3, Trash2, Layers, ChevronLeft,
  ChevronRight, X, Download, CheckCircle2, AlertCircle,
  Loader2, FileSpreadsheet, AlertTriangle, BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  course: "BSABE" | "BSGE";
  subject: string;
  explanation?: string;
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

type FormData = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  course: "BSABE" | "BSGE";
  subject: string;
  explanation: string;
};

const EMPTY_FORM: FormData = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  difficulty: "Medium",
  category: "",
  course: "BSABE",
  subject: "",
  explanation: "",
};

// ─── Style constants ──────────────────────────────────────────────────────────
const DIFFICULTY_STYLES: Record<string, string> = {
  Hard:   "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Easy:   "bg-emerald-50 text-emerald-600",
};
const DIFFICULTY_DOT: Record<string, string> = {
  Hard:   "bg-red-500",
  Medium: "bg-amber-500",
  Easy:   "bg-emerald-500",
};
const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all placeholder:text-gray-400";
const labelCls = "block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5";

// ═══════════════════════════════════════════════════════════════════════════════
// Question Form Modal
// ═══════════════════════════════════════════════════════════════════════════════
function QuestionModal({
  editQuestion,
  onClose,
  onSaved,
  userId,
}: {
  editQuestion: Question | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}) {
  const isEdit = !!editQuestion;

  const [form, setForm] = useState<FormData>(
    isEdit
      ? {
          questionText: editQuestion.questionText,
          optionA: editQuestion.optionA,
          optionB: editQuestion.optionB,
          optionC: editQuestion.optionC ?? "",
          optionD: editQuestion.optionD ?? "",
          correctAnswer: editQuestion.correctAnswer,
          difficulty: editQuestion.difficulty,
          category: editQuestion.category,
          course: editQuestion.course,
          subject: editQuestion.subject,
          explanation: editQuestion.explanation ?? "",
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError("");

    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    if (!form.optionA.trim())      { setError("Option A is required."); return; }
    if (!form.optionB.trim())      { setError("Option B is required."); return; }
    if (form.correctAnswer === "C" && !form.optionC.trim()) {
      setError("Option C is required when it is marked as the correct answer."); return;
    }
    if (form.correctAnswer === "D" && !form.optionD.trim()) {
      setError("Option D is required when it is marked as the correct answer."); return;
    }
    if (!form.category.trim()) { setError("Category is required."); return; }
    if (!form.subject.trim())  { setError("Subject is required."); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        optionC: form.optionC.trim() || undefined,
        optionD: form.optionD.trim() || undefined,
        explanation: form.explanation.trim() || undefined,
        userId,
      };

      const res = await fetch(
        isEdit ? `/api/questions/${editQuestion._id}` : "/api/questions",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Show option C/D fields if they have content OR if they're the correct answer
  const showC = form.optionC.trim().length > 0 || form.correctAnswer === "C" || form.correctAnswer === "D";
  const showD = form.optionD.trim().length > 0 || form.correctAnswer === "D" || showC;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-[#7d1a1a]" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base">
                {isEdit ? "Edit Question" : "New Question"}
              </h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {isEdit ? "Update the question details below" : "Fill in all required fields to add a question"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Row 1: Course · Difficulty · Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Course *</label>
              <select value={form.course} onChange={(e) => set("course", e.target.value)} className={inputCls}>
                <option value="BSABE">BSABE</option>
                <option value="BSGE">BSGE</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Difficulty *</label>
              <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inputCls}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <input
                type="text"
                placeholder="e.g. Hydraulics"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category *</label>
            <input
              type="text"
              placeholder="e.g. Engineering Science, Laws & Ethics, Mathematics"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Question text */}
          <div>
            <label className={labelCls}>Question Text *</label>
            <textarea
              rows={4}
              placeholder="Enter the full question here…"
              value={form.questionText}
              onChange={(e) => set("questionText", e.target.value)}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </div>

          {/* Answer choices */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " mb-0"}>Answer Choices *</label>
              <span className="text-[10px] text-gray-400 font-medium">Click a letter to mark as correct</span>
            </div>

            <div className="space-y-2.5">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                if (letter === "C" && !showC) return null;
                if (letter === "D" && !showD) return null;

                const fieldKey = `option${letter}` as keyof FormData;
                const isCorrect = form.correctAnswer === letter;
                const isOptional = letter === "C" || letter === "D";

                return (
                  <div key={letter} className="flex items-center gap-2.5">
                    {/* Letter badge — click to set correct answer */}
                    <button
                      type="button"
                      onClick={() => set("correctAnswer", letter)}
                      title={`Mark ${letter} as the correct answer`}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border-2 transition-all ${
                        isCorrect
                          ? "bg-[#7d1a1a] text-white border-[#7d1a1a] shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-[#7d1a1a] hover:text-[#7d1a1a]"
                      }`}
                    >
                      {letter}
                    </button>

                    <input
                      type="text"
                      placeholder={isOptional ? `Option ${letter} (optional)` : `Option ${letter} *`}
                      value={form[fieldKey] as string}
                      onChange={(e) => set(fieldKey, e.target.value)}
                      className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                        isCorrect
                          ? "bg-[#7d1a1a]/5 border-[#7d1a1a]/40 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                          : "bg-gray-50 border-gray-200 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      }`}
                    />

                    {isCorrect && (
                      <span className="text-[10px] font-black text-[#7d1a1a] uppercase tracking-wide shrink-0 hidden sm:block">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Progressive reveal buttons */}
              <div className="flex gap-3 pt-1">
                {!showC && (
                  <button
                    type="button"
                    onClick={() => set("optionC", " ")}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Option C
                  </button>
                )}
                {showC && !showD && (
                  <button
                    type="button"
                    onClick={() => set("optionD", " ")}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Option D
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className={labelCls}>
              Explanation{" "}
              <span className="normal-case font-medium text-gray-400 tracking-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief explanation of why the answer is correct…"
              value={form.explanation}
              onChange={(e) => set("explanation", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isEdit ? (
              <CheckCircle2 size={15} />
            ) : (
              <Plus size={15} />
            )}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Import Result Modal
// ═══════════════════════════════════════════════════════════════════════════════
function ImportResultModal({ result, onClose }: { result: ImportResult; onClose: () => void }) {
  const totalDups = result.duplicatesInFile.length + result.duplicatesInDb.length;
  const hasIssues = result.errors.length > 0 || totalDups > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.imported > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              {result.imported > 0 ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Import Complete</h3>
              <p className="text-[11px] text-gray-500 font-medium">{result.imported} imported · {result.skipped} skipped</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={16} className="text-gray-500" /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{result.imported}</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Imported</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{totalDups}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">Duplicates</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-red-600">{result.errors.length}</p>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mt-0.5">Errors</p>
          </div>
        </div>

        {hasIssues && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {result.duplicatesInDb.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle size={12} />Already in Database ({result.duplicatesInDb.length})</p>
                <div className="space-y-1.5">{result.duplicatesInDb.map((d, i) => (<div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-[10px] text-amber-700 font-bold">Row {d.row}</p><p className="text-xs text-amber-600 mt-0.5 line-clamp-2">{d.text}</p></div>))}</div>
              </div>
            )}
            {result.duplicatesInFile.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle size={12} />Duplicate in File ({result.duplicatesInFile.length})</p>
                <div className="space-y-1.5">{result.duplicatesInFile.map((d, i) => (<div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-[10px] text-amber-700 font-bold">Row {d.row}</p><p className="text-xs text-amber-600 mt-0.5 line-clamp-2">{d.text}</p></div>))}</div>
              </div>
            )}
            {result.errors.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={12} />Validation Errors ({result.errors.length})</p>
                <div className="space-y-1.5">{result.errors.map((e, i) => (<div key={i} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2"><p className="text-[10px] text-red-700 font-bold">Row {e.row}</p><p className="text-xs text-red-600 mt-0.5">{e.reason}</p></div>))}</div>
              </div>
            )}
          </div>
        )}

        <div className="p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all">Done</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
function QuestionsPage() {
  const { user } = useAuth();
  const USER_ID = user?.id;

  const [selectedCourse, setSelectedCourse] = useState<"BSABE" | "BSGE">("BSABE");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ course: selectedCourse, page: String(currentPage), limit: "12" });
      if (searchQuery)      params.set("search", searchQuery);
      if (filterCategory)   params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (filterSubject)    params.set("subject", filterSubject);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      if (res.ok) { setQuestions(data.questions); setPagination(data.pagination); }
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, currentPage, searchQuery, filterCategory, filterDifficulty, filterSubject]);

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, searchQuery, filterCategory, filterDifficulty, filterSubject]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditTarget(null); setShowModal(true); };
  const openEdit = (q: Question) => { setEditTarget(q); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleDelete = async (id: string) => {
    if (!USER_ID) { alert("Session not loaded. Please refresh."); return; }
    if (!confirm("Delete this question? This cannot be undone.")) return;
    await fetch(`/api/questions/${id}?userId=${USER_ID}`, { method: "DELETE" });
    fetchQuestions();
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await fetch("/api/questions/template");
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "questions_import_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloadingTemplate(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!USER_ID) { alert("Session not loaded. Please refresh."); return; }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", USER_ID);
      const res = await fetch("/api/questions/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Import failed"); return; }
      setImportResult(data.result);
      fetchQuestions();
    } finally { setImporting(false); }
  };

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages = pagination?.totalPages ?? 1;
  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };
  const shortId = (id: string, course: string) =>
    `${course === "BSABE" ? "ABE" : "GE"}-${id.slice(-4).toUpperCase()}`;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 xs:gap-4 sm:gap-6 w-full max-w-full overflow-hidden">

      {/* Modals */}
      {showModal && USER_ID && (
        <QuestionModal
          editQuestion={editTarget}
          onClose={closeModal}
          onSaved={fetchQuestions}
          userId={USER_ID}
        />
      )}
      {importResult && <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Question Bank</h1>
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5 xs:mt-1">Database Management</p>
        </div>
        <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} disabled={downloadingTemplate}
            className="flex items-center justify-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-[10px] xs:text-xs transition-all disabled:opacity-60">
            {downloadingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden xs:inline">Template</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center justify-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-[10px] xs:text-xs transition-all flex-1 sm:flex-none disabled:opacity-60">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
            <span className="hidden xs:inline">{importing ? "Importing…" : "Bulk Import"}</span>
            <span className="xs:hidden">{importing ? "Importing…" : "Import"}</span>
          </button>
          <button onClick={openAdd}
            className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-2.5 xs:px-3 sm:px-5 py-2 xs:py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#5a1313] text-[10px] xs:text-xs transition-all flex-1 sm:flex-none">
            <Plus size={16} />
            <span className="truncate">New Question</span>
          </button>
        </div>
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 xs:gap-4">
          <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-xl w-full">
            {(["BSABE", "BSGE"] as const).map((course) => (
              <button key={course} onClick={() => setSelectedCourse(course)}
                className={`flex-1 px-3 xs:px-4 sm:px-8 py-2 xs:py-2.5 rounded-lg text-[10px] xs:text-xs font-black transition-all ${selectedCourse === course ? "bg-white text-[#7d1a1a] shadow-sm" : "text-gray-500"}`}>
                {course}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Search questions, category, subject…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all placeholder:text-xs" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 xs:p-2.5 border rounded-xl transition-all flex-shrink-0 ${showFilters ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              <Filter size={16} />
            </button>
          </div>
          {showFilters && (
            <div className="pt-3 xs:pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 xs:gap-3">
                <input type="text" placeholder="Filter by subject…" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
                <input type="text" placeholder="Filter by category…" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" />
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20">
                  <option value="">All Difficulties</option>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
                <button onClick={() => { setFilterSubject(""); setFilterCategory(""); setFilterDifficulty(""); }}
                  className="px-3 py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-700 transition-all">
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP TABLE ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-[8%]">ID</th>
                <th className="px-6 py-5 w-[36%]">Question</th>
                <th className="px-6 py-5 w-[14%]">Subject</th>
                <th className="px-6 py-5 w-[14%]">Category</th>
                <th className="px-6 py-5 w-[10%]">Difficulty</th>
                <th className="px-6 py-5 w-[18%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><Loader2 size={24} className="animate-spin text-[#7d1a1a] mx-auto" /></td></tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-400">No questions found</p>
                    <p className="text-xs text-gray-400 mt-1">Add a question or import from Excel.</p>
                  </td>
                </tr>
              ) : questions.map((q) => (
                <tr key={q._id} className="hover:bg-gray-50/80 group transition-all">
                  <td className="px-6 py-4"><span className="text-xs font-black text-[#7d1a1a]">{shortId(q._id, q.course)}</span></td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-700 line-clamp-2 leading-relaxed group-hover:line-clamp-none cursor-default">{q.questionText}</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg">{q.subject}</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2.5 py-1.5 rounded-lg">{q.category}</span></td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${DIFFICULTY_STYLES[q.difficulty]}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[q.difficulty]}`} />
                      {q.difficulty}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(q)} className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all" aria-label="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(q._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-gray-400 disabled:opacity-20 hover:text-gray-900 transition-all"><ChevronLeft size={20} /></button>
              {buildPageList().map((p, i) => (
                <button key={i} onClick={() => typeof p === "number" && setCurrentPage(p)} disabled={typeof p !== "number"}
                  className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black border transition-all ${p === currentPage ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : typeof p === "number" ? "bg-white border-gray-200 text-gray-500 hover:border-[#7d1a1a] hover:text-[#7d1a1a]" : "bg-transparent border-transparent text-gray-400 cursor-default"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-400 disabled:opacity-20 hover:text-gray-900 transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE CARDS ────────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-2 xs:space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#7d1a1a]" /></div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileSpreadsheet size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">No questions found</p>
          </div>
        ) : questions.map((q) => (
          <div key={q._id} className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all">
            <div className="flex-1 min-w-0 mb-2 xs:mb-3">
              <div className="flex items-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2 flex-wrap">
                <span className="text-[10px] xs:text-xs font-black text-[#7d1a1a]">{shortId(q._id, q.course)}</span>
                <span className="text-[8px] xs:text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">{q.subject}</span>
                <span className="text-[8px] xs:text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">{q.category}</span>
              </div>
              <p className="text-xs xs:text-sm font-semibold text-gray-700 leading-relaxed line-clamp-3">{q.questionText}</p>
            </div>
            <div className="flex items-center justify-between pt-2 xs:pt-3 border-t border-gray-100">
              <div className={`inline-flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-[8px] xs:text-[10px] font-black uppercase ${DIFFICULTY_STYLES[q.difficulty]}`}>
                <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${DIFFICULTY_DOT[q.difficulty]}`} />
                {q.difficulty}
              </div>
              <div className="flex items-center gap-0.5 xs:gap-1">
                <button onClick={() => openEdit(q)} className="p-1.5 xs:p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all active:scale-95"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(q._id)} className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}

        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4">
            <p className="text-[9px] xs:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-1.5 xs:gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 xs:p-2 text-gray-400 disabled:opacity-20 transition-all flex-shrink-0"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-0.5 xs:gap-1 overflow-x-auto">
                {buildPageList().map((p, i) => (
                  <button key={i} onClick={() => typeof p === "number" && setCurrentPage(p)} disabled={typeof p !== "number"}
                    className={`min-w-[32px] xs:min-w-[36px] h-8 xs:h-9 px-1.5 xs:px-2 rounded-xl text-[10px] xs:text-xs font-black border transition-all flex-shrink-0 ${p === currentPage ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : typeof p === "number" ? "bg-white border-gray-200 text-gray-500 active:scale-95" : "bg-transparent border-transparent text-gray-400 cursor-default"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 xs:p-2 text-gray-400 disabled:opacity-20 transition-all flex-shrink-0"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionsPage;