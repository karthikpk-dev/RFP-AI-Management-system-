const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try multiple models as fallback (Gemini 2.x models)
const MODELS_TO_TRY = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-lite'
];

/**
 * Clean JSON response from AI - remove markdown formatting and extract JSON
 */
function cleanJsonResponse(text) {
    let cleanedText = text.trim();

    // Remove markdown code blocks
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    // Try to extract just the JSON object if there's extra text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }

    return cleanedText;
}

/**
 * Try to generate content with fallback models
 */
async function generateWithFallback(prompt) {
    let lastError = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`✅ Success with model: ${modelName}`);
            return response;
        } catch (error) {
            console.log(`❌ Failed with ${modelName}:`, error.message);
            lastError = error;
            continue;
        }
    }

    throw lastError || new Error('All models failed');
}

/**
 * Generate a structured RFP from a natural language query
 * @param {string} userQuery - The user's natural language description of their RFP
 * @returns {Promise<Object>} - Structured RFP data
 */
async function generateStructuredRFP(userQuery) {
    const prompt = `You are a procurement expert. Convert this user query into a JSON object with fields: title, lineItems (array of objects with item, quantity, specs), budget (number or null if not specified), deliveryDate (ISO date string or null), paymentTerms (string or null). Output ONLY valid JSON, no markdown code blocks, no explanations.

User Query: "${userQuery}"

JSON Output:`;

    try {
        const response = await generateWithFallback(prompt);
        const text = response.text();
        const cleanedText = cleanJsonResponse(text);
        const structuredData = JSON.parse(cleanedText);

        return {
            success: true,
            data: structuredData,
            originalQuery: userQuery
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        return {
            success: false,
            error: error.message,
            originalQuery: userQuery
        };
    }
}

/**
 * Parse a vendor proposal email and extract structured data
 * @param {string} emailBody - The email body text from vendor
 * @returns {Promise<Object>} - Extracted proposal data
 */
async function parseProposal(emailBody) {
    const prompt = `You are a procurement analyst. Extract the following information from this vendor proposal email and output as JSON:
- total_price: number or null
- line_item_prices: array of objects with {item: string, price: number} or empty array
- warranty_terms: string or null
- delivery_time: string or null
- additional_notes: string or null

If information is not found, use null. Output ONLY valid JSON, no explanations.

Vendor Email:
"""
${emailBody}
"""

JSON Output:`;

    try {
        const response = await generateWithFallback(prompt);
        const text = response.text();
        const cleanedText = cleanJsonResponse(text);
        const extractedData = JSON.parse(cleanedText);

        return {
            success: true,
            data: extractedData
        };
    } catch (error) {
        console.error('AI Parse Proposal Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate a summary of a proposal for quick review
 * @param {Object} proposalData - The extracted proposal data
 * @param {string} emailBody - Original email body
 * @returns {Promise<string>} - Summary text
 */
async function generateProposalSummary(proposalData, emailBody) {
    const prompt = `Summarize this vendor proposal in 2-3 sentences, highlighting the key terms (price, delivery, warranty):

Extracted Data: ${JSON.stringify(proposalData)}

Original Email (for context):
${emailBody.substring(0, 500)}...

Summary:`;

    try {
        const response = await generateWithFallback(prompt);
        return response.text().trim();
    } catch (error) {
        console.error('AI Summary Error:', error);
        return 'Unable to generate summary.';
    }
}

/**
 * Compare multiple vendor proposals against RFP requirements
 * @param {Object} rfpData - The original RFP data
 * @param {Array} proposals - Array of proposal objects with vendor and extracted data
 * @returns {Promise<Object>} - Comparison results with scores and recommendation
 */
async function compareProposals(rfpData, proposals) {
    // Format proposals for the prompt
    const formattedProposals = proposals.map((p, index) => ({
        proposalId: p.id,
        vendorName: p.vendor?.name || 'Unknown Vendor',
        vendorId: p.vendor?.id,
        extractedData: p.extracted_data_json,
        summary: p.summary
    }));

    const prompt = `Act as a procurement manager. Compare these vendor proposals against the original RFP requirements.

ORIGINAL RFP:
Title: ${rfpData.title}
Budget: ${rfpData.budget || 'Not specified'}
Requirements: ${JSON.stringify(rfpData.structured_json_data || {})}

VENDOR PROPOSALS:
${JSON.stringify(formattedProposals, null, 2)}

For each proposal, evaluate:
1. Price competitiveness (vs budget and other proposals)
2. Completeness of response
3. Delivery timeline
4. Warranty/terms offered

Output a JSON object with:
{
  "scores": [
    {
      "proposalId": "uuid",
      "vendorName": "string",
      "score": number (0-100),
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  ],
  "recommendedProposalId": "uuid of best proposal",
  "recommendedVendorName": "name of best vendor",
  "summary": "2-3 sentence explanation of why this vendor is recommended",
  "comparisonNotes": "Brief overview of how proposals compare"
}

Output ONLY valid JSON, no markdown code blocks, no explanations.`;

    try {
        const response = await generateWithFallback(prompt);
        const text = response.text();
        const cleanedText = cleanJsonResponse(text);
        const comparison = JSON.parse(cleanedText);

        return {
            success: true,
            data: comparison
        };
    } catch (error) {
        console.error('AI Compare Proposals Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    generateStructuredRFP,
    parseProposal,
    generateProposalSummary,
    compareProposals
};
