const express = require('express');
const router = express.Router();
const { clerkWebhook } = require('../controllers/webhook.controller');

router.post('/clerk', clerkWebhook);

module.exports = router;
