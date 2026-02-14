"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, MoreVertical, ShieldCheck, ShieldAlert, 
  Clock, FilePlus, UserPlus, ChevronLeft, 
  ChevronRight, Activity, Zap, X, Loader2, AlertCircle,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface Coordinator {
  _id: string;
  name: string;
  email: string;
  course: "BSABEN" | "BSGE";
  department: string;
  contributions: number;
  lastActive?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
}

interface Stats {
  totalCoordinators: number;
  activeCoordinators: number;
  totalContributions: number;
  syncFrequency: string;
}

export default function CoordinatorStatusPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<"BSABEN" | "BSGE" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCoordinators: 0,
    activeCoordinators: 0,
    totalContributions: 0,
    syncFrequency: "Normal",
  });
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Check if user is online (lastActive within 5 minutes)
  const isOnline = (lastActive?: string) => {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  // Format last active time
  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return "Never";
    const now = Date.now();
    const then = new Date(lastActive).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Active Now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  // Fetch coordinators
  const fetchCoordinators = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        userId: user.id,
        status: "approved",
      });

      if (selectedCourse !== "all") {
        params.set("course", selectedCourse);
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/coordinators?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch coordinators");
        return;
      }

      setCoordinators(data.coordinators);
      setStats(data.stats);
    } catch (err) {
      setError("Failed to load coordinators");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, [user?.id, selectedCourse, searchQuery]);

  // Revoke coordinator access
  const handleRevokeAccess = async (coordinatorId: string, coordinatorName: string) => {
    if (!user?.id) return;
    
    if (!confirm(`Revoke access for ${coordinatorName}? This will prevent them from accessing coordinator features.`)) {
      return;
    }

    setRevoking(coordinatorId);
    setError("");

    try {
      const res = await fetch(`/api/coordinators?coordinatorId=${coordinatorId}&userId=${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to revoke access");
        return;
      }

      alert("Coordinator access revoked successfully");
      await fetchCoordinators();
    } catch (err) {
      setError("Failed to revoke access");
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  // Filter coordinators by search
  const filteredCoordinators = coordinators;

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="space-y-4 xs:space-y-6 sm:space-y-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
          <div>
            <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
              <GraduationCap className="text-[#7d1a1a]" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
                Department Leads & Content Moderators
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Coordinator Management
            </h1>
          </div>

          <button 
            onClick={() => window.location.href = '/admin/coordinators/pending'}
            className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 text-xs xs:text-sm"
          >
            <UserPlus size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
            <span className="truncate">View Pending Coordinators</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-3 xs:grid-cols-3 gap-3 xs:gap-4">
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-[#7d1a1a]/5 rounded-xl xs:rounded-2xl flex items-center justify-center text-[#7d1a1a] flex-shrink-0">
            <ShieldCheck size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Active Leads
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">
              {stats.totalCoordinators.toString().padStart(2, '0')}
            </h4>
          </div>
        </div>
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-blue-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <Activity size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Sync Frequency
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">{stats.syncFrequency}</h4>
          </div>
        </div>
        <div className="bg-white p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-[20px] sm:rounded-3xl border border-gray-200 shadow-sm flex items-center gap-2 xs:gap-3 sm:gap-4 xs:col-span-3 sm:col-span-1">
          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Zap size={20} className="xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              Total Contribs
            </p>
            <h4 className="text-lg xs:text-xl font-black text-gray-900">
              {stats.totalContributions >= 1000 
                ? `${(stats.totalContributions / 1000).toFixed(1)}k` 
                : stats.totalContributions}
            </h4>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {[
            { value: "all", label: "All Departments" },
            { value: "BSABEN", label: "BSABEN Department" },
            { value: "BSGE", label: "BSGE Department" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedCourse(option.value as any)}
              className={`flex-1 min-w-[120px] xs:min-w-0 px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCourse === option.value 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Search coordinators by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 text-slate-800 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X size={14} className="xs:w-4 xs:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">Coordinator</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Questions Added</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-8 py-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin text-[#7d1a1a] mx-auto" />
                  </td>
                </tr>
              ) : filteredCoordinators.length > 0 ? filteredCoordinators.map((coord) => (
                <tr key={coord._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7d1a1a] flex items-center justify-center text-white font-black text-xs shadow-inner">
                        {coord.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">{coord.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{coord.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline(coord.lastActive) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[11px] font-bold text-gray-700 capitalize">
                        {isOnline(coord.lastActive) ? 'online' : 'offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <FilePlus size={14} className="text-[#7d1a1a]" />
                      <span className="text-xs font-black text-gray-700">{coord.contributions}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold">{formatLastActive(coord.lastActive)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRevokeAccess(coord._id, coord.name)}
                        disabled={revoking === coord._id}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-[#7d1a1a] hover:text-white transition-all disabled:opacity-60"
                        aria-label="Revoke access"
                      >
                        {revoking === coord._id ? (
                          <Loader2 size={14} className="animate-spin inline" />
                        ) : (
                          "Revoke Access"
                        )}
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-all"
                        aria-label="More options"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <ShieldCheck size={48} className="text-gray-400" />
                      <p className="mt-4 font-black uppercase tracking-widest text-sm text-gray-500">
                        No Coordinators Found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Audit logs updated in real-time
          </p>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="p-2 text-gray-400 hover:bg-white border border-gray-200 rounded-lg disabled:opacity-30" 
              disabled
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#7d1a1a]" />
          </div>
        ) : filteredCoordinators.length > 0 ? filteredCoordinators.map((coord) => (
          <div 
            key={coord._id} 
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-sm p-3 xs:p-4 hover:shadow-md transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start gap-2 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl bg-[#7d1a1a] flex items-center justify-center text-white font-black text-xs xs:text-sm shadow-inner flex-shrink-0">
                {coord.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm xs:text-base font-black text-gray-900 leading-none mb-1 truncate">
                  {coord.name}
                </h3>
                <p className="text-[10px] xs:text-[11px] text-gray-400 font-bold mb-1.5 xs:mb-2 truncate">
                  {coord.email}
                </p>
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <div className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${
                    isOnline(coord.lastActive) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className="text-[9px] xs:text-[10px] font-bold text-gray-600 capitalize">
                    {isOnline(coord.lastActive) ? 'online' : 'offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-2 xs:space-y-2.5 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Department:
                </span>
                <span className="text-[10px] xs:text-xs font-bold text-gray-700">
                  {coord.course}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Questions Added:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <FilePlus size={12} className="text-[#7d1a1a] xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-black text-gray-700">
                    {coord.contributions}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-500 font-medium">
                  Last Sync:
                </span>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <Clock size={12} className="text-gray-400 xs:w-3.5 xs:h-3.5" />
                  <span className="text-[10px] xs:text-xs font-bold text-gray-600">
                    {formatLastActive(coord.lastActive)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button 
                onClick={() => handleRevokeAccess(coord._id, coord.name)}
                disabled={revoking === coord._id}
                className="flex-1 flex items-center justify-center gap-1 xs:gap-1.5 px-3 xs:px-4 py-2 xs:py-2.5 bg-gray-100 text-gray-600 rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:bg-[#7d1a1a] hover:text-white transition-all active:scale-95 disabled:opacity-60"
              >
                {revoking === coord._id ? (
                  <Loader2 size={14} className="animate-spin xs:w-4 xs:h-4" />
                ) : (
                  <ShieldAlert size={14} className="xs:w-4 xs:h-4" />
                )}
                <span>Revoke Access</span>
              </button>
              <button 
                className="p-2 xs:p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg xs:rounded-xl transition-all active:scale-95 flex-shrink-0"
                aria-label="More options"
              >
                <MoreVertical size={16} className="xs:w-[18px] xs:h-[18px]" />
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl xs:rounded-2xl border-2 border-dashed border-gray-100 p-8 xs:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-3 xs:mb-4">
              <ShieldCheck size={32} className="text-gray-400 xs:w-10 xs:h-10" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs xs:text-sm text-gray-500 mb-1">
              No Coordinators Found
            </p>
            <p className="text-[10px] xs:text-xs font-bold text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}