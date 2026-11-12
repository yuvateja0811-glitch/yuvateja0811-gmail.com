/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ResourcesSection } from './components/resources/ResourcesSection';
import { TimetableSection } from './components/timetable/TimetableSection';
import { PublicLanding } from './components/home/PublicLanding';
import { testConnection } from './firebase/config';
import { UserRole } from './types';
import { CheckCircle2, GraduationCap, ShieldCheck, Users } from 'lucide-react';

function MainContent() {
  const { currentUser, userProfile, userRole, loading, isSetupCompleted } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'resources' | 'timetable' | 'roster'>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('student');

  useEffect(() => {
    // Run connection test on boot
    testConnection();
  }, []);

  const openAuthWithRole = (role: UserRole) => {
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 p-2 flex items-center justify-center animate-pulse">
          <GraduationCap className="w-8 h-8 text-blue-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-slate-100">GVP CSE-2 Academic Portal</h2>
          <p className="text-xs text-slate-400 font-mono">Connecting to Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => openAuthWithRole('student')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Render Tab Content */}
        {activeTab === 'resources' && <ResourcesSection />}

        {activeTab === 'timetable' && <TimetableSection />}

        {activeTab === 'roster' && (
          currentUser && userRole === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
              <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Administrator Access Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The official 93-student roster and administrative management console are restricted to authorized portal administrators.
              </p>
              <button
                onClick={() => openAuthWithRole('admin')}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition-all"
              >
                Sign In as Admin
              </button>
            </div>
          )
        )}

        {activeTab === 'attendance' && (
          currentUser && userRole === 'teacher' ? (
            <TeacherDashboard />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
              <Users className="w-12 h-12 text-blue-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Faculty Access Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Only approved faculty members can record attendance for CSE-2 classes.
              </p>
              <button
                onClick={() => openAuthWithRole('teacher')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Sign In as Faculty
              </button>
            </div>
          )
        )}

        {activeTab === 'dashboard' && (
          currentUser && userProfile ? (
            userRole === 'admin' ? (
              <AdminDashboard />
            ) : userRole === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
            )
          ) : (
            <PublicLanding
              onOpenAuth={(role) => openAuthWithRole(role)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">GVP College of Engineering (Autonomous)</span>
            <span>•</span>
            <span>CSE-2 Academic Portal</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>Roster: 26UECSE0122 – 26UECSE0214 (93 Students)</span>
            <span>•</span>
            <span className="text-emerald-500/80 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Real-time Firestore Active
            </span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authInitialRole}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
