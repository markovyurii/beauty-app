const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');

// Отримання списку всіх клієнток з історією візитів (GET /api/clients)
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find().sort({ name: 1 });
        
        const enrichedClients = await Promise.all(clients.map(async (client) => {
            const clientAppointments = await Appointment.find({ clientPhone: client.phone })
                .populate('service')
                .sort({ date: -1 });

            const totalSpent = clientAppointments.reduce((sum, app) => sum + app.finalPrice, 0);
            
            return {
                _id: client._id,
                name: client.name,
                phone: client.phone,
                notes: client.notes,
                totalVisits: clientAppointments.length,
                totalSpent,
                appointments: clientAppointments.map(app => ({
                    _id: app._id,
                    date: app.date,
                    finalPrice: app.finalPrice,
                    serviceName: app.service ? app.service.name : 'Послугу видалено'
                }))
            };
        }));

        res.status(200).json(enrichedClients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновлення особистих бʼюті-нотаток клієнтки (PATCH /api/clients/:id/notes)
router.patch('/:id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id, 
            { notes }, 
            { new: true }
        );
        if (!updatedClient) return res.status(404).json({ message: 'Клієнтку не знайдено' });
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ВИДАЛЕННЯ КЛІЄНТКИ ТА ЇЇ ВІЗИТІВ (DELETE /api/clients/:id)
router.delete('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Клієнтку не знайдено в базі' });
        }

        await Appointment.deleteMany({ clientPhone: client.phone });
        await Client.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Картку клієнтки та її візити успішно видалено', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при видаленні клієнтки', error: error.message });
    }
});

module.exports = router;
