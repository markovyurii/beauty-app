import React from 'react';

function ClientsPage({ clients, expandedClientId, setExpandedClientId, handleUpdateClientNotes, handleDeleteClient }) {
  return (
    <div className="space-y-3 animate-fade-in">
      <h2 className="text-lg font-black text-slate-800 px-1">👥 Картки клієнток ({clients.length})</h2>
      
      {clients.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl text-center text-slate-400 text-sm border border-slate-100">Список порожній. Клієнти з'являться автоматично при записі візитів!</div>
      ) : (
        clients.map(client => {
          const isExpanded = expandedClientId === client._id;
          return (
            <div key={client._id} className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden transition-all">
              
              {/* Заголовок */}
              <div onClick={() => setExpandedClientId(isExpanded ? null : client._id)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors">
                <div>
                  <h3 className="font-black text-slate-800 text-base leading-tight">{client.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">📞 {client.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-pink-50 text-pink-600 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-pink-100/30">⏱ {client.totalVisits} візитів</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client._id); }} className="text-slate-300 hover:text-red-500 text-xs p-1 cursor-pointer transition-colors">❌</button>
                  <span className="text-slate-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Розгорнуті деталі */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/40 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                    <span>Загальний чек клієнтки:</span>
                    <span className="font-black text-pink-600 text-sm">{client.totalSpent} ₴</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">🕒 Історія візитів ({client.appointments?.length || 0})</label>
                    {client.appointments?.length === 0 ? (
                      <p className="text-slate-300 text-xs italic pl-1">Історія порожня...</p>
                    ) : (
                      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                        {client.appointments.map(app => (
                          <div key={app._id} className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="font-bold text-slate-700 block">{app.serviceName}</span>
                              <span className="text-[10px] text-slate-400">{new Date(app.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <span className="font-extrabold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">{app.finalPrice} ₴</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">📝 Особисті бʼюті-нотатки</label>
                    <textarea value={client.notes} onChange={(e) => handleUpdateClientNotes(client._id, e.target.value)} placeholder="Кава з молоком..." rows={3} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-pink-500" />
                  </div>
                </div>
              )}

            </div>
          );
        })
      )}
    </div>
  );
}

export default ClientsPage;
