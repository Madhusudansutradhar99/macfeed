const Payment = require('../models/Payment');
const User = require('../models/User');

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (amount > user.pendingAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient pending balance' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const payment = await Payment.create({
      userId: req.user._id,
      amount,
      method,
      accountDetails
    });

    user.pendingAmount -= amount;
    await user.save();

    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort('-requestedAt');
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'name email').sort('-requestedAt');
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'completed') return res.status(400).json({ success: false, message: 'Already completed' });

    payment.status = status || 'completed';
    payment.transactionId = transactionId;
    payment.processedAt = Date.now();
    await payment.save();

    if (payment.status === 'completed') {
      const user = await User.findById(payment.userId);
      user.withdrawnAmount += payment.amount;
      await user.save();
    } else if (payment.status === 'rejected') {
      const user = await User.findById(payment.userId);
      user.pendingAmount += payment.amount; // refund to pending
      await user.save();
    }

    res.json({ success: true, message: 'Payment processed', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
