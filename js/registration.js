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
            
            throw new Error('Please fix the validation errors');
        }
        
        console.log('Client-side validation passed ✓');
        
        // ============================================
        // STEP 2: Call Edge Function (server-side validation + insert + email)
        // ============================================
        console.log('Calling Edge Function...');
        
        const response = await supabase.functions.invoke('send-confirmation-email', {
            body: formData
        });
        
        console.log('Edge Function response:', response);
        
        if (response.error) {
            console.error('Edge Function error:', response.error);
            throw response.error;
        }
        
        const result = response.data;
        
        // ============================================
        // STEP 3: Handle response with specific error messages
        // ============================================
        if (!result.success) {
            console.log('Server validation failed:', result);
            
            // Build specific error message
            let errorMessage = 'Registration failed. Please try again.';
            
            if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                // Multiple errors - join them with bullet points
                errorMessage = result.errors.join(' • ');
            } else if (result.error && typeof result.error === 'string') {
                // Single error message from server
                errorMessage = result.error;
            }
            
            showMainError(errorMessage);
            throw new Error(errorMessage);
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
        
        // Show error if not already shown
        if (errorMessage.style.display === 'none') {
            // Extract meaningful error message
            let displayError = 'Registration failed. Please try again.';
            
            // Check if error has a meaningful message
            if (error.message) {
                // Don't show generic "Please fix" message again
                if (!error.message.includes('Please fix the validation errors')) {
                    displayError = error.message;
                } else {
                    // Validation errors already shown inline, use generic message
                    displayError = 'Please correct the errors above';
                }
            }
            
            showMainError(displayError);
        }
        
        // Re-enable submit button
        submitButton.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});
