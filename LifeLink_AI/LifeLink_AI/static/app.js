// Local Database Simulation / Frontend Main Script
let appState = {
    currentUser: { name: "Arif", phone: "01800000000", blood: "O+", location: "Dhanmondi" },
    activeRequestsCount: 12,
    donors: [
        { name: "Riad Hasan", blood: "O+", phone: "01812-345678", location: "Dhanmondi", distance: "1.2 km" },
        { name: "Nusrat Jahan", blood: "O+", phone: "01711-987654", location: "Mirpur", distance: "2.5 km" },
        { name: "Saiful Islam", blood: "A+", phone: "01911-223344", location: "Uttara", distance: "3.1 km" },
        { name: "Tanvir Ahmed", blood: "B+", phone: "01511-556677", location: "Gulshan", distance: "4.2 km" },
        { name: "Ayesha Rahman", blood: "O-", phone: "01611-889900", location: "Dhanmondi", distance: "0.8 km" }
    ]
};

// 1. Navigation Function
function navigate(stepId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => section.classList.add('d-none'));

    const targetSection = document.getElementById(stepId);
    if (targetSection) {
        targetSection.classList.remove('d-none');
    }
}

// 2. Switch between Login and Register tabs
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('#authTabs .nav-link');

    if (tab === 'login') {
        if (loginForm) loginForm.classList.remove('d-none');
        if (regForm) regForm.classList.add('d-none');
        if (tabs[0]) tabs[0].classList.add('active');
        if (tabs[1]) tabs[1].classList.remove('active');
    } else {
        if (loginForm) loginForm.classList.add('d-none');
        if (regForm) regForm.classList.remove('d-none');
        if (tabs[0]) tabs[0].classList.remove('active');
        if (tabs[1]) tabs[1].classList.add('active');
    }
}

// 3. Handle User Login via Flask Backend
async function handleLogin() {
    const identifier = document.getElementById('login-phone')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    if (!identifier || !password) {
        alert("দয়া করে ফোন নম্বর এবং পাসওয়ার্ড দিন!");
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            appState.currentUser = result.user;
            updateUserUI();
            alert("লগইন সফল হয়েছে! 🎉");
            navigate('step3'); // Dashboard
        } else {
            alert("Error: " + (result.message || "লগইন ব্যর্থ হয়েছে!"));
        }
    } catch (err) {
        console.error("Network Error:", err);
        alert("সার্ভারে সংযোগ করতে সমস্যা হচ্ছে!");
    }
}

// 4. Handle New User Registration (Connected to MongoDB via Flask)
async function handleRegister() {
    const name = document.getElementById('reg-name')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const blood = document.getElementById('reg-blood')?.value;
    const location = document.getElementById('reg-location')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();

    if (!name || !phone || !location || !password) {
        alert("সবগুলো ফিল্ড (পাসওয়ার্ডসহ) সঠিকভাবে পূরণ করো!");
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, blood, location, password, distance: 1.5 })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            alert("Database Updated Successfully! 🎉");
            appState.currentUser = result.donor;
            
            const reqLoc = document.getElementById('req-location');
            const reqBlood = document.getElementById('req-blood-group');
            if (reqLoc) reqLoc.value = location;
            if (reqBlood) reqBlood.value = blood;

            updateUserUI();
            navigate('step3'); // Dashboard
        } else {
            alert("Error: " + (result.message || "রেজিস্ট্রেশন করা যায়নি!"));
        }
    } catch (err) {
        console.error("Network Error:", err);
        alert("সার্ভারে সংযোগ করতে সমস্যা হচ্ছে!");
    }
}

// Update UI with User Details
function updateUserUI() {
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) {
        nameDisplay.innerText = `Hello, ${appState.currentUser.name} 👋`;
    }
}

// 5. Handle Blood Request
async function handleBloodRequest() {
    const bloodGroup = document.getElementById('req-blood-group')?.value;
    const units = document.getElementById('req-units')?.value;
    const location = document.getElementById('req-location')?.value.trim();

    if (!location) {
        alert("দয়া করে লোকেশন লিখুন!");
        return;
    }

    try {
        const response = await fetch('/api/request-blood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blood_group: bloodGroup, units, location })
        });

        const data = await response.json();

        appState.activeRequestsCount++;
        const dashReq = document.getElementById('dash-active-requests');
        const landReq = document.getElementById('landing-req-count');
        if (dashReq) dashReq.innerText = appState.activeRequestsCount;
        if (landReq) landReq.innerText = appState.activeRequestsCount;

        const matchedDonors = data.matched_donors || [];
        renderMatchingResults(matchedDonors, bloodGroup, location, units);
        navigate('step5');
    } catch (err) {
        console.error("Error fetching blood requests:", err);
        alert("ব্লাড রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে!");
    }
}

// Render AI Matched Donors
function renderMatchingResults(donors, bloodGroup, userLoc, units) {
    const container = document.getElementById('step5')?.querySelector('.container');
    if (!container) return;
    
    let html = `
        <h3 class="fw-bold">Matching Donors Found</h3>
        <p class="text-success"><i class="fa-solid fa-robot"></i> AI matched ${donors.length} donors for <strong>${units} Unit(s) of ${bloodGroup}</strong> near <strong>${userLoc}</strong> (Requested by ${appState.currentUser.name})</p>
    `;

    if (donors.length === 0) {
        html += `<div class="alert alert-warning p-3">No exact donor match for group ${bloodGroup} in your area. Contacting nearby emergency blood banks...</div>`;
    } else {
        donors.forEach((donor, index) => {
            html += `
                <div class="card p-3 shadow-sm mb-3 ${index === 0 ? 'border-success border-2' : ''}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0 fw-bold">${donor.name} ${index === 0 ? '<span class="badge bg-success ms-2">Best Match</span>' : ''}</h5>
                            <small class="text-muted">${donor.distance} km away • Area: ${donor.location} • Group: ${donor.blood}</small>
                        </div>
                        <button class="btn btn-outline-danger" onclick="showDonorDetails('${donor.name}', '${donor.blood}', '${donor.phone}', '${donor.distance}')">Contact</button>
                    </div>
                </div>
            `;
        });
    }

    html += `<button class="btn btn-secondary mt-3" onclick="navigate('step3')">Back to Dashboard</button>`;
    container.innerHTML = html;
}

// Show Specific Donor Profile (Step 6)
function showDonorDetails(name, blood, phone, distance) {
    const container = document.getElementById('step6')?.querySelector('.container');
    if (!container) return;

    container.innerHTML = `
        <div class="mt-5 d-flex justify-content-center">
            <div class="card p-4 shadow-sm" style="width: 400px; border-radius: 15px;">
                <div class="text-center mb-3">
                    <div class="bg-danger text-white rounded-circle d-inline-block p-4"><i class="fa-solid fa-user fa-2x"></i></div>
                    <h4 class="mt-2 fw-bold">${name}</h4>
                    <span class="badge bg-success">Available Now</span>
                </div>
                <ul class="list-group list-group-flush mb-4">
                    <ul class="list-group list-group-flush mb-4">
                    <li class="list-group-item d-flex justify-content-between"><span>Blood Group</span><strong>${blood}</strong></li>
                    <li class="list-group-item d-flex justify-content-between"><span>Distance</span><strong>${distance} km</strong></li>
                    <li class="list-group-item d-flex justify-content-between"><span>Phone</span><strong>${phone}</strong></li>
                </ul>
                <div class="d-flex gap-2">
                    <a href="tel:${phone}" class="btn btn-danger w-50"><i class="fa-solid fa-phone"></i> Call Donor</a>
                    <button class="btn btn-secondary w-50" onclick="navigate('step3')">Dashboard</button>
                </div>
            </div>
        </div>
    `;
    navigate('step6');
}

// Live Map Integration
function openGoogleMaps(query) {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
}

// 6. GEMINI AI INTEGRATION THROUGH FLASK BACKEND
async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    if (!inputField || !chatBox) return;

    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'mb-3 text-end';
    userDiv.textContent = userMessage;
    chatBox.appendChild(userDiv);

    inputField.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        const aiDiv = document.createElement('div');
        aiDiv.className = 'mb-3';
        aiDiv.textContent = data.reply || 'কোনো উত্তর পাওয়া যায়নি।';
        chatBox.appendChild(aiDiv);
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mb-3 text-danger';
        errorDiv.textContent = 'AI service-এর সঙ্গে যোগাযোগ করা যায়নি।';
        chatBox.appendChild(errorDiv);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
