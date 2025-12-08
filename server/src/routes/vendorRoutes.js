'use strict';

const express = require('express');
const router = express.Router();
const { Vendor } = require('../models');

/**
 * GET /api/vendors
 * List all vendors
 */
router.get('/', async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: vendors
        });
    } catch (error) {
        console.error('Vendor List Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors',
            details: error.message
        });
    }
});

/**
 * GET /api/vendors/:id
 * Get a single vendor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findByPk(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Vendor Get Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor',
            details: error.message
        });
    }
});

/**
 * POST /api/vendors
 * Create a new vendor
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, contactInfo } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Check for duplicate email
        const existing = await Vendor.findOne({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'A vendor with this email already exists'
            });
        }

        const vendor = await Vendor.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            contact_info: contactInfo || {}
        });

        res.status(201).json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Vendor Create Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create vendor',
            details: error.message
        });
    }
});

/**
 * PUT /api/vendors/:id
 * Update a vendor
 */
router.put('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findByPk(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const { name, email, contactInfo } = req.body;

        if (email && email !== vendor.email) {
            const existing = await Vendor.findOne({ where: { email: email.trim().toLowerCase() } });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: 'A vendor with this email already exists'
                });
            }
        }

        await vendor.update({
            name: name ? name.trim() : vendor.name,
            email: email ? email.trim().toLowerCase() : vendor.email,
            contact_info: contactInfo !== undefined ? contactInfo : vendor.contact_info
        });

        res.json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Vendor Update Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update vendor',
            details: error.message
        });
    }
});

/**
 * DELETE /api/vendors/:id
 * Delete a vendor
 */
router.delete('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findByPk(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        await vendor.destroy();

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Vendor Delete Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete vendor',
            details: error.message
        });
    }
});

module.exports = router;
