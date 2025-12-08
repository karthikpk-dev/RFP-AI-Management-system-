'use strict';

const express = require('express');
const router = express.Router();
const { generateStructuredRFP } = require('../services/aiService');
const { sendRfpToVendors } = require('../services/emailService');
const { Rfp, Vendor } = require('../models');

/**
 * POST /api/rfps/generate
 * Generate a structured RFP from natural language using Gemini AI
 */
router.post('/generate', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        const result = await generateStructuredRFP(query.trim());

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate structured RFP',
                details: result.error
            });
        }

        res.json({
            success: true,
            data: result.data,
            originalQuery: result.originalQuery
        });
    } catch (error) {
        console.error('RFP Generate Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

/**
 * POST /api/rfps
 * Save a structured RFP to the database
 */
router.post('/', async (req, res) => {
    try {
        const { title, naturalLanguageQuery, structuredData, budget, status } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }

        const rfp = await Rfp.create({
            title: title.trim(),
            natural_language_query: naturalLanguageQuery || null,
            structured_json_data: structuredData || {},
            budget: budget || null,
            status: status || 'draft'
        });

        res.status(201).json({
            success: true,
            data: rfp
        });
    } catch (error) {
        console.error('RFP Create Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create RFP',
            details: error.message
        });
    }
});

/**
 * GET /api/rfps
 * List all RFPs
 */
router.get('/', async (req, res) => {
    try {
        const rfps = await Rfp.findAll({
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: rfps
        });
    } catch (error) {
        console.error('RFP List Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch RFPs',
            details: error.message
        });
    }
});

/**
 * GET /api/rfps/:id
 * Get a single RFP by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const rfp = await Rfp.findByPk(req.params.id);

        if (!rfp) {
            return res.status(404).json({
                success: false,
                error: 'RFP not found'
            });
        }

        res.json({
            success: true,
            data: rfp
        });
    } catch (error) {
        console.error('RFP Get Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch RFP',
            details: error.message
        });
    }
});

/**
 * POST /api/rfps/:id/send
 * Send RFP to selected vendors via email
 */
router.post('/:id/send', async (req, res) => {
    try {
        const { vendorIds } = req.body;

        if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'vendorIds is required and must be a non-empty array'
            });
        }

        // Fetch the RFP
        const rfp = await Rfp.findByPk(req.params.id);
        if (!rfp) {
            return res.status(404).json({
                success: false,
                error: 'RFP not found'
            });
        }

        // Fetch the vendors
        const vendors = await Vendor.findAll({
            where: { id: vendorIds }
        });

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid vendors found'
            });
        }

        // Send emails to vendors
        const emailResults = await sendRfpToVendors(vendors, rfp);

        // Update RFP status to 'sent' if at least one email was sent
        if (emailResults.totalSent > 0) {
            await rfp.update({ status: 'sent' });
        }

        res.json({
            success: true,
            message: `RFP sent to ${emailResults.totalSent} vendor(s)`,
            results: emailResults
        });
    } catch (error) {
        console.error('RFP Send Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send RFP',
            details: error.message
        });
    }
});

/**
 * GET /api/rfps/:id/compare
 * Compare all proposals for an RFP using AI
 */
router.get('/:id/compare', async (req, res) => {
    try {
        // Import Proposal and compareProposals here to avoid circular deps
        const { Proposal } = require('../models');
        const { compareProposals } = require('../services/aiService');

        // Fetch the RFP
        const rfp = await Rfp.findByPk(req.params.id);
        if (!rfp) {
            return res.status(404).json({
                success: false,
                error: 'RFP not found'
            });
        }

        // Fetch all proposals for this RFP
        const proposals = await Proposal.findAll({
            where: { rfp_id: req.params.id },
            include: [
                { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'email'] }
            ],
            order: [['received_at', 'DESC']]
        });

        if (proposals.length === 0) {
            return res.json({
                success: true,
                rfp: rfp,
                proposals: [],
                comparison: null,
                message: 'No proposals received yet for this RFP'
            });
        }

        if (proposals.length === 1) {
            // Only one proposal, no comparison needed
            return res.json({
                success: true,
                rfp: rfp,
                proposals: proposals,
                comparison: {
                    scores: [{
                        proposalId: proposals[0].id,
                        vendorName: proposals[0].vendor?.name || 'Unknown',
                        score: proposals[0].score || 50,
                        strengths: ['Only proposal received'],
                        weaknesses: ['No other proposals to compare']
                    }],
                    recommendedProposalId: proposals[0].id,
                    recommendedVendorName: proposals[0].vendor?.name || 'Unknown',
                    summary: 'This is the only proposal received. Review the terms carefully before making a decision.',
                    comparisonNotes: 'Single proposal - no comparison available.'
                },
                message: 'Only one proposal received'
            });
        }

        // Compare proposals with AI
        const comparisonResult = await compareProposals(rfp, proposals);

        if (!comparisonResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to compare proposals',
                details: comparisonResult.error,
                proposals: proposals
            });
        }

        // Update proposal scores based on AI comparison
        if (comparisonResult.data.scores) {
            for (const scoreData of comparisonResult.data.scores) {
                await Proposal.update(
                    { score: scoreData.score },
                    { where: { id: scoreData.proposalId } }
                );
            }
        }

        res.json({
            success: true,
            rfp: rfp,
            proposals: proposals,
            comparison: comparisonResult.data
        });

    } catch (error) {
        console.error('RFP Compare Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare proposals',
            details: error.message
        });
    }
});

module.exports = router;
