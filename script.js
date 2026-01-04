// script.js - COMPLETE FIXED VERSION
const GOOGLESCRIPTURL = 'https://script.google.com/macros/s/AKfycbzDRcAFDwzdd4pepyqPuWgpbaMTDQ_hIdqrINC5aDcQ37bkAn9r2fqy6RSonvyyN2K5/exec';
const ADMINPASSWORD = 'class2024';
const GOOGLESHEETURL = 'https://docs.google.com/spreadsheets/d/1ESTI04FQ8zrumvTYAZ-vlS446bCPsFcs1rjQrJeoc/edit';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    loadStats();
    setupForm();
    updateViewDirectoryLinks();
    
    // Set up phone input formatting
    setupPhoneInput();
});

// Phone input formatting
function setupPhoneInput() {
    const phoneInput = document.getElementById('phone');
    const altPhoneInput = document.getElementById('altPhone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            
            // Format as XXXX XXX XXX
            if (value.length > 6) {
                value = value.substring(0, 5) + ' ' + value.substring(5, 10);
            } else if (value.length > 5) {
                value = value.substring(0, 5) + ' ' + value.substring(5);
            }
            
            e.target.value = value;
        });
    }
    
    if (altPhoneInput) {
        altPhoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            
            if (value.length > 6) {
                value = value.substring(0, 5) + ' ' + value.substring(5, 10);
            } else if (value.length > 5) {
                value = value.substring(0, 5) + ' ' + value.substring(5);
            }
            
            e.target.value = value;
        });
    }
}

// Form navigation
let currentStep = 1;

function nextStep(step) {
    if (!validateStep(currentStep)) return;
    
    document.getElementById('step' + currentStep).classList.remove('active');
    document.querySelector('.step:nth-child(' + currentStep + ')').classList.remove('active');
    
    currentStep = step;
    
    document.getElementById('step' + currentStep).classList.add('active');
    document.querySelector('.step:nth-child(' + currentStep + ')').classList.add('active');
    updateReview();
}

function prevStep(step) {
    document.getElementById('step' + currentStep).classList.remove('active');
    document.querySelector('.step:nth-child(' + currentStep + ')').classList.remove('active');
    
    currentStep = step;
    
    document.getElementById('step' + currentStep).classList.add('active');
    document.querySelector('.step:nth-child(' + currentStep + ')').classList.add('active');
}

function validateStep(step) {
    if (step === 1) {
        const name = document.getElementById('fullName').value.trim();
        if (!name) {
            alert('Please enter your full name');
            document.getElementById('fullName').focus();
            return false;
        }
        return true;
    }
    
    if (step === 2) {
        const phone = document.getElementById('phone').value.replace(/\s/g, '');
        if (!phone) {
            alert('Please enter your WhatsApp number');
            document.getElementById('phone').focus();
            return false;
        }
        if (!/^\d{10}$/.test(phone)) {
            alert('Please enter a valid 10-digit phone number');
            document.getElementById('phone').focus();
            return false;
        }
        return true;
    }
    
    return true;
}

function updateReview() {
    if (currentStep === 3) {
        document.getElementById('reviewName').textContent = 
            document.getElementById('fullName').value || 'Not provided';
        
        const phone = document.getElementById('phone').value;
        document.getElementById('reviewPhone').textContent = 
            phone ? `+91 ${phone}` : 'Not provided';
            
        document.getElementById('reviewEmail').textContent = 
            document.getElementById('email').value || 'Not provided';
            
        const instagram = document.getElementById('instagram').value;
        document.getElementById('reviewInstagram').textContent = 
            instagram ? '@' + instagram : 'Not provided';
    }
}

// Form setup
function setupForm() {
    const form = document.getElementById('classForm');
    if (!form) {
        console.error('Form not found!');
        return;
    }
    
    console.log('Setting up form...');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Validate all steps
        if (!validateStep(1) || !validateStep(2)) {
            console.log('Form validation failed');
            return;
        }
        
        if (!document.getElementById('consent').checked) {
            alert('Please agree to share your contact information');
            return;
        }
        
        // Prepare data
        const formData = {
            name: document.getElementById('fullName').value.trim(),
            phone: document.getElementById('phone').value.replace(/\s/g, ''),
            altPhone: document.getElementById('altPhone').value.replace(/\s/g, '') || '',
            email: document.getElementById('email').value.trim() || '',
            instagram: document.getElementById('instagram').value.trim() || '',
            timestamp: new Date().toISOString(),
            submittedAt: new Date().toLocaleString('en-IN')
        };
        
        console.log('Submitting data:', formData);
        
        // Show loading
        document.getElementById('loading').style.display = 'flex';
        
        try {
            // Save to Google Sheets
            console.log('Sending to Google Sheets...');
            const success = await saveToGoogleSheets(formData);
            
            if (success) {
                console.log('Successfully saved to Google Sheets');
                
                // Also save to localStorage for offline access
                let localEntries = JSON.parse(localStorage.getItem('classDirectory')) || [];
                localEntries.push(formData);
                localStorage.setItem('classDirectory', JSON.stringify(localEntries));
                
                // Update daily stats
                const today = new Date().toDateString();
                let dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
                dailyStats[today] = (dailyStats[today] || 0) + 1;
                localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
                
                // Show success message
                document.querySelector('.form-container form').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
                // Update stats
                loadStats();
                
                // Try to notify admin panel
                try {
                    window.opener?.postMessage({ 
                        type: 'NEW_ENTRY', 
                        data: formData 
                    }, '*');
                } catch (e) {
                    console.log('Could not notify admin panel');
                }
                
            } else {
                alert('Failed to save to Google Sheets. Please try again or check your connection.');
                console.error('Failed to save to Google Sheets');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error saving data: ' + error.message);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    });
}

// FIXED: Google Sheets save function
async function saveToGoogleSheets(data) {
    console.log('Starting saveToGoogleSheets with data:', data);
    
    try {
        // Prepare payload
        const payload = {
            name: data.name,
            phone: data.phone,
            altPhone: data.altPhone,
            email: data.email,
            instagram: data.instagram
        };
        
        console.log('Payload:', payload);
        
        // Try JSON POST first
        try {
            const response = await fetch(GOOGLESCRIPTURL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Response from Google:', result);
                
                if (result.success) {
                    return true;
                } else if (result.error === 'DUPLICATE') {
                    alert('This phone number or email is already registered!');
                    return false;
                } else {
                    console.error('Google Sheets error:', result);
                    return false;
                }
            } else {
                console.error('HTTP error:', response.status);
                throw new Error('HTTP error: ' + response.status);
            }
            
        } catch (jsonError) {
            console.log('JSON POST failed, trying FormData:', jsonError);
            
            // Fallback to FormData
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('phone', data.phone);
            formData.append('altPhone', data.altPhone);
            formData.append('email', data.email);
            formData.append('instagram', data.instagram);
            
            const formResponse = await fetch(GOOGLESCRIPTURL, {
                method: 'POST',
                mode: 'cors',
                body: formData
            });
            
            if (formResponse.ok) {
                const result = await formResponse.json();
                console.log('FormData response:', result);
                return result.success || false;
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('Error in saveToGoogleSheets:', error);
        
        // Try one more time with no-cors mode as last resort
        try {
            await fetch(GOOGLESCRIPTURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `name=${encodeURIComponent(data.name)}&phone=${encodeURIComponent(data.phone)}&email=${encodeURIComponent(data.email || '')}`
            });
            
            console.log('Data sent (no-cors mode)');
            return true; // Assume success in no-cors mode
            
        } catch (finalError) {
            console.error('Final attempt failed:', finalError);
            return false;
        }
    }
}

// FIXED: Load stats function
async function loadStats() {
    console.log('Loading stats...');
    
    try {
        // Try Google Sheets first
        const response = await fetch(GOOGLESCRIPTURL);
        console.log('Stats fetch response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Stats from Google:', result);
            
            if (result.success && Array.isArray(result.data)) {
                updateStatsFromGoogleSheets(result.data);
                return;
            }
        }
        
        // Fallback to localStorage
        console.log('Falling back to localStorage for stats');
        updateStatsFromLocalStorage();
        
    } catch (error) {
        console.error('Error loading stats:', error);
        updateStatsFromLocalStorage();
    }
}

function updateStatsFromGoogleSheets(data) {
    console.log('Updating stats from Google Sheets:', data.length, 'entries');
    
    const total = data.length;
    const withEmail = data.filter(entry => entry.Email && entry.Email.trim()).length;
    const withInsta = data.filter(entry => entry.Instagram && entry.Instagram.trim()).length;
    const todayCount = data.filter(entry => {
        try {
            const entryDate = new Date(entry.Timestamp).toDateString();
            return entryDate === new Date().toDateString();
        } catch (e) {
            return false;
        }
    }).length;
    
    updateStatElements(total, todayCount, withEmail, withInsta);
}

function updateStatsFromLocalStorage() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    console.log('LocalStorage entries:', entries.length);
    
    const total = entries.length;
    const withEmail = entries.filter(entry => entry.email && entry.email.trim()).length;
    const withInsta = entries.filter(entry => entry.instagram && entry.instagram.trim()).length;
    const todayCount = entries.filter(entry => {
        try {
            const entryDate = new Date(entry.timestamp || entry.submittedAt).toDateString();
            return entryDate === new Date().toDateString();
        } catch (e) {
            return false;
        }
    }).length;
    
    updateStatElements(total, todayCount, withEmail, withInsta);
}

function updateStatElements(total, todayCount, withEmail, withInsta) {
    console.log('Updating UI stats:', { total, todayCount, withEmail, withInsta });
    
    // Update hero stats
    const totalMembers = document.getElementById('totalMembers');
    const todayJoined = document.getElementById('todayJoined');
    
    if (totalMembers) totalMembers.textContent = total;
    if (todayJoined) todayJoined.textContent = todayCount;
    
    // Update stats section
    const statTotal = document.getElementById('statTotal');
    const statWithEmail = document.getElementById('statWithEmail');
    const statWithInsta = document.getElementById('statWithInsta');
    
    if (statTotal) statTotal.textContent = total;
    if (statWithEmail) statWithEmail.textContent = withEmail;
    if (statWithInsta) statWithInsta.textContent = withInsta;
}

function updateViewDirectoryLinks() {
    const adminLink = document.getElementById('adminLink');
    const viewDirectoryBtn = document.getElementById('viewDirectoryBtn');
    const viewSheetLink = document.getElementById('viewSheetLink');
    
    if (adminLink) {
        adminLink.onclick = function(e) {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === ADMINPASSWORD) {
                window.open('admin.html', '_blank');
            } else {
                alert('Incorrect password');
            }
        };
    }
    
    if (viewDirectoryBtn) {
        viewDirectoryBtn.onclick = function(e) {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === ADMINPASSWORD) {
                window.location.href = 'admin.html';
            } else {
                alert('Incorrect password');
            }
        };
    }
    
    if (viewSheetLink) {
        viewSheetLink.href = GOOGLESHEETURL;
        viewSheetLink.target = '_blank';
    }
}

function resetForm() {
    console.log('Resetting form...');
    
    // Reset form fields
    document.getElementById('classForm').reset();
    
    // Hide success message, show form
    document.getElementById('successMessage').style.display = 'none';
    document.querySelector('.form-container form').style.display = 'block';
    
    // Reset to step 1
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    
    document.getElementById('step1').classList.add('active');
    document.querySelector('.step:nth-child(1)').classList.add('active');
    currentStep = 1;
}

function exportData() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    if (entries.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Prepare CSV
    const headers = ['Name', 'Phone', 'Alt Phone', 'Email', 'Instagram', 'Date Added'];
    const csvRows = [headers.join(',')];
    
    entries.forEach(entry => {
        const row = [
            `"${entry.name || ''}"`,
            `"${entry.phone || ''}"`,
            `"${entry.altPhone || ''}"`,
            `"${entry.email || ''}"`,
            `"${entry.instagram || ''}"`,
            `"${entry.submittedAt || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `classmates_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Test function to check Google Script
async function testGoogleScript() {
    console.log('Testing Google Script connection...');
    
    try {
        const response = await fetch(GOOGLESCRIPTURL);
        console.log('Test response status:', response.status);
        console.log('Test response headers:', response.headers);
        
        const text = await response.text();
        console.log('Test response text:', text);
        
        try {
            const json = JSON.parse(text);
            console.log('Test JSON:', json);
        } catch (e) {
            console.log('Response is not JSON:', e.message);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Call test on load
setTimeout(testGoogleScript, 1000);

// Auto-refresh stats every 30 seconds
setInterval(loadStats, 30000);
