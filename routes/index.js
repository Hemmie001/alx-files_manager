// routes/index.js

const express = require('express');
const router = express.Router();
const AppController = require('../controllers/AppController');

// GET /status => AppController.getStatus
router.get('/status', AppController.getStatus);

// GET /stats => AppController.getStats
router.get('/stats', AppController.getStats);

module.exports = router;
