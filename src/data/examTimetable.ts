import { ExamScheduleItem } from '../types';

export const MID1_TIMETABLE: ExamScheduleItem[] = [
  {
    id: 'exam_ep',
    date: '2026-11-20',
    day: 'Friday',
    timeSlot: '9:00 AM – 10:30 AM',
    subject: 'Engineering Physics',
    courseCode: 'EP101',
    venue: 'CSE Academic Block - CSE-2 Hall',
    syllabusOverview: [
      'Unit 1: Wave Optics & Interference phenomena',
      'Unit 2: Lasers and Optical Fibers principles',
      'Quantum Mechanics fundamentals and Schrödinger wave equations',
    ],
  },
  {
    id: 'exam_maths',
    date: '2026-11-20',
    day: 'Friday',
    timeSlot: '1:00 PM – 2:30 PM',
    subject: 'Calculus and Linear Algebra',
    courseCode: 'MAT101',
    venue: 'CSE Academic Block - CSE-2 Hall',
    syllabusOverview: [
      'Matrices, Rank, System of Linear Equations',
      'Eigenvalues, Eigenvectors, Cayley-Hamilton Theorem',
      'Mean Value Theorems, Taylor & Maclaurin series',
    ],
  },
  {
    id: 'exam_c_prog',
    date: '2026-11-21',
    day: 'Saturday',
    timeSlot: '9:00 AM – 10:30 AM',
    subject: 'Programming for Problem Solving through C',
    courseCode: 'PPS-C101',
    venue: 'CSE Academic Block - CSE-2 Hall',
    syllabusOverview: [
      'Unit 1: Data types, Operators, Precedence & Expressions',
      'Unit 2 (Part 1): Conditional statements, branching & loops',
      'Operator precedence, Type conversions, Formatted I/O',
    ],
  },
  {
    id: 'exam_fwd',
    date: '2026-11-21',
    day: 'Saturday',
    timeSlot: '1:00 PM – 2:30 PM',
    subject: 'Fundamentals of Web Designing and User Interface',
    courseCode: 'FWD101',
    venue: 'CSE Academic Block - CSE-2 Hall',
    syllabusOverview: [
      'HTML5 semantic markup & Document structure',
      'CSS3 styling, Box model, Flexbox and Grid layouts',
      'UI/UX design principles, responsive typography and color schemes',
    ],
  },
];
