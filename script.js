[file name]: script.js
[file content begin]
// script.js - COMPLETE FIXED VERSION
const GOOGLESCRIPTURL = 'https://script.google.com/macros/s/AKfycbxrEMMt6g-39pTAUeJhJnZdfzM7s5A4kI8trsm7yezVwBfkTQzGnJxDpLbxhPwc0zpX/exec';
const ADMINPASSWORD = 'class2024';
const GOOGLESHEETURL = 'https://docs.google.com/spreadsheets/d/1ESTI04FQ8zrumvTYAZ-vlS446bCPsFcs1rjQrJeoc/edit';

// DOM Elements
let currentStep = 1;
let totalMembers = 0;
let todayJoined = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupFormValidation();
    setupFormNavigation();
    
    // Update view sheet link
    document.getElementById('viewSheetLink').href = GOOGLESHEETURL;
    
    // Update admin link with password
    document.getElementById('adminLink').addEventListener('click', function(e) {
        e.preventDefault();
        const password = prompt('Enter admin password:');
        if (password === ADMINPASSWORD) {
            window.open('admin.html', '_blank');
        } else {
            alert('Incorrect password');
        }
    });
});

// Form Navigation
function nextStep(step) {
    // Validate current step before proceeding
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = step;
    document.getElementById(`step${currentStep}`).classList.add('active');
    updateReviewSection();
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = step;
    document.getElementById(`step${currentStep}`).classList.add('active');
}

// Form Validation
function validateStep1() {
    const name = document.getElementById('fullName').value.trim();
    if (!name) {
        alert('Please enter your full name');
        document.getElementById('fullName').focus();
        return false;
    }
    return true;
}

function validateStep2() {
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        alert('Please enter your WhatsApp number');
        document.getElementById('phone').focus();
        return false;
    }
    
    // Clean phone number (remove spaces)
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
        alert('Please enter a valid 10-digit Indian phone number');
        document.getElementById('phone').focus();
        return false;
    }
    
    const email = document.getElementById('email').value.trim();
    if (email && !validateEmail(email)) {
        alert('Please enter a valid email address');
        document.getElementById('email').focus();
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Update Review Section
function updateReviewSection() {
    if (currentStep !== 3) return;
    
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const altPhone = document.getElementById('altPhone').value.trim();
    const email = document.getElementById('email').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    
    document.getElementById('reviewName').textContent = name || 'Not provided';
    
    // Format phone for display
    const formatPhone = (phone) => {
        if (!phone) return 'Not provided';
        const clean = phone.replace(/\s/g, '');
        if (clean.length === 10) return `+91 ${clean.slice(0,5)} ${clean.slice(5)}`;
        return phone;
    };
    
    document.getElementById('reviewPhone').textContent = formatPhone(phone);
    
    if (altPhone) {
        document.getElementById('reviewPhone').textContent += ` / ${formatPhone(altPhone)}`;
    }
    
    document.getElementById('reviewEmail').textContent = email || 'Not provided';
    document.getElementById('reviewInstagram').textContent = instagram ? `@${instagram}` : 'Not provided';
}

// Form Submission
document.getElementById('classForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateStep1() || !validateStep2()) {
        return;
    }
    
    if (!document.getElementById('consent').checked) {
        alert('Please agree to share your contact information');
        return;
    }
    
    // Prepare data
    const formData = {
        name: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim().replace(/\s/g, ''),
        altPhone: document.getElementById('altPhone').value.trim().replace(/\s/g, ''),
        email: document.getElementById('email').value.trim(),
        instagram: document.getElementById('instagram').value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Show loading
    document.getElementById('loading').style.display = 'flex';
    
    try {
        // Save to Google Sheets
        const saved = await saveToGoogleSheets(formData);
        
        if (saved) {
            // Also save to localStorage as backup
            saveToLocalStorage(formData);
            
            // Show success
            document.querySelector('.form-container').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            // Update stats
            loadStats();
            
            // Update directory button with password
            document.getElementById('viewDirectoryBtn').onclick = function(e) {
                e.preventDefault();
                const password = prompt('Enter admin password:');
                if (password === ADMINPASSWORD) {
                    window.open('admin.html', '_blank');
                } else {
                    alert('Incorrect password');
                }
            };
        } else {
            alert('Failed to save to Google Sheets. Please try again or use local storage.');
            saveToLocalStorage(formData);
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Saving locally instead.');
        saveToLocalStorage(formData);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

// Save to Google Sheets
async function saveToGoogleSheets(data) {
    try {
        console.log('Sending to Google Sheets:', data);
        
        // Add action parameter for Google Script
        const payload = {
            action: 'create',
            data: data
        };
        
        const response = await fetch(GOOGLESCRIPTURL, {
            method: 'POST',
            mode: 'no-cors', // Use no-cors for Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // With no-cors mode, we can't read the response
        // But the request should still go through
        console.log('Request sent to Google Sheets');
        return true;
        
    } catch (error) {
        console.error('Network error:', error.message);
        return false;
    }
}

// Save to Local Storage
function saveToLocalStorage(data) {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    entries.push(data);
    localStorage.setItem('classDirectory', JSON.stringify(entries));
    
    // Update daily stats
    const today = new Date().toDateString();
    let dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
    dailyStats[today] = (dailyStats[today] || 0) + 1;
    localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
    
    console.log('Saved to localStorage:', data);
}

// Load Stats
async function loadStats() {
    try {
        // Try to load from Google Sheets first
        const response = await fetch(`${GOOGLESCRIPTURL}?action=read`);
        if (response.ok) {
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                updateStatsFromGoogleSheets(result.data);
                return;
            }
        }
    } catch (error) {
        console.log('Using localStorage stats:', error.message);
    }
    
    // Fallback to localStorage
    updateStatsFromLocalStorage();
}

// Update Stats from Google Sheets
function updateStatsFromGoogleSheets(data) {
    if (!Array.isArray(data)) return;
    
    const total = data.length;
    const today = new Date().toDateString();
    const withEmail = data.filter(entry => entry.Email || entry.email).length;
    const withInsta = data.filter(entry => entry.Instagram || entry.instagram).length;
    
    // Update main page stats
    document.getElementById('totalMembers').textContent = total;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statWithEmail').textContent = withEmail;
    document.getElementById('statWithInsta').textContent = withInsta;
    
    // Calculate today's count
    const todayCount = data.filter(entry => {
        try {
            const entryDate = new Date(entry.Timestamp || entry.timestamp).toDateString();
            return entryDate === today;
        } catch (e) {
            return false;
        }
    }).length;
    
    document.getElementById('todayJoined').textContent = todayCount;
    
    // Update localStorage with Google Sheets data
    localStorage.setItem('classDirectory', JSON.stringify(data));
}

// Update Stats from Local Storage
function updateStatsFromLocalStorage() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    const total = entries.length;
    const today = new Date().toDateString();
    
    const withEmail = entries.filter(entry => entry.email).length;
    const withInsta = entries.filter(entry => entry.instagram).length;
    const todayCount = entries.filter(entry => {
        try {
            const entryDate = new Date(entry.timestamp).toDateString();
            return entryDate === today;
        } catch (e) {
            return false;
        }
    }).length;
    
    // Update all stat elements
    document.getElementById('totalMembers').textContent = total;
    document.getElementById('todayJoined').textContent = todayCount;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statWithEmail').textContent = withEmail;
    document.getElementById('statWithInsta').textContent = withInsta;
}

// Export Data
function exportData() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    if (entries.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Prepare CSV
    const headers = ['Name', 'Phone', 'Alt Phone', 'Email', 'Instagram', 'Timestamp'];
    const csvRows = [headers.join(',')];
    
    entries.forEach(entry => {
        const row = [
            `"${entry.name || ''}"`,
            `"${entry.phone || ''}"`,
            `"${entry.altPhone || ''}"`,
            `"${entry.email || ''}"`,
            `"${entry.instagram || ''}"`,
            `"${entry.timestamp || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `classmates_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Reset Form
function resetForm() {
    document.getElementById('classForm').reset();
    document.querySelector('.form-container').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    currentStep = 1;
    
    // Reset steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    
    // Reset progress steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.step:first-child').classList.add('active');
}

// Setup Form Validation Events
function setupFormValidation() {
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        e.target.value = value;
    });
    
    document.getElementById('altPhone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        e.target.value = value;
    });
}

// Setup Form Navigation
function setupFormNavigation() {
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.addEventListener('click', () => {
            if (index + 1 < currentStep) {
                prevStep(index + 1);
                
                // Update step visual indicators
                document.querySelectorAll('.step').forEach(s => {
                    s.classList.remove('active');
                });
                step.classList.add('active');
            }
        });
    });
}
[file content end]
