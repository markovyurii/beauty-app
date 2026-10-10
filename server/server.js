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
    const baseDate = req.query.date ? new Date(req.query.date) : new Date();
    const now = new Date();

    // 1. Расчет за конкретный выбранный день
    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayApps = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const totalDay = dayApps.reduce(
      (sum, app) => sum + (Number(app.finalPrice) || 0),
      0,
    );

    // 2. Расчет за месяц
    const startOfMonth = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthApps = await Appointment.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Считаем сумму ТОЛЬКО выполненных (тех, что уже прошли по времени)
    const totalMonth = monthApps.reduce((sum, app) => {
      if (!app.date || !app.finalPrice) return sum;

      const appointmentDate = new Date(app.date);
      // Если дата записи меньше или равна текущему моменту — суммируем
      if (appointmentDate <= now) {
        return sum + (Number(app.finalPrice) || 0);
      }
      return sum;
    }, 0);

    // Возвращаем чистый JSON
    res.status(200).json({
      day: { total: totalDay },
      month: { total: totalMonth },
    });
  } catch (error) {
    console.error('Ошибка в роуте аналитики:', error.message);
    // Защита: даже если всё упало, возвращаем ноль, чтобы фронтенд не ломался!
    res.status(200).json({ day: { total: 0 }, month: { total: 0 } });
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
