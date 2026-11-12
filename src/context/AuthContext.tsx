import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  registerStudent: (fullName: string, studentId: string, pass: string) => Promise<string>;
  registerTeacher: (fullName: string, email: string, dept: string, pass: string) => Promise<string>;
  executeAdminSetup: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
          } else {
            // Check if admin doc exists
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              const adminData: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                fullName: adminDoc.data()?.fullName || 'Portal Administrator',
                role: 'admin',
                department: 'Administration',
                status: 'approved',
              };
              setUserProfile(adminData);
            } else {
              setUserProfile(null);
            }
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
      const code = error.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
      if (code === 'auth/user-not-found') {
        throw new Error('Account not found. Please register or submit an enrollment request.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Access temporarily locked for security. Please try again shortly.');
      }
      throw new Error(error.message || 'Login failed. Please check your credentials.');
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
      throw new Error(error.message || 'Enrollment submission failed.');
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
      throw new Error(error.message || 'Teacher enrollment failed.');
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
      throw new Error(error.message || 'Admin setup failed.');
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
