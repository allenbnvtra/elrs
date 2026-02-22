"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, X, BookOpen, AlertCircle, Loader2,
  CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import type { Question, FormData } from "./types";
import { EMPTY_FORM, inputCls, labelCls } from "./constants";

interface Props {
  editQuestion: Question | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  defaultSubject?: string;
}

export default function QuestionModal({ editQuestion, onClose, onSaved, userId, defaultSubject }: Props) {
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
      : { ...EMPTY_FORM, subject: defaultSubject || "" }
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
    if (form.correctAnswer === "C" || form.correctAnswer === "D") setShowOptionC(true);
    if (form.correctAnswer === "D") setShowOptionD(true);
  }, [form.correctAnswer]);

  const handleSubmit = async () => {
    setError("");
    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    if (!form.optionA.trim()) { setError("Option A is required."); return; }
    if (!form.optionB.trim()) { setError("Option B is required."); return; }
    if (form.correctAnswer === "C" && !form.optionC.trim()) { setError("Option C is required when correct."); return; }
    if (form.correctAnswer === "D" && !form.optionD.trim()) { setError("Option D is required when correct."); return; }
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
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7d1a1a]/10 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-[#7d1a1a]" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base">{isEdit ? "Edit Question" : "New Question"}</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {isEdit ? "Update the question details below" : "Fill in all required fields to add a question"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Status Toggle */}
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
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
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
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <input type="text" placeholder="e.g. Professional Practice, Laws & Ethics"
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border-2 transition-all ${
                        isCorrect ? "bg-[#7d1a1a] text-white border-[#7d1a1a] shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:border-[#7d1a1a] hover:text-[#7d1a1a]"
                      }`}>{letter}</button>
                    <input type="text" placeholder={isOptional ? `Option ${letter} (optional)` : `Option ${letter} *`}
                      value={form[fieldKey] as string} onChange={(e) => set(fieldKey, e.target.value)}
                      className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                        isCorrect ? "bg-[#7d1a1a]/5 border-[#7d1a1a]/40 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]" : "bg-gray-50 border-gray-200 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      }`} />
                    {isCorrect && <span className="text-[10px] font-black text-[#7d1a1a] uppercase tracking-wide shrink-0 hidden sm:block">✓ Correct</span>}
                  </div>
                );
              })}
              <div className="flex gap-3 pt-1">
                {!showOptionC && (
                  <button type="button" onClick={() => setShowOptionC(true)}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1">
                    <Plus size={12} /> Add Option C
                  </button>
                )}
                {showOptionC && !showOptionD && (
                  <button type="button" onClick={() => setShowOptionD(true)}
                    className="text-[11px] font-bold text-gray-400 hover:text-[#7d1a1a] transition-all flex items-center gap-1">
                    <Plus size={12} /> Add Option D
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Explanation <span className="normal-case font-medium text-gray-400 tracking-normal">(optional)</span></label>
            <textarea rows={2} placeholder="Brief explanation of why the answer is correct…"
              value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60 shadow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" /> : isEdit ? <CheckCircle2 size={15} /> : <Plus size={15} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}