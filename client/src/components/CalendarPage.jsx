import React from 'react';

function CalendarPage({ analytics, currentDate, changeMonth, getDaysInMonth, selectedDate, handleDayClick, monthStats }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* БЛОК ФІНАНСІВ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md shadow-slate-100/40">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase">День ({new Date(selectedDate).getDate()})</p>
            <div className="text-lg font-black text-pink-600 mt-0.5">{analytics.day?.total || 0} ₴</div>
          </div>
          <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Весь місяць</p>
            <div className="text-lg font-black text-pink-600 mt-0.5">{analytics.month?.total || 0} ₴</div>
          </div>
        </div>
      </div>

      {/* СІТКА МІСЯЦЯ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={() => changeMonth(-1)} className="p-1 px-3 bg-slate-100 rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-200">◀</button>
          <h2 className="font-black text-slate-700 capitalize">{currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</h2>
          <button type="button" onClick={() => changeMonth(1)} className="p-1 px-3 bg-slate-100 rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-200">▶</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
          <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Нд</div>
        </div>
        <div className="grid grid-cols-7 gap-x-1 gap-y-4">
          {getDaysInMonth().map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`}></div>;
            const dayNum = day.getDate();
            const tzOffset = day.getTimezoneOffset() * 60000;
            const dateStr = new Date(day.getTime() - tzOffset).toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const count = monthStats[dayNum] || 0;

            return (
              <div key={dateStr} className="relative flex flex-col items-center">
                <button type="button" onClick={() => handleDayClick(day)}
                        className={`w-10 h-10 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center ${isSelected ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-105' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{dayNum}</button>
                {count > 0 && <span className={`absolute -bottom-2 text-[9px] font-black px-1.5 py-0.2 rounded-full border ${isSelected ? 'bg-white text-pink-600 border-pink-100' : 'bg-pink-500 text-white border-white'}`}>{count}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
