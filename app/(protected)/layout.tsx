"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  UserCheck,
  UserPlus,
  Users,
  BarChart3,
  ClipboardList,
  Archive,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  GraduationCap,
  FileQuestion,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";

interface NavItem {
  label: string;
  icon: any;
  href: string;
  id?: string;
  expandable?: boolean;
  subItems?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Dynamic Protected Layout - Fully Responsive (Down to 320px)
 * Features: Role-Based Navigation, Fixed Maroon Sidebar, Glassmorphism Header
 * Supports: Admin, Faculty, Student roles
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Auto-expand Questions menu if on BSABE or BSGE questions page (Admin only)
  useEffect(() => {
    if (
      user?.role === "admin" &&
      (pathname?.includes("/questions/bsaben") || pathname?.includes("/questions/bsge"))
    ) {
      if (!expandedMenus.includes("questions")) {
        setExpandedMenus((prev) => [...prev, "questions"]);
      }
    }
  }, [pathname, user?.role]);

  // Get user initials
  const getUserInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Toggle menu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Theme Constants
  const colors = {
    primary: "#7d1a1a",
    primaryDark: "#5a1313",
    bgSidebar: "linear-gradient(180deg, #5a1313 0%, #3d0d0d 100%)",
  };

  // Get navigation groups based on user role
  const getNavGroups = (): NavGroup[] => {
    if (!user) return [];

    switch (user.role) {
      case "admin":
        return [
          {
            label: "Core",
            items: [
              { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
              { label: "Review Materials", icon: BookOpen, href: "/admin/review-materials" },
              {
                label: "Questions",
                icon: HelpCircle,
                href: "/admin/questions",
                id: "questions",
                expandable: true,
                subItems: [
                  { label: "BSABEN", icon: GraduationCap, href: "/admin/questions/bsaben" },
                  { label: "BSGE", icon: GraduationCap, href: "/admin/questions/bsge" },
                ],
              },
            ],
          },
          {
            label: "Management",
            items: [
              { label: "Student Approval", icon: UserCheck, href: "/admin/student-approval" },
              { label: "Coordinator Status", icon: UserPlus, href: "/admin/coordinators" },
              { label: "Student Info", icon: Users, href: "/admin/student-info" },
            ],
          },
          {
            label: "Data & Systems",
            items: [
              { label: "Results", icon: BarChart3, href: "/admin/results" },
              { label: "Scores", icon: ClipboardList, href: "/admin/scores" },
              { label: "Archive", icon: Archive, href: "/admin/archive" },
              { label: "Settings", icon: Settings, href: "/admin/settings" },
            ],
          },
        ];

      case "faculty":
        return [
          {
            label: "Core",
            items: [
              { label: "Dashboard", icon: LayoutDashboard, href: "/faculty/dashboard" },
              { label: "Review Materials", icon: BookOpen, href: "/faculty/review-materials" },
              { label: "Questionnaires", icon: FileQuestion, href: "/faculty/questionnaires" },
            ],
          },
          {
            label: "Management",
            items: [
              { label: "Student Approval", icon: UserCheck, href: "/faculty/student-approval" },
              { label: "Student Informations", icon: Users, href: "/faculty/student-informations" },
            ],
          },
          {
            label: "Data & Reports",
            items: [
              { label: "Results", icon: BarChart3, href: "/faculty/results" },
              { label: "Scores", icon: ClipboardList, href: "/faculty/scores" },
              { label: "Archive", icon: Archive, href: "/faculty/archive" },
            ],
          },
          {
            label: "System",
            items: [{ label: "Settings", icon: Settings, href: "/faculty/settings" }],
          },
        ];

      case "student":
        return [
          {
            label: "Main",
            items: [
              { label: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
              { label: "Review Materials", icon: BookOpen, href: "/student/review-materials" },
              { label: "Exam", icon: ClipboardList, href: "/student/exams" },
            ],
          },
          {
            label: "Personal",
            items: [
              { label: "Settings", icon: Settings, href: "/student/settings" },
            ],
          },
        ];

      default:
        return [];
    }
  };

  // Get panel title based on role
  const getPanelTitle = () => {
    if (!user) return "PANEL";
    switch (user.role) {
      case "admin":
        return "ADMIN PANEL";
      case "faculty":
        return "FACULTY PANEL";
      case "student":
        return "STUDENT PORTAL";
      default:
        return "PANEL";
    }
  };

  // Get base path for current role
  const getBasePath = () => {
    if (!user) return "/";
    return `/${user.role}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7d1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7d1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check if user has valid role
  if (!["admin", "faculty", "student"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this panel.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-[#7d1a1a] text-white font-semibold rounded-xl hover:bg-[#5a1313] transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const navGroups = getNavGroups();

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{ background: colors.bgSidebar }}
        className={`fixed top-0 left-0 h-screen text-white transition-all duration-300 ease-in-out z-[70] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)]
          ${isCollapsed ? "w-16 lg:w-20" : "w-[260px] xs:w-64 sm:w-72 lg:w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Section */}
        <div
          className={`h-14 xs:h-16 sm:h-20 flex items-center ${
            isCollapsed ? "px-2 xs:px-3 lg:px-4" : "px-3 xs:px-4 sm:px-6"
          } border-b border-white/5 bg-black/20 flex-shrink-0`}
        >
          <div className="flex items-center gap-2 xs:gap-2 sm:gap-3 min-w-0">
            <div
              className={`flex-shrink-0 ${
                isCollapsed ? "w-7 h-7 xs:w-8 xs:h-8" : "w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9"
              } bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transform rotate-3`}
            >
              <Image
                src="/basc_logo.png"
                alt="Logo"
                width={isCollapsed ? 18 : 22}
                height={isCollapsed ? 18 : 22}
                className="object-contain -rotate-3"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-500 min-w-0">
                <span className="font-bold tracking-tight text-[11px] xs:text-xs sm:text-sm uppercase truncate">
                  BSAU ELRS
                </span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-white/50 font-medium tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-[0.2em] uppercase truncate">
                  {getPanelTitle()}
                </span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto p-1.5 xs:p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
          >
            <X size={18} className="xs:w-5 xs:h-5" />
          </button>
        </div>

        {/* Navigation Area */}
        <nav
          className={`flex-1 py-3 xs:py-4 sm:py-6 lg:py-8 overflow-y-auto no-scrollbar ${
            isCollapsed ? "px-2" : "px-2 xs:px-3"
          } space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8`}
        >
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p
                  className={`px-2 xs:px-3 sm:px-4 text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1.5 xs:mb-2 sm:mb-3 lg:mb-4 truncate`}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5 xs:space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    item.subItems?.some((sub) => pathname === sub.href);
                  const isExpanded =
                    item.expandable && expandedMenus.includes(item.id || "");

                  return (
                    <div key={item.href}>
                      {/* Main Menu Item */}
                      {item.expandable ? (
                        <button
                          onClick={() => toggleMenu(item.id || "")}
                          className={`w-full flex items-center gap-2 xs:gap-2 sm:gap-3 ${
                            isCollapsed
                              ? "px-2 xs:px-3 justify-center"
                              : "px-2 xs:px-3 sm:px-4"
                          } py-2 xs:py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-all duration-200 group relative cursor-pointer
                            ${
                              active
                                ? "bg-white text-[#7d1a1a] shadow-xl shadow-black/20"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }
                          `}
                        >
                          <item.icon
                            size={isCollapsed ? 16 : 18}
                            className={`flex-shrink-0 xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5 ${
                              active
                                ? "text-[#7d1a1a]"
                                : "group-hover:scale-110 transition-transform"
                            }`}
                          />
                          {!isCollapsed && (
                            <>
                              <span className="text-[11px] xs:text-xs sm:text-sm font-semibold tracking-wide truncate flex-1 text-left">
                                {item.label}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`flex-shrink-0 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                } ${active ? "text-[#7d1a1a]" : ""}`}
                              />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-2 xs:gap-2 sm:gap-3 ${
                            isCollapsed
                              ? "px-2 xs:px-3 justify-center"
                              : "px-2 xs:px-3 sm:px-4"
                          } py-2 xs:py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl transition-all duration-200 group relative
                            ${
                              active
                                ? "bg-white text-[#7d1a1a] shadow-xl shadow-black/20"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }
                          `}
                        >
                          <item.icon
                            size={isCollapsed ? 16 : 18}
                            className={`flex-shrink-0 xs:w-[18px] xs:h-[18px] sm:w-5 sm:h-5 ${
                              active
                                ? "text-[#7d1a1a]"
                                : "group-hover:scale-110 transition-transform"
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="text-[11px] xs:text-xs sm:text-sm font-semibold tracking-wide truncate">
                              {item.label}
                            </span>
                          )}
                          {active && !isCollapsed && (
                            <div className="absolute right-2 xs:right-3 w-1 h-1 xs:w-1.5 xs:h-1.5 bg-[#7d1a1a] rounded-full flex-shrink-0" />
                          )}
                        </Link>
                      )}

                      {/* Sub Items (only show if expanded and not collapsed sidebar) */}
                      {item.expandable && item.subItems && !isCollapsed && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-3 xs:ml-4 sm:ml-6 space-y-0.5 border-l-2 border-white/10 pl-2 xs:pl-3 sm:pl-4">
                            {item.subItems.map((subItem) => {
                              const subActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => setIsMobileOpen(false)}
                                  className={`flex items-center gap-2 xs:gap-2 sm:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 group relative
                                    ${
                                      subActive
                                        ? "bg-white/20 text-white shadow-lg"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                    }
                                  `}
                                >
                                  <subItem.icon
                                    size={14}
                                    className={`flex-shrink-0 xs:w-4 xs:h-4 ${
                                      subActive
                                        ? "text-white"
                                        : "group-hover:scale-110 transition-transform"
                                    }`}
                                  />
                                  <span className="text-[10px] xs:text-[11px] sm:text-xs font-semibold tracking-wide truncate">
                                    {subItem.label}
                                  </span>
                                  {subActive && (
                                    <div className="absolute right-2 xs:right-3 w-1 h-1 xs:w-1.5 xs:h-1.5 bg-white rounded-full flex-shrink-0" />
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`${
            isCollapsed ? "p-2 sm:p-3" : "p-2 xs:p-3 sm:p-4"
          } border-t border-white/10 bg-black/10 flex-shrink-0`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex w-full items-center ${
              isCollapsed ? "justify-center px-2 xs:px-3" : "gap-2 xs:gap-3 px-3 xs:px-4"
            } py-2 xs:py-2.5 sm:py-3 text-white/50 hover:text-white hover:bg-white/5 rounded-lg sm:rounded-xl transition-all`}
          >
            <ChevronRight
              className={`transition-transform duration-300 flex-shrink-0 ${
                !isCollapsed ? "rotate-180" : ""
              }`}
              size={16}
            />
            {!isCollapsed && (
              <span className="text-[11px] xs:text-xs sm:text-sm font-semibold">
                Collapse
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-2 xs:px-3" : "gap-2 xs:gap-3 px-3 xs:px-4"
            } py-2 xs:py-2.5 sm:py-3 text-red-300 hover:bg-red-500/20 rounded-lg sm:rounded-xl transition-all ${
              !isCollapsed && "mt-1.5 xs:mt-2"
            } group cursor-pointer`}
          >
            <LogOut
              size={16}
              className="xs:w-[18px] xs:h-[18px] group-hover:-translate-x-1 transition-transform flex-shrink-0"
            />
            {!isCollapsed && (
              <span className="text-[11px] xs:text-xs sm:text-sm font-semibold">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-16 xl:ml-20" : "lg:ml-64"
        } overflow-x-hidden`}
      >
        {/* HEADER */}
        <header
          style={{ background: colors.bgSidebar }}
          className="h-14 xs:h-16 sm:h-20 flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-6 lg:px-10 sticky top-0 z-40 shadow-xl shadow-black/10"
        >
          {/* Internal Overlay */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-4 relative z-10 min-w-0 flex-1">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 xs:p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} className="xs:w-5 xs:h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-white/40 text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] block">
                {user.role}
              </span>
              <h2 className="text-white font-bold text-[11px] xs:text-xs sm:text-sm tracking-tight capitalize truncate">
                {pathname === getBasePath()
                  ? "Dashboard"
                  : pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-6 relative z-10 flex-shrink-0">
            <div className="hidden xs:block h-6 sm:h-8 w-px bg-white/10 mx-0.5 sm:mx-1" />

            {/* Profile Section with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 bg-white/5 border border-white/10 p-0.5 xs:p-1 sm:p-1.5 pr-1.5 xs:pr-2 sm:pr-3 md:pr-4 rounded-lg xs:rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all group backdrop-blur-sm flex-shrink-0 cursor-pointer"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center text-[#7d1a1a] font-black text-[10px] xs:text-xs sm:text-sm shadow-lg group-hover:scale-95 transition-transform flex-shrink-0">
                  {getUserInitials(user.name)}
                </div>
                <div className="hidden xs:block min-w-0">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs font-black text-white leading-none tracking-wide truncate">
                    {user.name}
                  </p>
                  <p className="text-[7px] xs:text-[8px] sm:text-[10px] text-white/40 font-bold mt-0.5 sm:mt-1 tracking-widest uppercase truncate">
                    {user.role}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-white/60 transition-transform flex-shrink-0 ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-56 xs:w-60 bg-white border border-gray-200 rounded-xl xs:rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-4 xs:p-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-[#7d1a1a] to-[#5a1313] rounded-xl flex items-center justify-center text-white font-black text-sm xs:text-base shadow-lg flex-shrink-0">
                          {getUserInitials(user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm xs:text-base font-black text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] xs:text-xs text-gray-500 font-medium truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="inline-block px-3 py-1 text-[10px] xs:text-xs font-bold text-[#7d1a1a] bg-[#7d1a1a]/10 rounded-full uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href={`${getBasePath()}/settings`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User
                          size={18}
                          className="text-gray-400 group-hover:text-[#7d1a1a] transition-colors flex-shrink-0"
                        />
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#7d1a1a] transition-colors">
                          View Profile
                        </span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all group cursor-pointer"
                      >
                        <LogOut
                          size={18}
                          className="group-hover:-translate-x-1 transition-transform flex-shrink-0"
                        />
                        <span className="text-sm font-bold">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN PAGE AREA */}
        <main className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-56px)] xs:min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] bg-[#f5f5f5]">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}