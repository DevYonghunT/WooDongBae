/**
 * Sanitizer utilities for scraper security
 * Prevents prompt injection and XSS attacks
 */

// Maximum content length to prevent token overflow attacks
const MAX_CONTENT_LENGTH = 50000;

// Characters that could be used for prompt injection
const INJECTION_PATTERNS = [
    /```/g,                          // Code blocks
    /\[INST\]/gi,                    // Instruction tags
    /\[\/INST\]/gi,
    /<\|.*?\|>/g,                    // Special tokens
    /<<SYS>>/gi,                     // System prompts
    /<<\/SYS>>/gi,
    /Human:|Assistant:|System:/gi,  // Role markers
    /IGNORE ALL PREVIOUS/gi,         // Common injection phrases
    /DISREGARD ABOVE/gi,
    /NEW INSTRUCTIONS:/gi,
];

/**
 * Sanitize content before sending to AI model
 * Prevents prompt injection attacks
 */
export function sanitizeForPrompt(content: string): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    let sanitized = content;

    // 1. Limit content length
    if (sanitized.length > MAX_CONTENT_LENGTH) {
        sanitized = sanitized.substring(0, MAX_CONTENT_LENGTH);
        console.log(`      ⚠️ Content truncated to ${MAX_CONTENT_LENGTH} characters`);
    }

    // 2. Remove potential injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, ' ');
    }

    // 3. Escape special characters that could affect JSON parsing
    sanitized = sanitized
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/"/g, '\\"')    // Escape double quotes (for JSON)
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\r/g, '')      // Remove carriage returns
        .replace(/\t/g, ' ');    // Replace tabs with spaces

    // 4. Remove excessive whitespace
    sanitized = sanitized.replace(/\s{3,}/g, '  ');

    return sanitized.trim();
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')  // Remove event handlers
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, 'data_');  // Prevent data URLs
}

/**
 * Sanitize course title for database storage
 */
export function sanitizeTitle(title: string): string {
    if (!title || typeof title !== 'string') {
        return '';
    }

    return title
        .trim()
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/<[^>]*>/g, '')        // Remove HTML tags
        .replace(/[<>"'&]/g, '')        // Remove potentially dangerous chars
        .substring(0, 500);             // Limit length
}

/**
 * Sanitize general text field
 */
export function sanitizeTextField(text: string | undefined | null, maxLength: number = 200): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/<[^>]*>/g, '')
        .substring(0, maxLength);
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Sanitize error message for logging (remove sensitive info)
 */
export function sanitizeErrorForLogging(error: unknown): string {
    if (error instanceof Error) {
        // Remove potential sensitive info from error message
        let message = error.message;

        // Remove API keys
        message = message.replace(/[A-Za-z0-9_-]{20,}/g, '[REDACTED]');
        // Remove URLs with tokens
        message = message.replace(/https?:\/\/[^\s]+/g, '[URL_REDACTED]');
        // Remove email addresses
        message = message.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[EMAIL_REDACTED]');

        return `${error.name}: ${message}`;
    }

    if (typeof error === 'string') {
        return error.substring(0, 200);
    }

    return 'Unknown error';
}

/**
 * Generate deterministic hash for consistent image URLs
 */
export function generateHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
