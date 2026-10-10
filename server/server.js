const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Імпортуємо моделі для аналітики
const Appointment = require('./models/Appointment');

// Імпортуємо модулі маршрутів
const serviceRoutes = require('./routes/serviceRoutes');
const clientRoutes = require('./routes/clientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();

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

// ПІДКЛЮЧЕННЯ ДО MONGODB (Для Vercel Serverless – підключається при кожному виклику функції)
if (!process.env.MONGO_URI) {
  console.error('[DB] MONGO_URI відсутня в середовищі Vercel');
} else {
  console.log('[DB] MONGO_URI доступна');

  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    .then(() => {
      console.log('[DB] MongoDB успішно підключена');
    })
    .catch((err) => {
      console.error('[DB] Помилка підключення:', err.name, err.message);

      if (err.reason?.servers) {
        for (const [address, detail] of err.reason.servers) {
          console.error('[DB] Вузол:', address);
          console.error('[DB] Причина:', detail.error?.name);
          console.error('[DB] Деталі:', detail.error?.message);
        }
      }
    });
}
// ==========================================
// 📊 ЕНДПОІНТ АНАЛІТИКИ (ЗАЛІЗОБЕТОННО ВИПРАВЛЕНИЙ З $)
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

    // ПРАВИЛЬНО: Використовуємо $gte та $lte
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

    // ПРАВИЛЬНО: Використовуємо $gte та $lte
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

    res
      .status(200)
      .json({ day: { total: totalDay }, month: { total: totalMonth } });
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

// КРИТИЧНО ДЛЯ VERCEL: Експортуємо наш додаток (запуск через app.listen у хмарі робить сам Vercel)
module.exports = app;
