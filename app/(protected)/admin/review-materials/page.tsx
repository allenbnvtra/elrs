"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  Plus, Search, FileText, Video, Trash2, Clock, GraduationCap,
  X, Upload, AlertCircle, Loader2, ExternalLink, Download,
  ChevronRight, Folder, BookOpen, Link2, Filter, 
  ArrowUpDown, ArrowUp, ArrowDown, Eye, Calendar, User, Menu
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface Material {
  _id: string;
  title: string;
  description?: string;
  type: "document" | "video";
  course: "BSGE" | "BSABEN";
  area?: string;
  subject: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  videoUrl?: string;
  videoDuration?: string;
  uploadedByName: string;
  uploadedByRole: string;
  createdAt: string;
  updatedAt: string;
}

interface Area {
  _id: string;
  name: string;
  description?: string;
  course: string;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
  course: string;
  area?: string;
  questionCount: number;
  createdAt: string;
}

type SortField = "title" | "subject" | "area" | "createdAt" | "type";
type SortDirection = "asc" | "desc";

const ITEMS_PER_LOAD = 20;

export default function ReviewMaterialsPage() {
  const { user } = useAuth();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [selectedCourse, setSelectedCourse] = useState<"BSGE" | "BSABEN">(
    user?.course || "BSABEN"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  
  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<"document" | "video">("document");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    area: "",
    subject: "",
    file: null as File | null,
    videoUrl: "",
    videoDuration: "",
  });

  // Fetch areas (only for BSABEN)
  const fetchAreas = async () => {
    if (selectedCourse === "BSGE") {
      console.log("🚫 Skipping areas fetch for BSGE (no areas)");
      setAreas([]);
      return;
    }

    setLoadingAreas(true);
    try {
      console.log("📁 Fetching areas for BSABEN");
      const response = await fetch(`/api/areas?course=${selectedCourse}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Fetched ${data.areas?.length || 0} areas`);
        setAreas(data.areas || []);
      } else {
        console.error("❌ Failed to fetch areas:", data.error);
        setAreas([]);
      }
    } catch (error) {
      console.error("❌ Error fetching areas:", error);
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      console.log(`📚 Fetching subjects for ${selectedCourse}`);
      const response = await fetch(`/api/subjects?course=${selectedCourse}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter to ensure we only get subjects for the current course
        const courseSubjects = (data.subjects || []).filter(
          (s: Subject) => s.course === selectedCourse
        );
        
        console.log(`✅ Found ${courseSubjects.length} subjects for ${selectedCourse}:`, 
          courseSubjects.map((s: Subject) => ({ name: s.name, area: s.area }))
        );
        
        setSubjects(courseSubjects);
      } else {
        console.error("❌ Failed to fetch subjects:", data.error);
        setSubjects([]);
      }
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      console.log(`📦 Fetching materials for ${selectedCourse}`);
      const queryParams = new URLSearchParams({ course: selectedCourse });
      const response = await fetch(`/api/review-materials?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Fetched ${data.materials?.length || 0} materials`);
        setMaterials(data.materials);
      } else {
        console.error("❌ Failed to fetch materials:", data.error);
        setMaterials([]);
      }
    } catch (error) {
      console.error("❌ Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    console.log(`🔄 Course changed to: ${selectedCourse}`);
    fetchAreas();
    fetchSubjects();
    fetchMaterials();
  }, [selectedCourse]);

  useEffect(() => {
    console.log(`🔄 Resetting filters for course change to ${selectedCourse}`);
    setSelectedAreas([]);
    setSelectedSubjects([]);
    setSelectedTypes([]);
    setVisibleCount(ITEMS_PER_LOAD);
  }, [selectedCourse]);

  // Filtered and sorted materials
  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.area && item.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type);
      
      // For BSGE: ignore area filter (no areas)
      const matchesArea = selectedCourse === "BSGE" || 
        selectedAreas.length === 0 || 
        (item.area && selectedAreas.includes(item.area));
      
      const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(item.subject);

      return matchesSearch && matchesType && matchesArea && matchesSubject;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "subject":
          comparison = a.subject.localeCompare(b.subject);
          break;
        case "area":
          comparison = (a.area || "").localeCompare(b.area || "");
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [materials, searchQuery, sortField, sortDirection, selectedTypes, selectedAreas, selectedSubjects, selectedCourse]);

  const visibleMaterials = useMemo(() => {
    return filteredAndSortedMaterials.slice(0, visibleCount);
  }, [filteredAndSortedMaterials, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredAndSortedMaterials.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + ITEMS_PER_LOAD, filteredAndSortedMaterials.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredAndSortedMaterials.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleFilter = (filterType: "type" | "area" | "subject", value: string) => {
    const setters = {
      type: setSelectedTypes,
      area: setSelectedAreas,
      subject: setSelectedSubjects,
    };

    setters[filterType](prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
    setVisibleCount(ITEMS_PER_LOAD);
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedAreas([]);
    setSelectedSubjects([]);
    setSearchQuery("");
  };

  const handleUpload = async () => {
    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("type", uploadType);
      formData.append("course", selectedCourse);
      
      // Only add area for BSABEN
      if (selectedCourse === "BSABEN" && uploadForm.area) {
        formData.append("area", uploadForm.area);
      }
      
      formData.append("subject", uploadForm.subject);
      formData.append("userId", user?.id || "");

      if (uploadType === "document" && uploadForm.file) {
        formData.append("file", uploadForm.file);
      } else if (uploadType === "video") {
        formData.append("videoUrl", uploadForm.videoUrl);
        formData.append("videoDuration", uploadForm.videoDuration);
      }

      const response = await fetch("/api/review-materials/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setShowUploadModal(false);
      setUploadForm({
        title: "",
        description: "",
        area: "",
        subject: "",
        file: null,
        videoUrl: "",
        videoDuration: "",
      });
      fetchMaterials();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/review-materials/${id}?userId=${user?.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMaterials();
      } else {
        const data = await response.json();
        alert(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Delete failed");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const canManageCourse = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "faculty" && user.course === selectedCourse) return true;
    return false;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-300" />;
    return sortDirection === "asc" 
      ? <ArrowUp size={14} className="text-[#7d1a1a]" />
      : <ArrowDown size={14} className="text-[#7d1a1a]" />;
  };

  const activeFilterCount = selectedTypes.length + selectedAreas.length + selectedSubjects.length;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 max-w-[1800px] mx-auto overflow-hidden">
      
      {/* MOBILE FILTER MODAL */}
      {showFiltersPanel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFiltersPanel(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[#7d1a1a]" />
                  <h3 className="font-black text-lg text-slate-800">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#7d1a1a] text-white text-xs font-bold rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFiltersPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <FilterContent 
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                user={user}
                selectedTypes={selectedTypes}
                toggleFilter={toggleFilter}
                materials={materials}
                selectedAreas={selectedAreas}
                areas={areas}
                loadingAreas={loadingAreas}
                selectedSubjects={selectedSubjects}
                subjects={subjects}
                loadingSubjects={loadingSubjects}
                clearAllFilters={clearAllFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR FILTERS */}
      <div className={`hidden lg:block transition-all duration-300 ${showFiltersPanel ? 'w-72' : 'w-0 overflow-hidden'}`}>
        {showFiltersPanel && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#7d1a1a]" />
                <h3 className="text-lg text-slate-800">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#7d1a1a] text-white text-xs font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-[#7d1a1a] font-medium"
              >
                Clear all
              </button>
            </div>

            <FilterContent 
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              user={user}
              selectedTypes={selectedTypes}
              toggleFilter={toggleFilter}
              materials={materials}
              selectedAreas={selectedAreas}
              areas={areas}
              loadingAreas={loadingAreas}
              selectedSubjects={selectedSubjects}
              subjects={subjects}
              loadingSubjects={loadingSubjects}
              clearAllFilters={clearAllFilters}
            />
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0 flex-shrink">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="text-[#7d1a1a] flex-shrink-0" size={16} />
              <span className="text-[#7d1a1a] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                Academic Resources • {selectedCourse}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
              Review Materials
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {filteredAndSortedMaterials.length} materials • Showing {visibleMaterials.length}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Filter size={16} />
              <span className="sm:inline text-slate-800">Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#7d1a1a] text-white text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {canManageCourse() && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#7d1a1a] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 text-xs sm:text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Upload</span>
              </button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* TABLE / CARDS */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
            </div>
          ) : filteredAndSortedMaterials.length > 0 ? (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:flex flex-col h-full">
                <div className="bg-gray-50 border-b border-gray-200 px-4 xl:px-6 py-3 flex items-center gap-3 xl:gap-4 text-xs font-bold text-gray-600 uppercase tracking-wider flex-shrink-0">
                  <div className="w-8"></div>
                  <button 
                    onClick={() => handleSort("type")}
                    className="w-20 xl:w-24 flex items-center gap-2 hover:text-[#7d1a1a] transition-colors"
                  >
                    Type
                    <SortIcon field="type" />
                  </button>
                  <button 
                    onClick={() => handleSort("title")}
                    className="flex-1 min-w-0 flex items-center gap-2 hover:text-[#7d1a1a] transition-colors"
                  >
                    Title
                    <SortIcon field="title" />
                  </button>
                  {selectedCourse === "BSABEN" && (
                    <button 
                      onClick={() => handleSort("area")}
                      className="w-32 xl:w-40 flex items-center gap-2 hover:text-[#7d1a1a] transition-colors"
                    >
                      Area
                      <SortIcon field="area" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleSort("subject")}
                    className="w-36 xl:w-44 flex items-center gap-2 hover:text-[#7d1a1a] transition-colors"
                  >
                    Subject
                    <SortIcon field="subject" />
                  </button>
                  <button 
                    onClick={() => handleSort("createdAt")}
                    className="w-28 xl:w-32 flex items-center gap-2 hover:text-[#7d1a1a] transition-colors"
                  >
                    Date
                    <SortIcon field="createdAt" />
                  </button>
                  <div className="w-32 xl:w-36 text-right">Actions</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {visibleMaterials.map((item, index) => (
                    <div 
                      key={item._id}
                      className={`px-4 xl:px-6 py-3 xl:py-4 flex items-center gap-3 xl:gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <div className="w-8 flex items-center justify-center flex-shrink-0">
                        {item.type === "video" ? (
                          <div className="p-1.5 bg-[#1A1A1A] rounded-lg">
                            <Video size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-[#7d1a1a]/10 rounded-lg">
                            <FileText size={14} className="text-[#7d1a1a]" />
                          </div>
                        )}
                      </div>

                      <div className="w-20 xl:w-24 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-md text-[10px] xl:text-xs font-bold ${
                          item.type === "video" 
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {item.type === "video" ? "Video" : "Doc"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate mb-0.5">
                          {item.title}
                        </h4>
                        {item.type === "video" && item.videoDuration && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={10} />
                            {item.videoDuration}
                          </div>
                        )}
                      </div>

                      {selectedCourse === "BSABEN" && (
                        <div className="w-32 xl:w-40 flex-shrink-0">
                          {item.area ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] xl:text-xs font-medium truncate block">
                              {item.area}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      )}

                      <div className="w-36 xl:w-44 flex-shrink-0">
                        <span className="px-2 py-1 bg-[#7d1a1a]/10 text-[#7d1a1a] rounded-md text-[10px] xl:text-xs font-medium truncate block">
                          {item.subject}
                        </span>
                      </div>

                      <div className="w-28 xl:w-32 flex-shrink-0">
                        <div className="text-[10px] xl:text-xs text-gray-600">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      <div className="w-32 xl:w-36 flex items-center justify-end gap-2 flex-shrink-0">
                        {canManageCourse() && (
                          <button 
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 xl:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {item.type === 'video' ? (
                          <a 
                            href={item.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1 xl:py-1.5 bg-[#7d1a1a] text-white rounded-lg font-bold text-[10px] xl:text-xs hover:shadow-lg hover:shadow-[#7d1a1a]/30 transition-all"
                          >
                            <ExternalLink size={12} />
                            Watch
                          </a>
                        ) : (
                          <a 
                            href={item.fileUrl} 
                            download={item.fileName}
                            className="flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1 xl:py-1.5 bg-[#7d1a1a] text-white rounded-lg font-bold text-[10px] xl:text-xs hover:shadow-lg hover:shadow-[#7d1a1a]/30 transition-all"
                          >
                            <Download size={12} />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  <div ref={observerTarget} className="h-16 flex items-center justify-center">
                    {isLoadingMore && (
                      <Loader2 className="animate-spin text-[#7d1a1a]" size={20} />
                    )}
                    {visibleCount >= filteredAndSortedMaterials.length && filteredAndSortedMaterials.length > 0 && (
                      <p className="text-xs text-gray-400">All materials loaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3">
                {visibleMaterials.map((item) => (
                  <div 
                    key={item._id}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {item.type === "video" ? (
                          <div className="p-2 bg-[#1A1A1A] rounded-lg">
                            <Video size={18} className="text-white" />
                          </div>
                        ) : (
                          <div className="p-2 bg-[#7d1a1a]/10 rounded-lg">
                            <FileText size={18} className="text-[#7d1a1a]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            item.type === "video" 
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {item.type === "video" ? "Video" : "Document"}
                          </span>
                          {item.type === "video" && item.videoDuration && (
                            <div className="flex items-center gap-1 text-[9px] text-gray-500">
                              <Clock size={10} />
                              {item.videoDuration}
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                          {item.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {selectedCourse === "BSABEN" && item.area && (
                            <span className="px-1.5 py-0.5 bg-white text-gray-600 rounded font-medium">
                              {item.area}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-[#7d1a1a]/10 text-[#7d1a1a] rounded font-medium">
                            {item.subject}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      {canManageCourse() && (
                        <button 
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="flex-1"></div>
                      {item.type === 'video' ? (
                        <a 
                          href={item.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#7d1a1a] text-white rounded-lg font-bold text-xs hover:shadow-lg transition-all"
                        >
                          <ExternalLink size={14} />
                          Watch Video
                        </a>
                      ) : (
                        <a 
                          href={item.fileUrl} 
                          download={item.fileName}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#7d1a1a] text-white rounded-lg font-bold text-xs hover:shadow-lg transition-all"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={observerTarget} className="h-16 flex items-center justify-center">
                  {isLoadingMore && (
                    <Loader2 className="animate-spin text-[#7d1a1a]" size={20} />
                  )}
                  {visibleCount >= filteredAndSortedMaterials.length && filteredAndSortedMaterials.length > 0 && (
                    <p className="text-xs text-gray-400">All materials loaded</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <FileText size={32} />
              </div>
              <p className="font-bold text-base text-center">
                No materials found
              </p>
              <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
                {activeFilterCount > 0 || searchQuery
                  ? "Try adjusting your filters or search query"
                  : canManageCourse()
                  ? "Upload new materials to get started"
                  : "No materials available yet"}
              </p>
              {(activeFilterCount > 0 || searchQuery) && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Upload Material</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Material Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setUploadType("document")}
                        className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          uploadType === "document"
                            ? "border-[#7d1a1a] bg-[#7d1a1a]/5 text-[#7d1a1a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Upload size={18} />
                        <span className="font-bold text-sm">PDF Document</span>
                      </button>
                      <button
                        onClick={() => setUploadType("video")}
                        className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          uploadType === "video"
                            ? "border-[#7d1a1a] bg-[#7d1a1a]/5 text-[#7d1a1a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Link2 size={18} />
                        <span className="font-bold text-sm">Video Link</span>
                      </button>
                    </div>
                  </div>

                  {selectedCourse === "BSABEN" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Area</label>
                      <select
                        value={uploadForm.area}
                        onChange={(e) => setUploadForm({ ...uploadForm, area: e.target.value, subject: "" })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                      >
                        <option value="">Select Area</option>
                        {areas.map((area) => (
                          <option key={area._id} value={area.name}>{area.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Subject</label>
                    <select
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                      disabled={selectedCourse === "BSABEN" && !uploadForm.area}
                    >
                      <option value="">Select Subject</option>
                      {subjects
                        .filter(s => {
                          // For BSGE: show all subjects
                          if (selectedCourse === "BSGE") return true;
                          // For BSABEN: filter by selected area
                          return !uploadForm.area || s.area === uploadForm.area;
                        })
                        .map((subject) => (
                          <option key={subject._id} value={subject.name}>{subject.name}</option>
                        ))}
                    </select>
                    {selectedCourse === "BSABEN" && !uploadForm.area && (
                      <p className="text-xs text-gray-500 mt-1">Please select an area first</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Title</label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                      placeholder="Enter material title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Description (Optional)</label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] resize-none text-sm"
                      rows={3}
                      placeholder="Brief description of the material"
                    />
                  </div>

                  {uploadType === "document" ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">PDF File</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">Maximum file size: 50MB</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Video URL</label>
                        <input
                          type="url"
                          value={uploadForm.videoUrl}
                          onChange={(e) => setUploadForm({ ...uploadForm, videoUrl: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Duration (Optional)</label>
                        <input
                          type="text"
                          value={uploadForm.videoDuration}
                          onChange={(e) => setUploadForm({ ...uploadForm, videoDuration: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] text-sm"
                          placeholder="e.g., 45:30"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={
                        isUploading || 
                        !uploadForm.title || 
                        !uploadForm.subject || 
                        (selectedCourse === "BSABEN" && !uploadForm.area) ||
                        (uploadType === 'document' && !uploadForm.file) || 
                        (uploadType === 'video' && !uploadForm.videoUrl)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#7d1a1a] text-white font-bold rounded-xl hover:bg-[#5a1313] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload Material</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Filter Content Component
function FilterContent({ 
  selectedCourse, 
  setSelectedCourse, 
  user, 
  selectedTypes, 
  toggleFilter, 
  materials,
  selectedAreas,
  areas,
  loadingAreas,
  selectedSubjects,
  subjects,
  loadingSubjects,
  clearAllFilters
}: any) {
  return (
    <>
      {user?.role === "admin" && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
            Course
          </label>
          <div className="space-y-2">
            {["BSABEN", "BSGE"].map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course as "BSGE" | "BSABEN")}
                className={`w-full px-4 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                  selectedCourse === course
                    ? "bg-[#7d1a1a] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {course === "BSABEN" ? "Agricultural & Biosystems" : "Geodetic Engineering"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
          Material Type
        </label>
        <div className="space-y-2">
          {["document", "video"].map((type) => (
            <label key={type} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleFilter("type", type)}
                className="w-4 h-4 text-[#7d1a1a] border-gray-300 rounded focus:ring-[#7d1a1a] cursor-pointer"
              />
              <div className="flex items-center gap-2 flex-1 text-slate-700">
                {type === "document" ? <FileText size={16} className="text-[#7d1a1a]/70" /> : <Video size={16} className="text-[#7d1a1a]/70" />}
                <span className="text-sm font-medium capitalize">{type}</span>
              </div>
              <span className="text-xs text-gray-400">
                {materials.filter((m: Material) => m.type === type).length}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* AREAS - Only show for BSABEN */}
      {selectedCourse === "BSABEN" && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
            Area
          </label>
          {loadingAreas ? (
            <div className="text-center py-4">
              <Loader2 size={20} className="text-[#7d1a1a] mx-auto animate-spin" />
              <p className="text-xs text-gray-400 mt-2">Loading areas...</p>
            </div>
          ) : areas.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {areas.map((area: Area) => (
                <label key={area._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area.name)}
                    onChange={() => toggleFilter("area", area.name)}
                    className="w-4 h-4 text-[#7d1a1a] border-gray-300 rounded focus:ring-[#7d1a1a] cursor-pointer"
                  />
                  <div className="flex items-center gap-2 flex-1 text-slate-700 min-w-0">
                    <Folder size={16} className="text-[#7d1a1a]/70 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{area.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {materials.filter((m: Material) => m.area === area.name).length}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Folder size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No areas found</p>
            </div>
          )}
        </div>
      )}

      {/* SUBJECTS - Always show, filtered by area for BSABEN */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
          Subject
        </label>
        {loadingSubjects ? (
          <div className="text-center py-4">
            <Loader2 size={20} className="text-[#7d1a1a] mx-auto animate-spin" />
            <p className="text-xs text-gray-400 mt-2">Loading subjects...</p>
          </div>
        ) : subjects.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subjects
              .filter((subject: Subject) => {
                // For BSGE: show all subjects (no area filtering)
                if (selectedCourse === "BSGE") return true;
                
                // For BSABEN: filter by selected areas
                if (selectedAreas.length === 0) return true;
                return !subject.area || selectedAreas.includes(subject.area);
              })
              .map((subject: Subject) => (
                <label key={subject._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.name)}
                    onChange={() => toggleFilter("subject", subject.name)}
                    className="w-4 h-4 text-[#7d1a1a] border-gray-300 rounded focus:ring-[#7d1a1a] cursor-pointer"
                  />
                  <div className="flex items-center gap-2 flex-1 text-slate-700 min-w-0">
                    <BookOpen size={16} className="text-[#7d1a1a]/70 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{subject.name}</span>
                      {selectedCourse === "BSABEN" && subject.area && (
                        <span className="text-xs text-gray-400 truncate block">{subject.area}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {materials.filter((m: Material) => {
                      // For BSGE: only match subject name
                      if (selectedCourse === "BSGE") {
                        return m.subject === subject.name;
                      }
                      // For BSABEN: match both subject name and area
                      return m.subject === subject.name && 
                        (!subject.area || m.area === subject.area);
                    }).length}
                  </span>
                </label>
              ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <BookOpen size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No subjects for {selectedCourse}</p>
            <p className="text-xs text-gray-400 mt-1">Create in Questions page</p>
          </div>
        )}
      </div>
    </>
  );
}