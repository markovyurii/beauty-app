const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Назва послуги обовʼязкова'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Вартість послуги обовʼязкова'],
      min: [0, 'Ціна не може бути меншою за 0']
    },
    duration: {
      type: Number,
      required: [true, 'Тривалість послуги обовʼязкова'],
      min: [15, 'Мінімальна тривалість — 15 хвилин'],
      default: 60
    }
  },
  {
    timestamps: true
  },
);

module.exports = mongoose.model('Service', ServiceSchema);