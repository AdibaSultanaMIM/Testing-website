import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Replace with YOUR Supabase credentials
const SUPABASE_URL = 'https://dtcwvzjicjdywqkghaip.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Y3d2emppY2pkeXdxa2doYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODczODgsImV4cCI6MjA4NTY2MzM4OH0.S_kJESfs6OplIQD25BtZ2AFSlUqc6w-32_FfpZT-X3A'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const registrationForm = document.getElementById('registrationForm')
const successMessage = document.getElementById('regSuccessMsg')
const submitButton = registrationForm.querySelector('button[type="submit"]')

registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    submitButton.disabled = true
    submitButton.textContent = 'Submitting...'

    const formData = {
        full_name: document.getElementById('reg_full_name').value,
        email: document.getElementById('reg_email').value,
        phone: document.getElementById('reg_phone').value,
        institution: document.getElementById('reg_institution').value,
        topic: document.getElementById('reg_topic').value
    }

    try {
        // Insert into database
        const { data, error } = await supabase
            .from('workshop_registrations')
            .insert([formData])
            .select()

        if (error) {
            if (error.code === '23505') {
                throw new Error('This email is already registered!')
            }
            throw error
        }

        // Registration successful! Try to send email but don't fail if it doesn't work
        try {
            const emailResponse = await supabase.functions.invoke('send-confirmation-email', {
                body: formData
            })

            if (emailResponse.error) {
                console.error('Email error:', emailResponse.error)
            }
        } catch (emailError) {
            console.error('Email sending failed, but registration was successful:', emailError)
        }

        // Show success message regardless of email status
        registrationForm.style.display = 'none'
        successMessage.style.display = 'flex'

    } catch (error) {
        console.error('Error:', error)
        alert(error.message || 'Registration failed. Please try again.')
        submitButton.disabled = false
        submitButton.textContent = 'Register Now'
    }
})
