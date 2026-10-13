import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';

const RightSidebarWidgets = ({ selectedDate, onSelectDate }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [notes, setNotes] = useState([
    { id: 1, text: 'Review cardiology schedule for Dr. Connor', color: 'bg-amber-100 text-amber-700' },
    { id: 2, text: 'Confirm email verification on new registrations', color: 'bg-rose-100 text-rose-700' },
    { id: 3, text: 'Check daily patient cap limit of 20 slots', color: 'bg-emerald-100 text-emerald-700' },
    { id: 4, text: 'Ensure Christmas (Dec 25) remains blocked', color: 'bg-indigo-100 text-indigo-700' },
  ]);

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Build days for month grid
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleAddNote = () => {
    const text = prompt('Enter a quick note or clinical reminder:');
    if (text && text.trim()) {
      setNotes((prev) => [
        { id: Date.now(), text: text.trim(), color: 'bg-indigo-100 text-indigo-700' },
        ...prev,
      ]);
      toast.success('Note added');
    }
  };

  // Generate calendar days
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Previous month trailing
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month, -i).getDate();
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr: null });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthPadded = String(month + 1).padStart(2, '0');
    const dayPadded = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthPadded}-${dayPadded}`;
    calendarDays.push({ day: d, isCurrentMonth: true, dateStr });
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* ─── 1. Mini Month Calendar (Exact Screenshot Replica) ───── */}
      <div className="habs-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-[#171825] text-base">{monthName}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {daysOfWeek.map((day) => (
            <span key={day} className="text-[11px] font-bold text-[#8e94a5]">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.slice(0, 35).map((item, idx) => {
            const isSelected = selectedDate && item.dateStr === selectedDate;
            const isToday = item.day === 13 && item.isCurrentMonth && month === 9; // 13 Oct 2026

            return (
              <button
                key={idx}
                disabled={!item.isCurrentMonth}
                onClick={() => item.dateStr && onSelectDate && onSelectDate(item.dateStr)}
                className={`h-8 w-8 mx-auto rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  !item.isCurrentMonth
                    ? 'text-slate-300 pointer-events-none'
                    : isSelected || isToday
                    ? 'bg-[#6956e5] text-white shadow-md shadow-indigo-300 font-extrabold scale-105'
                    : 'text-[#171825] hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Upcoming Events / Appointments Timeline ─────────── */}
      <div className="habs-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-[#171825] text-base">Upcoming Schedule</h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            10 Nov
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Timeline Item 1 */}
          <div className="flex items-start gap-3 text-xs">
            <span className="font-bold text-[#171825] w-16 shrink-0 pt-0.5">09:00 am</span>
            <div className="border-l-2 border-indigo-500 pl-3 flex-1">
              <p className="font-extrabold text-[#171825]">Cardiology Consultation</p>
              <p className="text-[11px] text-[#8e94a5] mt-0.5">Dr. Sarah Connor · Room 302</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                09:00 - 09:30 am
              </span>
            </div>
          </div>

          {/* Timeline Item 2 */}
          <div className="flex items-start gap-3 text-xs">
            <span className="font-bold text-[#171825] w-16 shrink-0 pt-0.5">11:00 am</span>
            <div className="border-l-2 border-cyan-500 pl-3 flex-1">
              <p className="font-extrabold text-[#171825]">General Checkup</p>
              <p className="text-[11px] text-[#8e94a5] mt-0.5">Blood pressure & vitals check</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                11:00 - 11:30 am
              </span>
            </div>
          </div>

          {/* Timeline Item 3 */}
          <div className="flex items-start gap-3 text-xs">
            <span className="font-bold text-[#171825] w-16 shrink-0 pt-0.5">02:30 pm</span>
            <div className="border-l-2 border-purple-500 pl-3 flex-1">
              <p className="font-extrabold text-[#171825]">Prescription Review</p>
              <p className="text-[11px] text-[#8e94a5] mt-0.5">Routine follow-up session</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                02:30 - 03:00 pm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. My Notes & Notices ─────────────────────────────────── */}
      <div className="habs-card p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-[#171825] text-base">Quick Notices</h3>
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[11px] flex items-center justify-center">
              {notes.length}
            </span>
          </div>
          <button
            onClick={handleAddNote}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Note
          </button>
        </div>

        <div className="space-y-2.5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-2xl bg-[#f8f9fd] border border-slate-100 flex items-start gap-2.5 text-xs hover:bg-[#f1f3f9] transition-colors"
            >
              <span className={`w-5 h-5 rounded-full ${note.color} flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]`}>
                •
              </span>
              <p className="text-[#323649] font-medium leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default RightSidebarWidgets;
