// script.js - UPDATED: Complete file with proper CORS handling
const GOOGLESCRIPTURL = 'https://script.google.com/macros/s/AKfycbzDRcAFDwzdd4pepyqPuWgpbaMTDQ_hIdqrINC5aDcQ37bkAn9r2fqy6RSonvyyN2K5/exec';
const ADMINPASSWORD = 'class2024';
const GOOGLESHEETURL = 'https://docs.google.com/spreadsheets/d/1ESTI04FQ8zrumvTYAZ-vlS446bCPsFcs1rjQrJeoc/edit';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupForm();
    updateViewDirectoryLinks();
});

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
            return false;
        }
        return true;
    }
    
    if (step === 2) {
        const phone = document.getElementById('phone').value.trim();
        if (!phone) {
            alert('Please enter your WhatsApp number');
            return false;
        }
        if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
            alert('Please enter a valid 10-digit phone number');
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
        document.getElementById('reviewPhone').textContent = 
            document.getElementById('phone').value || 'Not provided';
        document.getElementById('reviewEmail').textContent = 
            document.getElementById('email').value || 'Not provided';
        document.getElementById('reviewInstagram').textContent = 
            document.getElementById('instagram').value ? '@' + document.getElementById('instagram').value : 'Not provided';
    }
}

// Form setup
function setupForm() {
    const form = document.getElementById('classForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep(1) || !validateStep(2)) return;
        
        if (!document.getElementById('consent').checked) {
            alert('Please agree to share your contact information');
            return;
        }
        
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
            const success = await saveToGoogleSheets(formData);
            
            if (success) {
                // Also save to localStorage for offline access
                let localEntries = JSON.parse(localStorage.getItem('classDirectory')) || [];
                localEntries.push(formData);
                localStorage.setItem('classDirectory', JSON.stringify(localEntries));
                
                // Update daily stats
                const today = new Date().toDateString();
                let dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
                dailyStats[today] = (dailyStats[today] || 0) + 1;
                localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
                
                // Show success
                document.querySelector('.form-container form').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
                // Notify admin panel if open
                try {
                    window.opener?.postMessage({ type: 'NEW_ENTRY', data: formData }, '*');
                } catch (e) {
                    console.log('Could not notify admin panel');
                }
                
                // Update stats
                loadStats();
                
                // Update admin panel if it's in a popup
                const adminWindow = window.open('', 'AdminPanel');
                if (adminWindow) {
                    adminWindow.postMessage({ type: 'NEW_ENTRY', data: formData }, '*');
                }
                
            } else {
                alert('Failed to save to Google Sheets. Please try again or check your connection.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error saving data: ' + error.message);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    });
}

// UPDATED: Google Sheets save function
async function saveToGoogleSheets(data) {
    try {
        console.log('Sending to Google Sheets:', data);
        
        // Use formData approach for better compatibility
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('phone', data.phone);
        formData.append('altPhone', data.altPhone);
        formData.append('email', data.email);
        formData.append('instagram', data.instagram);
        formData.append('timestamp', data.timestamp);
        
        const response = await fetch(GOOGLESCRIPTURL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            body: formData
        });
        
        // With no-cors, we can't read the response
        // So we'll assume success if no network error
        console.log('Data sent to Google Sheets (no-cors mode)');
        return true;
        
    } catch (error) {
        console.error('Network error:', error.message);
        
        // Fallback: Use JSON with error handling
        try {
            const jsonResponse = await fetch(GOOGLESCRIPTURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            console.log('JSON fallback response status:', jsonResponse.status);
            return jsonResponse.ok;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return false;
        }
    }
}

// UPDATED: Load stats function
async function loadStats() {
    try {
        console.log('Loading stats from Google Sheets...');
        
        // Try to get data from Google Sheets
        // Use a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${GOOGLESCRIPTURL}?action=read&t=${timestamp}`);
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                updateStatsFromGoogleSheets(result.data);
                return;
            }
        }
        
        // Fallback to localStorage
        console.log('Using localStorage stats');
        updateStatsFromLocalStorage();
        
    } catch (error) {
        console.log('Error loading from Google, using localStorage:', error);
        updateStatsFromLocalStorage();
    }
}

function updateStatsFromGoogleSheets(data) {
    const total = data.length;
    const withEmail = data.filter(entry => entry.email && entry.email.trim()).length;
    const withInsta = data.filter(entry => entry.instagram && entry.instagram.trim()).length;
    const todayCount = data.filter(entry => {
        try {
            const entryDate = new Date(entry.timestamp || entry.submittedAt).toDateString();
            return entryDate === new Date().toDateString();
        } catch (e) {
            return false;
        }
    }).length;
    
    // Update all stat displays
    updateStatElements(total, todayCount, withEmail, withInsta);
}

function updateStatsFromLocalStorage() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
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
        adminLink.href = 'admin.html';
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
    }
}

function resetForm() {
    // Reset form
    document.getElementById('classForm').reset();
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

// Auto-refresh stats every 30 seconds
setInterval(loadStats, 30000);
