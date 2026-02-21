"use client";

import React from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import type { ImportResult } from "../../types/bsge-questions";

interface Props {
  result: ImportResult;
  onClose: () => void;
}

export function ImportResultModal({ result, onClose }: Props) {
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