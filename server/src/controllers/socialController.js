const Report = require('../models/Report');
const Comment = require('../models/Comment');

/**
 * Upvote a report
 * POST /api/reports/:id/upvote
 */
const upvoteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // Wallet address from Privy

        if (!userId) {
            return res.status(400).json({ message: 'User ID required' });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Check if user already upvoted
        const alreadyUpvoted = report.upvotedBy.includes(userId);
        const alreadyDownvoted = report.downvotedBy.includes(userId);

        if (alreadyUpvoted) {
            // Remove upvote
            report.upvotes -= 1;
            report.upvotedBy = report.upvotedBy.filter(id => id !== userId);
        } else {
            // Add upvote
            report.upvotes += 1;
            report.upvotedBy.push(userId);

            // Remove downvote if exists
            if (alreadyDownvoted) {
                report.downvotes -= 1;
                report.downvotedBy = report.downvotedBy.filter(id => id !== userId);
            }
        }

        await report.save();
        res.json({ upvotes: report.upvotes, downvotes: report.downvotes });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Downvote a report
 * POST /api/reports/:id/downvote
 */
const downvoteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID required' });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const alreadyUpvoted = report.upvotedBy.includes(userId);
        const alreadyDownvoted = report.downvotedBy.includes(userId);

        if (alreadyDownvoted) {
            // Remove downvote
            report.downvotes -= 1;
            report.downvotedBy = report.downvotedBy.filter(id => id !== userId);
        } else {
            // Add downvote
            report.downvotes += 1;
            report.downvotedBy.push(userId);

            // Remove upvote if exists
            if (alreadyUpvoted) {
                report.upvotes -= 1;
                report.upvotedBy = report.upvotedBy.filter(id => id !== userId);
            }
        }

        await report.save();
        res.json({ upvotes: report.upvotes, downvotes: report.downvotes });
    } catch (error) {
        console.error('Downvote error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Get comments for a report
 * GET /api/reports/:id/comments
 */
const getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await Comment.find({ reportId: id }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Add a comment to a report
 * POST /api/reports/:id/comments
 */
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, text } = req.body;

        if (!userId || !text) {
            return res.status(400).json({ message: 'User ID and text required' });
        }

        // Create comment
        const comment = new Comment({
            reportId: id,
            userId,
            text
        });

        await comment.save();

        // Update report comment count
        await Report.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    upvoteReport,
    downvoteReport,
    getComments,
    addComment
};
