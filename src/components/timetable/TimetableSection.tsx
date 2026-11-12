import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Info,
  MapPin,
  Printer,
  Sparkles
} from 'lucide-react';
import { MID1_TIMETABLE } from '../../data/examTimetable';

export const TimetableSection: React.FC = () => {
  // Countdown to First Exam: Nov 20, 2026 09:00:00
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const examTarget = new Date('2026-11-20T09:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = examTarget - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Group by day
  const fridayExams = MID1_TIMETABLE.filter((e) => e.date === '2026-11-20');
  const saturdayExams = MID1_TIMETABLE.filter((e) => e.date === '2026-11-21');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                EXAMINATION SCHEDULE
              </span>
              <span className="text-xs text-slate-400 font-mono">B.Tech I Semester • AY 2026-27</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              Mid-1 Examination Timetable (CSE-2)
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Gayatri Vidya Parishad College of Engineering (Autonomous) • Department of CSE
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Countdown Card */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Countdown to Mid-1</span>
            <h3 className="text-base font-bold text-white mt-0.5">Commencing 20 November 2026 at 9:00 AM</h3>
            <p className="text-xs text-slate-400">First Exam: Engineering Physics</p>
          </div>
        </div>

        {/* Timer Blocks */}
        <div className="flex items-center gap-2 font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[65px]">
            <div className="text-2xl font-extrabold text-blue-400">{timeLeft.days}</div>
            <div className="text-[10px] text-slate-400 uppercase">Days</div>
          </div>
          <span className="text-slate-600 font-bold text-xl">:</span>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[65px]">
            <div className="text-2xl font-extrabold text-white">{timeLeft.hours}</div>
            <div className="text-[10px] text-slate-400 uppercase">Hours</div>
          </div>
          <span className="text-slate-600 font-bold text-xl">:</span>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[65px]">
            <div className="text-2xl font-extrabold text-white">{timeLeft.minutes}</div>
            <div className="text-[10px] text-slate-400 uppercase">Mins</div>
          </div>
          <span className="text-slate-600 font-bold text-xl">:</span>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[65px]">
            <div className="text-2xl font-extrabold text-emerald-400">{timeLeft.seconds}</div>
            <div className="text-[10px] text-slate-400 uppercase">Secs</div>
          </div>
        </div>
      </div>

      {/* Timetable Grid Day by Day */}
      <div className="space-y-6">
        {/* DAY 1: Friday, 20 November 2026 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h2 className="text-lg font-extrabold text-white">
              20 November 2026, Friday
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              DAY 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fridayExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-blue-300 border border-slate-700">
                      {exam.courseCode}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.timeSlot}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1">
                    {exam.subject}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{exam.venue}</span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                    <span className="font-semibold text-slate-300">Syllabus Coverage:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {exam.syllabusOverview.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                  <span>Duration: 90 Minutes</span>
                  <span className="font-semibold text-blue-400">Total: 30 Marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAY 2: Saturday, 21 November 2026 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <h2 className="text-lg font-extrabold text-white">
              21 November 2026, Saturday
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              DAY 2
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {saturdayExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      {exam.courseCode}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.timeSlot}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1">
                    {exam.subject}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{exam.venue}</span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                    <span className="font-semibold text-slate-300">Syllabus Coverage:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {exam.syllabusOverview.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                  <span>Duration: 90 Minutes</span>
                  <span className="font-semibold text-indigo-400">Total: 30 Marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exam Guidelines Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Info className="w-4 h-4" />
          <span>Examination Instructions for CSE-2 Students</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
          <li>Students must be present inside the designated examination hall 15 minutes before commencement.</li>
          <li>College Identity Cards and Hall Tickets are mandatory for entry.</li>
          <li>Electronic devices including smartwatches, programmable calculators, and mobile phones are strictly prohibited.</li>
          <li>Attendance percentage above 75% is mandatory for semester end exam hall ticket generation.</li>
        </ul>
      </div>
    </div>
  );
};
