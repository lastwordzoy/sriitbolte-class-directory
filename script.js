// Configuration - USE YOUR NEW SCRIPT URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrEMMt6g-39pTAUeJhJnZdfzM7s5A4kI8trsm7yezVwBfkTQzGnJxDpLbxhPwc0zpX/exec';
const ADMIN_PASSWORD = 'class2024';
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ESTI04FQ8zrumvTYAZ-vlS446bCP_sF_cs1rjQrJeoc/edit';

// Current step
let currentStep = 1;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    loadStats();
    setupViewDirectoryBtn();
    setInterval(loadStats, 30000);
});

function initApp() {
    // Setup event listeners
    setupFormSubmission();
    setupLivePreview();
    setupAdminLink();
    setupSheetLink();
    
    // Show first step
    showStep(1);
}

// Setup Google Sheet link
function setupSheetLink() {
    const sheetLink = document.getElementById('viewSheetLink');
    if (sheetLink) {
        sheetLink.href = GOOGLE_SHEET_URL;
    }
}

// Setup view directory button in success message
function setupViewDirectoryBtn() {
    const viewDirBtn = document.getElementById('viewDirectoryBtn');
    if (viewDirBtn) {
        viewDirBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === ADMIN_PASSWORD) {
                window.location.href = 'admin.html';
            } else {
                alert('Incorrect password');
            }
        });
    }
}

// Step navigation
function nextStep(step) {
    if (validateStep(currentStep)) {
        showStep(step);
    }
}

function prevStep(step) {
    showStep(step);
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show current step
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
        stepEl.classList.add('active');
    }
    
    // Update steps indicator
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) <= step);
    });
    
    currentStep = step;
    
    // Update review when showing step 3
    if (step === 3) {
        updateReview();
    }
}

function validateStep(step) {
    switch(step) {
        case 1:
            const name = document.getElementById('fullName')?.value.trim();
            if (!name) {
                alert('Please enter your full name');
                return false;
            }
            return true;
            
        case 2:
            const phone = document.getElementById('phone')?.value.trim();
            if (!phone) {
                alert('Please enter your WhatsApp number');
                return false;
            }
            
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                alert('Please enter a valid 10-digit Indian number');
                return false;
            }
            return true;
            
        case 3:
            const consent = document.getElementById('consent')?.checked;
            if (!consent) {
                alert('Please agree to share your information');
                return false;
            }
            return true;
    }
    return true;
}

// Live preview
function setupLivePreview() {
    const inputs = ['fullName', 'phone', 'instagram', 'email', 'altPhone'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateReview);
        }
    });
}

function updateReview() {
    const name = document.getElementById('fullName')?.value.trim() || 'Your Name';
    const phone = document.getElementById('phone')?.value.trim();
    const altPhone = document.getElementById('altPhone')?.value.trim();
    const instagram = document.getElementById('instagram')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    
    const reviewName = document.getElementById('reviewName');
    const reviewPhone = document.getElementById('reviewPhone');
    const reviewInstagram = document.getElementById('reviewInstagram');
    const reviewEmail = document.getElementById('reviewEmail');
    
    if (reviewName) reviewName.textContent = name;
    
    if (reviewPhone) {
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            reviewPhone.textContent = `+91 ${cleanPhone}`;
            if (altPhone) {
                const cleanAltPhone = altPhone.replace(/\D/g, '');
                reviewPhone.textContent += ` / +91 ${cleanAltPhone}`;
            }
        } else {
            reviewPhone.textContent = 'Not provided';
        }
    }
    
    if (reviewInstagram) reviewInstagram.textContent = instagram ? `@${instagram}` : 'Not provided';
    if (reviewEmail) reviewEmail.textContent = email || 'Not provided';
}

// Form submission - SIMPLIFIED AND WORKING VERSION
function setupFormSubmission() {
    const form = document.getElementById('classForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep(3)) return;
        
        showLoading(true);
        
        try {
            // Get form data
            const formData = {
                name: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim().replace(/\D/g, ''),
                altPhone: document.getElementById('altPhone').value.trim() ? 
                    document.getElementById('altPhone').value.trim().replace(/\D/g, '') : '',
                email: document.getElementById('email').value.trim(),
                instagram: document.getElementById('instagram').value.trim(),
                hasPhoto: false,
                submittedAt: new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            
            console.log('📤 Sending data to Google:', formData);
            
            // Try to save to Google Sheets
            const googleSaved = await saveToGoogleSheets(formData);
            
            if (googleSaved) {
                // Save to localStorage as backup
                const localStorageSaved = saveToLocalStorage(formData);
                
                // Show success
                document.getElementById('classForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
                // Update stats
                loadStats();
                updateLiveStats();
                
                console.log('✅ Profile submitted successfully!');
                
                // Notify admin panel if open
                if (typeof window.parent !== 'undefined' && window.parent !== window) {
                    try {
                        window.parent.postMessage({ type: 'NEW_ENTRY', data: formData }, '*');
                    } catch (e) {
                        console.log('Could not notify parent window');
                    }
                }
            } else {
                // Google Sheets failed, try localStorage only
                const localStorageSaved = saveToLocalStorage(formData);
                
                if (localStorageSaved) {
                    // Show success but mention it's local only
                    document.getElementById('classForm').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                    document.querySelector('#successMessage p').textContent = 
                        'Your information has been saved locally. Could not connect to Google Sheets.';
                    
                    updateStatsFromLocalStorage();
                    updateLiveStats();
                    
                    console.log('💾 Saved to localStorage only');
                } else {
                    alert('⚠️ This entry already exists!');
                }
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ An unexpected error occurred. Please try again.');
        } finally {
            showLoading(false);
        }
    });
}

// Save to Google Sheets - UPDATED FOR YOUR SCRIPT
async function saveToGoogleSheets(data) {
    try {
        console.log('📤 Sending to Google Sheets:', data);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📥 Response from Google:', result);
        
        if (result.success) {
            console.log('✅ Successfully saved to Google Sheets');
            return true;
        } else {
            console.error('❌ Google Sheets error:', result.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return false;
    }
}

// LocalStorage backup
function saveToLocalStorage(data) {
    try {
        let entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
        
        // Add ID and timestamp
        const entryWithId = {
            ...data,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        };
        
        // Check for duplicates (by phone or email)
        const isDuplicate = entries.some(entry => 
            entry.phone === data.phone || 
            (entry.email && data.email && entry.email === data.email)
        );
        
        if (!isDuplicate) {
            entries.push(entryWithId);
            localStorage.setItem('classDirectory', JSON.stringify(entries));
            
            // Update daily stats
            const today = new Date().toDateString();
            let dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
            dailyStats[today] = (dailyStats[today] || 0) + 1;
            localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
            
            console.log('💾 Saved to localStorage:', entryWithId);
            return true;
        } else {
            console.log('⚠️ Duplicate entry found');
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
        return false;
    }
}

// Load stats
async function loadStats() {
    try {
        console.log('📊 Loading stats from Google Sheets...');
        const response = await fetch(GOOGLE_SCRIPT_URL + '?read=true');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data)) {
            updateStatsFromGoogleSheets(result.data);
        } else {
            updateStatsFromLocalStorage();
        }
        
    } catch (error) {
        console.log('📊 Using localStorage stats');
        updateStatsFromLocalStorage();
    }
}

function updateStatsFromGoogleSheets(data) {
    const total = data.length;
    const withEmail = data.filter(item => 
        (item.Email && item.Email.trim()) || 
        (item.email && item.email.trim())
    ).length;
    const withInsta = data.filter(item => 
        (item.Instagram && item.Instagram.trim()) || 
        (item.instagram && item.instagram.trim())
    ).length;
    
    updateStatDisplay(total, withEmail, withInsta);
}

function updateStatsFromLocalStorage() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    const total = entries.length;
    const withEmail = entries.filter(item => item.email && item.email.trim()).length;
    const withInsta = entries.filter(item => item.instagram && item.instagram.trim()).length;
    
    updateStatDisplay(total, withEmail, withInsta);
}

function updateStatDisplay(total, withEmail, withInsta) {
    const totalElement = document.getElementById('totalMembers');
    const statTotalElement = document.getElementById('statTotal');
    const statWithEmailElement = document.getElementById('statWithEmail');
    const statWithInstaElement = document.getElementById('statWithInsta');
    
    if (totalElement) totalElement.textContent = total;
    if (statTotalElement) statTotalElement.textContent = total;
    if (statWithEmailElement) statWithEmailElement.textContent = withEmail;
    if (statWithInstaElement) statWithInstaElement.textContent = withInsta;
    
    const today = new Date().toDateString();
    const dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
    const todayJoinedElement = document.getElementById('todayJoined');
    if (todayJoinedElement) {
        todayJoinedElement.textContent = dailyStats[today] || 0;
    }
}

// Admin link
function setupAdminLink() {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            const password = prompt('Enter admin password:');
            if (password === ADMIN_PASSWORD) {
                window.location.href = 'admin.html';
            } else {
                alert('Incorrect password');
            }
        });
    }
}

// Export data
function exportData() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    if (entries.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = ['Name', 'Phone', 'Alt Phone', 'Email', 'Instagram', 'Date Added'];
    const csvRows = [headers.join(',')];
    
    entries.forEach(entry => {
        const row = [
            `"${entry.name || ''}"`,
            `"${entry.phone || ''}"`,
            `"${entry.altPhone || ''}"`,
            `"${entry.email || ''}"`,
            `"${entry.instagram || ''}"`,
            `"${entry.submittedAt || entry.timestamp || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `classmates_directory_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Exported ${entries.length} entries successfully!`);
}

// Reset form
function resetForm() {
    document.getElementById('classForm').reset();
    document.getElementById('classForm').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    updateReview();
    showStep(1);
}

// Loading overlay
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Update live stats
function updateLiveStats() {
    const entries = JSON.parse(localStorage.getItem('classDirectory')) || [];
    const totalElement = document.getElementById('totalMembers');
    const todayJoinedElement = document.getElementById('todayJoined');
    
    if (totalElement) totalElement.textContent = entries.length;
    
    if (todayJoinedElement) {
        const today = new Date().toDateString();
        const dailyStats = JSON.parse(localStorage.getItem('dailyStats')) || {};
        todayJoinedElement.textContent = dailyStats[today] || 0;
    }
}

// Listen for messages from admin panel
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'RELOAD_STATS') {
        loadStats();
    }
});