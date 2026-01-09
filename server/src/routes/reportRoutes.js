const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const socialController = require('../controllers/socialController');

router.get('/', reportController.getReports);
router.post('/', reportController.createReport);

// Social features
router.post('/:id/upvote', socialController.upvoteReport);
router.post('/:id/downvote', socialController.downvoteReport);
router.get('/:id/comments', socialController.getComments);
router.post('/:id/comments', socialController.addComment);

module.exports = router;
