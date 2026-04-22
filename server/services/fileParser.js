// ============================================================
// File Parser Service — Extracts text from PDF and DOCX files
// ============================================================

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';

/**
 * Extracts text from an uploaded file buffer
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalName - Original filename to detect extension
 * @returns {Promise<string>} - Extracted plain text
 */
export async function extractText(buffer, originalName) {
    const ext = path.extname(originalName).toLowerCase();

    switch (ext) {
        case '.pdf':
            return extractFromPDF(buffer);
        case '.docx':
            return extractFromDOCX(buffer);
        case '.doc':
            throw new Error('Legacy .doc format is not supported. Please convert to .docx or .pdf.');
        case '.txt':
            return buffer.toString('utf-8');
        default:
            throw new Error(`Unsupported file format: ${ext}. Please upload a PDF, DOCX, or TXT file.`);
    }
}

/**
 * Extract text from PDF buffer
 */
async function extractFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        if (!data.text || data.text.trim().length === 0) {
            throw new Error('No text found in PDF. The file may be a scanned image without a text layer.');
        }
        return cleanText(data.text);
    } catch (error) {
        if (error.message.includes('No text found')) throw error;
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}

/**
 * Extract text from DOCX buffer
 */
async function extractFromDOCX(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        if (!result.value || result.value.trim().length === 0) {
            throw new Error('No text found in DOCX file.');
        }
        return cleanText(result.value);
    } catch (error) {
        if (error.message.includes('No text found')) throw error;
        throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
}

/**
 * Clean extracted text — normalize whitespace, remove control chars
 */
function cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[^\S\n]+/g, ' ')       // collapse horizontal whitespace
        .replace(/\n{3,}/g, '\n\n')       // max 2 consecutive newlines
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // remove only control chars, keep Unicode
        .trim();
}
