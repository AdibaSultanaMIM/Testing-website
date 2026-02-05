// ================================================
// VALIDATION.JS - Email & Phone Validation
// ================================================

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(String(email).trim());
}

/**
 * Validates Bangladesh phone number (11 digits starting with 01)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidPhone(phone) {
  const p = String(phone).trim();
  
  // Must be digits only
  if (!/^\d+$/.test(p)) return false;
  
  // Must be exactly 11 digits
  if (p.length !== 11) return false;
  
  // Must start with 01
  if (!p.startsWith("01")) return false;
  
  return true;
}

/**
 * Get detailed email validation errors
 * @param {string} email - Email to validate
 * @returns {string[]} - Array of error messages
 */
function getEmailErrors(email) {
  const errors = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
    return errors;
  }
  
  if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address (e.g., name@example.com)');
  }
  
  return errors;
}

/**
 * Get detailed phone validation errors
 * @param {string} phone - Phone number to validate
 * @returns {string[]} - Array of error messages
 */
function getPhoneErrors(phone) {
  const errors = [];
  const p = String(phone).trim();
  
  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required');
    return errors;
  }
  
  if (!/^\d+$/.test(p)) {
    errors.push('Phone number must contain only digits (0-9)');
    return errors;
  }
  
  if (p.length !== 11) {
    errors.push(`Phone number must be exactly 11 digits (currently ${p.length} digits)`);
  }
  
  if (!p.startsWith("01")) {
    errors.push('Bangladesh phone numbers must start with 01');
  }
  
  return errors;
}

/**
 * Validate all required fields
 * @param {Object} formData - Object containing form data
 * @returns {Object} - { valid: boolean, errors: Object }
 */
function validateRegistrationForm(formData) {
  const errors = {};
  
  // Full Name validation
  if (!formData.full_name || formData.full_name.trim().length < 3) {
    errors.full_name = 'Full name must be at least 3 characters';
  }
  
  // Email validation
  const emailErrors = getEmailErrors(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }
  
  // Phone validation
  const phoneErrors = getPhoneErrors(formData.phone);
  if (phoneErrors.length > 0) {
    errors.phone = phoneErrors[0];
  }
  
  // Institution validation
  if (!formData.institution || formData.institution.trim().length < 2) {
    errors.institution = 'Institution name is required';
  }
  
  // Topic validation
  if (!formData.topic || formData.topic === '') {
    errors.topic = 'Please select a topic';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: errors
  };
}

// Export functions (for ES6 modules - optional)
// If using <script src="..."> tags, these are already global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidEmail,
    isValidPhone,
    getEmailErrors,
    getPhoneErrors,
    validateRegistrationForm
  };
}
