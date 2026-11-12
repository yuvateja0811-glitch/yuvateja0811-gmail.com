import React from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface PublicLandingProps {
  onOpenAuth: (role: UserRole) => void;
  onNavigateTab: (tab: 'resources' | 'timetable') => void;
  onOpenDownloadGuide: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({ onOpenAuth, onNavigateTab, onOpenDownloadGuide }) => {
  const { isSetupCompleted } = useAuth();

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono font-semibold text-blue-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GVP College of Engineering (Autonomous) • Section CSE-2</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Academic & Real-Time Attendance Portal
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Official institutional gateway for CSE-2 students and faculty. Real-time attendance tracking with Cloud Firestore, enrollment approvals, Mid-1 timetable, and course resources.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('student')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 group"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Sign In / Register</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onOpenAuth('teacher')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Faculty Portal</span>
            </button>

            <button
              onClick={() => onOpenAuth('admin')}
              className="px-5 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-sm border border-amber-500/30 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isSetupCompleted ? 'Admin Login' : 'First-Time Admin Setup'}</span>
            </button>

            <button
              onClick={onOpenDownloadGuide}
              className="px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-sm border border-emerald-500/30 transition-colors flex items-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
              <span>Download / Install App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Portals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Portal Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-max border border-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Student Enrollment & Attendance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register with your official roll number (<span className="text-blue-300 font-mono">26UECSE0122 - 26UECSE0214</span>). View daily attendance percentages, subject breakdown, and status alerts.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant 75% threshold advisory check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Private, authenticated student records</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onOpenAuth('student')}
            className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs border border-blue-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>Access Student Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Teacher Portal Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-max border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Faculty Attendance Manager</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mark official CSE-2 attendance by date, subject, and period. One-click batch marking with instant Firestore persistence and duplicate prevention.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Pre-loaded with official 93-student roster</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Attendance history and session review</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onOpenAuth('teacher')}
            className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Faculty Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Admin Portal Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-max border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Admin Approval Console</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time approval workflow for student and faculty registrations. Manage 93-student roster, import official names via CSV, and export attendance.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Protected one-time administrator setup</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real-time listener on enrollment requests</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onOpenAuth('admin')}
            className="w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>{isSetupCompleted ? 'Admin Console Login' : 'Initialize Portal Admin'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Highlights: Mid-1 Exam & Quick Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mid-1 Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Calendar className="w-4 h-4" />
              <span>EXAMINATION NOTICE</span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
              MID-1 AY 2026-27
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Mid-1 Examinations Timetable</h3>
            <p className="text-xs text-slate-400 mt-1">
              Scheduled on 20 & 21 November 2026. Review timings and subjects:
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">20 Nov (Fri): Engineering Physics</strong>
                <span className="text-[11px] text-slate-400">9:00 AM – 10:30 AM</span>
              </div>
              <span className="font-mono text-blue-300 text-xs">EP101</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">20 Nov (Fri): Calculus and Linear Algebra</strong>
                <span className="text-[11px] text-slate-400">1:00 PM – 2:30 PM</span>
              </div>
              <span className="font-mono text-blue-300 text-xs">MAT101</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('timetable')}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Complete Timetable & Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Resources Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <BookOpen className="w-4 h-4" />
              <span>OFFICIAL COURSE REPOSITORY</span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              DRIVE & NOTES
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Study Materials & Links</h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct access to faculty folders and course files:
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <a
              href="https://drive.google.com/drive/folders/18drGNtfsfY1EBzkQZhKYXHE9BlU1jr4V?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition-colors block"
            >
              <div>
                <strong className="text-white block">Fundamentals of Web Designing</strong>
                <span className="text-[11px] text-slate-400">Official Google Drive Folder (Slides & Labs)</span>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-400" />
            </a>

            <a
              href="https://drbabu.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between transition-colors block"
            >
              <div>
                <strong className="text-white block">Engineering Physics</strong>
                <span className="text-[11px] text-slate-400">Dr. Babu Official Learning Portal</span>
              </div>
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

          <button
            onClick={() => onNavigateTab('resources')}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Browse All Resources & C Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
