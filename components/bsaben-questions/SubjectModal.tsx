"use client";

import { X, AlertCircle, Loader2, Plus } from "lucide-react";

interface Props {
  editingSubject: { _id: string; name: string } | null;
  selectedAreaName: string;
  subjectForm: { name: string; description: string };
  setSubjectForm: (form: { name: string; description: string }) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}

export default function SubjectModal({
  editingSubject, selectedAreaName, subjectForm, setSubjectForm,
  onClose, onSave, saving, error,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">
            {editingSubject ? "Edit Subject" : "New Subject"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

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
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g., Fluid Flow, Soil Properties, Steel Design"
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