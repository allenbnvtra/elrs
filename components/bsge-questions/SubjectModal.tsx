"use client";

import React from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  isEditing: boolean;
  form: { name: string; description: string };
  saving: boolean;
  onChange: (form: { name: string; description: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

export function SubjectModal({ isOpen, isEditing, form, saving, onChange, onSave, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">{isEditing ? "Edit Subject" : "New Subject"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Subject Name *</label>
            <input type="text" value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="e.g., Surveying, Geodesy, Professional Practice"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Description (Optional)</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Brief description of this subject..." rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 text-sm resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7d1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#5a1313] transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Subject"}
          </button>
        </div>
      </div>
    </div>
  );
}