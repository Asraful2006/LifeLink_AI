// Navigation between views
function navigate(stepId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => section.classList.add('d-none'));
    
    const targetSection = document.getElementById(stepId);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        window.scrollTo(0, 0);
    }
}

// Switch between Login and Register tabs
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('#authTabs .nav-link');

    if (tab === 'login') {
        if (loginForm) loginForm.classList.remove('d-none');
        if (registerForm) registerForm.classList.add('d-none');
        if (tabs[0]) tabs[0].classList.add('active');
        if (tabs[1]) tabs[1].classList.remove('active');
    } else {
        if (loginForm) loginForm.classList.add('d-none');
        if (registerForm) registerForm.classList.remove('d-none');
        if (tabs[0]) tabs[0].classList.remove('active');
        if (tabs[1]) tabs[1].classList.add('active');
    }
}

// ---------------- Handle Donor Registration ----------------
async function handleRegister() {
    const name = document.getElementById('reg-name')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const blood = document.getElementById('reg-blood')?.value;
    const location = document.getElementById('reg-location')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();

    if (!name || !phone || !blood || !location || !password) {
        alert("দয়া করে পাসওয়ার্ডসহ সকল ঘর পূরণ করুন!");
        return;
    }

    try {
        const response = await fetch('/api/donor/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                phone, 
                blood, 
                location, 
                password,
                distance: 1.2 // Default distance for BST
            })
        });

        const data = await response.json();

        if (data.status === 'success' || data.success) {
            alert("🎉 একাউন্ট সফলভাবে তৈরি হয়েছে এবং ডাটাবেসে সেভ হয়েছে!");
            const userDisplay = document.getElementById('user-display-name');
            if (userDisplay) userDisplay.innerText = `Hello, ${name} 👋`;
            
            // Clear inputs
            if (document.getElementById('reg-name')) document.getElementById('reg-name').value = '';
            if (document.getElementById('reg-phone')) document.getElementById('reg-phone').value = '';
            if (document.getElementById('reg-location')) document.getElementById('reg-location').value = '';
            if (document.getElementById('reg-password')) document.getElementById('reg-password').value = '';

            navigate('step3'); // Dashboard
        } else {
            alert("❌ " + (data.message || "Registration failed"));
        }
    } catch (error) {
        console.error("Registration Error:", error);
        alert("সার্ভারে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
}

// ---------------- Handle Login ----------------
async function handleLogin() {
    const phone = document.getElementById('login-phone')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    if (!phone || !password) {
        alert("দয়া করে ফোন নাম্বার ও পাসওয়ার্ড দিন!");
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: phone, password })
        });

        const data = await response.json();

        if (data.status === 'success' || data.success) {
            alert("🎉 সফলভাবে লগইন হয়েছে!");
            const userName = data.user?.name || "User";
            const userDisplay = document.getElementById('user-display-name');
            if (userDisplay) userDisplay.innerText = `Hello, ${userName} 👋`;
            
            if (document.getElementById('login-phone')) document.getElementById('login-phone').value = '';
            if (document.getElementById('login-password')) document.getElementById('login-password').value = '';

            navigate('step3'); // Dashboard
        } else {
            alert("❌ " + (data.message || "Login failed"));
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("সার্ভারে সমস্যা হয়েছে!");
    }
}

// ---------------- Handle Blood Request (Uses Backend BST Sorting) ----------------
async function handleBloodRequest() {
    const bloodGroup = document.getElementById('req-blood-group')?.value;
    const location = document.getElementById('req-location')?.value || "Current Location";

    try {
        const response = await fetch('/api/request-blood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blood_group: bloodGroup })
        });

        const data = await response.json();

        const resultsContainer = document.getElementById('matching-results-container');
        if (!resultsContainer) return;

        if (data.status === 'success' && data.matched_donors.length > 0) {
            let donorsHTML = data.matched_donors.map(donor => `
                <div class="list-group-item d-flex justify-content-between align-items-center p-3 mb-2 shadow-sm rounded">
                    <div>
                        <h5 class="mb-1 fw-bold">${donor.name}</h5>
                        <p class="mb-0 text-muted small">
                            <i class="fa-solid fa-location-dot text-danger"></i> ${donor.location} (${donor.distance || 1.0} km away)
                        </p>
                        <span class="badge bg-danger mt-1">${donor.blood}</span>
                    </div>
                    <a href="tel:${donor.phone}" class="btn btn-outline-danger btn-sm">
                        <i class="fa-solid fa-phone me-1"></i> Contact
                    </a>
                </div>
            `).join('');

            resultsContainer.innerHTML = `
                <div class="card p-4 shadow-sm border-0 text-center">
                    <h3 class="text-danger fw-bold mb-3"><i class="fa-solid fa-brain"></i> BST Sorted Active Donors Found!</h3>
                    <p class="text-muted">Total Donors Found: <strong>${data.count}</strong> for Group <strong>${bloodGroup}</strong></p>
                    <div class="list-group mt-3 text-start">
                        ${donorsHTML}
                    </div>
                    <button class="btn btn-secondary mt-4" onclick="navigate('step3')">Back to Dashboard</button>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="card p-4 shadow-sm border-0 text-center">
                    <h3 class="text-muted mb-3"><i class="fa-solid fa-circle-exclamation text-warning"></i> No Donors Found</h3>
                    <p>Currently no donors available for group <strong>${bloodGroup}</strong>.</p>
                    <button class="btn btn-secondary mt-3" onclick="navigate('step3')">Back to Dashboard</button>
                </div>
            `;
        }
        navigate('step5');

    } catch (error) {
        console.error("Blood Request Error:", error);
        alert("ডাটা পেতে সমস্যা হয়েছে!");
    }
}

// ---------------- LIVE GEMINI AI CHAT INTEGRATION ----------------
async function sendMessage() {
    const input = document.getElementById('user-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;

    const chatBox = document.getElementById('chat-box');

    // 1. Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'mb-3 text-end';
    userDiv.innerHTML = `<div class="bg-danger text-white p-3 rounded shadow-sm d-inline-block">${message}</div>`;
    chatBox.appendChild(userDiv);

    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // 2. Typing Indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'mb-3';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `<div class="bg-light p-2 rounded d-inline-block text-muted"><i class="fa-solid fa-robot text-danger me-1"></i> LifeLink AI Thinking...</div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 3. Send to Gemini API Backend
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();

        const botReply = data.reply || "Sorry, I couldn't process your query right now.";

        const botDiv = document.createElement('div');
        botDiv.className = 'mb-3';
        botDiv.innerHTML = `<div class="bg-white p-3 rounded shadow-sm d-inline-block border text-dark"><i class="fa-solid fa-robot text-danger me-1"></i> ${botReply}</div>`;
        chatBox.appendChild(botDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Gemini AI Error:", error);
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'mb-3';
        errorDiv.innerHTML = `<div class="bg-white p-3 rounded shadow-sm d-inline-block border text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> Connection error with Gemini AI.</div>`;
        chatBox.appendChild(errorDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
