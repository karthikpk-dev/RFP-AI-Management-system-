const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

/**
 * Get IMAP connection configuration from environment
 */
function getImapConfig() {
    return {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASS,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT) || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 30000,  // 30 seconds
            connTimeout: 30000   // 30 seconds
        }
    };
}

/**
 * Extract RFP ID from email subject
 * Expects format like "Re: Request for Proposal: Title - RFP #uuid"
 * @param {string} subject - Email subject line
 * @returns {string|null} - RFP ID or null
 */
function extractRfpIdFromSubject(subject) {
    // Look for RFP ID pattern (UUID format)
    const rfpPattern = /RFP[:\s#]+([a-f0-9-]{36})/i;
    const match = subject.match(rfpPattern);

    if (match) {
        return match[1];
    }

    // Also try to find any UUID in subject as fallback
    const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
    const uuidMatch = subject.match(uuidPattern);

    return uuidMatch ? uuidMatch[1] : null;
}

/**
 * Fetch unread emails that are replies to RFPs
 * @returns {Promise<Array>} - Array of parsed email objects
 */
async function fetchUnreadReplies() {
    let connection;
    const emails = [];

    try {
        console.log('📧 Connecting to IMAP server...');
        connection = await imaps.connect(getImapConfig());
        console.log('📧 Connected! Opening INBOX...');
        await connection.openBox('INBOX');
        console.log('📧 INBOX opened. Searching for RFP emails only...');

        // Search for unseen emails with "RFP" in subject (MUCH faster than fetching all 367!)
        const searchCriteria = ['UNSEEN', ['SUBJECT', 'RFP']];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false // Don't mark as read yet, let the caller decide
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Found ${messages.length} unread RFP emails`);

        for (const message of messages) {
            try {
                // Get the full email content
                const all = message.parts.find(part => part.which === '');
                const parsed = await simpleParser(all.body);

                const subject = parsed.subject || '';
                const rfpId = extractRfpIdFromSubject(subject);

                // Only process emails that look like RFP replies
                if (rfpId || subject.toLowerCase().includes('rfp') || subject.toLowerCase().includes('proposal')) {
                    emails.push({
                        uid: message.attributes.uid,
                        messageId: parsed.messageId,
                        from: parsed.from?.value?.[0] || { address: 'unknown', name: 'Unknown' },
                        subject: subject,
                        date: parsed.date,
                        text: parsed.text || '',
                        html: parsed.html || '',
                        rfpId: rfpId
                    });
                }
            } catch (parseError) {
                console.error('Error parsing email:', parseError);
            }
        }

        return emails;
    } catch (error) {
        console.error('IMAP Fetch Error:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (e) {
                // Ignore close errors
            }
        }
    }
}

/**
 * Mark specific emails as read
 * @param {Array<number>} uids - Array of email UIDs to mark as read
 */
async function markEmailsAsRead(uids) {
    if (!uids || uids.length === 0) return;

    let connection;
    try {
        connection = await imaps.connect(getImapConfig());
        await connection.openBox('INBOX');

        for (const uid of uids) {
            await connection.addFlags(uid, ['\\Seen']);
        }
    } catch (error) {
        console.error('Error marking emails as read:', error);
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (e) {
                // Ignore close errors
            }
        }
    }
}

module.exports = {
    fetchUnreadReplies,
    markEmailsAsRead,
    extractRfpIdFromSubject
};
