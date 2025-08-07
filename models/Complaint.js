const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  priority: { type: String, required: true },
  submittedAt: { type: String }, // ✅ new field added
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Optional: associate with logged-in user
});

module.exports = mongoose.model('Complaint', complaintSchema);
