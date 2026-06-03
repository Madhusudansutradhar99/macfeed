const express = require('express');
const router = express.Router();
const { requestWithdrawal, getMyPayments, getAllPayments, processPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

router.post('/request', protect, requestWithdrawal);
router.get('/my', protect, getMyPayments);
router.get('/all', protect, adminOnly, getAllPayments);
router.put('/:id/process', protect, adminOnly, processPayment);

module.exports = router;
