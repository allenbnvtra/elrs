"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  Home,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter, useParams } from "next/navigation";

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: string;
  category: string;
  explanation?: string;
  options: {
    A: string;
    B: string;
    C?: string;
    D?: string;
  };
}

interface ExamResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  results: QuestionResult[];
  completedAt: string;
  timeTaken: number;
  violations?: any[];
  violationCount?: number;
  wasFlagged?: boolean;
}

export default function ExamResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");

  useEffect(() => {
    if (!user || !examId) return;
    fetchResults();
  }, [user, examId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/results/${examId}?userId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || "Failed to load results");
        router.push("/student/exams");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("Failed to load results");
      router.push("/student/exams");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 mb-4">Results not found</p>
          <button
            onClick={() => router.push("/student/exams")}
            className="px-6 py-2 bg-[#7d1a1a] text-white rounded-lg font-bold"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const filteredResults = result.results.filter((r) => {
    if (filter === "correct") return r.isCorrect;
    if (filter === "incorrect") return !r.isCorrect;
    return true;
  });

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-blue-600";
    return "text-red-600";
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-50";
    if (percentage >= 60) return "bg-blue-50";
    return "bg-red-50";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#7d1a1a]/10 mb-4">
            <Trophy size={40} className="text-[#7d1a1a]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Exam Completed!
          </h1>
          <p className="text-gray-500">
            Here's how you performed
          </p>
        </div>

        {/* SCORE CARD */}
        <div className={`rounded-2xl ${getScoreBg(result.percentage)} border-2 border-${getScoreColor(result.percentage).replace('text-', '')} p-8`}>
          {/* FLAGGED WARNING */}
          {result.wasFlagged && (
            <div className="bg-red-600 text-white px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
              <AlertTriangle size={24} className="flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">⚠️ Exam Flagged for Violations</p>
                <p className="text-xs mt-1">
                  This exam was auto-submitted due to {result.violationCount || 3} cheating violations detected.
                </p>
              </div>
            </div>
          )}

          {(result.violationCount || 0) > 0 && !result.wasFlagged && (
            <div className="bg-orange-100 text-orange-900 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 border-2 border-orange-300">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Violations Detected</p>
                <p className="text-xs mt-1">
                  {result.violationCount || 0} violation(s) were logged during this exam.
                </p>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">
              Your Score
            </p>
            <p className={`text-6xl sm:text-7xl font-black ${getScoreColor(result.percentage)}`}>
              {result.percentage}%
            </p>
            <p className="text-lg text-gray-600 mt-2">
              {result.correctCount} out of {result.totalQuestions} correct
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatBox
              icon={Target}
              label="Accuracy"
              value={`${result.percentage}%`}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatBox
              icon={Clock}
              label="Time Taken"
              value={`${result.timeTaken} min`}
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <StatBox
              icon={TrendingUp}
              label="Questions"
              value={`${result.correctCount}/${result.totalQuestions}`}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/student/exams")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Home size={18} />
            Back to Exams
          </button>
          <button
            onClick={() => router.push("/student/exams/history")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <BookOpen size={18} />
            View History
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#7d1a1a] text-white rounded-xl font-bold hover:bg-[#5a1313] transition-all"
          >
            <RotateCcw size={18} />
            Review Answers
          </button>
        </div>

        {/* FILTER TABS */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Questions ({result.results.length})
          </button>
          <button
            onClick={() => setFilter("correct")}
            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === "correct"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Correct ({result.correctCount})
          </button>
          <button
            onClick={() => setFilter("incorrect")}
            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === "incorrect"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Incorrect ({result.totalQuestions - result.correctCount})
          </button>
        </div>

        {/* QUESTIONS REVIEW */}
        <div className="space-y-3">
          {filteredResults.map((questionResult, index) => (
            <QuestionReviewCard
              key={questionResult.questionId}
              questionResult={questionResult}
              index={index + 1}
              isExpanded={expandedQuestion === questionResult.questionId}
              onToggle={() =>
                setExpandedQuestion(
                  expandedQuestion === questionResult.questionId
                    ? null
                    : questionResult.questionId
                )
              }
            />
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Award size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No questions to display for this filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// STAT BOX
function StatBox({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={16} className={color} />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  );
}

// QUESTION REVIEW CARD
function QuestionReviewCard({
  questionResult,
  index,
  isExpanded,
  onToggle,
}: {
  questionResult: QuestionResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { isCorrect, userAnswer, correctAnswer } = questionResult;

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
        isCorrect ? "border-emerald-200" : "border-red-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-4 hover:bg-gray-50 transition-all"
      >
        <div className="flex-shrink-0">
          {isCorrect ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
              Question {index}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                questionResult.difficulty === "Easy"
                  ? "bg-green-100 text-green-700"
                  : questionResult.difficulty === "Medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {questionResult.difficulty}
            </span>
          </div>
          <p className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
            {questionResult.questionText}
          </p>
        </div>

        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
          {/* OPTIONS */}
          <div className="space-y-2">
            {["A", "B", "C", "D"].map((option) => {
              const optionText = questionResult.options[option as keyof typeof questionResult.options];
              if (!optionText) return null;

              const isUserAnswer = userAnswer === option;
              const isCorrectAnswer = correctAnswer === option;

              return (
                <div
                  key={option}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrectAnswer
                      ? "border-emerald-500 bg-emerald-50"
                      : isUserAnswer && !isCorrect
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                        isCorrectAnswer
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isUserAnswer && !isCorrect
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 text-gray-600 bg-white"
                      }`}
                    >
                      <span className="text-sm font-bold">{option}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{optionText}</p>
                      {isCorrectAnswer && (
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          ✓ Correct Answer
                        </p>
                      )}
                      {isUserAnswer && !isCorrect && (
                        <p className="text-xs font-bold text-red-600 mt-1">
                          ✗ Your Answer
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXPLANATION */}
          {questionResult.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                Explanation
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {questionResult.explanation}
              </p>
            </div>
          )}

          {/* STATUS */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Your answer:</span>
            <span
              className={`font-bold ${
                isCorrect ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {userAnswer || "Not answered"} - {isCorrect ? "Correct" : "Incorrect"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}