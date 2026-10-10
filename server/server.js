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

let mongoConnectionPromise = null;

async function connectToMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI відсутня в налаштуваннях');
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      })
      .then(() => {
        console.log('[DB] MongoDB успішно підключена');
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }

  return mongoConnectionPromise;
}

// Перед обробкою API-запитів чекаємо на підключення до бази
app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error('[DB] Помилка підключення:', error.name, error.message);

    res.status(503).json({
      error: 'База даних тимчасово недоступна',
    });
  }
});

// ==========================================
// 📊 ЕНДПОІНТ АНАЛІТИКИ (ЗАЛІЗОБЕТОННО ВИПРАВЛЕНИЙ З $)
// ==========================================
a;
app.get('/api/analytics', async (req, res) => {
  try {
    const queryDate = req.query.date ? new Date(req.query.date) : new Date();

    if (Number.isNaN(queryDate.getTime())) {
      return res.status(400).json({
        error: 'Некоректна дата',
      });
    }

    const now = new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      queryDate.getFullYear(),
      queryDate.getMonth(),
      1,
    );

    const endOfMonth = new Date(
      queryDate.getFullYear(),
      queryDate.getMonth() + 1,
      1,
    );

    const checkLimit = new Date(now);
    checkLimit.setDate(checkLimit.getDate() + 1);

    const [dayResult, monthResult] = await Promise.all([
      Appointment.aggregate([
        {
          $match: {
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$finalPrice', 0] } },
          },
        },
      ]),

      Appointment.aggregate([
        {
          $match: {
            date: {
              $gte: startOfMonth,
              $lt: endOfMonth,
              $lte: checkLimit,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$finalPrice', 0] } },
          },
        },
      ]),
    ]);

    res.status(200).json({
      day: {
        total: dayResult[0]?.total ?? 0,
      },
      month: {
        total: monthResult[0]?.total ?? 0,
      },
    });
  } catch (error) {
    console.error('[Analytics] Помилка:', error);
    res.status(500).json({
      error: 'Не вдалося завантажити аналітику',
    });
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
