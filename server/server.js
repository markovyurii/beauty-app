const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Импортируем модели
const Appointment = require('./models/Appointment');

// Импортируем модули маршрутов
const serviceRoutes = require('./routes/serviceRoutes');
const clientRoutes = require('./routes/clientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  }),
);
app.use(express.json());

// ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ MONGODB (Асинхронно, без блокировки порта)
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('🔌 База даних MongoDB успішно підключена!'))
    .catch((err) => console.error('❌ Помилка підключення до бази:', err));
} else {
  console.error('❌ Критична помилка: змінна MONGO_URI відсутня!');
}

// ==========================================
// 📊 ЕНДПОІНТ АНАЛІТИКИ (ЗАЛІЗОБЕТОННО ВИПРАВЛЕНИЙ)
// ==========================================
app.get('/api/analytics', async (req, res) => {
  try {
    const queryDate = req.query.date ? new Date(req.query.date) : new Date();
    const now = new Date();

    // Розрахунок за день
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // ИСПРАВЛЕНО: Возвращены обязательные знаки \$
    const dayApps = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const totalDay = dayApps.reduce((sum, app) => sum + (app.finalPrice || 0), 0);

    // Розрахунок за місяць
    const startOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1);
    const endOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // ИСПРАВЛЕНО: Возвращены обязательные знаки \$
    const monthApps = await Appointment.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalMonth = monthApps.reduce((sum, app) => {
      if (!app.date) return sum;
      
      const appointmentDate = new Date(app.date);
      const checkLimit = new Date(now);
      checkLimit.setDate(checkLimit.getDate() + 1);

      if (appointmentDate <= checkLimit) {
        return sum + (app.finalPrice || 0);
      }
      return sum;
    }, 0);

    res.status(200).json({ day: { total: totalDay }, month: { total: totalMonth } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ТИМЧАСОВИЙ МАРШРУТ ДЛЯ ОЧИЩЕННЯ ТЕСТІВ
app.get('/api/clear-database-tests', async (req, res) => {
  try {
    const Client = require('./models/Client');
    await Appointment.deleteMany({});
    await Client.deleteMany({});
    res.status(200).send('🧹 Базу візитів та клієнтів повністю очищено!');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 🛣 ПІДКЛЮЧЕННЯ РОУТЕРІВ ДО ЕКСПРЕСУ (API)
// ==========================================
app.use('/api/services', serviceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/calendar', calendarRoutes);

// ==========================================
// 🛣 РОЗДАЧА СТАТИКИ REACT
// ==========================================
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ЗАПУСК СЕРВЕРА (Мгновенный, как требует Render)
app.listen(PORT, () =>
  console.log(`🚀 Професійний бєкенд успішно запущено на порту ${PORT}`),
);
