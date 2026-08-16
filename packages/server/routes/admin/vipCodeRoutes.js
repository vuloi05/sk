const express = require('express');
const router = express.Router();
const { getVipCodes, createVipCode, deleteVipCode } = require('../../controllers/admin/vipCodeController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getVipCodes)
  .post(protect, adminOnly, createVipCode);

router.route('/:id')
  .delete(protect, adminOnly, deleteVipCode);

module.exports = router;
