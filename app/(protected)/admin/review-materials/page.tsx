"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Filter, FileText, Video, Trash2, Edit3, Clock, GraduationCap,
  X, Upload, Link as LinkIcon, AlertCircle, Loader2, ExternalLink, Download
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface Material {
  _id: string;
  title: string;
  description?: string;
  type: "document" | "video";
  course: "BSGE" | "BSABEN";
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

export default function ReviewMaterialsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<"BSGE" | "BSABEN">(
    user?.course || "BSABEN"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<"document" | "video">("document");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subject: "",
    file: null as File | null,
    videoUrl: "",
    videoDuration: "",
  });

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        course: selectedCourse,
        ...(activeTab !== "all" && { type: activeTab }),
      });

      const response = await fetch(`/api/review-materials?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedCourse, activeTab]);

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("type", uploadType);
      formData.append("course", selectedCourse);
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

      // Success
      setShowUploadModal(false);
      setUploadForm({
        title: "",
        description: "",
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

  // Handle delete
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Check if user can upload to selected course
  const canUpload = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "faculty" && user.course === selectedCourse) return true;
    return false;
  };

  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <GraduationCap className="text-[#7d1a1a]" size={16} />
            <span className="text-[#7d1a1a] font-bold text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest">
              Academic Resources
            </span>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Review Materials
          </h1>
        </div>
        {canUpload() && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-1.5 xs:gap-2 bg-[#7d1a1a] text-white px-4 xs:px-5 sm:px-6 py-2.5 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-bold shadow-lg shadow-[#7d1a1a]/20 hover:bg-[#5a1313] transition-all active:scale-95 text-xs xs:text-sm"
          >
            <Plus size={16} className="xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5" />
            <span className="truncate">Upload for {selectedCourse}</span>
          </button>
        )}
      </div>

      {/* COURSE SELECTOR TABS */}
      <div className="flex gap-2 xs:gap-3 sm:gap-4 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {(user?.role === "admin" ? ["BSABEN", "BSGE"] : [user?.course]).filter(Boolean).map((course) => (
          <button
            key={course}
            onClick={() => setSelectedCourse(course as "BSGE" | "BSABEN")}
            className={`pb-2.5 xs:pb-3 sm:pb-4 px-1 xs:px-2 text-[10px] xs:text-xs sm:text-sm font-black transition-all relative whitespace-nowrap flex-shrink-0 ${
              selectedCourse === course ? "text-[#7d1a1a]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="hidden sm:inline">
              {course === "BSABEN" ? "Agricultural & Biosystems" : "Geodetic Engineering"}
            </span>
            <span className="sm:hidden">
              {course}
            </span>
            {selectedCourse === course && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 xs:h-1 bg-[#7d1a1a] rounded-t-full shadow-[0_-2px_10px_rgba(125,26,26,0.3)]" />
            )}
          </button>
        ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3 xs:p-4 rounded-xl xs:rounded-2xl sm:rounded-[24px] border border-gray-200/60 shadow-sm flex flex-col gap-3 xs:gap-4">
        <div className="flex bg-gray-100 p-0.5 xs:p-1 rounded-lg xs:rounded-xl w-full overflow-x-auto no-scrollbar">
          {["all", "document", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] xs:min-w-0 px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 rounded-md xs:rounded-lg text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab 
                ? "bg-white text-[#7d1a1a] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 xs:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${selectedCourse} materials...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-2.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/10 transition-all placeholder:text-[10px] xs:placeholder:text-xs"
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
      </div>

      {/* MATERIALS GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#7d1a1a]" size={32} />
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          {filteredMaterials.map((item) => (
            <div 
              key={item._id} 
              className="bg-white border border-gray-200/60 rounded-2xl xs:rounded-[24px] sm:rounded-[32px] overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className={`h-32 xs:h-36 sm:h-44 flex items-center justify-center relative ${
                item.type === 'video' ? 'bg-[#1A1A1A]' : 'bg-[#7d1a1a]/5'
              }`}>
                {item.type === 'video' ? (
                  <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                    <Video size={28} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white/20" />
                    <span className="bg-white/10 text-white text-[8px] xs:text-[9px] sm:text-[10px] px-1.5 xs:px-2 py-0.5 xs:py-1 rounded backdrop-blur-md">
                      Play Lesson
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                    <FileText size={28} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[#7d1a1a]/20" />
                    <span className="bg-[#7d1a1a]/10 text-[#7d1a1a] text-[8px] xs:text-[9px] sm:text-[10px] px-1.5 xs:px-2 py-0.5 xs:py-1 rounded font-bold">
                      PDF Manual
                    </span>
                  </div>
                )}
                
                {item.type === 'video' && item.videoDuration && (
                  <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 right-2 xs:right-3 sm:right-4 bg-black/60 backdrop-blur-md px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-white flex items-center gap-0.5 xs:gap-1">
                    <Clock size={10} className="xs:w-3 xs:h-3" /> {item.videoDuration}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2 xs:mb-3">
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-widest px-1.5 xs:px-2 py-0.5 xs:py-1 bg-[#7d1a1a]/5 text-[#7d1a1a] rounded">
                    {item.subject}
                  </span>
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-gray-400">
                    {item.type === 'document' && item.fileSize ? formatFileSize(item.fileSize) : item.videoDuration}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-sm xs:text-base sm:text-lg leading-tight mb-2 xs:mb-3 group-hover:text-[#7d1a1a] transition-colors min-h-[2.5rem] xs:min-h-[2.8rem] sm:min-h-[3rem] line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-[9px] xs:text-[10px] text-gray-500 mb-3 xs:mb-4">
                  By {item.uploadedByName} • {formatDate(item.createdAt)}
                </p>

                <div className="flex items-center justify-between pt-2.5 xs:pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex gap-0.5 xs:gap-1">
                    {(user?.role === "admin" || item.uploadedByRole === user?.role) && (
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 xs:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md xs:rounded-lg transition-all active:scale-95"
                        aria-label="Delete material"
                      >
                        <Trash2 size={14} className="xs:w-4 xs:h-4" />
                      </button>
                    )}
                  </div>
                  {item.type === 'video' ? (
                    <a 
                      href={item.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:shadow-lg hover:shadow-[#7d1a1a]/30 transition-all active:scale-95"
                    >
                      <ExternalLink size={12} className="xs:w-3.5 xs:h-3.5" />
                      <span>Watch</span>
                    </a>
                  ) : (
                    <a 
                      href={item.fileUrl} 
                      download={item.fileName}
                      className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-[#7d1a1a] text-white rounded-lg xs:rounded-xl font-bold text-[10px] xs:text-xs hover:shadow-lg hover:shadow-[#7d1a1a]/30 transition-all active:scale-95"
                    >
                      <Download size={12} className="xs:w-3.5 xs:h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 xs:h-56 sm:h-64 bg-white rounded-2xl xs:rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 p-4">
          <div className="bg-gray-50 p-3 xs:p-4 rounded-full mb-2 xs:mb-3">
             <FileText size={24} className="xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
          </div>
          <p className="font-bold text-xs xs:text-sm text-center">
            No {activeTab}s found for {selectedCourse}
          </p>
          <p className="text-[10px] xs:text-xs text-gray-400 mt-1 text-center">
            Try uploading new materials or adjusting filters
          </p>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Upload Material</h2>
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

                <form onSubmit={handleUpload} className="space-y-6">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Material Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadType("document")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          uploadType === "document"
                            ? "border-[#7d1a1a] bg-[#7d1a1a]/5 text-[#7d1a1a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Upload size={20} />
                        <span className="font-bold">PDF Document</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadType("video")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          uploadType === "video"
                            ? "border-[#7d1a1a] bg-[#7d1a1a]/5 text-[#7d1a1a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <LinkIcon size={20} />
                        <span className="font-bold">Video Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      placeholder="Enter material title"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Subject/Area</label>
                    <input
                      type="text"
                      required
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      placeholder="e.g., Area 1, Laws & Ethics"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Description (Optional)</label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a] resize-none"
                      rows={3}
                      placeholder="Brief description of the material"
                    />
                  </div>

                  {/* File Upload or Video URL */}
                  {uploadType === "document" ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">PDF File</label>
                      <input
                        type="file"
                        required
                        accept=".pdf"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                      />
                      <p className="text-xs text-gray-500 mt-2">Maximum file size: 50MB</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Video URL</label>
                        <input
                          type="url"
                          required
                          value={uploadForm.videoUrl}
                          onChange={(e) => setUploadForm({ ...uploadForm, videoUrl: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-gray-500 mt-2">Supports YouTube, Vimeo, Google Drive links</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Duration (Optional)</label>
                        <input
                          type="text"
                          value={uploadForm.videoDuration}
                          onChange={(e) => setUploadForm({ ...uploadForm, videoDuration: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d1a1a]/20 focus:border-[#7d1a1a]"
                          placeholder="e.g., 45:30"
                        />
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#7d1a1a] text-white font-bold rounded-xl hover:bg-[#5a1313] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}