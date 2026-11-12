import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Info,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidCse2Id, normalizeStudentId } from '../../data/officialRoster';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
}) => {
  const {
    isSetupCompleted,
    login,
    registerStudent,
    registerTeacher,
    executeAdminSetup,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering (CSE-2)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin one-time setup master key / secret key
  const [adminSetupSecret, setAdminSetupSecret] = useState('');

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
    if (!isSetupCompleted && activeTab === 'admin') {
      setMode('register'); // Needs setup
    } else {
      setMode('login');
    }
  }, [activeTab, isSetupCompleted]);

  if (!isOpen) return null;

  const isIdValid = isValidCse2Id(studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (activeTab === 'student') {
        if (mode === 'login') {
          await login(studentId, password, 'student');
          onClose();
        } else {
          // Validation
          if (!fullName.trim()) throw new Error('Please enter your full legal name.');
          if (!isIdValid) {
            throw new Error('Student ID must be within the official GVP CSE-2 range: 26UECSE0122 to 26UECSE0214.');
          }
          if (password.length < 6) throw new Error('Password must be at least 6 characters.');
          if (password !== confirmPassword) throw new Error('Passwords do not match.');

          const msg = await registerStudent(fullName, studentId, password);
          setSuccessMessage(msg);
          // Reset form fields
          setPassword('');
          setConfirmPassword('');
        }
      } else if (activeTab === 'teacher') {
        if (mode === 'login') {
          await login(email, password, 'teacher');
          onClose();
        } else {
          if (!fullName.trim()) throw new Error('Please enter your full name.');
          if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid faculty email address.');
          if (password.length < 6) throw new Error('Password must be at least 6 characters.');
          if (password !== confirmPassword) throw new Error('Passwords do not match.');

          const msg = await registerTeacher(fullName, email, department, password);
          setSuccessMessage(msg);
          setPassword('');
          setConfirmPassword('');
        }
      } else if (activeTab === 'admin') {
        if (!isSetupCompleted) {
          // First time Admin setup
          if (!fullName.trim()) throw new Error('Please enter Admin full name.');
          if (!email.trim() || !email.includes('@')) throw new Error('Please enter Admin email.');
          if (password.length < 6) throw new Error('Master password must be at least 6 characters.');
          if (password !== confirmPassword) throw new Error('Passwords do not match.');
          if (adminSetupSecret !== 'GVP-CSE2-ADMIN' && adminSetupSecret.trim() !== '') {
            // Secret key check for protection
            throw new Error('Invalid Portal Master Setup Key. Contact System Administrator.');
          }

          await executeAdminSetup(fullName, email, password);
          setSuccessMessage('Admin account initialized successfully! You are now logged in as Portal Administrator.');
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          // Standard Admin Login
          await login(email, password, 'admin');
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activeTab === 'student' && <GraduationCap className="w-6 h-6" />}
              {activeTab === 'teacher' && <Users className="w-6 h-6" />}
              {activeTab === 'admin' && <ShieldCheck className="w-6 h-6 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white capitalize">
                {activeTab === 'admin' && !isSetupCompleted
                  ? 'First-Time Admin Setup'
                  : `${activeTab} Portal Authentication`}
              </h2>
              <p className="text-xs text-slate-400">
                GVP College of Engineering (A) • CSE-2 Section
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Segmented Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation (Login vs Register) */}
        {activeTab !== 'admin' && (
          <div className="px-6 pt-3 flex border-b border-slate-800/80 gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-2.5 transition-colors border-b-2 ${
                mode === 'login'
                  ? 'border-blue-500 text-blue-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-2.5 transition-colors border-b-2 ${
                mode === 'register'
                  ? 'border-blue-500 text-blue-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'student' ? 'Student Enrollment Request' : 'Teacher Registration'}
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Request Submitted Successfully</span>
              </div>
              <p className="leading-relaxed text-slate-300">{successMessage}</p>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-200/90">
                <strong>Next Step:</strong> The Admin panel receives your request in real time. Once reviewed and approved by the department, you will be able to log in with your credentials.
              </div>
            </div>
          )}

          {/* Student Fields */}
          {activeTab === 'student' && (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Legal Name (as per college record)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Student Roll Number (ID)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Range: 26UECSE0122 – 26UECSE0214</span>
                </div>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. 26UECSE0145"
                    className={`w-full pl-9 pr-10 py-2 bg-slate-950/80 border rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                      studentId.length >= 8
                        ? isIdValid
                          ? 'border-emerald-500 focus:ring-emerald-500'
                          : 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700/80 focus:ring-blue-500'
                    }`}
                  />
                  {studentId.length >= 8 && (
                    <div className="absolute right-3 top-2.5">
                      {isIdValid ? (
                        <span title="Valid GVP CSE-2 Roster ID" className="text-emerald-400 text-xs flex items-center gap-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span title="Out of CSE-2 Roster Range" className="text-red-400 text-xs flex items-center gap-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {mode === 'register' && studentId.length >= 5 && !isIdValid && (
                  <p className="text-[11px] text-red-400 mt-1">
                    Student ID must be in the official CSE-2 roster range (26UECSE0122 to 26UECSE0214).
                  </p>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                  <input
                    type="text"
                    readOnly
                    value="Computer Science & Engineering (CSE-2)"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono"
                  />
                </div>
              )}
            </>
          )}

          {/* Teacher Fields */}
          {activeTab === 'teacher' && (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Faculty Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. K. Babu"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Faculty Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@gvpce.ac.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                    <option value="Physics Department">Physics Department</option>
                    <option value="Mathematics Department">Mathematics Department</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* Admin Fields */}
          {activeTab === 'admin' && (
            <>
              {!isSetupCompleted ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-200">First-Time Portal Admin Setup</p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        No administrator account has been provisioned yet. Set up the master administrative credentials below. Once completed, this setup screen is permanently disabled.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Administrator Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. CSE-2 Class Admin"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Admin Email (e.g. yuvateja0811@gmail.com)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gvpce.ac.in"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Portal Setup Passkey
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">Key: GVP-CSE2-ADMIN</span>
                    </div>
                    <input
                      type="text"
                      value={adminSetupSecret}
                      onChange={(e) => setAdminSetupSecret(e.target.value)}
                      placeholder="GVP-CSE2-ADMIN"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gvpce.ac.in"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password Fields */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {(mode === 'register' || (!isSetupCompleted && activeTab === 'admin')) && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-600/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : activeTab === 'admin' && !isSetupCompleted ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Complete One-Time Admin Setup</span>
              </>
            ) : mode === 'login' ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to {activeTab.toUpperCase()} Portal</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Enrollment Request</span>
              </>
            )}
          </button>
        </form>

        {/* Modal Footer info */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Strict Cross-Device Real-Time Sync</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">Cloud Firestore v2</span>
        </div>
      </div>
    </div>
  );
};
