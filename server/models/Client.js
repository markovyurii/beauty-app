const mongoose = require('mongoose');
const ClientSchema = new mongoose.Schema (
  {
    name: {
      type: String,
      required: [true, 'Імʼя клієнта обовʼязкове'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Номер телефону обовʼязковий'],
      unique: true,
      trim: true
    },
    notes: {
            type: String,
            default: '',
            trim: true
        }
  },
  {
        timestamps: true
    }

)
module.exports = mongoose.model('Client', ClientSchema);