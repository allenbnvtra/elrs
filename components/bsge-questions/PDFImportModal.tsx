"use client";

import React, { useState, useRef } from "react";
import { X, FileText, AlertCircle, Upload, Loader2, CheckCircle2 } from "lucide-react";
import type { ParsedQuestion } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  defaultSubject?: string;
}

export default function PDFImportModal({ isOpen, onClose, onSuccess, userId, defaultSubject }: Props) {
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
    if (!formData.subject) { setError("Please enter a subject first"); return; }

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      fd.append("course", "BSGE");
      fd.append("subject", formData.subject);
      fd.append("difficulty", formData.difficulty);

      const res = await fetch("/api/questions/import-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse PDF");
      setParsedQuestions(data.questions);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/questions/import-pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsedQuestions, userId, course: "BSGE", defaultSubject: formData.subject, defaultDifficulty: formData.difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import questions");
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

  const readyToImport = parsedQuestions.filter(q => q.correctAnswer);
  const needsReview = parsedQuestions.filter(q => !q.correctAnswer);

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
                {step === "upload" ? "Upload a PDF file containing exam questions" : `${parsedQuestions.length} questions found`}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Subject *</label>
                  <input type="text" value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Surveying, Geodesy" disabled={!!defaultSubject}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Default Difficulty</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-500 transition-all">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Upload PDF File</h3>
                <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop your PDF file here</p>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload}
                  disabled={uploading || !formData.subject} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading || !formData.subject}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center gap-2">
                  {uploading ? <><Loader2 size={16} className="animate-spin" />Parsing PDF...</> : <><Upload size={16} />Select PDF File</>}
                </button>
                {!formData.subject && <p className="text-xs text-red-500 mt-2">Please enter a subject first</p>}
              </div>

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
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{readyToImport.length}</p>
                  <p className="text-xs font-bold text-green-600 mt-1">Ready to Import</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-amber-600">{needsReview.length}</p>
                  <p className="text-xs font-bold text-amber-600 mt-1">Need Review</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{parsedQuestions.length}</p>
                  <p className="text-xs font-bold text-blue-600 mt-1">Total Found</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedQuestions.map((q, index) => (
                  <div key={index} className={`border-2 rounded-xl p-4 ${q.correctAnswer ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/30"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${q.correctAnswer ? "bg-green-600 text-white" : "bg-amber-600 text-white"}`}>
                        Q{q.questionNumber}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{q.questionText}</p>
                        {q.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{q.category}</span>
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
                      <select value={q.correctAnswer || ""}
                        onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                        className={`px-2 py-1 border rounded text-xs font-bold ${q.correctAnswer ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
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
            <button onClick={() => setStep("upload")} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all">
              ← Back to Upload
            </button>
          )}
          <div className="flex-1" />
          <div className="flex gap-3">
            <button onClick={handleClose} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              Cancel
            </button>
            {step === "preview" && (
              <button onClick={handleConfirmImport} disabled={importing || readyToImport.length === 0}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                {importing ? <><Loader2 size={16} className="animate-spin" />Importing...</> : <><CheckCircle2 size={16} />Import {readyToImport.length} Questions</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}