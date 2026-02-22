import type { FormData } from "./types";

export const EMPTY_FORM: FormData = {
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

export const DIFFICULTY_STYLES: Record<string, string> = {
  Hard: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Easy: "bg-emerald-50 text-emerald-600",
};

export const DIFFICULTY_DOT: Record<string, string> = {
  Hard: "bg-red-500",
  Medium: "bg-amber-500",
  Easy: "bg-emerald-500",
};

export const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all placeholder:text-gray-400";

export const labelCls =
  "block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5";