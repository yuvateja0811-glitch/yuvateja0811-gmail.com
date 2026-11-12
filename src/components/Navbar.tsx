import React from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  LogOut,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'attendance' | 'resources' | 'timetable' | 'roster';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'resources' | 'timetable' | 'roster') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { userProfile, userRole, currentUser, logout, isSetupCompleted } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top institution bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-1.5 text-xs border-b border-blue-950/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium tracking-wide text-blue-200">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GAYATRI VIDYA PARISHAD COLLEGE OF ENGINEERING (Autonomous)</span>
          <span className="hidden sm:inline text-blue-400">•</span>
          <span className="hidden sm:inline text-blue-300">Dept. of Computer Science & Engineering</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-semibold border border-blue-500/30">
            CLASS: CSE-2
          </span>
          <span className="text-slate-400 hidden md:inline">AY 2026-27</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  GVP CSE-2
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Academic & Attendance Management System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {userRole === 'teacher' && (
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'attendance'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'roster'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>CSE-2 Roster</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'resources'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'timetable'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Mid-1 Schedule</span>
            </button>
          </nav>

          {/* User Status / Auth action */}
          <div className="flex items-center gap-3">
            {currentUser && userProfile ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 justify-end">
                    {userRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                    {userRole === 'teacher' && <User className="w-3.5 h-3.5 text-emerald-400" />}
                    {userRole === 'student' && <GraduationCap className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{userProfile.fullName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {userProfile.studentId ? (
                      <span className="text-blue-300 font-medium">{userProfile.studentId}</span>
                    ) : (
                      <span className="capitalize">{userProfile.role}</span>
                    )}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <button
                  onClick={logout}
                  title="Sign out of portal"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors border border-slate-700/60"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>{isSetupCompleted ? 'Sign In / Register' : 'Admin Setup & Login'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2 py-1 rounded font-medium ${
              activeTab === 'dashboard' ? 'text-blue-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          {userRole === 'teacher' && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-2 py-1 rounded font-medium ${
                activeTab === 'attendance' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Attendance
            </button>
          )}
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-2 py-1 rounded font-medium ${
                activeTab === 'roster' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Roster
            </button>
          )}
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-2 py-1 rounded font-medium ${
              activeTab === 'resources' ? 'text-blue-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-2 py-1 rounded font-medium ${
              activeTab === 'timetable' ? 'text-blue-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Timetable
          </button>
        </div>
      </div>
    </header>
  );
};
