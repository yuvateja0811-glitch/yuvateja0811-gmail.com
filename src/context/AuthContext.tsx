import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { isValidCse2Id, normalizeStudentId } from '../data/officialRoster';
import { auth, db } from '../firebase/config';
import {
  getPortalConfig,
  seedOfficialRosterIfEmpty,
  setupFirstTimeAdmin,
  submitStudentEnrollment,
  submitTeacherEnrollment
} from '../services/portalService';
import { PortalConfig, UserProfile, UserRole } from '../types';

export const ADMIN_PRIMARY_EMAIL = 'yuvateja0811@gmail.com';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  loading: boolean;
  portalConfig: PortalConfig | null;
  isSetupCompleted: boolean;
  login: (identifier: string, pass: string, requestedRole?: UserRole) => Promise<UserProfile>;
  loginWithGoogle: (requestedRole?: UserRole, rollNo?: string, fullName?: string) => Promise<UserProfile>;
  registerStudent: (fullName: string, studentId: string, pass: string) => Promise<string>;
  registerTeacher: (fullName: string, email: string, dept: string, pass: string) => Promise<string>;
  executeAdminSetup: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatAuthError(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || String(error);

  if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
    return "Email/Password sign-in is not yet enabled in this Firebase project. You can sign in immediately using 'Continue with Google' (already enabled), or enable Email/Password in your Firebase Console under Authentication > Sign-in method.";
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Incorrect credentials. Please verify your password, or switch to the Register tab if you haven\'t created an account yet.';
  }
  if (code === 'auth/user-not-found') {
    return 'Account not found. Please click the Register tab to submit your enrollment request first.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google Sign-In popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-In popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Access temporarily locked for security. Please try again in a few moments.';
  }

  // Handle JSON error from handleFirestoreError
  if (typeof msg === 'string' && msg.trim().startsWith('{') && msg.includes('Missing or insufficient permissions')) {
    return 'Access Denied: You do not currently possess approved permissions for this operation. Please ensure your enrollment has been approved by the Administrator.';
  }

  return msg;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(false);

  // Load system configuration and listen for updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const config = snap.data() as PortalConfig;
        setPortalConfig(config);
        setIsSetupCompleted(!!config.adminSetupCompleted);
      } else {
        setPortalConfig(null);
        setIsSetupCompleted(false);
      }
    }, (err) => {
      console.warn('System config snapshot notice:', err.message);
    });

    return () => unsub();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const isOwner = (user.email || '').toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();

          // Check admin doc
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (isOwner || adminDoc.exists()) {
            const adminData: UserProfile = {
              uid: user.uid,
              email: user.email || ADMIN_PRIMARY_EMAIL,
              fullName: user.displayName || adminDoc.data()?.fullName || 'Portal Administrator',
              role: 'admin',
              department: 'CSE Administration',
              status: 'approved',
            };
            setUserProfile(adminData);
            setLoading(false);
            return;
          }

          // Check standard user doc
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
          } else {
            setUserProfile(null);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!currentUser) return;
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data() as UserProfile);
    }
  };

  /**
   * Google Sign-In with instant Owner recognition and Enrollment linking
   */
  const loginWithGoogle = async (
    requestedRole: UserRole = 'student',
    rollNo?: string,
    fullName?: string
  ): Promise<UserProfile> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      const email = (user.email || '').toLowerCase();
      const uid = user.uid;

      // 1. Is this the authorized portal admin / owner?
      if (email === ADMIN_PRIMARY_EMAIL.toLowerCase()) {
        const adminProfile: UserProfile = {
          uid,
          email: user.email || ADMIN_PRIMARY_EMAIL,
          fullName: user.displayName || 'Portal Administrator',
          role: 'admin',
          department: 'CSE Administration',
          status: 'approved',
        };

        // Persist admin credentials in Firestore
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email: user.email,
          fullName: user.displayName || 'Portal Administrator',
          role: 'admin',
          createdAt: new Date().toISOString(),
        }, { merge: true });

        await setDoc(doc(db, 'users', uid), adminProfile, { merge: true });

        await setDoc(doc(db, 'system', 'config'), {
          adminSetupCompleted: true,
          adminEmail: user.email,
          adminUid: uid,
          department: 'Computer Science and Engineering',
          section: 'CSE-2',
          academicYear: '2026-2027',
          semester: 'I Semester',
          totalRosterCount: 93,
        }, { merge: true });

        // Auto-seed roster in background
        seedOfficialRosterIfEmpty().catch(console.warn);

        setUserProfile(adminProfile);
        setIsSetupCompleted(true);
        return adminProfile;
      }

      // 2. Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const existingProfile = userDoc.data() as UserProfile;
        if (existingProfile.status === 'pending') {
          await signOut(auth);
          throw new Error('Account not approved. Your enrollment request is currently pending Admin approval.');
        }
        if (existingProfile.status === 'rejected') {
          await signOut(auth);
          throw new Error('Account rejected. Your enrollment request was declined by the administrator.');
        }
        setUserProfile(existingProfile);
        return existingProfile;
      }

      // 3. New User registering via Google:
      const nameToUse = fullName || user.displayName || 'Applicant';

      if (requestedRole === 'student') {
        if (!rollNo || !isValidCse2Id(rollNo)) {
          await signOut(auth);
          throw new Error('Please enter a valid CSE-2 roll number (26UECSE0122 - 26UECSE0214) to submit student enrollment with Google.');
        }
        const normalized = normalizeStudentId(rollNo);
        await submitStudentEnrollment(uid, user.email || '', nameToUse, normalized);
        await signOut(auth);
        throw new Error(`Enrollment request submitted for ${nameToUse} (${normalized})! Status: Pending Admin Approval.`);
      } else if (requestedRole === 'teacher') {
        await submitTeacherEnrollment(uid, user.email || '', nameToUse, 'Computer Science & Engineering');
        await signOut(auth);
        throw new Error(`Teacher enrollment request submitted for ${nameToUse}! Status: Pending Admin Approval.`);
      }

      // If generic admin login attempted with non-admin Google account
      await signOut(auth);
      throw new Error(`Access Denied: The Google account "${email}" does not possess administrator privileges for GVP CSE-2.`);
    } catch (err: any) {
      throw new Error(formatAuthError(err));
    }
  };

  /**
   * Unified login that handles Student ID roll numbers, emails, and role checks
   */
  const login = async (identifier: string, pass: string, requestedRole?: UserRole): Promise<UserProfile> => {
    const cleanId = identifier.trim();
    let emailToUse = cleanId;

    // Check if identifier is a student ID
    if (isValidCse2Id(cleanId) || /^26UECSE/i.test(cleanId)) {
      const normalized = normalizeStudentId(cleanId);
      emailToUse = `${normalized.toLowerCase()}@gvpce.ac.in`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pass);
      const uid = userCredential.user.uid;

      // Check user record
      const userSnap = await getDoc(doc(db, 'users', uid));
      const adminSnap = await getDoc(doc(db, 'admins', uid));

      let profile: UserProfile | null = null;

      if (adminSnap.exists() || (userSnap.exists() && userSnap.data()?.role === 'admin')) {
        profile = {
          uid,
          email: userCredential.user.email || '',
          fullName: adminSnap.data()?.fullName || userSnap.data()?.fullName || 'Administrator',
          role: 'admin',
          department: 'CSE Administration',
          status: 'approved',
        };
      } else if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
      }

      if (!profile) {
        await signOut(auth);
        throw new Error('Account not found in portal database. Please submit an enrollment request.');
      }

      // Role check if requested role is specified
      if (requestedRole && profile.role !== requestedRole && profile.role !== 'admin') {
        await signOut(auth);
        throw new Error(`This account is registered as a ${profile.role.toUpperCase()}, not a ${requestedRole.toUpperCase()}. Please use the correct login tab.`);
      }

      // Check approval status
      if (profile.role !== 'admin') {
        if (profile.status === 'pending') {
          await signOut(auth);
          throw new Error('Account not approved. Your enrollment request is still pending Admin review. Please check back later.');
        }

        if (profile.status === 'rejected') {
          await signOut(auth);
          throw new Error('Account rejected. Your enrollment request was declined by the administrator. Contact your department office.');
        }
      }

      setUserProfile(profile);
      return profile;
    } catch (error: any) {
      throw new Error(formatAuthError(error));
    }
  };

  /**
   * Student Enrollment Submission
   */
  const registerStudent = async (fullName: string, studentId: string, pass: string): Promise<string> => {
    const cleanId = studentId.trim();
    if (!isValidCse2Id(cleanId)) {
      throw new Error(`Invalid student ID: "${studentId}". Official GVP CSE-2 student IDs range from 26UECSE0122 to 26UECSE0214.`);
    }

    const normalizedId = normalizeStudentId(cleanId);
    const email = `${normalizedId.toLowerCase()}@gvpce.ac.in`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await submitStudentEnrollment(cred.user.uid, email, fullName, normalizedId);
      // Immediately sign out to enforce approval requirement
      await signOut(auth);
      return `Your enrollment request for ID ${normalizedId} has been submitted successfully. Please wait for Admin approval before logging in.`;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error(`Student ID ${normalizedId} has already submitted an enrollment request or account exists. Contact Admin if you need assistance.`);
      }
      throw new Error(formatAuthError(error));
    }
  };

  /**
   * Teacher Enrollment Submission
   */
  const registerTeacher = async (fullName: string, email: string, dept: string, pass: string): Promise<string> => {
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      await submitTeacherEnrollment(cred.user.uid, cleanEmail, fullName, dept);
      // Enforce approval requirement
      await signOut(auth);
      return 'Your teacher enrollment request has been submitted successfully. Please wait for Admin approval before logging in.';
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error(`An account with email ${cleanEmail} is already registered or pending review.`);
      }
      throw new Error(formatAuthError(error));
    }
  };

  /**
   * One-time Admin Setup
   */
  const executeAdminSetup = async (fullName: string, email: string, pass: string): Promise<void> => {
    const currentConfig = await getPortalConfig();
    if (currentConfig?.adminSetupCompleted) {
      throw new Error('Admin account has already been initialized. Public setup is permanently disabled.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await setupFirstTimeAdmin(cred.user.uid, email.trim(), fullName);
      setIsSetupCompleted(true);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This admin email is already in use. Please sign in instead.');
      }
      throw new Error(formatAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const userRole = userProfile?.role || null;
  const isApproved = userProfile?.status === 'approved';
  const isPending = userProfile?.status === 'pending';
  const isRejected = userProfile?.status === 'rejected';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        isApproved,
        isPending,
        isRejected,
        loading,
        portalConfig,
        isSetupCompleted,
        login,
        loginWithGoogle,
        registerStudent,
        registerTeacher,
        executeAdminSetup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
