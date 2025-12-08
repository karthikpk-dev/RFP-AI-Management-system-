'use strict';

const express = require('express');
const router = express.Router();
const { fetchUnreadReplies, markEmailsAsRead } = require('../services/emailReceiver');
const { parseProposal, generateProposalSummary } = require('../services/aiService');
const { Proposal, Rfp, Vendor } = require('../models');
const { Op } = require('sequelize');

// In-memory job tracking (use Redis in production)
const refreshJobs = new Map();

/**
 * GET /api/proposals
 * List all proposals with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { rfpId, vendorId } = req.query;
        const where = {};

        if (rfpId) where.rfp_id = rfpId;
        if (vendorId) where.vendor_id = vendorId;

        const proposals = await Proposal.findAll({
            where,
            include: [
                { model: Rfp, as: 'rfp', attributes: ['id', 'title', 'status'] },
                { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'email'] }
            ],
            order: [['received_at', 'DESC']]
        });

        res.json({
            success: true,
            data: proposals
        });
    } catch (error) {
        console.error('Proposal List Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch proposals',
            details: error.message
        });
    }
});

/**
 * GET /api/proposals/:id
 * Get a single proposal by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const proposal = await Proposal.findByPk(req.params.id, {
            include: [
                { model: Rfp, as: 'rfp' },
                { model: Vendor, as: 'vendor' }
            ]
        });

        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        res.json({
            success: true,
            data: proposal
        });
    } catch (error) {
        console.error('Proposal Get Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch proposal',
            details: error.message
        });
    }
});

/**
 * Background job processor for proposal refresh
 */
async function processRefreshJob(jobId) {
    const job = refreshJobs.get(jobId);
    if (!job) return;

    try {
        console.log(`🔄 [Job ${jobId}] Starting proposal refresh...`);
        job.status = 'fetching_emails';

        // Fetch unread emails
        const emails = await fetchUnreadReplies();
        console.log(`📧 [Job ${jobId}] Found ${emails.length} unread emails`);
        job.totalEmails = emails.length;

        if (emails.length === 0) {
            job.status = 'completed';
            job.message = 'No new proposal emails found';
            return;
        }

        job.status = 'processing';
        const processedUids = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            job.currentEmail = i + 1;
            job.processed++;

            try {
                // Skip if we've already processed this email
                const existingProposal = await Proposal.findOne({
                    where: { email_message_id: email.messageId }
                });

                if (existingProposal) {
                    console.log(`⏭️ [Job ${jobId}] Skipping already processed email`);
                    job.skipped++;
                    processedUids.push(email.uid);
                    continue;
                }

                // Find the RFP
                let rfp = null;
                if (email.rfpId) {
                    rfp = await Rfp.findByPk(email.rfpId);
                }

                if (!rfp) {
                    console.log(`⚠️ [Job ${jobId}] Could not find RFP for email`);
                    job.errors.push({ email: email.subject, error: 'Could not find matching RFP' });
                    continue;
                }

                // Find the vendor
                const vendor = await Vendor.findOne({
                    where: { email: email.from.address.toLowerCase() }
                });

                if (!vendor) {
                    job.errors.push({ email: email.subject, error: `Unknown vendor: ${email.from.address}` });
                    continue;
                }

                // Parse with AI
                job.status = `parsing_email_${i + 1}`;
                const emailBody = email.text || email.html || '';
                const parseResult = await parseProposal(emailBody);

                if (!parseResult.success) {
                    job.errors.push({ email: email.subject, error: `AI parsing failed` });
                    continue;
                }

                // Generate summary
                const summary = await generateProposalSummary(parseResult.data, emailBody);

                // Calculate score
                let score = null;
                if (parseResult.data.total_price && rfp.budget) {
                    const priceRatio = parseFloat(rfp.budget) / parseResult.data.total_price;
                    score = Math.min(100, Math.max(0, priceRatio * 50));
                }

                // Create proposal
                const proposal = await Proposal.create({
                    rfp_id: rfp.id,
                    vendor_id: vendor.id,
                    email_content: emailBody,
                    extracted_data_json: parseResult.data,
                    score: score,
                    summary: summary,
                    received_at: email.date || new Date(),
                    email_message_id: email.messageId
                });

                console.log(`✅ [Job ${jobId}] Created proposal: ${proposal.id}`);
                job.created++;
                processedUids.push(email.uid);

            } catch (emailError) {
                job.errors.push({ email: email.subject, error: emailError.message });
            }
        }

        // Mark processed emails as read
        if (processedUids.length > 0) {
            await markEmailsAsRead(processedUids);
        }

        job.status = 'completed';
        job.message = `Processed ${job.processed} emails, created ${job.created} proposals`;
        console.log(`✅ [Job ${jobId}] Completed`);

    } catch (error) {
        console.error(`❌ [Job ${jobId}] Error:`, error);
        job.status = 'failed';
        job.error = error.message;
    }
}

/**
 * POST /api/proposals/refresh
 * Start background job to fetch emails - returns immediately
 */
router.post('/refresh', async (req, res) => {
    try {
        // Create job ID
        const jobId = `job_${Date.now()}`;

        // Initialize job status
        refreshJobs.set(jobId, {
            id: jobId,
            status: 'starting',
            startedAt: new Date(),
            totalEmails: 0,
            currentEmail: 0,
            processed: 0,
            created: 0,
            skipped: 0,
            errors: [],
            message: null
        });

        // Start processing in background (don't await)
        processRefreshJob(jobId).catch(err => {
            console.error('Background job error:', err);
        });

        // Return immediately with job ID
        res.json({
            success: true,
            message: 'Refresh started in background',
            jobId: jobId,
            statusUrl: `/api/proposals/refresh/status/${jobId}`
        });

    } catch (error) {
        console.error('Proposal Refresh Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start refresh',
            details: error.message
        });
    }
});

/**
 * GET /api/proposals/refresh/status/:jobId
 * Check status of background refresh job
 */
router.get('/refresh/status/:jobId', (req, res) => {
    const job = refreshJobs.get(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }

    res.json({
        success: true,
        job: {
            id: job.id,
            status: job.status,
            totalEmails: job.totalEmails,
            currentEmail: job.currentEmail,
            processed: job.processed,
            created: job.created,
            skipped: job.skipped,
            errors: job.errors,
            message: job.message,
            startedAt: job.startedAt
        }
    });
});

/**
 * POST /api/proposals/refresh-sync
 * Synchronous refresh - waits for completion (simpler, but slower response)
 */
router.post('/refresh-sync', async (req, res) => {
    try {
        console.log('🔄 Starting synchronous proposal refresh...');

        // Fetch unread emails
        const emails = await fetchUnreadReplies();
        console.log(`📧 Found ${emails.length} unread emails`);

        if (emails.length === 0) {
            return res.json({
                success: true,
                message: 'No new proposal emails found',
                processed: 0,
                created: 0
            });
        }

        const results = { processed: 0, created: 0, skipped: 0, errors: [] };
        const processedUids = [];

        for (const email of emails) {
            results.processed++;

            try {
                // Skip if already processed
                const existing = await Proposal.findOne({
                    where: { email_message_id: email.messageId }
                });

                if (existing) {
                    results.skipped++;
                    processedUids.push(email.uid);
                    continue;
                }

                // Find RFP
                let rfp = email.rfpId ? await Rfp.findByPk(email.rfpId) : null;
                if (!rfp) {
                    results.errors.push({ email: email.subject, error: 'RFP not found' });
                    continue;
                }

                // Find vendor
                const vendor = await Vendor.findOne({
                    where: { email: email.from.address.toLowerCase() }
                });
                if (!vendor) {
                    results.errors.push({ email: email.subject, error: 'Unknown vendor' });
                    continue;
                }

                // Parse with AI
                const emailBody = email.text || email.html || '';
                const parseResult = await parseProposal(emailBody);

                if (!parseResult.success) {
                    results.errors.push({ email: email.subject, error: 'AI parsing failed' });
                    continue;
                }

                // Generate summary
                const summary = await generateProposalSummary(parseResult.data, emailBody);

                // Create proposal
                await Proposal.create({
                    rfp_id: rfp.id,
                    vendor_id: vendor.id,
                    email_content: emailBody,
                    extracted_data_json: parseResult.data,
                    score: null,
                    summary: summary,
                    received_at: email.date || new Date(),
                    email_message_id: email.messageId
                });

                results.created++;
                processedUids.push(email.uid);
                console.log('✅ Created proposal');

            } catch (err) {
                results.errors.push({ email: email.subject, error: err.message });
            }
        }

        // Mark as read
        if (processedUids.length > 0) {
            await markEmailsAsRead(processedUids);
        }

        res.json({
            success: true,
            message: `Processed ${results.processed} emails`,
            ...results
        });

    } catch (error) {
        console.error('Sync Refresh Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh proposals',
            details: error.message
        });
    }
});

/**
 * PUT /api/proposals/:id/score
 * Manually update proposal score
 */
router.put('/:id/score', async (req, res) => {
    try {
        const { score } = req.body;

        if (score === undefined || score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                error: 'Score must be a number between 0 and 100'
            });
        }

        const proposal = await Proposal.findByPk(req.params.id);

        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        await proposal.update({ score });

        res.json({
            success: true,
            data: proposal
        });
    } catch (error) {
        console.error('Proposal Score Update Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update score',
            details: error.message
        });
    }
});

module.exports = router;
