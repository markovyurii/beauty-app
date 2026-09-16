const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ОПТИМІЗАЦІЯ: Імпортуємо моделі для аналітики
const Appointment = require('./models/Appointment');

// ПРОФЕСІЙНИЙ КРОК: Імпортуємо наші нові модулі маршрутів
const serviceRoutes = require('./routes/serviceRoutes');
const clientRoutes = require('./routes/clientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
// ЗАЛІЗОБЕТОННИЙ CORS ДЛЯ РОБОТИ НА VERCEL ТА NETLIFY
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Обробка попередніх запитів браузера (Preflight OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    // Якщо шлях повний, залишаємо як є
    next();
  } else {
    // Якщо Vercel зрізав /api, додаємо його назад для Express роутера
    req.url = '/api' + req.url;
    next();
  }
});
app.use(express.json());

// ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ MONGODB
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('🔌 База даних MongoDB успішно підключена!'))
    .catch((err) => console.error('❌ Помилка підключення до бази:', err));
} else {
  console.error(
    '❌ Критична помилка: зміння MONGO_URI відсутня в налаштуваннях Vercel!',
  );
}
// ==========================================
// 📊 ЕНДПОІНТ АНАЛІТИКИ (ЗАЛИШАЄТЬСЯ В СЕРВЕРІ)
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
    const dayApps = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const totalDay = dayApps.reduce(
      (sum, app) => sum + (app.finalPrice || 0),
      0,
    );

    // Розрахунок за місяць
    const startOfMonth = new Date(
      queryDate.getFullYear(),
      queryDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      queryDate.getFullYear(),
      queryDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const monthApps = await Appointment.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const totalMonth = monthApps.reduce((sum, app) => {
      const appointmentDate = new Date(app.date);
      if (appointmentDate <= now) {
        return sum + (app.finalPrice || 0);
      }
      return sum;
    }, 0);

    res
      .status(200)
      .json({ day: { total: totalDay }, month: { total: totalMonth } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ТИМЧАСОВИЙ МАРШРУТ ДЛЯ ОЧИЩЕННЯ ТЕСТІВ (Залишаємо для гнучкості розробки)
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

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ЗАПУСК СЕРВЕРА
app.listen(PORT, () =>
  console.log(`🚀 Професійний бєкенд успішно запущено на порту ${PORT}`),
);
