"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Folder,
  Play,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  ChevronRight,
  BarChart3,
  Award,
  Brain,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

interface Subject {
  subject: string;
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

interface Area {
  area: string;
  subjects: Subject[];
  totalQuestions: number;
}

export default function ExamSelectionPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // Fetch available exams
  useEffect(() => {
    if (!user) return;
    fetchAvailableExams();
    fetchRecentExams();
  }, [user]);

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const userCourse = (user?.role === "student" || user?.role === "faculty") 
        ? (user as any).course 
        : "BSABEN";
      
      const response = await fetch(
        `/api/exams/available?course=${userCourse}&userId=${user?.id}`
      );
      const data = await response.json();

      if (response.ok) {
        if (data.type === "subjects") {
          setSubjects(data.data);
        } else {
          setAreas(data.data);
        }
      } else {
        console.error("Failed to fetch exams:", data.error);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExams = async () => {
    try {
      const userCourse = (user?.role === "student" || user?.role === "faculty") 
        ? (user as any).course 
        : "BSABEN";
        
      const response = await fetch(
        `/api/exams/history?userId=${user?.id}&course=${userCourse}&limit=5`
      );
      const data = await response.json();

      if (response.ok) {
        setRecentExams(data.results);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching exam history:", error);
    }
  };

  const handleStartExam = async (subject: string, area?: string) => {
    // Get user course
    const userCourse = (user?.role === "student" || user?.role === "faculty") 
      ? (user as any).course 
      : "BSABEN";

    try {
      // Check if student can take exam (daily limit)
      const params = new URLSearchParams({
        userId: user?.id || "",
        course: userCourse,
        subject,
        ...(area && { area }),
      });

      const response = await fetch(`/api/exams/can-take?${params.toString()}`);
      const data = await response.json();

      if (!data.canTake) {
        alert(data.message);
        return;
      }

      // Navigate to exam page
      const examParams = new URLSearchParams({
        course: userCourse,
        subject,
        ...(area && { area }),
      });
      router.push(`/student/exams/take?${examParams.toString()}`);
    } catch (error) {
      console.error("Error checking exam eligibility:", error);
      alert("Failed to start exam. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="text-[#7d1a1a] flex-shrink-0" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                Practice & Assessment • {(user.role === "student" || user.role === "faculty") ? (user as any).course : "All"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Take an Exam
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Choose a subject to start practicing
            </p>
          </div>

          <button
            onClick={() => router.push("/student/exams/history")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <BarChart3 size={16} />
            View History
          </button>
        </div>

        {/* STATISTICS CARDS */}
        {statistics && statistics.totalExams > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Trophy}
              label="Total Exams"
              value={statistics.totalExams}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              icon={Target}
              label="Average Score"
              value={`${Math.round(statistics.averageScore)}%`}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              icon={Award}
              label="Highest Score"
              value={`${statistics.highestScore}%`}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Questions"
              value={statistics.totalQuestions}
              color="text-purple-600"
              bg="bg-purple-50"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN EXAM SELECTION */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-gray-900">
              {((user.role === "student" || user.role === "faculty") && (user as any).course === "BSGE") ? "Select Subject" : "Select Area"}
            </h2>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
              </div>
            ) : ((user.role === "student" || user.role === "faculty") && (user as any).course === "BSGE") ? (
              // BSGE: Show subjects directly
              <div className="space-y-3">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <SubjectCard
                      key={subject.subject}
                      subject={subject}
                      onStart={() => handleStartExam(subject.subject)}
                    />
                  ))
                ) : (
                  <EmptyState message="No subjects available yet" />
                )}
              </div>
            ) : (
              // BSABEN: Show areas, then subjects
              <div className="space-y-3">
                {areas.length > 0 ? (
                  areas.map((area) => (
                    <AreaCard
                      key={area.area}
                      area={area}
                      isExpanded={selectedArea === area.area}
                      onToggle={() =>
                        setSelectedArea(
                          selectedArea === area.area ? null : area.area
                        )
                      }
                      onStartSubject={(subject) =>
                        handleStartExam(subject, area.area)
                      }
                    />
                  ))
                ) : (
                  <EmptyState message="No areas available yet" />
                )}
              </div>
            )}
          </div>

          {/* RECENT EXAMS SIDEBAR */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">Recent Exams</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              {recentExams.length > 0 ? (
                recentExams.map((exam) => (
                  <div
                    key={exam._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#7d1a1a]/20 transition-all cursor-pointer"
                    onClick={() =>
                      router.push(`/student/exams/results/${exam.examSessionId}`)
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {exam.subject}
                        </p>
                        {exam.area && (
                          <p className="text-xs text-gray-500">{exam.area}</p>
                        )}
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          exam.percentage >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : exam.percentage >= 60
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {exam.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatDate(exam.completedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No exams taken yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SUBJECT CARD (for BSGE)
function SubjectCard({
  subject,
  onStart,
}: {
  subject: Subject;
  onStart: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-[#7d1a1a]/30 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[#7d1a1a]/10 rounded-lg group-hover:bg-[#7d1a1a]/20 transition-colors">
              <BookOpen size={18} className="text-[#7d1a1a]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {subject.subject}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">
                {subject.easyCount} Easy
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">
                {subject.mediumCount} Medium
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">
                {subject.hardCount} Hard
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 font-medium">
            {subject.totalQuestions} questions available
          </p>
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7d1a1a] text-white rounded-xl font-bold text-sm hover:bg-[#5a1313] transition-all active:scale-95 group-hover:shadow-lg shadow-[#7d1a1a]/20 flex-shrink-0"
        >
          <Play size={16} />
          Start
        </button>
      </div>
    </div>
  );
}

// AREA CARD (for BSABEN)
function AreaCard({
  area,
  isExpanded,
  onToggle,
  onStartSubject,
}: {
  area: Area;
  isExpanded: boolean;
  onToggle: () => void;
  onStartSubject: (subject: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#7d1a1a]/30 transition-all">
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-[#7d1a1a]/10 rounded-lg">
            <Folder size={20} className="text-[#7d1a1a]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {area.area}
            </h3>
            <p className="text-sm text-gray-500">
              {area.subjects.length} subjects • {area.totalQuestions} questions
            </p>
          </div>
        </div>
        <ChevronRight
          className={`text-gray-400 transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          size={20}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
          {area.subjects.map((subject) => (
            <div
              key={subject.subject}
              className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between hover:border-[#7d1a1a]/20 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 mb-1 truncate">
                  {subject.subject}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{subject.totalQuestions} questions</span>
                  <span>•</span>
                  <span className="text-green-600">{subject.easyCount}E</span>
                  <span className="text-yellow-600">{subject.mediumCount}M</span>
                  <span className="text-red-600">{subject.hardCount}H</span>
                </div>
              </div>
              <button
                onClick={() => onStartSubject(subject.subject)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7d1a1a] text-white rounded-lg font-bold text-xs hover:bg-[#5a1313] transition-all active:scale-95 flex-shrink-0"
              >
                <Play size={14} />
                Start
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STAT CARD
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

// EMPTY STATE
function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
        <BookOpen size={32} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}