import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  Sparkles,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_RESOURCES } from '../../data/defaultResources';
import { MID1_TIMETABLE } from '../../data/examTimetable';
import { OFFICIAL_SUBJECTS } from '../../data/subjects';
import { db } from '../../firebase/config';
import { AttendanceRecord, Subject } from '../../types';

interface StudentDashboardProps {
  onNavigateTab: (tab: 'resources' | 'timetable') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab }) => {
  const { userProfile, currentUser } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Absent'>('all');

  const studentRollNo = userProfile?.studentId || '';

  // Real-time listener: strictly query ONLY this student's records
  useEffect(() => {
    if (!studentRollNo) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentRollNo)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AttendanceRecord);
        });
        // Sort newest first
        list.sort((a, b) => b.date.localeCompare(a.date));
        setRecords(list);
        setLoading(false);
      },
      (error) => {
        console.error('Student attendance query notice:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [studentRollNo]);

  // Overall calculations
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'Present').length;
  const absentDays = totalDays - presentDays;
  const overallPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Attendance requirement analysis (Target: 75%)
  const TARGET_PCT = 75;
  let advisoryText = '';
  let isSafe = true;

  if (totalDays === 0) {
    advisoryText = 'Attendance recording has started for AY 2026-27. Attend all classes regularly.';
  } else if (overallPercentage >= TARGET_PCT) {
    // How many can miss without dropping below 75%?
    // present / (total + x) >= 0.75  =>  present / 0.75 >= total + x  =>  x = floor(present/0.75 - total)
    const canMiss = Math.floor(presentDays / 0.75 - totalDays);
    if (canMiss > 0) {
      advisoryText = `You are in good standing! You can miss up to ${canMiss} more lecture${canMiss > 1 ? 's' : ''} and still remain above 75%.`;
    } else {
      advisoryText = 'You are currently at the border of 75%. Attend the next class to maintain compliance.';
    }
  } else {
    isSafe = false;
    // How many consecutive classes to attend to reach 75%?
    // (present + x) / (total + x) >= 0.75  =>  present + x >= 0.75*total + 0.75*x  =>  0.25*x >= 0.75*total - present
    const needed = Math.ceil((0.75 * totalDays - presentDays) / 0.25);
    advisoryText = `Attendance Shortage Alert: You need to attend the next ${needed} consecutive class${needed > 1 ? 'es' : ''} to reach the mandatory 75% threshold.`;
  }

  // Subject-wise breakdown calculation
  const subjectBreakdown = OFFICIAL_SUBJECTS.map((subject) => {
    const subRecords = records.filter((r) => r.subjectId === subject.id);
    const subTotal = subRecords.length;
    const subPresent = subRecords.filter((r) => r.status === 'Present').length;
    const subAbsent = subTotal - subPresent;
    const subPct = subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 100;

    return {
      subject,
      total: subTotal,
      present: subPresent,
      absent: subAbsent,
      percentage: subPct,
    };
  });

  // Filtered attendance timeline
  const filteredTimeline = records.filter((rec) => {
    if (subjectFilter !== 'all' && rec.subjectId !== subjectFilter) return false;
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Student Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                CSE-2 STUDENT PORTAL
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Enrolled
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              {userProfile?.fullName || 'Student Dashboard'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
              <span>Roll No: <strong className="text-blue-300">{studentRollNo}</strong></span>
              <span>•</span>
              <span>Section: <strong className="text-slate-200">CSE-2</strong></span>
              <span>•</span>
              <span>Gayatri Vidya Parishad College of Engineering (A)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('timetable')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Mid-1 Schedule</span>
            </button>
            <button
              onClick={() => onNavigateTab('resources')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Resources</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div
        className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-lg ${
          isSafe
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/20 border-red-500/30 text-red-300'
        }`}
      >
        {isSafe ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className="font-bold text-sm text-white">
            {isSafe ? 'Attendance Status: Compliant (≥ 75%)' : 'Attendance Shortage Warning'}
          </p>
          <p className="leading-relaxed text-slate-300">{advisoryText}</p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Percentage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Attendance</span>
            <div className={`p-2 rounded-lg ${
              overallPercentage >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${
              overallPercentage >= 75 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-400">Min 75% req.</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Total Classes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Working Days</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{totalDays}</span>
            <span className="text-xs text-slate-400 font-mono">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Conducted across all subjects</p>
        </div>

        {/* Metric 3: Present Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Days</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-400">{presentDays}</span>
            <span className="text-xs text-slate-400 font-mono">Attended</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Verified by faculty</p>
        </div>

        {/* Metric 4: Absent Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Absent Days</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-red-400">{absentDays}</span>
            <span className="text-xs text-slate-400 font-mono">Missed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Unattended lectures</p>
        </div>
      </div>

      {/* Subject-Wise Attendance Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Subject-Wise Attendance Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectBreakdown.map((item) => (
            <div
              key={item.subject.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold border border-slate-700">
                    {item.subject.code}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1.5 leading-snug">
                    {item.subject.name}
                  </h4>
                  <p className="text-xs text-slate-400">Faculty: {item.subject.facultyName}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-extrabold ${
                    item.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {item.percentage}%
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.present}/{item.total} Attended
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                <span>Present: <strong className="text-emerald-400">{item.present}</strong></span>
                <span>Absent: <strong className="text-red-400">{item.absent}</strong></span>
                <span>Credits: <strong className="text-slate-300">{item.subject.totalCredits}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date-Wise Attendance History */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Date-Wise Attendance History</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
            </select>
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            No attendance records logged matching the selected filter.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTimeline.map((rec) => (
                  <tr key={rec.recordId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300">{rec.date}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white">{rec.subjectName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">{rec.markedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Access to Mid-1 Exams */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Upcoming: Mid-1 Examinations</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled on 20 & 21 November 2026 for Engineering Physics, Calculus, C, and Web Designing.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('timetable')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0"
        >
          View Exam Timetable
        </button>
      </div>
    </div>
  );
};
