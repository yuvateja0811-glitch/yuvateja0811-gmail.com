export type UserRole = 'admin' | 'teacher' | 'student';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  department: string;
  status: ApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnrollmentRequest {
  requestId: string;
  uid: string;
  email: string;
  fullName: string;
  role: 'teacher' | 'student';
  studentId?: string;
  department: string;
  status: ApprovalStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface RosterStudent {
  studentId: string;
  name: string;
  section: string;
  registered: boolean;
  registeredUid?: string;
}

export type AttendanceStatus = 'Present' | 'Absent';

export interface AttendanceRecord {
  recordId: string; // Composite: `${date}_${subjectId}_${studentId}`
  date: string;     // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  markedByUid: string;
  markedByName: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  facultyName: string;
  totalCredits: number;
  color: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  type: 'drive_folder' | 'web_link' | 'pdf_document';
  url: string;
  description: string;
  isOfficial?: boolean;
}

export interface ExamScheduleItem {
  id: string;
  date: string;
  day: string;
  timeSlot: string;
  subject: string;
  courseCode: string;
  venue?: string;
  syllabusOverview: string[];
}

export interface PortalConfig {
  adminSetupCompleted: boolean;
  adminEmail?: string;
  adminUid?: string;
  department: string;
  section: string;
  academicYear: string;
  semester: string;
  totalRosterCount: number;
}
