const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Кількість записів на кожен день місяця (GET /api/calendar/month-stats)
router.get('/month-stats', async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) return res.status(400).json({ message: 'Рік та місяць обовʼязкові' });

        const startOfMonth = new Date(Number(year), Number(month), 1);
        const endOfMonth = new Date(Number(year), Number(month) + 1, 0, 23, 59, 59, 999);

        const appointments = await Appointment.find({ date: { $gte: startOfMonth, $lte: endOfMonth } });
        
        const stats = {};
        appointments.forEach(app => {
            const day = new Date(app.date).getDate();
            stats[day] = (stats[day] || 0) + 1;
        });
        
        res.status(200).json(stats); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Цілодобова погодинна сітка дня з автоблокуванням часу (GET /api/calendar/day)
router.get('/day', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Дата обовʼязкова' });

        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

        // Завантажуємо візити на цей день
        const appointments = await Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } }).populate('service');

        const schedule = [];

        // Генеруємо 48 слотів по 30 хвилин через цикл (без використання сплитів)
        for (let h = 9; h < 24; h++) {
            // Робимо два слоти для кожної години: :00 та :30
            const timeSlots = [
                { time: `${h.toString().padStart(2, '0')}:00`, mins: 0 },
                { time: `${h.toString().padStart(2, '0')}:30`, mins: 30 }
            ];

            for (const slot of timeSlots) {
                const slotTime = new Date(startOfDay);
                slotTime.setHours(h, slot.mins, 0, 0);

                // Шукаємо, чи зайнятий цей час процедурою
                const active = appointments.find(app => {
                    const appStart = new Date(app.date);
                    const durationMin = app.service && app.service.duration ? app.service.duration : 60;
                    const appEnd = new Date(appStart.getTime() + durationMin * 60 * 1000);
                    return slotTime >= appStart && slotTime < appEnd;
                });

                schedule.push({
                    time: slot.time,
                    isBusy: !!active,
                    id: active ? active._id : null,
                    clientName: active ? active.clientName : null,
                    clientPhone: active ? active.clientPhone : null,
                    serviceName: active && active.service ? active.service.name : null,
                    price: active ? active.finalPrice : null
                });
            }
        }

        res.status(200).json(schedule);
    } catch (error) {
        console.error("Помилка сітки дня 30 хв:", error.message);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
