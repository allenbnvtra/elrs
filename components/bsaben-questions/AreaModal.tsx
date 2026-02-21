"use client";

import React, { useEffect } from "react";
import { X, AlertCircle, Loader2, Plus } from "lucide-react";

interface AreaFormState {
  name: string;
  description: string;
  timerHH: string;
  timerMM: string;
  timerSS: string;
}

interface Props {
  editingArea: { _id: string; name: string; timer?: number } | null;
  areaForm: AreaFormState;
  setAreaForm: (form: AreaFormState) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}

export default function AreaModal({
  editingArea, areaForm, setAreaForm, onClose, onSave, saving, error,
}: Props) {
  // Convert timer from seconds to HH:MM:SS when editing
  useEffect(() => {
    if (editingArea?.timer !== undefined) {
      const totalSeconds = editingArea.timer;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setAreaForm({
        ...areaForm,
        timerHH: String(hours).padStart(2, "0"),
        timerMM: String(minutes).padStart(2, "0"),
        timerSS: String(seconds).padStart(2, "0"),
      });
    }
  }, [editingArea?._id]);

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
            {editingArea ? "Edit Area" : "New Area"}
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
            <label className="block text-xs font-bold text-gray-700 mb-2">Area Name *</label>
            <input
              type="text"
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              placeholder="e.g., Hydraulics, Soil Mechanics, Structural Analysis"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={areaForm.description}
              onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
              placeholder="Brief description of this area..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm resize-none"
            />
          </div>

          {/* Timer */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Set Timer (Optional)</label>
            <div className="flex items-center gap-1.5">
              {[
                { key: "timerHH" as const, max: 23 },
                { key: "timerMM" as const, max: 59 },
                { key: "timerSS" as const, max: 59 },
              ].map(({ key, max }, idx) => (
                <React.Fragment key={key}>
                  {idx > 0 && <span className="text-gray-400 font-bold text-lg">:</span>}
                  <input
                    key={key}
                    type="number"
                    min={0}
                    max={max}
                    value={areaForm[key]}
                    onChange={(e) => {
                      const v = Math.min(max, Math.max(0, Number(e.target.value)));
                      setAreaForm({ ...areaForm, [key]: String(v).padStart(2, "0") });
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm text-center font-mono tabular-nums"
                  />
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px] text-gray-400 font-semibold">HH</span>
              <span className="text-[10px] text-gray-400 font-semibold">MM</span>
              <span className="text-[10px] text-gray-400 font-semibold">SS</span>
            </div>
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
            {saving ? "Saving..." : editingArea ? "Save Changes" : "Add Area"}
          </button>
        </div>
      </div>
    </div>
  );
}