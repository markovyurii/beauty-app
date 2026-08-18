const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    clientName: {
      type: String,
      required: [true, 'Імʼя клієнта обовʼязкове'],
      trim: true
    },
    clientPhone: {
      type: String,
      required:  [true, 'Номер телефону обовʼязковий'],
      trim: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Послуга обовʼязкова']
    },
    finalPrice: {
      type: Number,
      required: [true, 'Фінальна вартість обовʼязкова']
    },
    date: {
      type: Date,
      required: [true, 'Дата та час візиту обовʼязкові']
    }
}
);

module.exports = mongoose.model('Appointment', AppointmentSchema);