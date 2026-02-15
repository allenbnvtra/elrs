"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Filter, Edit3, Trash2, Layers, ChevronLeft,
  ChevronRight, X, Download, CheckCircle2, AlertCircle,
  Loader2, FileSpreadsheet, AlertTriangle, BookOpen, ArrowLeft, FileText,
  GraduationCap, Power, Eye, EyeOff, FileUp,
  Upload
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  _id: string;
  name: string;
  description?: string;
  course: string;
  area?: string;
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

interface ParsedQuestion {
  questionNumber: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  category?: string;
  difficulty?: string;
  subject?: string;
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
  subject: string;
  explanation: string;
  isActive: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  difficulty: "Medium",
  category: "",
  subject: "",
  explanation: "",
  isActive: true,
};

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
  defaultSubject,
}: {
  editQuestion: Question | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  defaultSubject?: string;
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
          subject: editQuestion.subject,
          explanation: editQuestion.explanation ?? "",
          isActive: editQuestion.isActive ?? true,
        }
      : { 
          ...EMPTY_FORM, 
          subject: defaultSubject || ""
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [showOptionC, setShowOptionC] = useState(
    isEdit ? (!!editQuestion.optionC || editQuestion.correctAnswer === "C" || editQuestion.correctAnswer === "D") : false
  );
  const [showOptionD, setShowOptionD] = useState(
    isEdit ? (!!editQuestion.optionD || editQuestion.correctAnswer === "D") : false
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  
  useEffect(() => {
    if (form.correctAnswer === "C" || form.correctAnswer === "D") {
      setShowOptionC(true);
    }
    if (form.correctAnswer === "D") {
      setShowOptionD(true);
    }
  }, [form.correctAnswer]);

  const handleSubmit = async () => {
    setError("");

    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    if (!form.optionA.trim()) { setError("Option A is required."); return; }
    if (!form.optionB.trim()) { setError("Option B is required."); return; }
    if (form.correctAnswer === "C" && !form.optionC.trim()) {
      setError("Option C is required when it is marked as the correct answer."); return;
    }
    if (form.correctAnswer === "D" && !form.optionD.trim()) {
      setError("Option D is required when it is marked as the correct answer."); return;
    }
    if (!form.category.trim()) { setError("Category is required."); return; }
    if (!form.subject.trim()) { setError("Subject is required."); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        optionC: form.optionC.trim() || undefined,
        optionD: form.optionD.trim() || undefined,
        explanation: form.explanation.trim() || undefined,
        course: "BSGE",
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Active/Inactive Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.isActive ? "bg-emerald-100" : "bg-gray-200"}`}>
                {form.isActive ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Question Status</p>
                <p className="text-xs text-gray-500">
                  {form.isActive ? "This question is active and visible" : "This question is inactive and hidden"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                form.isActive ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Subject *</label>
              <input type="text" placeholder="e.g. Surveying, Geodesy" value={form.subject}
                onChange={(e) => set("subject", e.target.value)} className={inputCls} disabled={!!defaultSubject} />
            </div>
            <div>
              <label className={labelCls}>Difficulty *</label>
              <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inputCls}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <input type="text" placeholder="e.g. Professional Practice, Laws & Ethics, Remote Sensing"
              value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Question Text *</label>
            <textarea rows={4} placeholder="Enter the full question here…" value={form.questionText}
              onChange={(e) => set("questionText", e.target.value)} className={`${inputCls} resize-none leading-relaxed`} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " mb-0"}>Answer Choices *</label>
              <span className="text-[10px] text-gray-400 font-medium">Click a letter to mark as correct</span>
            </div>

            <div className="space-y-2.5">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                if (letter === "C" && !showOptionC) return null;
                if (letter === "D" && !showOptionD) return null;

                const fieldKey = `option${letter}` as keyof FormData;
                const isCorrect = form.correctAnswer === letter;
                const isOptional = letter === "C" || letter === "D";

                return (
                  <div key={letter} className="flex items-center gap-2.5">
                    <button type="button" onClick={() => set("correctAnswer", letter)}
                      title={`Mark ${letter} as the correct answer`}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border-2 transition-all ${
                        isCorrect ? "bg-[#7d1a1a] text-white border-[#7d1a1a] shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-[#7d1a1a] hover:text-[#7d1a1a]"
                      }`}>
                      {letter}
                    </button>

                    <input type="text" placeholder={isOptional ? `Option ${letter} (optional)` : `Option ${letter} *`}
                      value={form[fieldKey] as string} onChange={(e) => set(fieldKey, e.target.value)}
                      className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                        isCorrect ? "bg-[#7d1a1a]/5 border-[#7d1a1a]/40 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                          : "bg-gray-50 border-gray-200 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      }`} />

                    {isCorrect && (
                      <span className="text-[10px] font-black text-[#7d1a1a] uppercase tracking-wide shrink-0 hidden sm:block">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-1">
                {!showOptionC && (
                  <button
                    type="button"
                    onClick={() => setShowOptionC(true)}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Option C
                  </button>
                )}
                {showOptionC && !showOptionD && (
                  <button
                    type="button"
                    onClick={() => setShowOptionD(true)}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Option D
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Explanation <span className="normal-case font-medium text-gray-400 tracking-normal">(optional)</span>
            </label>
            <textarea rows={2} placeholder="Brief explanation of why the answer is correct…"
              value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60 shadow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" />
              : isEdit ? <CheckCircle2 size={15} /> : <Plus size={15} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Result Modal
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X size={16} className="text-gray-500" />
          </button>
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
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} />Already in Database ({result.duplicatesInDb.length})
                </p>
                <div className="space-y-1.5">
                  {result.duplicatesInDb.map((d, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-amber-700 font-bold">Row {d.row}</p>
                      <p className="text-xs text-amber-600 mt-0.5 line-clamp-2">{d.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.duplicatesInFile.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} />Duplicate in File ({result.duplicatesInFile.length})
                </p>
                <div className="space-y-1.5">
                  {result.duplicatesInFile.map((d, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-amber-700 font-bold">Row {d.row}</p>
                      <p className="text-xs text-amber-600 mt-0.5 line-clamp-2">{d.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.errors.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertCircle size={12} />Validation Errors ({result.errors.length})
                </p>
                <div className="space-y-1.5">
                  {result.errors.map((e, i) => (
                    <div key={i} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-red-700 font-bold">Row {e.row}</p>
                      <p className="text-xs text-red-600 mt-0.5">{e.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// PDF Import Modal Component
function PDFImportModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  defaultSubject 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  defaultSubject?: string;
}) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [formData, setFormData] = useState({
    subject: defaultSubject || "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.subject) {
      setError("Please enter a subject first");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      fd.append("course", "BSGE");
      fd.append("subject", formData.subject);
      fd.append("difficulty", formData.difficulty);

      const res = await fetch("/api/questions/import-pdf", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      setParsedQuestions(data.questions);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    setError("");

    try {
      const res = await fetch("/api/questions/import-pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: parsedQuestions,
          userId,
          course: "BSGE",
          defaultSubject: formData.subject,
          defaultDifficulty: formData.difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import questions");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import questions");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setParsedQuestions([]);
    setError("");
    setFormData({ subject: defaultSubject || "", difficulty: "Medium" });
    onClose();
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const questionsWithCorrectAnswer = parsedQuestions.filter(q => q.correctAnswer);
  const questionsWithoutCorrectAnswer = parsedQuestions.filter(q => !q.correctAnswer);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base">
                {step === "upload" ? "Import from PDF" : "Review Questions"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === "upload" 
                  ? "Upload a PDF file containing exam questions" 
                  : `${parsedQuestions.length} questions found`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === "upload" ? (
            <div className="space-y-6">
              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Surveying, Geodesy, Professional Practice"
                    disabled={!!defaultSubject}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Default Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-500 transition-all">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Upload PDF File</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click to browse or drag and drop your PDF file here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading || !formData.subject}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !formData.subject}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Parsing PDF...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Select PDF File
                    </>
                  )}
                </button>
                {!formData.subject && (
                  <p className="text-xs text-red-500 mt-2">Please enter a subject first</p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 text-sm mb-2">PDF Format Requirements:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Questions should be numbered (1., 2., 3., etc.)</li>
                  <li>• Options should be labeled (a., b., c., d., e.)</li>
                  <li>• Correct answers should be marked with ✓ or highlighted</li>
                  <li>• Categories can be in section headers (e.g., "Hydrometeorology (14 items):")</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{questionsWithCorrectAnswer.length}</p>
                  <p className="text-xs font-bold text-green-600 mt-1">Ready to Import</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-amber-600">{questionsWithoutCorrectAnswer.length}</p>
                  <p className="text-xs font-bold text-amber-600 mt-1">Need Review</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{parsedQuestions.length}</p>
                  <p className="text-xs font-bold text-blue-600 mt-1">Total Found</p>
                </div>
              </div>

              {/* Question List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedQuestions.map((q, index) => (
                  <div 
                    key={index}
                    className={`border-2 rounded-xl p-4 ${
                      q.correctAnswer 
                        ? "border-green-200 bg-green-50/30" 
                        : "border-amber-200 bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        q.correctAnswer 
                          ? "bg-green-600 text-white" 
                          : "bg-amber-600 text-white"
                      }`}>
                        Q{q.questionNumber}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {q.questionText}
                        </p>
                        {q.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {q.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>A: {q.optionA.substring(0, 40)}...</div>
                      <div>B: {q.optionB.substring(0, 40)}...</div>
                      {q.optionC && <div>C: {q.optionC.substring(0, 40)}...</div>}
                      {q.optionD && <div>D: {q.optionD.substring(0, 40)}...</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-700">Correct Answer:</label>
                      <select
                        value={q.correctAnswer || ""}
                        onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                        className={`px-2 py-1 border rounded text-xs font-bold ${
                          q.correctAnswer 
                            ? "border-green-300 bg-green-50 text-green-700" 
                            : "border-amber-300 bg-amber-50 text-amber-700"
                        }`}
                      >
                        <option value="">Select...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        {q.optionC && <option value="C">C</option>}
                        {q.optionD && <option value="D">D</option>}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center shrink-0">
          {step === "preview" && (
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all"
            >
              ← Back to Upload
            </button>
          )}
          <div className="flex-1"></div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            {step === "preview" && (
              <button
                onClick={handleConfirmImport}
                disabled={importing || questionsWithCorrectAnswer.length === 0}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Import {questionsWithCorrectAnswer.length} Questions
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component - BSGE Questions
export default function BSGEQuestionsPage() {
  const { user } = useAuth();
  const USER_ID = user?.id;

  const [currentView, setCurrentView] = useState<"subjects" | string>("subjects");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "" });
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

  // Fetch Subjects
  const fetchSubjects = useCallback(async () => {
    if (!USER_ID) return;
    setLoadingSubjects(true);
    setError("");

    try {
      const params = new URLSearchParams({ course: "BSGE" });
      if (subjectSearchQuery) params.set("search", subjectSearchQuery);

      const res = await fetch(`/api/subjects?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch subjects");
        return;
      }

      setSubjects(data.subjects || []);
    } catch (err) {
      setError("Failed to load subjects");
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  }, [USER_ID, subjectSearchQuery]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    if (!USER_ID || !selectedSubject) return;
    setLoadingQuestions(true);
    setError("");

    try {
      const params = new URLSearchParams({
        course: "BSGE",
        subject: selectedSubject.name,
        page: String(currentPage),
        limit: "12"
      });
      if (searchQuery) params.set("search", searchQuery);
      if (filterCategory) params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (filterStatus !== "all") params.set("isActive", filterStatus === "active" ? "true" : "false");

      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch questions");
        return;
      }

      setQuestions(data.questions || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [USER_ID, selectedSubject, currentPage, searchQuery, filterCategory, filterDifficulty, filterStatus]);

  // Effects
  useEffect(() => {
    if (currentView === "subjects") {
      fetchSubjects();
    }
  }, [currentView, fetchSubjects]);

  useEffect(() => {
    if (currentView !== "subjects" && selectedSubject) {
      fetchQuestions();
    }
  }, [currentView, selectedSubject, fetchQuestions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDifficulty, filterStatus]);

  // Subject handlers
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", description: "" });
    setShowSubjectModal(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({ name: subject.name, description: subject.description || "" });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!USER_ID) return;
    if (!subjectForm.name.trim()) {
      setError("Subject name is required");
      return;
    }

    setSavingSubject(true);
    setError("");

    try {
      const url = editingSubject ? `/api/subjects/${editingSubject._id}` : "/api/subjects";
      const method = editingSubject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subjectForm,
          course: "BSGE",
          userId: USER_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save subject");
        return;
      }

      setShowSubjectModal(false);
      fetchSubjects();
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!USER_ID) return;

    if (!confirm(`Delete "${subject.name}"? ${subject.questionCount > 0 ? `This subject has ${subject.questionCount} question(s).` : ""}`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${subject._id}?userId=${USER_ID}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete subject");
        return;
      }

      fetchSubjects();
    } catch (err) {
      alert("Failed to delete subject");
      console.error(err);
    }
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentView(subject.name);
    setCurrentPage(1);
    setSearchQuery("");
    setFilterCategory("");
    setFilterDifficulty("");
    setFilterStatus("all");
  };

  const handleBackToSubjects = () => {
    setCurrentView("subjects");
    setSelectedSubject(null);
    setQuestions([]);
    setPagination(null);
  };

  // Question handlers
  const openAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!USER_ID) return;
    if (!confirm("Delete this question? This cannot be undone.")) return;

    await fetch(`/api/questions/${id}?userId=${USER_ID}`, { method: "DELETE" });
    fetchQuestions();
    fetchSubjects();
  };

  const handleToggleStatus = async (question: Question) => {
    if (!USER_ID) return;

    try {
      const res = await fetch(`/api/questions/${question._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...question,
          isActive: !question.isActive,
          userId: USER_ID,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update question status");
        return;
      }

      fetchQuestions();
    } catch (err) {
      setError("Failed to update question status");
      console.error(err);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await fetch("/api/questions/template?course=BSGE");
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bsge_questions_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!USER_ID) return;
    
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", USER_ID);
      fd.append("course", "BSGE");
      const res = await fetch("/api/questions/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Import failed");
        return;
      }
      setImportResult(data.result);
      fetchQuestions();
      fetchSubjects();
    } finally {
      setImporting(false);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;
  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const shortId = (id: string) => `GE-${id.slice(-4).toUpperCase()}`;

  // RENDER
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Modals */}
      {showQuestionModal && USER_ID && (
        <QuestionModal
          editQuestion={editingQuestion}
          onClose={closeQuestionModal}
          onSaved={() => {
            fetchQuestions();
            fetchSubjects();
          }}
          userId={USER_ID}
          defaultSubject={selectedSubject?.name}
        />
      )}
      {importResult && <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />}
      {showPDFImportModal && USER_ID && (
        <PDFImportModal
          isOpen={showPDFImportModal}
          onClose={() => setShowPDFImportModal(false)}
          onSuccess={() => {
            fetchQuestions();
            fetchSubjects();
          }}
          userId={USER_ID}
          defaultSubject={selectedSubject?.name}
        />
      )}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

      {/* HEADER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            {currentView !== "subjects" && (
              <button 
                onClick={handleBackToSubjects}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0"
              >
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

          {/* Action Buttons */}
          {currentView === "subjects" ? (
            <button 
              onClick={openAddSubject}
              className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all"
            >
              <Plus size={18} />
              Add Subject
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleDownloadTemplate} 
                disabled={downloadingTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60"
              >
                {downloadingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Template
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all disabled:opacity-60"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                Excel
              </button>
              <button 
                onClick={() => setShowPDFImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs transition-all"
              >
                <FileUp size={14} />
                PDF
              </button>
              <button 
                onClick={openAddQuestion}
                className="flex items-center gap-2 bg-[#7d1a1a] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all"
              >
                <Plus size={18} />
                New Question
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        {currentView === "subjects" ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={subjectSearchQuery}
              onChange={(e) => setSubjectSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" 
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  value={searchQuery}
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
                className={`p-2.5 border rounded-xl transition-all ${showFilters ? "bg-[#7d1a1a] text-white border-[#7d1a1a]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                <Filter size={16} />
              </button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-gray-100 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input 
                    type="text" 
                    placeholder="Filter by category…" 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20" 
                  />
                  <select 
                    value={filterDifficulty} 
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20"
                  >
                    <option value="">All Difficulties</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                  <button 
                    onClick={() => { setFilterCategory(""); setFilterDifficulty(""); setFilterStatus("all"); }}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CONTENT */}
      {currentView === "subjects" ? (
        // SUBJECTS VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingSubjects ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
            </div>
          ) : subjects.length > 0 ? (
            subjects.map((subject) => (
              <div 
                key={subject._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} className="text-[#7d1a1a]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditSubject(subject)}
                      className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-[#7d1a1a]/5 rounded-lg transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSubject(subject)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2">{subject.name}</h3>
                {subject.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{subject.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText size={14} />
                    <span className="text-xs font-bold">
                      {subject.questionCount} Question{subject.questionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleViewSubject(subject)}
                    className="text-xs font-bold text-[#7d1a1a] hover:underline"
                  >
                    View Questions →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center">
              <BookOpen size={48} className="text-gray-300 mb-4" />
              <p className="font-black uppercase tracking-widest text-sm text-gray-500 mb-1">No Subjects Found</p>
              <p className="text-xs text-gray-400 mb-4">Create your first subject to get started</p>
              <button 
                onClick={openAddSubject}
                className="flex items-center gap-2 px-4 py-2 bg-[#7d1a1a] text-white rounded-xl font-bold text-xs hover:bg-[#5a1313] transition-all"
              >
                <Plus size={14} />
                Add Subject
              </button>
            </div>
          )}
        </div>
      ) : (
        // QUESTIONS VIEW
        <>
          {/* Desktop Table */}
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
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 size={24} className="animate-spin text-[#7d1a1a] mx-auto" />
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No questions found</p>
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className={`hover:bg-gray-50/80 group ${!q.isActive ? "opacity-50" : ""}`}>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-[#7d1a1a]">{shortId(q._id)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-700 line-clamp-2">{q.questionText}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2.5 py-1.5 rounded-lg">
                          {q.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${DIFFICULTY_STYLES[q.difficulty]}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[q.difficulty]}`} />
                          {q.difficulty}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          q.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${q.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {q.isActive ? "Active" : "Inactive"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleToggleStatus(q)}
                            className={`p-2 rounded-xl transition-all ${
                              q.isActive 
                                ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={q.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power size={16} />
                          </button>
                          <button 
                            onClick={() => openEditQuestion(q)}
                            className="p-2 text-gray-400 hover:text-[#7d1a1a] hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(q._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-5 border-t bg-gray-50/50 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 disabled:opacity-20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {buildPageList().map((p, i) => (
                    <button 
                      key={i} 
                      onClick={() => typeof p === "number" && setCurrentPage(p)}
                      disabled={typeof p !== "number"}
                      className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black border ${
                        p === currentPage
                          ? "bg-[#7d1a1a] text-white border-[#7d1a1a]"
                          : typeof p === "number"
                          ? "bg-white border-gray-200 text-gray-500"
                          : "bg-transparent border-transparent text-gray-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 disabled:opacity-20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubjectModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-black text-gray-900 text-base">
                {editingSubject ? "Edit Subject" : "New Subject"}
              </h2>
              <button onClick={() => setShowSubjectModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Subject Name *</label>
                <input 
                  type="text" 
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g., Surveying, Geodesy, Professional Practice"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Description (Optional)</label>
                <textarea 
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="Brief description of this subject..." 
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm resize-none" 
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowSubjectModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSubject} 
                disabled={savingSubject}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60"
              >
                {savingSubject ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {savingSubject ? "Saving..." : editingSubject ? "Save Changes" : "Add Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}