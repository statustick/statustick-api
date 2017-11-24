const express = require('express');
const droneRoutes = require('./server/drone/drone.route');
const userRoutes = require('./server/user/user.route');
const authRoutes = require('./server/auth/auth.route');
const accountRoutes = require('./server/account/account.route');
const contactRoutes = require('./server/contact/contact.route');
const monitorRoutes = require('./server/monitor/monitor.route');
const taskRoutes = require('./server/task/task.route');
const alertRoutes = require('./server/alert/alert.route');
const metricRoutes = require('./server/metric/metric.route');
const pageRoutes = require('./server/page/page.route');

const router = express.Router();

router.get('/', (req, res) => res.send('StatusTick API'));

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// mount user routes at /users
router.use('/drones', droneRoutes);

// mount user routes at /users
router.use('/user', userRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount account routes at /accounts
router.use('/accounts', accountRoutes);

// mount contact routes at /contacts
router.use('/contacts', contactRoutes);

// mount monitor routes at /monitors
router.use('/monitors', monitorRoutes);

// mount metric routes at /metrics
router.use('/metrics', metricRoutes);

// mount page routes at /pages
router.use('/pages', pageRoutes);

// mount task routes at /monitors/:idMonitor/tasks
router.use('/monitors/:idMonitor/tasks', taskRoutes);

// mount task routes at /monitors/:idMonitor/alerts
router.use('/monitors/:idMonitor/alerts', alertRoutes);

module.exports = router;
