const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Client = require('../models/Client');

// Створення нового запису клієнта (POST /api/appointments)
router.post('/', async (req, res) => {
    try {
        const { clientName, clientPhone, serviceId, date, customPrice } = req.body;
        
        const targetService = await Service.findById(serviceId);
        if (!targetService) return res.status(404).json({ message: 'Послугу не знайдено' });

        const pureDigits = clientPhone.replace(/\D/g, '');
        let formattedPhone = '';
        
        if (pureDigits.length === 10 && pureDigits.startsWith('0')) {
            formattedPhone = `+38${pureDigits}`;
        } else if (pureDigits.length === 12 && pureDigits.startsWith('380')) {
            formattedPhone = `+${pureDigits}`;
        } else {
            formattedPhone = `+${pureDigits}`;
        }

        await Client.findOneAndUpdate(
            { phone: formattedPhone },
            { name: clientName },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const newAppointment = new Appointment({
            clientName,
            clientPhone: formattedPhone,
            service: serviceId,
            finalPrice: customPrice !== undefined && customPrice !== '' ? Number(customPrice) : targetService.price,
            date
        });

        res.status(201).json(await newAppointment.save());
    } catch (error) {
        res.status(400).json({ message: 'Помилка запису', error: error.message });
    }
});

// Отримання записів (GET /api/appointments)
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        let filter = {};
        if (date) {
            const start = new Date(date); start.setHours(0,0,0,0);
            const end = new Date(date); end.setHours(23,59,59,999);
            filter.date = { $gte: start, $lte: end };
        }
        res.status(200).json(await Appointment.find(filter).populate('service').sort({ date: 1 }));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Видалення візиту клієнта (DELETE /api/appointments/:id)
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Запис не знайдено' });
        res.status(200).json({ message: 'Успішно видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
