import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { API } from './api';
import CalendarPage from './components/CalendarPage';
import ClientsPage from './components/ClientsPage';
import PricePage from './components/PricePage';


function App(){



// Дані з бази
  const [services, setServices] = useState([]);
  const [analytics, setAnalytics] = useState({day: {total:0}, month: {total:0}});
  const [appointments, setAppointments] = useState([]);
  const [daySchedule, setDaySchedule] = useState([]);
  const [monthStats, setMonthStats] = useState({});
  const [clients,setClients] = useState([]);

  // Календарні стейти
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

 // Стейт для розгортання картки конкретного клієнта (зберігаємо його ID)
  const [expandedClientId, setExpandedClientId] = useState(null);

// Модальні вікна (Попапи)
  const [isDayPopupOpen, setIsDayPopupOpen] = useState(false);
  const [isNewServicePopupOpen, setIsNewServicePopupOpen] = useState(false);
  const [isAppointmentPopupOpen, setIsAppointmentPopupOpen] = useState(false);

  
// Стейти для форми ДОДАВАННЯ ПОСЛУГ (Прайс)
  const [name, setName] = useState('');
  const [price,setPrice] = useState('');
  const [duration, setDuration] = useState('60'); 

 // Стейти для форми ЗАПИСУ КЛІЄНТА
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState(''); 
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentPrice, setAppointmentPrice] = useState(''); 

  
// Завантаження денних даних
  const loadData = async (date) => {
    try {
      const [ resAnalytics, resSchedule] = await Promise.all([
        fetch(`/api/analytics?date=${date}`),
        fetch(`${API.CALENDAR}/day?date=${date}`)
      ])

     setAnalytics(await resAnalytics.json());
    setDaySchedule(await resSchedule.json());
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
    }
  }

// Завантаження статистики місяця
  const loadMonthStats = async () =>{
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const res = await fetch(`${API.CALENDAR}/month-stats?year=${year}&month=${month}`);
        setMonthStats(await res.json());
    }catch (error) { console.error("Помилка завантаження статистики місяця:", error); }
  }

// Завантаження списку клієнтів із бази
  const loadClientsData = async () =>{
    try{
     const res = await fetch(API.CLIENTS);
      setClients(await res.json())
    } catch (error) { console.error("Помилка завантаження клієнтів:", error); }
  }

// Базові завантаження при старті
  useEffect(() => {
    fetch(API.SERVICES).then(res => res.json()).then(data => setServices(data));
    loadClientsData()
  }, []);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadMonthStats();
  }, [currentDate]);

// Функції календаря
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year,month,1);
    const days = [];

    let startDay = date.getDay();
    if (startDay === 0) startDay = 7;
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }

    while(date.getMonth() === month) {
      days.push(new Date(date))
      date.setDate(date.getDate()+1)
    }
    return days;
   }

   const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(),currentDate.getMonth() + offset, 1))
   }

  const handleDayClick = (day) => {
    if (!day) return;
    const tzOffset = day.getTimezoneOffset() * 60000;
    const localISODate = new Date(day.getTime() - tzOffset).toISOString().split('T')[0];
    setSelectedDate(localISODate);
    setIsDayPopupOpen(true);
  }

   const handleFreeSlotClick = (time) => {
    setAppointmentTime(time); // Автоматично підставляємо обрану годину в форму
    loadClientsData();
    setIsAppointmentPopupOpen(true); // Відкриваємо попап запису клієнта
  };
   const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    const foundService = services.find(s => s._id === serviceId);
    if (foundService) setAppointmentPrice(foundService.price);
  };


  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const responce = await fetch(API.SERVICES, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name,price:Number(price),duration: Number(duration)})
      });
      if (responce.ok) {
        setName('');
        setPrice('');
        setDuration('60');
        setIsNewServicePopupOpen(false);
        loadData(selectedDate);
        const r = await fetch(API.SERVICES); setServices(await r.json());
      }
    } catch(error) {
      console.error("Помилка створення послуги:", error);
    }
  }

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      const fullDateTime = `${selectedDate}T${appointmentTime}:00`;
      const responce = await fetch(API.APPOINTMENTS,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          clientName,
          clientPhone,
          date: fullDateTime,
          serviceId: selectedService,
          customPrice: appointmentPrice
        })
      })
      if (responce.ok) {
        setClientName('');
        setClientPhone('');
        setAppointmentTime('');
        setSelectedService('');
        setAppointmentPrice('');
        loadData(selectedDate);
        loadMonthStats();
        setIsAppointmentPopupOpen(false);
        loadClientsData();
      }
    } catch (error) { console.error(error); }
  }

  const handleDeletedAppointment = async(id) => {
    if (!window.confirm("Видалити цей запис клієнта?")) return;
    try {
      const res = await fetch(`${API.APPOINTMENTS}/${id}`, { method: 'DELETE' });
      if (res.ok) loadData(selectedDate); loadMonthStats();
    } catch (error) { console.error(error); }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Видалити цю послугу з прайс-листа?")) return;
    try {
      const res = await fetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Оновлюємо список послуг на екрані
        const r = await fetch('/api/services'); 
        setServices(await r.json());
      }
    } catch (error) {
      console.error("Помилка видалення послуги:", error);
    }
  };

    const handleDeleteClient = async (id) => {
    if (!window.confirm("Видалити цю клієнтку? Увага: всі її візити та історія також будуть видалені!")) return;
    try {
      const res = await fetch(`${API.CLIENTS}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadClientsData();
        loadMonthStats();
      }
    } catch (error) {
      console.error("Помилка видалення клієнтки:", error);
    }
  };

// Нагадування в месенджери
  const handleSendReminder = (slot) => {
    const formattedDate = new Date(selectedDate).toLocaleDateString('uk-UA', {day:'numeric',month: 'short'});
    const message = `Привіт, ${slot.clientName}! Нагадую про наш запис на послугу ${slot.serviceName} - ${formattedDate} о ${slot.time}. Чекатиму на вас!`
    const encodedText = encodeURIComponent(message);
     if (slot.clientPhone) {
       window.open(`viber://chat?number=${encodeURIComponent(slot.clientPhone)}&draft=${encodedText}`, '_blank');
      console.log(encodedText)
      setTimeout(() => {
        window.open(`https://viber.click{cleanPhone}?text=${encodedText}`, '_blank');
      }, 300);
    } else {
      alert("У цього клієнта немає номера телефону!");
    }
  }
 
//Збереження оновлених нотаток клієнта в базу (викликається при розфокусуванні або зміні тексту)
const handleUpdateClientNotes = async (clientId,newNotes) =>{
  try {
    setClients(prev => prev.map(c => c._id === clientId ? {...c, notes: newNotes}:c));
    await fetch(`${API.CLIENTS}/${clientId}/notes`, {
      method: "PATCH",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: newNotes })
    })

  } catch (error) { console.error("Не вдалося зберегти нотатки:", error); }
} 


  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 font-sans">

    <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
      <header className="text-center py-2">
          <h1 className="text-2xl font-black tracking-tight text-pink-600">Beauty Assistant</h1>
          <p className="text-xs text-slate-400 mt-0.5">Особистий кабінет майстра</p>
      </header>
      <Routes>
            <Route path="/" element={
              <CalendarPage analytics={analytics} currentDate={currentDate} changeMonth={changeMonth} getDaysInMonth={getDaysInMonth} selectedDate={selectedDate} handleDayClick={handleDayClick} monthStats={monthStats} />
            } />
            <Route path="/clients" element={
               <ClientsPage clients={clients} expandedClientId={expandedClientId} setExpandedClientId={setExpandedClientId} handleUpdateClientNotes={handleUpdateClientNotes} handleDeleteClient={handleDeleteClient} loadClientsData={loadClientsData} />
            } />
            <Route path="/price" element={
              <PricePage services={services} setIsNewServicePopupOpen={setIsNewServicePopupOpen} handleDeleteService={handleDeleteService} />
            } />
          </Routes>
        {/* POPUP №1: СІТКА ГОДИН З ОБʼЄДНАННЯМ ЗАЙНЯТИХ */}
        {/* ========================================== */}
        {isDayPopupOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 p-5 shadow-xl max-h-[85vh] flex flex-col">
              
              {/* Шапка попапу */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                  Розклад: {new Date(selectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                </h3>
                <button type="button" onClick={() => setIsDayPopupOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
              </div>

              {/* Цілодобова погодинна сітка годин */}
              <div className="space-y-1 overflow-y-auto flex-1 pr-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                {daySchedule.map((slot, index) => {
                  // ХИТРИЙ ФІЛЬТР: якщо цей слот зайнятий, і він є ДРУГИМ чи ТРЕТІМ годиною того самого візиту — пропускаємо його (ховаємо)
                  if (slot.isBusy && slot.id) {
                    const firstSlotIndex = daySchedule.findIndex(t => t.id === slot.id);
                    if (index !== firstSlotIndex) return null; // Ховаємо дублікат рядка
                  }

                  // Якщо слот вільний або це перша година візиту — рендеримо його
                  if (!slot.isBusy) {
                    return (
                      <div 
                        key={slot.time} 
                        onClick={() => handleFreeSlotClick(slot.time)}
                        className="flex justify-between items-center px-3 py-2 bg-white border border-slate-100 text-slate-400 hover:border-pink-300 rounded-xl text-xs font-medium cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{slot.time}</span>
                          <span className="italic text-[11px] text-slate-300">Вільна година (записати)</span>
                        </div>
                      </div>
                    );
                  }

                  // Вираховуємо час завершення процедури для об'єднаної картки
                  const clientSlots = daySchedule.filter(t => t.id === slot.id);
                  const lastSlotTime = clientSlots[clientSlots.length - 1].time;
                  const [h] = lastSlotTime.split(':').map(Number);
                  const endTime = `${(h + 1).toString().padStart(2, '0')}:00`;

                  return (
                    <div 
                      key={slot.id} 
                      className="bg-pink-100/70 border border-pink-200/40 text-pink-900 rounded-xl p-3 flex justify-between items-center shadow-2xs relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
                      <div className="pl-1.5 space-y-1">
                        <span className="inline-block bg-pink-200 text-pink-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md tracking-wider">
                          🕒 {slot.time} - {endTime}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block leading-tight">{slot.clientName}</span>
                          <span className="text-[10px] text-pink-600 font-bold">{slot.serviceName}</span>
                        </div>
                      </div>
                     <button 
                      type="button" 
                      onClick={() => handleSendReminder(slot)} 
                      title="Нагадати в месенджер"
                      className="text-slate-400 hover:text-blue-500 text-sm p-1 cursor-pointer transition-colors"
                    >
                      💬
                    </button>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md text-[11px]">{slot.price} ₴</span>
                        <button type="button" onClick={() => handleDeletedAppointment(slot.id)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">❌</button>
                      </div>
                      
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* POPUP №2: ФОРМА ШВИДКОГО ЗАПИСУ КЛІЄНТА     */}
        {/* ========================================== */}
                {/* ========================================== */}
        {/* POPUP №2: ЗАПИС З ПОШУКОМ ПО ІМЕНІ ТА НОМЕРУ */}
        {/* ========================================== */}
        {isAppointmentPopupOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4 relative overflow-visible">
              <div className="flex justify-between items-center">
                <h2 className="text-md font-extrabold text-slate-800">📅 Запис на {appointmentTime}</h2>
                <button type="button" onClick={() => { setClientName(''); setClientPhone(''); setIsAppointmentPopupOpen(false); }} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              <form onSubmit={handleAddAppointment} className="space-y-3">
                
                {/* ПОЛЕ ІМЕНІ З ПІДКАЗКАМИ */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ім'я клієнта</label>
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)} 
                    required 
                    placeholder="Введіть ім'я" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white" 
                  />
                  
                  {/* ПІДКАЗКИ ПРИ ПОШУКУ ПО ІМЕНІ */}
                  {clientName.length > 0 && clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).length > 0 && (
                    !clients.some(c => c.name === clientName) && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-[110px] overflow-y-auto divide-y divide-slate-50">
                        {clients
                          .filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))
                          .map(c => (
                            <div 
                              key={c._id}
                              onClick={() => {
                                setClientName(c.name);
                                setClientPhone(c.phone); // Підставляємо телефон
                              }}
                              className="px-3 py-2 text-xs hover:bg-pink-50/50 cursor-pointer flex justify-between items-center"
                            >
                              <span className="font-bold text-slate-700">{c.name}</span>
                              <span className="text-slate-400">📞 {c.phone}</span>
                            </div>
                          ))}
                      </div>
                    )
                  )}
                </div>

                {/* ПОЛЕ ТЕЛЕФОНУ З ПІДКАЗКАМИ */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Телефон</label>
                  <input 
                    type="tel" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))} 
                    required 
                    maxLength="10"
                    placeholder="380..." 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white font-medium" 
                  />

                  {/* ПІДКАЗКИ ПРИ ПОШУКУ ПО НОМЕРУ */}
                  {clientPhone.length > 0 && clients.filter(c => c.phone.includes(clientPhone)).length > 0 && (
                    !clients.some(c => c.phone === clientPhone) && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-[110px] overflow-y-auto divide-y divide-slate-50">
                        {clients
                          .filter(c => c.phone.includes(clientPhone))
                          .map(c => (
                            <div 
                              key={c._id}
                              onClick={() => {
                                setClientName(c.name); // Автоматично підставляємо імʼя!
                                setClientPhone(c.phone);
                              }}
                              className="px-3 py-2 text-xs hover:bg-pink-50/50 cursor-pointer flex justify-between items-center"
                            >
                              <span className="font-bold text-slate-700">{c.name}</span>
                              <span className="text-slate-400">📞 +{c.phone}</span>
                            </div>
                          ))}
                      </div>
                    )
                  )}
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Оберіть послугу</label>
                  <select value={selectedService} onChange={(e) => handleServiceChange(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white">
                    <option value="" disabled>Оберіть послугу</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.name} ({s.price} ₴)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Вартість візиту</label>
                  <input type="number" value={appointmentPrice} onChange={(e) => setAppointmentPrice(e.target.value)} required placeholder="Введіть вартість" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-pink-600 focus:outline-hidden focus:border-pink-500 focus:bg-white" />
                </div>
                <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold py-2.5 rounded-xl cursor-pointer shadow-xs shadow-pink-100">Зберегти запис</button>
              </form>
            </div>
          </div>
        )}


        {/* ========================================== */}
        {/* POPUP №3: ФОРМА СТВОРЕННЯ НОВОЇ ПОСЛУГИ   */}
        {/* ========================================== */}
        {isNewServicePopupOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-md font-extrabold text-slate-800">🛠 Додати послугу в прайс</h2>
                <button type="button" onClick={() => setIsNewServicePopupOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              <form onSubmit={handleAddService} className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Назва послуги" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white" />
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="Ціна (₴)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white" />
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Тривалість процедури</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-pink-500 focus:bg-white">
                    <option value="30">30 хвилин</option>
                    <option value="60">1 година</option>
                    <option value="90">1.5 години</option>
                    <option value="120">2 години</option>
                    <option value="150">2.5 години</option>
                    <option value="180">3 години</option>
                  </select>
                </div>
                
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 rounded-xl cursor-pointer transition-all">Зберегти в прайс</button>
              </form>
            </div>
          </div>
        )}
{/* ПРОФЕСІЙНЕ НАВІГАЦІЙНЕ МЕНЮ НА NAVLINK    */}
{/* ========================================== */}
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 py-2.5 flex justify-around items-center z-40 shadow-xl shadow-slate-900/10">
  
  {/* Кнопка сторінки Календаря (Головна) */}
  <NavLink 
    to="/" 
    className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all cursor-pointer 
      ${isActive ? 'text-pink-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <span className="text-lg">📅</span> Календар
  </NavLink>
  
  {/* Кнопка сторінки Бази Клієнток */}
  <NavLink 
    to="/clients" 
    className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all cursor-pointer 
      ${isActive ? 'text-pink-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <span className="text-lg">👥</span> Клієнти
  </NavLink>

  {/* Кнопка сторінки Прайс-листа */}
  <NavLink 
    to="/price" 
    className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all cursor-pointer 
      ${isActive ? 'text-pink-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <span className="text-lg">🛠</span> Прайс-лист
  </NavLink>

</nav>

      </div>
    </div>
    </BrowserRouter>
  );
}

export default App;
