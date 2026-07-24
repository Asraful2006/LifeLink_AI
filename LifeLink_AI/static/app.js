// Local Database Simulation
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
        loginForm.classList.remove('d-none');
        regForm.classList.add('d-none');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.add('d-none');
        regForm.classList.remove('d-none');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// 3. Handle User Login
function handleLogin() {
    appState.currentUser.name = "Arif";
    updateUserUI();
    navigate('step3');
}

// 4. Handle New User Registration
async function handleRegister() {
    const name = document.getElementById("reg-name").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const blood = document.getElementById("reg-blood").value;
    const location = document.getElementById("reg-location").value.trim();

    if (!name || !phone || !blood || !location) {
        alert("Please complete all required fields.");
        return;
    }

    try {
        const response = await fetch("/api/donor/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                blood: blood,
                location: location,
                distance: 1.5
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed");
        }

        document.getElementById("user-display-name").textContent =
            `Hello, ${name} 👋`;

        alert("Donor registered successfully!");
        navigate("step3");

    } catch (error) {
        console.error("Registration error:", error);
        alert(error.message || "Registration failed. Please try again.");
    }
}

// 5. Handle Blood Request
function handleBloodRequest() {
    const bloodGroup = document.getElementById('req-blood-group').value;
    const units = document.getElementById('req-units').value;
    const location = document.getElementById('req-location').value.trim();

    if (!location) {
        alert("Please enter a location!");
        return;
    }

    appState.activeRequestsCount++;
    document.getElementById('dash-active-requests').innerText = appState.activeRequestsCount;
    document.getElementById('landing-req-count').innerText = appState.activeRequestsCount;

    const matchedDonors = appState.donors.filter(donor => donor.blood === bloodGroup);

    renderMatchingResults(matchedDonors, bloodGroup, location, units);
    navigate('step5');
}

// Render AI Matched Donors
function renderMatchingResults(donors, bloodGroup, userLoc, units) {
    const container = document.getElementById('step5').querySelector('.container');
    
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
                            <small class="text-muted">${donor.distance} away • Area: ${donor.location} • Group: ${donor.blood}</small>
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
    const container = document.getElementById('step6').querySelector('.container');
    container.innerHTML = `
        <div class="mt-5 d-flex justify-content-center">
            <div class="card p-4 shadow-sm" style="width: 400px; border-radius: 15px;">
                <div class="text-center mb-3">
                    <div class="bg-danger text-white rounded-circle d-inline-block p-4"><i class="fa-solid fa-user fa-2x"></i></div>
                    <h4 class="mt-2 fw-bold">${name}</h4>
                    <span class="badge bg-success">Available Now</span>
                </div>
                <ul class="list-group list-group-flush mb-4">
                    <li class="list-group-item d-flex justify-content-between"><span>Blood Group</span><strong>${blood}</strong></li>
                    <li class="list-group-item d-flex justify-content-between"><span>Distance</span><strong>${distance}</strong></li>
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
        aiDiv.textContent = data.reply || 'কোনো উত্তর পাওয়া যায়নি।';
        chatBox.appendChild(aiDiv);
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mb-3 text-danger';
        errorDiv.textContent = 'AI service-এর সঙ্গে যোগাযোগ করা যায়নি।';
        chatBox.appendChild(errorDiv);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
