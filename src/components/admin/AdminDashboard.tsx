import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Layers,
  RefreshCw,
  Search,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
  UserX,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parseRosterCsv } from '../../data/officialRoster';
import { db } from '../../firebase/config';
import {
  approveEnrollmentRequest,
  importRosterList,
  rejectEnrollmentRequest,
  updateIndividualAttendance,
  updateRosterStudent,
  updateUserAccount
} from '../../services/portalService';
import {
  AttendanceRecord,
  EnrollmentRequest,
  RosterStudent,
  UserProfile
} from '../../types';

export const AdminDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();

  // Active Tab in Admin
  const [activeTab, setActiveTab] = useState<'requests' | 'roster' | 'attendance' | 'users' | 'settings'>('requests');

  // Real-time Firestore State
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [requestRoleFilter, setRequestRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [requestSearch, setRequestSearch] = useState<string>('');

  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'registered' | 'unregistered'>('all');

  // Modal for Roster Import
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Modal for Reject Reason
  const [rejectModalReq, setRejectModalReq] = useState<EnrollmentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Status Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<RosterStudent | null>(null);
  const [editStudentName, setEditStudentName] = useState<string>('');
  const [editStudentSection, setEditStudentSection] = useState<string>('CSE-2');
  const [editSaving, setEditSaving] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartEditStudent = (student: RosterStudent) => {
    setEditingStudent(student);
    setEditStudentName(student.name || '');
    setEditStudentSection(student.section || 'CSE-2');
  };

  const handleSaveStudentEdit = async () => {
    if (!editingStudent) return;
    setEditSaving(true);
    try {
      await updateRosterStudent(editingStudent.studentId, editStudentName, editStudentSection);
      showToast(`Updated student ${editingStudent.studentId} information!`);
      setEditingStudent(null);
    } catch (err: any) {
      alert('Error updating student: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleAttendance = async (rec: AttendanceRecord) => {
    const nextStatus = rec.status === 'Present' ? 'Absent' : 'Present';
    try {
      await updateIndividualAttendance(rec.recordId, nextStatus, userProfile?.fullName || 'Admin');
      showToast(`Updated ${rec.studentId} (${rec.subjectName}) to ${nextStatus}!`);
    } catch (err: any) {
      alert('Error updating attendance: ' + err.message);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'approved' ? 'rejected' : 'approved';
    try {
      await updateUserAccount(user.uid, { status: nextStatus });
      showToast(`Updated status for ${user.fullName} to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      alert('Error updating account: ' + err.message);
    }
  };

  // 1. Real-time listener for Enrollment Requests
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'enrollmentRequests'), (snapshot) => {
      const data: EnrollmentRequest[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as EnrollmentRequest);
      });
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.error('Enrollment requests listener notice:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Real-time listener for Official Roster
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'roster'), (snapshot) => {
      const data: RosterStudent[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as RosterStudent);
      });
      // Sort roll numbers ascending
      data.sort((a, b) => a.studentId.localeCompare(b.studentId));
      setRoster(data);
    }, (err) => {
      console.error('Roster listener notice:', err);
    });

    return () => unsub();
  }, []);

  // 3. Real-time listener for Attendance
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const data: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as AttendanceRecord);
      });
      setAttendance(data);
    }, (err) => {
      console.error('Attendance listener notice:', err);
    });

    return () => unsub();
  }, []);

  // 4. Real-time listener for Approved Users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data: UserProfile[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as UserProfile);
      });
      setUsers(data);
    }, (err) => {
      console.error('Users listener notice:', err);
    });

    return () => unsub();
  }, []);

  // Action: Approve
  const handleApprove = async (req: EnrollmentRequest) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await approveEnrollmentRequest(req, currentUser.uid);
      showToast(`Approved ${req.role.toUpperCase()}: ${req.fullName} (${req.studentId || req.email})`);
    } catch (err: any) {
      alert('Error approving request: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject
  const handleReject = async () => {
    if (!rejectModalReq) return;
    setActionLoading(true);
    try {
      await rejectEnrollmentRequest(rejectModalReq.requestId, rejectModalReq.uid, rejectReason);
      showToast(`Rejected request for: ${rejectModalReq.fullName}`);
      setRejectModalReq(null);
      setRejectReason('');
    } catch (err: any) {
      alert('Error rejecting request: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Import Roster CSV / Text
  const handleImportRoster = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    try {
      const entries = parseRosterCsv(importText);
      if (entries.length === 0) {
        throw new Error('No valid CSE-2 student records found. Roll numbers must be between 26UECSE0122 and 26UECSE0214.');
      }
      const count = await importRosterList(entries);
      setImportSuccess(`Successfully imported / updated ${count} official student roster entries!`);
      setTimeout(() => {
        setImportSuccess(null);
        setShowImportModal(false);
        setImportText('');
      }, 1500);
    } catch (err: any) {
      alert('Import error: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Export Attendance to CSV
  const handleExportAttendance = () => {
    if (attendance.length === 0) {
      alert('No attendance records available to export.');
      return;
    }

    const headers = ['Record ID', 'Date', 'Subject Code', 'Subject Name', 'Student ID', 'Student Name', 'Status', 'Marked By'];
    const rows = attendance.map(a => [
      a.recordId,
      a.date,
      a.subjectId,
      `"${a.subjectName}"`,
      a.studentId,
      `"${a.studentName}"`,
      a.status,
      `"${a.markedByName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GVP_CSE2_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Roster to CSV
  const handleExportRoster = () => {
    const headers = ['Roll Number', 'Student Name', 'Section', 'Registration Status'];
    const rows = roster.map(s => [
      s.studentId,
      `"${s.name || 'Unclaimed'}"`,
      s.section,
      s.registered ? 'Registered & Approved' : 'Unregistered'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GVP_CSE2_Official_Roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated stats
  const pendingStudents = requests.filter(r => r.role === 'student' && r.status === 'pending');
  const pendingTeachers = requests.filter(r => r.role === 'teacher' && r.status === 'pending');
  const approvedStudentsCount = users.filter(u => u.role === 'student' && u.status === 'approved').length;
  const approvedTeachersCount = users.filter(u => u.role === 'teacher' && u.status === 'approved').length;

  // Filtered Requests
  const filteredRequests = requests.filter(r => {
    if (requestFilter !== 'all' && r.status !== requestFilter) return false;
    if (requestRoleFilter !== 'all' && r.role !== requestRoleFilter) return false;
    if (requestSearch) {
      const q = requestSearch.toLowerCase();
      const matchName = r.fullName?.toLowerCase().includes(q);
      const matchId = r.studentId?.toLowerCase().includes(q);
      const matchEmail = r.email?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }
    return true;
  });

  // Filtered Roster
  const filteredRoster = roster.filter(s => {
    if (rosterStatusFilter === 'registered' && !s.registered) return false;
    if (rosterStatusFilter === 'unregistered' && s.registered) return false;
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      const matchId = s.studentId.toLowerCase().includes(q);
      const matchName = s.name?.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-white shadow-2xl flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                ADMINISTRATION CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Cloud Sync
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              GVP CSE-2 Academic & Attendance Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Welcome, <span className="text-slate-200 font-medium">{userProfile?.fullName}</span> ({userProfile?.email}). Manage enrollments, 93-student roster, and real-time attendance records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Import Official Roster</span>
            </button>
            <button
              onClick={handleExportAttendance}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Export Attendance CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Official Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">CSE-2 Roster</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{roster.length || 93}</span>
            <span className="text-xs text-slate-400 font-mono">Students</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{approvedStudentsCount}</span> registered accounts
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Teachers</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{approvedTeachersCount}</span>
            <span className="text-xs text-slate-400 font-mono">Faculty</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-blue-400 font-semibold">{pendingTeachers.length}</span> pending verification
          </div>
        </div>

        {/* Card 3: Pending Student Requests */}
        <div className={`border rounded-2xl p-5 transition-all ${
          pendingStudents.length > 0
            ? 'bg-amber-950/20 border-amber-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Students</span>
            <div className={`p-2 rounded-lg ${pendingStudents.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{pendingStudents.length}</span>
            <span className="text-xs text-amber-300 font-mono">Awaiting Review</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {pendingStudents.length > 0 ? 'Action required in requests tab' : 'All student requests resolved'}
          </div>
        </div>

        {/* Card 4: Attendance Records */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Entries</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{attendance.length}</span>
            <span className="text-xs text-slate-400 font-mono">Total Recorded</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            Real-time duplicate prevention active
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Enrollment Requests</span>
          {(pendingStudents.length + pendingTeachers.length) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-slate-950 font-bold animate-pulse">
              {pendingStudents.length + pendingTeachers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Official 93-Student Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Attendance Database</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Approved Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Portal Security</span>
        </button>
      </div>

      {/* TAB 1: ENROLLMENT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setRequestFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    requestFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400'
                  }`}
                >
                  Pending ({pendingStudents.length + pendingTeachers.length})
                </button>
                <button
                  onClick={() => setRequestFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    requestFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setRequestFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    requestFilter === 'rejected' ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30' : 'text-slate-400'
                  }`}
                >
                  Rejected
                </button>
                <button
                  onClick={() => setRequestFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    requestFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  All ({requests.length})
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setRequestRoleFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors ${requestRoleFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  All Roles
                </button>
                <button
                  onClick={() => setRequestRoleFilter('student')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors ${requestRoleFilter === 'student' ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-slate-400'}`}
                >
                  Students
                </button>
                <button
                  onClick={() => setRequestRoleFilter('teacher')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors ${requestRoleFilter === 'teacher' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400'}`}
                >
                  Teachers
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, roll no, email..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Enrollment Requests Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                {requestFilter === 'pending'
                  ? 'All student and teacher enrollment requests have been reviewed and approved.'
                  : 'No requests matched the current filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Student ID / Email</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRequests.map((req) => (
                      <tr key={req.requestId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{req.fullName}</div>
                          <div className="text-[11px] text-slate-400">{req.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] ${
                            req.role === 'student'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {req.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.studentId ? (
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                              {req.studentId}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">{req.email}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {req.department}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                              <Check className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-max">
                              <X className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={actionLoading}
                                onClick={() => handleApprove(req)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => setRejectModalReq(req)}
                                className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">
                              Reviewed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFICIAL CSE-2 ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search 93 students by Roll No or Name..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setRosterStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg ${rosterStatusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                >
                  All ({roster.length})
                </button>
                <button
                  onClick={() => setRosterStatusFilter('registered')}
                  className={`px-3 py-1 rounded-lg ${rosterStatusFilter === 'registered' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
                >
                  Registered ({roster.filter(s => s.registered).length})
                </button>
                <button
                  onClick={() => setRosterStatusFilter('unregistered')}
                  className={`px-3 py-1 rounded-lg ${rosterStatusFilter === 'unregistered' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}
                >
                  Unclaimed ({roster.filter(s => !s.registered).length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload / Paste Official Names</span>
              </button>
              <button
                onClick={handleExportRoster}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Roster CSV</span>
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Showing {filteredRoster.length} of {roster.length} students (Range: 26UECSE0122 to 26UECSE0214)</span>
              <span className="text-[11px] text-blue-400 font-mono">CSE-2 Section Official Roster</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">S.No</th>
                    <th className="py-3 px-4">Student Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRoster.map((student, idx) => (
                    <tr key={student.studentId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-300">
                        {student.studentId}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        {student.name ? (
                          student.name
                        ) : (
                          <span className="text-slate-500 italic text-xs font-normal">
                            (Name unassigned – click Edit to assign)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {student.section}
                      </td>
                      <td className="py-3 px-4">
                        {student.registered ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            Registered & Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60 flex items-center gap-1 w-max">
                            Unclaimed ID
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStartEditStudent(student)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 text-xs font-sans font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE DATABASE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Recorded Attendance Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {attendance.length} attendance marks recorded in Cloud Firestore.
              </p>
            </div>
            <button
              onClick={handleExportAttendance}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Attendance CSV</span>
            </button>
          </div>

          {attendance.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Attendance Entries Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Faculty members can mark attendance through the Teacher Attendance console.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {attendance.slice(0, 100).map((record) => (
                    <tr key={record.recordId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-300">{record.date}</td>
                      <td className="py-2.5 px-4 font-sans font-medium text-white">{record.subjectName}</td>
                      <td className="py-2.5 px-4 text-blue-300 font-bold">{record.studentId}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-200">{record.studentName}</td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(record)}
                          title="Click to toggle Present / Absent status in Firestore"
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 ${
                            record.status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                          }`}
                        >
                          <span>{record.status}</span>
                          <Edit3 className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">{record.markedByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPROVED USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Portal Accounts</h3>
            <span className="text-xs text-slate-400">{users.length} accounts authenticated</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : u.role === 'teacher'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-300">
                      {u.studentId || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.department}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        u.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                          {u.status === 'approved' ? 'Suspend' : 'Reinstate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PORTAL SECURITY */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Security & Access Controls</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                The GVP CSE-2 Academic Portal operates under strict Attribute-Based Access Control (ABAC). Public admin registration is permanently locked. Passwords are never stored in plain text.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>One-Time Admin Setup</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Locked & Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Master administrator privileges are bound to your authenticated identity. Public registration has been permanently closed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>CSE-2 Roster Integrity</span>
                <span className="text-blue-400 font-mono">26UECSE0122 – 26UECSE0214</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Any registration attempt outside the official 93-student roll range is rejected instantly by backend validation rules.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Request Dialog */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Reject Enrollment Request</h3>
              </div>
              <button
                onClick={() => setRejectModalReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to decline enrollment for{' '}
              <strong className="text-white">{rejectModalReq.fullName}</strong> ({rejectModalReq.studentId || rejectModalReq.email})?
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Rejection Reason (Optional note for record)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Roll number does not match submitted college identity card."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Official Roster */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-blue-400">
                <Upload className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Import Official CSE-2 Roster</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste names matching the official 93-student roster range (<span className="text-blue-300 font-mono">26UECSE0122</span> to <span className="text-blue-300 font-mono">26UECSE0214</span>). You can paste directly from Excel, CSV, or Tab-separated lists.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
              <p className="text-slate-300 font-semibold">Accepted formats:</p>
              <p>26UECSE0122, Student Name</p>
              <p>26UECSE0123 \t Student Name</p>
              <p>26UECSE0124  Student Name</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Paste Roster Content
              </label>
              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="26UECSE0122, Adarsh Varma&#10;26UECSE0123, Bhavya Sri&#10;26UECSE0124, Chaitanya Krishna..."
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {importSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                disabled={importLoading || !importText.trim()}
                onClick={handleImportRoster}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {importLoading ? 'Processing...' : 'Apply & Save Roster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Student Information */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-blue-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Edit Student Information</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Official Roll Number</span>
              <div className="text-base font-mono font-bold text-blue-300">{editingStudent.studentId}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  placeholder="Enter full legal name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Section
                </label>
                <input
                  type="text"
                  value={editStudentSection}
                  onChange={(e) => setEditStudentSection(e.target.value)}
                  placeholder="CSE-2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={editSaving}
                onClick={handleSaveStudentEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                {editSaving ? 'Saving...' : 'Save to Firestore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
