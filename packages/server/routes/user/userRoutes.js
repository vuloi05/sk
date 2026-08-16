const express = require('express');
const router = express.Router();
const { updateProfile, redeemVipCode } = require('../../controllers/user/userController');
const { protect } = require('../../middlewares/authMiddleware');

router.put('/profile', protect, updateProfile);
router.post('/redeem-code', protect, redeemVipCode);

module.exports = router;
