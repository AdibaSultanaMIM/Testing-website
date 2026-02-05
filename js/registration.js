import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration
const SUPABASE_URL = 'https://dtcwvzjicjdywqkghaip.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Y3d2emppY2pkeXdxa2doYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODczODgsImV4cCI6MjA4NTY2MzM4OH0.S_kJESfs6OplIQD25BtZ2AFSlUqc6w-32_FfpZT-X3A'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM elements
const registrationForm = document.getElementById('registrationForm')
const successMessage = document.getElementById('regSuccessMsg')
const errorMessage = document.getElementById('regErrorMsg')
const submitButton = document.getElementById('submitRegBtn')
const formContainer = document.querySelector('.registration-glass-container')
const successContainer = document.getElementById('successContainer')
const sectionHeader = document.querySelector('#registration .section-header')

// Get form fields
const emailField = document.getElementById('reg_email')
const phoneField = document.getElementById('reg_phone')

// Create error display elements for real-time validation
const emailErrorDiv = createErrorElement('emailValidationError')
const phoneErrorDiv = createErrorElement('phoneValidationError')

// Insert error divs after input fields
emailField.parentNode.appendChild(emailErrorDiv)
phoneField.parentNode.appendChild(phoneErrorDiv)

/**
 * Create error message element
 */
function createErrorElement(id) {
    const div = document.createElement('div');
    div.id = id;
    div.style.cssText = 'display:none; color:#ef4444; font-size:0.875rem; margin-top:0.5rem; font-weight:500;';
    return div;
}

/**
 * Show error message
 */
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError(element) {
    element.style.display = 'none';
}

/**
 * Debounce function for real-time validation
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Real-time email validation
 */
const validateEmailRealtime = debounce((email) => {
    if (!email || email.trim() === '') {
        hideError(emailErrorDiv);
        return;
    }
    
    const errors = getEmailErrors(email);
    if (errors.length > 0) {
        showError(emailErrorDiv, errors[0]);
    } else {
        hideError(emailErrorDiv);
    }
}, 500);

/**
 * Real-time phone validation
 */
const validatePhoneRealtime = debounce((phone) => {
    if (!phone || phone.trim() === '') {
        hideError(phoneErrorDiv);
        return;
    }
    
    const errors = getPhoneErrors(phone);
    if (errors.length > 0) {
        showError(phoneErrorDiv, errors[0]);
    } else {
        hideError(phoneErrorDiv);
    }
}, 500);

// Attach real-time validation to input fields
emailField.addEventListener('input', (e) => {
    validateEmailRealtime(e.target.value);
});

phoneField.addEventListener('input', (e) => {
    // Allow only digits
    e.target.value = e.target.value.replace(/[^\d]/g, '');
    validatePhoneRealtime(e.target.value);
});

/**
 * Show main error message
 */
function showMainError(message) {
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
    
    // Scroll to error
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 10000);
}

/**
 * Extract error message from Supabase Edge Function response
 */
function extractErrorMessage(response) {
    console.log('Extracting error from response:', response);
    
    // Default error message
    let errorMsg = 'Registration failed. Please try again.';
    
    // Check if there's an error object
    if (!response.error) {
        return errorMsg;
    }
    
    // METHOD 1: Check error.context.body (where server response is stored)
    if (response.error.context && response.error.context.body) {
        try {
            let errorBody;
            
            // Parse if string, use directly if object
            if (typeof response.error.context.body === 'string') {
                errorBody = JSON.parse(response.error.context.body);
            } else {
                errorBody = response.error.context.body;
            }
            
            console.log('Parsed error body:', errorBody);
            
            // Priority 1: errors array (multiple validation errors)
            if (errorBody.errors && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
                if (errorBody.errors.length === 1) {
                    return errorBody.errors[0];
                } else {
                    return '• ' + errorBody.errors.join('\n• ');
                }
            }
            
            // Priority 2: error field (single error message)
            if (errorBody.error && typeof errorBody.error === 'string') {
                return errorBody.error;
            }
            
            // Priority 3: message field
            if (errorBody.message && typeof errorBody.message === 'string') {
                return errorBody.message;
            }
        } catch (parseError) {
            console.error('Failed to parse error body:', parseError);
        }
    }
    
    // METHOD 2: Check direct error message (but ignore generic ones)
    if (response.error.message) {
        const msg = response.error.message;
        // Ignore generic Supabase error messages
        if (!msg.includes('non-2xx') && !msg.includes('FunctionsHttpError') && !msg.includes('FunctionsRelayError')) {
            return msg;
        }
    }
    
    return errorMsg;
}

/**
 * Handle form submission
 */
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Form submitted - starting validation...');
    
    // Disable submit button to prevent double submission
    submitButton.disabled = true;
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoader = submitButton.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    // Hide previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    hideError(emailErrorDiv);
    hideError(phoneErrorDiv);
    
    // Collect form data
    const formData = {
        full_name: document.getElementById('reg_full_name').value.trim(),
        email: document.getElementById('reg_email').value.trim(),
        phone: document.getElementById('reg_phone').value.trim(),
        institution: document.getElementById('reg_institution').value.trim(),
        topic: document.getElementById('reg_topic').value
    };
    
    console.log('Form data:', formData);
    
    try {
        // ============================================
        // STEP 1: Client-side validation
        // ============================================
        console.log('Starting client-side validation...');
        
        const validation = validateRegistrationForm(formData);
        
        if (!validation.valid) {
            console.log('Validation failed:', validation.errors);
            
            // Show validation errors
            if (validation.errors.email) {
                showError(emailErrorDiv, validation.errors.email);
            }
            if (validation.errors.phone) {
                showError(phoneErrorDiv, validation.errors.phone);
            }
            
            // Show first error in main error box
            const firstError = Object.values(validation.errors)[0];
            showMainError(firstError);
            
            throw new Error('VALIDATION_ERROR');
        }
        
        console.log('Client-side validation passed ✓');
        
        // ============================================
        // STEP 2: Call Edge Function
        // ============================================
        console.log('Calling Edge Function...');
        
        const response = await supabase.functions.invoke('send-confirmation-email', {
            body: formData
        });
        
        console.log('Edge Function full response:', JSON.stringify(response, null, 2));
        
        // ============================================
        // STEP 3: Handle Response
        // ============================================
        
        // If there's an error (400, 500, etc.)
        if (response.error) {
            const errorMsg = extractErrorMessage(response);
            console.log('Extracted error message:', errorMsg);
            showMainError(errorMsg);
            throw new Error(errorMsg);
        }
        
        // If successful response but no data
        if (!response.data) {
            showMainError('No response from server. Please try again.');
            throw new Error('Empty response from server');
        }
        
        // If data exists but success is false
        const result = response.data;
        if (result.success === false) {
            let errorMsg = 'Registration failed. Please check your information.';
            
            if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                errorMsg = result.errors.length === 1 ? result.errors[0] : '• ' + result.errors.join('\n• ');
            } else if (result.error) {
                errorMsg = result.error;
            } else if (result.message) {
                errorMsg = result.message;
            }
            
            showMainError(errorMsg);
            throw new Error(errorMsg);
        }
        
        console.log('Registration successful! ✓');
        
        // ============================================
        // SUCCESS! Show success state
        // ============================================
        
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        
        if (sectionHeader) {
            sectionHeader.style.display = 'none';
        }
        
        if (successContainer) {
            successContainer.style.display = 'block';
            setTimeout(() => {
                successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Only show error if not already shown and not validation error
        if (errorMessage.style.display === 'none' && error.message !== 'VALIDATION_ERROR') {
            showMainError(error.message || 'Something went wrong. Please try again.');
        }
        
        // Re-enable submit button
        submitButton.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});
