import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Filter,
  GraduationCap,
  History,
  Info,
  Layers,
  RefreshCw,
  Save,
  Search,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_SUBJECTS } from '../../data/subjects';
import { db } from '../../firebase/config';
import { saveAttendanceBatch, updateIndividualAttendance } from '../../services/portalService';
import {
  AttendanceRecord,
  AttendanceStatus,
  RosterStudent,
  Subject
} from '../../types';

export const TeacherDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();

  // Mode: Mark Attendance vs Attendance History
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');

  // Roster from Firestore
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(true);

  // Form selections
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    OFFICIAL_SUBJECTS[0].id
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('Period 1 (9:00 - 10:00 AM)');

  // Local student attendance map: studentId -> 'Present' | 'Absent'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [existingCount, setExistingCount] = useState<number>(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Absent'>('all');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // History State
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // 1. Load official roster
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'roster'), (snap) => {
      const list: RosterStudent[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as RosterStudent);
      });
      list.sort((a, b) => a.studentId.localeCompare(b.studentId));
      setRoster(list);
      setLoadingRoster(false);

      // Initialize default attendance map to Present
      setAttendanceMap((prev) => {
        const next = { ...prev };
        for (const s of list) {
          if (!next[s.studentId]) {
            next[s.studentId] = 'Present';
          }
        }
        return next;
      });
    }, (err) => {
      console.error('Teacher roster fetch notice:', err);
      setLoadingRoster(false);
    });

    return () => unsub();
  }, []);

  // 2. Load existing attendance if already marked for this date and subject
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const q = query(
          collection(db, 'attendance'),
          where('date', '==', selectedDate),
          where('subjectId', '==', selectedSubjectId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const map: Record<string, AttendanceStatus> = {};
          snap.forEach((doc) => {
            const data = doc.data() as AttendanceRecord;
            map[data.studentId] = data.status;
          });
          setAttendanceMap((prev) => ({ ...prev, ...map }));
          setExistingCount(snap.size);
        } else {
          setExistingCount(0);
        }
      } catch (err) {
        console.error('Error fetching existing attendance session:', err);
      }
    };

    fetchExisting();
  }, [selectedDate, selectedSubjectId]);

  // Load history records when history tab is opened
  useEffect(() => {
    if (viewMode === 'history') {
      setHistoryLoading(true);
      const unsub = onSnapshot(collection(db, 'attendance'), (snap) => {
        const list: AttendanceRecord[] = [];
        snap.forEach((doc) => list.push(doc.data() as AttendanceRecord));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setHistoryRecords(list);
        setHistoryLoading(false);
      });
      return () => unsub();
    }
  }, [viewMode]);

  // Quick Action: Mark All Present
  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const student of roster) {
      next[student.studentId] = status;
    }
    setAttendanceMap(next);
  };

  // Toggle single student
  const handleToggle = (studentId: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  // Quick status toggle for individual record in History
  const handleToggleHistoryStatus = async (rec: AttendanceRecord) => {
    const nextStatus: AttendanceStatus = rec.status === 'Present' ? 'Absent' : 'Present';
    try {
      await updateIndividualAttendance(rec.recordId, nextStatus, userProfile?.fullName || 'Faculty');
      setSaveSuccess(`Updated ${rec.studentId} (${rec.subjectName}) status to ${nextStatus}!`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      alert('Error updating attendance record: ' + err.message);
    }
  };

  // Load session into editor
  const handleLoadSessionToEditor = (date: string, subjectId: string) => {
    setSelectedDate(date);
    setSelectedSubjectId(subjectId);
    setViewMode('mark');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSaveSuccess(`Loaded session for ${date} into the attendance editor! You can now adjust and re-save.`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // Save Attendance to Firestore
  const handleSaveAttendance = async () => {
    if (!currentUser || !userProfile) return;
    setSaving(true);
    const currentSub = OFFICIAL_SUBJECTS.find((s) => s.id === selectedSubjectId);
    const subName = currentSub ? currentSub.name : selectedSubjectId;

    try {
      const recordsToSave = roster.map((s) => ({
        studentId: s.studentId,
        studentName: s.name || s.studentId,
        status: attendanceMap[s.studentId] || 'Present',
      }));

      await saveAttendanceBatch(
        selectedDate,
        selectedSubjectId,
        subName,
        recordsToSave,
        currentUser.uid,
        userProfile.fullName
      );

      setSaveSuccess(`Attendance for ${subName} on ${selectedDate} saved successfully! (${recordsToSave.length} students recorded)`);
      setShowConfirmModal(false);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentSubject = OFFICIAL_SUBJECTS.find((s) => s.id === selectedSubjectId) || OFFICIAL_SUBJECTS[0];

  // Stats calculation
  const totalStudents = roster.length;
  const presentCount = roster.filter((s) => (attendanceMap[s.studentId] || 'Present') === 'Present').length;
  const absentCount = totalStudents - presentCount;
  const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filtered Roster
  const filteredRoster = roster.filter((s) => {
    const curStatus = attendanceMap[s.studentId] || 'Present';
    if (statusFilter !== 'all' && curStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = s.studentId.toLowerCase().includes(q);
      const matchName = s.name?.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Teacher Console Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                FACULTY ATTENDANCE CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Class: <strong className="text-white">GVP CSE-2</strong> (93 Roster)
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              Class Attendance Tracker
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Mark official attendance for CSE-2. Records sync across student dashboards and admin panels in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'mark' ? 'history' : 'mark')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              {viewMode === 'mark' ? (
                <>
                  <History className="w-4 h-4 text-blue-400" />
                  <span>View Attendance History</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Back to Attendance Marking</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {viewMode === 'mark' && (
        <>
          {/* Session Parameters Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Attendance Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Subject / Course</span>
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OFFICIAL_SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Slot */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Class Slot</span>
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Period 1 (9:00 - 10:00 AM)">Period 1 (9:00 - 10:00 AM)</option>
                  <option value="Period 2 (10:00 - 11:00 AM)">Period 2 (10:00 - 11:00 AM)</option>
                  <option value="Period 3 (11:15 AM - 12:15 PM)">Period 3 (11:15 AM - 12:15 PM)</option>
                  <option value="Period 4 (1:00 - 2:00 PM)">Period 4 (1:00 - 2:00 PM)</option>
                  <option value="Laboratory Session (2:00 - 4:30 PM)">Laboratory Session (2:00 - 4:30 PM)</option>
                </select>
              </div>
            </div>

            {existingCount > 0 && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Existing attendance record found for {currentSubject.name} on {selectedDate} ({existingCount} students). Saving updates will edit the existing session.
                </span>
              </div>
            )}
          </div>

          {/* Real-time Summary & Quick Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold">Total Students:</span>
                <span className="text-white font-mono font-bold">{totalStudents}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span className="font-semibold">Present:</span>
                <span className="font-mono font-bold">{presentCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300">
                <span className="font-semibold">Absent:</span>
                <span className="font-mono font-bold">{absentCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 font-bold">
                <span>Attendance:</span>
                <span className="font-mono">{percentage}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Attendance to Cloud</span>
              </button>
            </div>
          </div>

          {/* Roster Search & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search CSE-2 student by Roll No or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                All ({roster.length})
              </button>
              <button
                onClick={() => setStatusFilter('Present')}
                className={`px-3 py-1 rounded-lg ${statusFilter === 'Present' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setStatusFilter('Absent')}
                className={`px-3 py-1 rounded-lg ${statusFilter === 'Absent' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-400'}`}
              >
                Absent ({absentCount})
              </button>
            </div>
          </div>

          {/* Student Cards Grid (Touch-friendly & Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredRoster.map((student) => {
              const status = attendanceMap[student.studentId] || 'Present';
              const isPresent = status === 'Present';

              return (
                <div
                  key={student.studentId}
                  onClick={() => handleToggle(student.studentId)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isPresent
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-red-950/20 border-red-500/40 hover:border-red-400'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-sm text-blue-300">
                      {student.studentId}
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate max-w-[150px]">
                      {student.name || (
                        <span className="text-slate-500 italic text-[11px]">Unassigned Name</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(student.studentId);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-sm ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-red-600 text-white shadow-red-600/30'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>P</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>A</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Floating Save Button on mobile */}
          <div className="fixed bottom-6 right-6 md:hidden z-30">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="p-4 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center gap-2 font-bold text-sm"
            >
              <Save className="w-5 h-5" />
              <span>Save ({percentage}%)</span>
            </button>
          </div>
        </>
      )}

      {/* VIEW MODE: HISTORY */}
      {viewMode === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                Attendance Archive & Modification Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Past recorded sessions. Teachers can edit records individually or re-open full sessions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
              {historyRecords.length} total student entries
            </span>
          </div>

          {/* Teacher Information Update Help Box */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">How Teachers Can Update Information:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                <li><strong>Quick Single-Student Correction:</strong> Click on any student's <span className="text-emerald-400 font-semibold">Present</span> or <span className="text-red-400 font-semibold">Absent</span> badge below to toggle and save immediately to Firestore.</li>
                <li><strong>Re-mark or Edit Full Session:</strong> Click the <strong className="text-blue-300">Edit Session</strong> button to load that date and subject back into the attendance register, modify any number of students, and re-save.</li>
                <li><strong>Study Materials:</strong> Go to the <em>Study Materials & Syllabus</em> tab to add new Drive folders, lecture PDFs, or external links using the <em>+ Add New Study Material</em> button.</li>
              </ul>
            </div>
          </div>

          {historyRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No historical records found.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Status (Click to Toggle)</th>
                    <th className="py-3 px-4">Marked By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {historyRecords.slice(0, 150).map((rec) => (
                    <tr key={rec.recordId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-300">{rec.date}</td>
                      <td className="py-2.5 px-4 font-sans text-white">{rec.subjectName}</td>
                      <td className="py-2.5 px-4 font-bold text-blue-300">{rec.studentId}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-300">{rec.studentName}</td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleHistoryStatus(rec)}
                          title="Click to toggle status in Firestore"
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${
                            rec.status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                          }`}
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>{rec.status}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">{rec.markedByName}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleLoadSessionToEditor(rec.date, rec.subjectId)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-sans font-medium transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Session</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Attendance Submission</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Please review the attendance summary before persisting to Cloud Firestore:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Subject:</span>
                <span className="font-semibold text-white">{currentSubject.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Date:</span>
                <span className="font-mono text-white">{selectedDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Class Slot:</span>
                <span className="text-white">{selectedSlot}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Total CSE-2 Students:</span>
                <span className="font-mono text-white">{totalStudents}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-400 font-semibold">
                <span>Present Count:</span>
                <span className="font-mono">{presentCount}</span>
              </div>
              <div className="flex justify-between py-1 text-red-400 font-semibold">
                <span>Absent Count:</span>
                <span className="font-mono">{absentCount}</span>
              </div>
              <div className="flex justify-between py-1 text-blue-400 font-bold border-t border-slate-800/80 pt-2">
                <span>Net Attendance Rate:</span>
                <span className="font-mono">{percentage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel & Review
              </button>
              <button
                disabled={saving}
                onClick={handleSaveAttendance}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                {saving ? 'Saving Records...' : 'Confirm & Save to Firestore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
