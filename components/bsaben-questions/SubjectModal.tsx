"use client";

import { X, AlertCircle, Loader2, Plus, Clock } from "lucide-react";

export interface BSABENSubjectFormData {
  name: string;
  description: string;
  timerHH: string;
  timerMM: string;
  timerSS: string;
}

interface Props {
  editingSubject: { _id: string; name: string } | null;
  selectedAreaName: string;
  subjectForm: BSABENSubjectFormData;
  setSubjectForm: (form: BSABENSubjectFormData) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}

const timerInputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm text-center font-bold tabular-nums";

function clamp(val: string, max: number): string {
  const n = parseInt(val.replace(/\D/g, "") || "0", 10);
  return String(Math.min(n, max)).padStart(2, "0");
}

export default function SubjectModal({
  editingSubject, selectedAreaName, subjectForm, setSubjectForm,
  onClose, onSave, saving, error,
}: Props) {
  const set = (field: keyof BSABENSubjectFormData, value: string) =>
    setSubjectForm({ ...subjectForm, [field]: value });

  const totalSeconds =
    parseInt(subjectForm.timerHH || "0") * 3600 +
    parseInt(subjectForm.timerMM || "0") * 60 +
    parseInt(subjectForm.timerSS || "0");

  const timerLabel = (() => {
    if (totalSeconds === 0) return "No time limit";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s) parts.push(`${s}s`);
    return parts.join(" ");
  })();

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">
            {editingSubject ? "Edit Subject" : "New Subject"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Area</label>
            <input
              type="text"
              value={selectedAreaName}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Subject Name *</label>
            <input
              type="text"
              value={subjectForm.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Fluid Flow, Soil Properties, Steel Design"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={subjectForm.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this subject..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm resize-none"
            />
          </div>

          {/* Timer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700">
                Exam Timer <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7d1a1a]">
                <Clock size={12} />
                {timerLabel}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number" min={0} max={23} placeholder="00"
                  value={subjectForm.timerHH}
                  onChange={(e) => set("timerHH", e.target.value)}
                  onBlur={(e) => set("timerHH", clamp(e.target.value, 23))}
                  className={timerInputCls}
                />
                <p className="text-[10px] text-gray-400 text-center mt-1 font-semibold">HH</p>
              </div>

              <span className="text-gray-400 font-black text-lg mb-4">:</span>

              <div className="flex-1">
                <input
                  type="number" min={0} max={59} placeholder="00"
                  value={subjectForm.timerMM}
                  onChange={(e) => set("timerMM", e.target.value)}
                  onBlur={(e) => set("timerMM", clamp(e.target.value, 59))}
                  className={timerInputCls}
                />
                <p className="text-[10px] text-gray-400 text-center mt-1 font-semibold">MM</p>
              </div>

              <span className="text-gray-400 font-black text-lg mb-4">:</span>

              <div className="flex-1">
                <input
                  type="number" min={0} max={59} placeholder="00"
                  value={subjectForm.timerSS}
                  onChange={(e) => set("timerSS", e.target.value)}
                  onBlur={(e) => set("timerSS", clamp(e.target.value, 59))}
                  className={timerInputCls}
                />
                <p className="text-[10px] text-gray-400 text-center mt-1 font-semibold">SS</p>
              </div>

              {totalSeconds > 0 && (
                <button
                  type="button"
                  onClick={() => setSubjectForm({ ...subjectForm, timerHH: "00", timerMM: "00", timerSS: "00" })}
                  className="mb-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear timer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {totalSeconds === 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                Leave at 00:00:00 to disable the timer for this subject.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Saving..." : editingSubject ? "Save Changes" : "Add Subject"}
          </button>
        </div>
      </div>
    </div>
  );
}