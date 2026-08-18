import React from 'react';

function PricePage({ services, setIsNewServicePopupOpen, handleDeleteService }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800">🛠 Поточний прайс</h2>
        <button type="button" onClick={() => setIsNewServicePopupOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all shadow-xs shadow-pink-100">+ Нова послуга</button>
      </div>
      <div className="divide-y divide-slate-100">
        {services.length === 0 ? <p className="text-slate-400 text-center py-4 text-sm">Прайс порожній...</p> : services.map(s => (
          <div key={s._id} className="flex justify-between items-center py-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">{s.name}</p>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">⏱ {s.duration || 60} хв</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-pink-600 text-sm">{s.price} ₴</span>
              <button type="button" onClick={() => handleDeleteService(s._id)} className="text-slate-300 hover:text-red-500 text-xs p-1 cursor-pointer transition-colors">❌</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricePage;
