"use client";

import React from "react";
import { BookOpen, Calendar, Trophy, TrendingUp, ArrowUpRight, PlayCircle, LayoutDashboard, Clock, Target, CheckCircle } from "lucide-react";

export default function StudentDashboard() {
  return (
    <div className="space-y-6 xs:space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* WELCOME SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div className="min-w-0 flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-[#7d1a1a] flex-shrink-0" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
              My Learning Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
            Welcome Back, Student!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            You're making great progress. Keep up the excellent work!
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all text-xs sm:text-sm shadow-sm">
            <Calendar size={16} className="flex-shrink-0" />
            <span className="hidden sm:inline">View Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#7d1a1a] text-white font-bold rounded-lg sm:rounded-xl hover:bg-[#5a1313] transition-all active:scale-95 text-xs sm:text-sm shadow-lg shadow-[#7d1a1a]/20">
            <Target size={16} className="flex-shrink-0" />
            <span className="hidden sm:inline">Start Studying</span>
            <span className="sm:hidden">Study Now</span>
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        {[
          { label: "Enrolled Courses", value: "6", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Upcoming Exams", value: "3", icon: Calendar, color: "text-[#7d1a1a]", bg: "bg-[#7d1a1a]/5" },
          { label: "Completed Exams", value: "24", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Average Score", value: "84%", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, i) => (
          <div 
            key={i} 
            className="bg-white p-4 xs:p-5 sm:p-6 rounded-2xl xs:rounded-[20px] sm:rounded-[24px] border border-gray-200/60 shadow-sm hover:shadow-xl transition-all group cursor-default"
          >
            <div className="flex items-center justify-between mb-3 xs:mb-4">
              <div className={`p-2 xs:p-2.5 sm:p-3 rounded-xl xs:rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={18} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-0.5 xs:gap-1 text-emerald-600 font-bold text-[10px] xs:text-xs bg-emerald-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg">
                <ArrowUpRight size={12} className="xs:w-3.5 xs:h-3.5" />
                <span>8%</span>
              </div>
            </div>
            <h3 className="text-xl xs:text-2xl font-black text-gray-900 tracking-tight">{item.value}</h3>
            <p className="text-[10px] xs:text-xs sm:text-sm font-bold text-gray-400 mt-0.5 xs:mt-1 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
        {/* PROGRESS ANALYTICS BOX */}
        <div className="lg:col-span-2 bg-white rounded-2xl xs:rounded-[24px] sm:rounded-[32px] border border-gray-200/60 p-4 xs:p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-6 sm:mb-8">
            <h3 className="text-base xs:text-lg font-black text-gray-900">My Progress Overview</h3>
            <select className="bg-gray-50 border border-gray-200 text-[10px] xs:text-xs font-bold p-1.5 xs:p-2 rounded-lg focus:outline-none w-full xs:w-auto">
              <option>This Semester</option>
              <option>Last Semester</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-48 xs:h-56 sm:h-64 md:h-72 bg-gray-50/50 rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center p-4">
            <p className="text-gray-400 font-semibold italic text-xs xs:text-sm text-center">
              Performance Chart Component Integration
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS / SIDE CARDS */}
        <div className="space-y-4 xs:space-y-6">
          <div className="bg-[#1A1A1A] rounded-2xl xs:rounded-[24px] sm:rounded-[32px] p-5 xs:p-6 sm:p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 xs:p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <PlayCircle size={60} className="xs:w-20 xs:h-20 sm:w-[100px] sm:h-[100px]" />
            </div>
            <h4 className="text-base xs:text-lg font-bold mb-1.5 xs:mb-2 relative z-10">Study Resources</h4>
            <p className="text-white/60 text-xs xs:text-sm mb-4 xs:mb-6 font-medium leading-relaxed relative z-10">
              Access video lectures, notes, and practice materials for your courses.
            </p>
            <button className="w-full py-2.5 xs:py-3 bg-[#7d1a1a] rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm hover:bg-[#a02323] transition-all active:scale-95 relative z-10">
              Browse Library
            </button>
          </div>

          <div className="bg-white rounded-2xl xs:rounded-[24px] sm:rounded-[32px] border border-gray-200/60 p-5 xs:p-6 sm:p-8 shadow-sm">
            <h4 className="text-gray-900 font-black mb-4 xs:mb-6 text-sm xs:text-base">Upcoming Deadlines</h4>
            <div className="space-y-3 xs:space-y-4 sm:space-y-5">
              {[
                { title: "Engineering Math Exam", time: "Tomorrow, 9:00 AM" },
                { title: "Physics Assignment Due", time: "In 3 days" },
                { title: "Chemistry Quiz", time: "Next Week" },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 xs:gap-3 sm:gap-4">
                  <div className="w-1 xs:w-1.5 h-8 xs:h-10 bg-[#7d1a1a] rounded-full flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-sm font-bold text-gray-800 leading-none mb-1.5 xs:mb-2 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} className="text-gray-400 flex-shrink-0 xs:w-3 xs:h-3" />
                      <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE COURSES SECTION */}
      <div className="bg-white rounded-2xl xs:rounded-[24px] sm:rounded-[32px] border border-gray-200/60 p-4 xs:p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 xs:mb-6 sm:mb-8">
          <h3 className="text-base xs:text-lg font-black text-gray-900">Active Courses</h3>
          <button className="text-[#7d1a1a] font-bold text-xs xs:text-sm hover:underline">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          {[
            { name: "Engineering Mathematics", progress: 75, color: "bg-blue-600" },
            { name: "Physics for Engineers", progress: 60, color: "bg-purple-600" },
            { name: "Chemistry Fundamentals", progress: 85, color: "bg-emerald-600" },
          ].map((course, i) => (
            <div key={i} className="bg-gray-50 p-4 xs:p-5 rounded-xl xs:rounded-2xl border border-gray-200/60 hover:border-[#7d1a1a]/20 transition-all group cursor-pointer">
              <div className="flex items-start justify-between mb-3 xs:mb-4">
                <div className={`p-2 xs:p-2.5 rounded-lg xs:rounded-xl ${course.color} text-white`}>
                  <BookOpen size={16} className="xs:w-5 xs:h-5" />
                </div>
                <span className="text-xs xs:text-sm font-black text-gray-900">{course.progress}%</span>
              </div>
              <h4 className="text-sm xs:text-base font-bold text-gray-900 mb-2 xs:mb-3 group-hover:text-[#7d1a1a] transition-colors">
                {course.name}
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-1.5 xs:h-2 mb-2 xs:mb-3">
                <div 
                  className={`h-full rounded-full ${course.color} transition-all duration-500`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <TrendingUp size={12} className="xs:w-3.5 xs:h-3.5" />
                <p className="text-[10px] xs:text-xs font-bold">On track</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}