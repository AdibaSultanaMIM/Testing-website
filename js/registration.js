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
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 8000);
}

/**
 * Show main success message
 */
function showMainSuccess(message) {
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
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
        
        console.log('Edge Function response:', response);
        
        // ============================================
        // STEP 3: Handle Edge Function Response (IMPROVED)
        // ============================================
        
        // Handle Edge Function errors (network, timeout, etc.)
        if (response.error) {
            console.error('Edge Function error:', response.error);
            
            // Try to extract meaningful error message
            let errorMsg = 'Registration failed. Please try again.';
            
            if (response.error.message) {
                errorMsg = response.error.message;
            }
            
            showMainError(errorMsg);
            throw new Error(errorMsg);
        }
        
        // Handle server response
        const result = response.data;
        
        // Check if result exists
        if (!result) {
            showMainError('No response from server. Please try again.');
            throw new Error('Empty response from server');
        }
        
        // Handle unsuccessful registration
        if (!result.success) {
            console.log('Server validation failed:', result);
            
            // Extract user-friendly error message
            let userErrorMessage = 'Registration failed. Please check your information and try again.';
            
            // Priority 1: Check for errors array (multiple errors)
            if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                userErrorMessage = result.errors.join('\n• ');
                if (result.errors.length > 1) {
                    userErrorMessage = '• ' + userErrorMessage;
                }
            }
            // Priority 2: Check for single error message
            else if (result.error && typeof result.error === 'string' && result.error.length > 0) {
                userErrorMessage = result.error;
            }
            // Priority 3: Check for message field
            else if (result.message && typeof result.message === 'string' && result.message.length > 0) {
                userErrorMessage = result.message;
            }
            
            showMainError(userErrorMessage);
            throw new Error(userErrorMessage);
        }
        
        console.log('Registration successful! ✓');
        
        // ============================================
        // SUCCESS! Show success state
        // ============================================
        
        // Hide form container and section header
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        
        if (sectionHeader) {
            sectionHeader.style.display = 'none';
        }
        
        // Show success container with animation
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
            let displayError = 'Something went wrong. Please try again.';
            
            if (error.message && error.message !== 'VALIDATION_ERROR') {
                displayError = error.message;
            }
            
            showMainError(displayError);
        }
        
        // Re-enable submit button
        submitButton.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});
