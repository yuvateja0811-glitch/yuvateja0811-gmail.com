import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { generateDefaultRoster, isValidCse2Id, normalizeStudentId } from '../data/officialRoster';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  AttendanceRecord,
  AttendanceStatus,
  EnrollmentRequest,
  PortalConfig,
  ResourceItem,
  RosterStudent,
  UserProfile
} from '../types';

/**
 * Initializes the default 93-student roster in Cloud Firestore if empty
 */
export async function seedOfficialRosterIfEmpty(): Promise<number> {
  const path = 'roster';
  try {
    const existingSnap = await getDocs(collection(db, path));
    if (existingSnap.size >= 90) {
      return existingSnap.size;
    }

    const defaultRoster = generateDefaultRoster();
    const batch = writeBatch(db);

    for (const student of defaultRoster) {
      const studentDocRef = doc(db, path, student.studentId);
      batch.set(studentDocRef, student, { merge: true });
    }

    await batch.commit();
    return defaultRoster.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return 0;
  }
}

/**
 * Checks system configuration to see if first-time admin setup has been executed
 */
export async function getPortalConfig(): Promise<PortalConfig | null> {
  const path = 'system/config';
  try {
    const snap = await getDoc(doc(db, 'system', 'config'));
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as PortalConfig;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Executes the secure one-time Admin account setup
 */
export async function setupFirstTimeAdmin(
  adminUid: string,
  adminEmail: string,
  fullName: string
): Promise<void> {
  const configPath = 'system/config';
  try {
    const configSnap = await getDoc(doc(db, 'system', 'config'));
    if (configSnap.exists() && configSnap.data()?.adminSetupCompleted) {
      throw new Error('Admin account setup has already been completed. Public setup is disabled.');
    }

    const batch = writeBatch(db);

    // 1. Lock system configuration
    const configRef = doc(db, 'system', 'config');
    const newConfig: PortalConfig = {
      adminSetupCompleted: true,
      adminEmail: adminEmail.trim(),
      adminUid,
      department: 'Computer Science and Engineering',
      section: 'CSE-2',
      academicYear: '2026-2027',
      semester: 'I Semester',
      totalRosterCount: 93,
    };
    batch.set(configRef, newConfig);

    // 2. Register admin identity in admin collection
    const adminRef = doc(db, 'admins', adminUid);
    batch.set(adminRef, {
      uid: adminUid,
      email: adminEmail.trim(),
      fullName: fullName.trim(),
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    // 3. User profile
    const userRef = doc(db, 'users', adminUid);
    const userProfile: UserProfile = {
      uid: adminUid,
      email: adminEmail.trim(),
      fullName: fullName.trim(),
      role: 'admin',
      department: 'CSE Administration',
      status: 'approved',
      createdAt: new Date().toISOString(),
    };
    batch.set(userRef, userProfile);

    await batch.commit();

    // Auto-seed roster in background
    await seedOfficialRosterIfEmpty();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, configPath);
  }
}

/**
 * Submits a student enrollment request
 */
export async function submitStudentEnrollment(
  uid: string,
  email: string,
  fullName: string,
  rawStudentId: string
): Promise<void> {
  const path = 'enrollmentRequests';
  const normalizedId = normalizeStudentId(rawStudentId);

  if (!isValidCse2Id(normalizedId)) {
    throw new Error(`Student ID ${rawStudentId} is not in the official GVP CSE-2 roster range (26UECSE0122 - 26UECSE0214).`);
  }

  try {
    const batch = writeBatch(db);

    const requestRef = doc(db, 'enrollmentRequests', uid);
    const requestData: EnrollmentRequest = {
      requestId: uid,
      uid,
      email: email.trim(),
      fullName: fullName.trim(),
      role: 'student',
      studentId: normalizedId,
      department: 'Computer Science and Engineering (CSE-2)',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    batch.set(requestRef, requestData);

    const userRef = doc(db, 'users', uid);
    const userData: UserProfile = {
      uid,
      email: email.trim(),
      fullName: fullName.trim(),
      role: 'student',
      studentId: normalizedId,
      department: 'CSE-2',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    batch.set(userRef, userData);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Submits a teacher enrollment request
 */
export async function submitTeacherEnrollment(
  uid: string,
  email: string,
  fullName: string,
  department: string
): Promise<void> {
  const path = 'enrollmentRequests';
  try {
    const batch = writeBatch(db);

    const requestRef = doc(db, 'enrollmentRequests', uid);
    const requestData: EnrollmentRequest = {
      requestId: uid,
      uid,
      email: email.trim(),
      fullName: fullName.trim(),
      role: 'teacher',
      department: department.trim() || 'Computer Science and Engineering',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    batch.set(requestRef, requestData);

    const userRef = doc(db, 'users', uid);
    const userData: UserProfile = {
      uid,
      email: email.trim(),
      fullName: fullName.trim(),
      role: 'teacher',
      department: department.trim() || 'CSE',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    batch.set(userRef, userData);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Approves an enrollment request (Admin only)
 */
export async function approveEnrollmentRequest(
  request: EnrollmentRequest,
  adminUid: string
): Promise<void> {
  const path = 'enrollmentRequests';
  try {
    const batch = writeBatch(db);

    // 1. Update enrollment request
    const reqRef = doc(db, 'enrollmentRequests', request.requestId);
    batch.update(reqRef, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUid,
    });

    // 2. Update user document
    const userRef = doc(db, 'users', request.uid);
    batch.update(userRef, {
      status: 'approved',
      updatedAt: new Date().toISOString(),
    });

    // 3. If student, link to official roster
    if (request.role === 'student' && request.studentId) {
      const rosterRef = doc(db, 'roster', request.studentId);
      batch.set(rosterRef, {
        studentId: request.studentId,
        name: request.fullName,
        section: 'CSE-2',
        registered: true,
        registeredUid: request.uid,
      }, { merge: true });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Rejects an enrollment request (Admin only)
 */
export async function rejectEnrollmentRequest(
  requestId: string,
  userUid: string,
  adminNotes?: string
): Promise<void> {
  const path = 'enrollmentRequests';
  try {
    const batch = writeBatch(db);

    const reqRef = doc(db, 'enrollmentRequests', requestId);
    batch.update(reqRef, {
      status: 'rejected',
      adminNotes: adminNotes || 'Registration request declined by administration.',
      reviewedAt: new Date().toISOString(),
    });

    const userRef = doc(db, 'users', userUid);
    batch.update(userRef, {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Saves attendance batch for a given date and subject
 * Uses composite doc ID `${date}_${subjectId}_${studentId}` to strictly prevent duplicates
 */
export async function saveAttendanceBatch(
  date: string,
  subjectId: string,
  subjectName: string,
  records: { studentId: string; studentName: string; status: AttendanceStatus }[],
  teacherUid: string,
  teacherName: string
): Promise<void> {
  const path = 'attendance';
  try {
    // Process in batches of 50 to respect Firestore transaction limits
    const CHUNK_SIZE = 45;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const recordId = `${date}_${subjectId}_${item.studentId}`;
        const recordRef = doc(db, 'attendance', recordId);
        const recordData: AttendanceRecord = {
          recordId,
          date,
          subjectId,
          subjectName,
          studentId: item.studentId,
          studentName: item.studentName || item.studentId,
          status: item.status,
          markedByUid: teacherUid,
          markedByName: teacherName,
          createdAt: new Date().toISOString(),
        };
        batch.set(recordRef, recordData, { merge: true });
      }

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Bulk updates official student roster (Admin only)
 */
export async function importRosterList(
  entries: { studentId: string; name: string }[]
): Promise<number> {
  const path = 'roster';
  try {
    const CHUNK_SIZE = 45;
    let updatedCount = 0;

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const entry of chunk) {
        if (!isValidCse2Id(entry.studentId)) continue;
        const normalizedId = normalizeStudentId(entry.studentId);
        const docRef = doc(db, 'roster', normalizedId);
        batch.set(
          docRef,
          {
            studentId: normalizedId,
            name: entry.name.trim(),
            section: 'CSE-2',
            registered: false,
          },
          { merge: true }
        );
        updatedCount++;
      }

      await batch.commit();
    }

    return updatedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return 0;
  }
}
