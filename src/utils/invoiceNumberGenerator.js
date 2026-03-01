/**
 * Secure Invoice Number Generator
 * Generates non-sequential, unpredictable invoice numbers
 * Format: PREFIX-YY-RANDOM
 * Example: PI-26-K8D4L2, INV-26-Q2M7X9
 */

// Characters to use (excluding O, 0, I, 1 to avoid confusion)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string (6-8 characters)
 * @returns {string} Random alphanumeric string
 */
const generateSecureRandom = (length = 6) => {
  // Use crypto.getRandomValues for cryptographic randomness
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    // Map random byte to safe character
    result += SAFE_CHARS[array[i] % SAFE_CHARS.length];
  }
  
  return result;
};

/**
 * Generate a secure invoice number
 * @param {string} prefix - Invoice prefix (e.g., 'PI', 'INV', 'QUOTE')
 * @param {number} randomLength - Length of random suffix (default: 6)
 * @returns {string} Secure invoice number
 */
export const generateSecureInvoiceNumber = (prefix = 'INV', randomLength = 6) => {
  // Get current year (2-digit)
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Generate random suffix
  const randomSuffix = generateSecureRandom(randomLength);
  
  // Format: PREFIX-YY-RANDOM
  return `${prefix}-${year}-${randomSuffix}`;
};

/**
 * Generate multiple unique invoice numbers
 * Useful for batch generation or ensuring uniqueness
 * @param {string} prefix - Invoice prefix
 * @param {number} count - Number of invoice numbers to generate
 * @param {number} randomLength - Length of random suffix
 * @returns {string[]} Array of unique invoice numbers
 */
export const generateBatchInvoiceNumbers = (prefix = 'INV', count = 1, randomLength = 6) => {
  const numbers = new Set();
  
  while (numbers.size < count) {
    numbers.add(generateSecureInvoiceNumber(prefix, randomLength));
  }
  
  return Array.from(numbers);
};

/**
 * Validate invoice number format
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {boolean} True if valid format
 */
export const validateInvoiceNumberFormat = (invoiceNumber) => {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    return false;
  }
  
  // Pattern: PREFIX-YY-RANDOM (e.g., INV-26-K8D4L2)
  // PREFIX: 2-10 uppercase letters
  // YY: 2 digits
  // RANDOM: 6-8 alphanumeric characters (safe chars only)
  const pattern = /^[A-Z]{2,10}-\d{2}-[A-Z2-9]{6,8}$/;
  
  return pattern.test(invoiceNumber);
};

/**
 * Extract components from invoice number
 * @param {string} invoiceNumber - Invoice number to parse
 * @returns {object|null} Object with prefix, year, random parts or null if invalid
 */
export const parseInvoiceNumber = (invoiceNumber) => {
  if (!validateInvoiceNumberFormat(invoiceNumber)) {
    return null;
  }
  
  const parts = invoiceNumber.split('-');
  
  return {
    prefix: parts[0],
    year: parts[1],
    random: parts[2],
    full: invoiceNumber
  };
};

/**
 * Generate invoice number with custom prefix based on document type
 * @param {string} documentType - Type of document (invoice, proforma, quote, etc.)
 * @returns {string} Secure invoice number with appropriate prefix
 */
export const generateInvoiceNumberByType = (documentType = 'invoice') => {
  const prefixMap = {
    'invoice': 'INV',
    'proforma': 'PI',
    'quote': 'QT',
    'estimate': 'EST',
    'receipt': 'RCP',
    'credit_note': 'CN',
    'debit_note': 'DN'
  };
  
  const prefix = prefixMap[documentType.toLowerCase()] || 'INV';
  
  return generateSecureInvoiceNumber(prefix, 6);
};

/**
 * Check if invoice number is likely sequential (for migration detection)
 * @param {string} invoiceNumber - Invoice number to check
 * @returns {boolean} True if appears to be sequential format
 */
export const isSequentialFormat = (invoiceNumber) => {
  if (!invoiceNumber) return false;
  
  // Check for patterns like: INV-2024-0001, PI-YYYY-0001, etc.
  const sequentialPatterns = [
    /\d{4}-\d{4,}$/,  // Ends with year and sequential number
    /-0{2,}\d+$/,     // Ends with padded zeros
    /^\d+$/           // Just numbers
  ];
  
  return sequentialPatterns.some(pattern => pattern.test(invoiceNumber));
};

/**
 * Generate a verification token (for public invoice verification)
 * This is separate from invoice number for additional security
 * @returns {string} Secure verification token
 */
export const generateVerificationToken = () => {
  return generateSecureRandom(12); // 12-character token
};

/**
 * Calculate entropy of invoice number (for security analysis)
 * @param {number} randomLength - Length of random suffix
 * @returns {number} Bits of entropy
 */
export const calculateEntropy = (randomLength = 6) => {
  // Entropy = log2(possible_combinations)
  // With 32 safe characters and length of 6: 32^6 = 1,073,741,824 combinations
  const possibleChars = SAFE_CHARS.length;
  const combinations = Math.pow(possibleChars, randomLength);
  const entropy = Math.log2(combinations);
  
  return Math.round(entropy);
};

// Export constants for testing and documentation
export const CONSTANTS = {
  SAFE_CHARS,
  DEFAULT_RANDOM_LENGTH: 6,
  MIN_RANDOM_LENGTH: 6,
  MAX_RANDOM_LENGTH: 8,
  ENTROPY_BITS: calculateEntropy(6) // ~30 bits for 6 characters
};

// Default export
export default {
  generateSecureInvoiceNumber,
  generateBatchInvoiceNumbers,
  validateInvoiceNumberFormat,
  parseInvoiceNumber,
  generateInvoiceNumberByType,
  isSequentialFormat,
  generateVerificationToken,
  calculateEntropy,
  CONSTANTS
};
