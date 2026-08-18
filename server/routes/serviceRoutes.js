const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Отримання прайсу
router.get('/', async (req, res) => {
    try {
        res.status(200).json(await Service.find());
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// Додавання послуги
router.post('/', async (req, res) => {
    try {
        const { name, price, duration } = req.body;
        const newService = new Service({ name, price, duration: duration ? Number(duration) : 60 });
        res.status(201).json(await newService.save());
    } catch (error) {
        res.status(400).json({ message: 'Помилка валідації', error: error.message });
    }
});

// Видалення послуги
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Service.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Послугу не знайдено' });
        res.status(200).json({ message: 'Успішно видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
