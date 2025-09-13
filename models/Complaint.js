const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['New', 'In Review', 'In Progress', 'Resolved'],
    default: 'New'
  },
  submittedAt: { type: String }, // ✅ new field added
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: associate with logged-in user
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  internalNotes: [{
    note: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  publicResponse: { type: String },
  archived: { type: Boolean, default: false }
});

module.exports = mongoose.model('Complaint', complaintSchema);
