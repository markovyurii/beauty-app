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
// ДОДАВАННЯ ПОСЛУГИ В ПРАЙС (Виправлено типи даних для Express 5)
router.post('/', async (req, res) => {
    try {
        const { name, price, duration } = req.body;

        // Перевірка наявності даних
        if (!name || !price) {
            return res.status(400).json({ message: 'Назва та ціна послуги обовʼязкові' });
        }

        const newService = new Service({
            name: String(name).trim(),
            price: Number(price),
            duration: duration ? Number(duration) : 60 // 
        });

        const savedService = await newService.save();
        res.status(201).json(savedService);
    } catch (error) {
        console.error("Помилка MongoDB при створенні послуги:", error.message);
        res.status(400).json({ message: 'Помилка валідації послуги', error: error.message });
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
