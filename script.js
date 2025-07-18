// Global variables for app ID and user ID (for consistency, though Firebase is not used)

const appId = typeof __app_id !== 'undefined' ? __app_id : 'skt-mining-app';

let userId = localStorage.getItem('currentUserId') || crypto.randomUUID(); // Use a random UUID if not set

// Elements

const authSection = document.getElementById('authSection');

const loginForm = document.getElementById('loginForm');

const registerForm = document.getElementById('registerForm');

const dashboardSection = document.getElementById('dashboardSection');

const walletPage = document.getElementById('walletPage');

const userNameSpan = document.getElementById('userName');

const miningCountdown = document.getElementById('miningCountdown');

const mineButton = document.getElementById('mineButton');

const claimButton = document.getElementById('claimButton');

const totalSktSpan = document.getElementById('totalSkt');

const walletTotalSktSpan = document.getElementById('walletTotalSkt');

const referralsCountSpan = document.getElementById('referralsCount');

const addReferralInput = document.getElementById('addReferralInput');

const effectiveMiningRateSpan = document.getElementById('effectiveMiningRate');

const currentBoostStatusSpan = document.getElementById('currentBoostStatus');

const claimHistoryList = document.getElementById('claimHistoryList');

const noClaimsMessage = document.getElementById('noClaimsMessage');

const getMiningAdviceBtn = document.getElementById('getMiningAdviceBtn');

const referralKeywordsInput = document.getElementById('referralKeywordsInput');

const generateReferralMsgBtn = document.getElementById('generateReferralMsgBtn');

// Modals

const messageModal = document.getElementById('messageModal');

const modalMessage = document.getElementById('modalMessage');

const depositModal = document.getElementById('depositModal');

const llmResponseModal = document.getElementById('llmResponseModal');

const llmResponseTitle = document.getElementById('llmResponseTitle');

const llmResponseMessage = document.getElementById('llmResponseMessage');

// Constants

const MINING_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

const BASE_SKT_PER_CLAIM = 0.6;

const BASE_MINING_RATE_PER_HOUR = 0.1;

// State variables (persisted in localStorage)

let currentUser = null; // Stores currently logged-in user's email

let mineStartTime = null; // Timestamp when mining started

let isMining = false; // Flag to indicate if mining is active

let miningTimerInterval = null; // Interval ID for the countdown timer

// --- Utility Functions ---

/**

 * Shows a modal with a given message.

 * @param {string} message - The message to display.

 * @param {string} modalId - The ID of the modal element.

 */

function showModal(message, modalId = 'messageModal') {

    modalMessage.textContent = message;

    document.getElementById(modalId).style.display = 'flex';

}

/**

 * Closes a modal.

 * @param {string} modalId - The ID of the modal element.

 */

function closeModal(modalId = 'messageModal') {

    document.getElementById(modalId).style.display = 'none';

}

/**

 * Copies text to the clipboard.

 * @param {string} elementId - The ID of the element whose text content should be copied.

 */

function copyToClipboard(elementId) {

    const textToCopy = document.getElementById(elementId).textContent;

    const tempInput = document.createElement('textarea');

    tempInput.value = textToCopy;

    document.body.appendChild(tempInput);

    tempInput.select();

    document.execCommand('copy'); // Fallback for navigator.clipboard.writeText

    document.body.removeChild(tempInput);

    showModal('Address copied to clipboard!', 'depositModal'); // Show message within the deposit modal context

}

/**

 * Retrieves data from localStorage.

 * @param {string} key - The key to retrieve.

 * @param {any} defaultValue - The default value if the key is not found.

 * @returns {any} The parsed data or default value.

 */

function getFromLocalStorage(key, defaultValue) {

    const data = localStorage.getItem(key);

    try {

        return data ? JSON.parse(data) : defaultValue;

    } catch (e) {

        console.error(`Error parsing localStorage key "${key}":`, e);

        return defaultValue;

    }

}

/**

 * Stores data in localStorage.

 * @param {string} key - The key to store.

 * @param {any} value - The value to store.

 */

function saveToLocalStorage(key, value) {

    localStorage.setItem(key, JSON.stringify(value));

}

// --- UI Navigation ---

/** Shows the login form and hides other forms. */

function showLogin() {

    loginForm.classList.remove('hidden');

    registerForm.classList.add('hidden');

    authSection.classList.remove('hidden');

    dashboardSection.classList.add('hidden');

    walletPage.classList.add('hidden');

}

/** Shows the registration form and hides other forms. */

function showRegister() {

    loginForm.classList.add('hidden');

    registerForm.classList.remove('hidden');

    authSection.classList.remove('hidden');

    dashboardSection.classList.add('hidden');

    walletPage.classList.add('hidden');

}

/** Shows the dashboard and hides auth/wallet sections. */

function showDashboard() {

    authSection.classList.add('hidden');

    dashboardSection.classList.remove('hidden');

    walletPage.classList.add('hidden');

    updateDashboardUI(); // Update UI when dashboard is shown

}

/** Shows the wallet page and hides auth/dashboard sections. */

function showWalletPage() {

    authSection.classList.add('hidden');

    dashboardSection.classList.add('hidden');

    walletPage.classList.remove('hidden');

    updateWalletUI(); // Update UI when wallet page is shown

}

/** Shows the deposit modal. */

function showDepositModal() {

    showModal('', 'depositModal');

}

// --- Authentication Logic ---

/** Handles user registration. */

function handleRegister() {

    const name = document.getElementById('registerName').value.trim();

    const email = document.getElementById('registerEmail').value.trim();

    const mobile = document.getElementById('registerMobile').value.trim();

    const password = document.getElementById('registerPassword').value.trim();

    if (!name || !email || !mobile || !password) {

        showModal('Please fill in all fields.');

        return;

    }

    if (!email.includes('@') || !email.includes('.')) {

        showModal('Please enter a valid email address.');

        return;

    }

    if (password.length < 6) {

        showModal('Password must be at least 6 characters long.');

        return;

    }

    const users = getFromLocalStorage('skt_users', {});

    if (users[email]) {

        showModal('This email is already registered.');

        return;

    }

    users[email] = { name, mobile, password, sktBalance: 0, referrals: 0, claimHistory: [] };

    saveToLocalStorage('skt_users', users);

    // Simulate admin alert (client-side email sending is not possible without a backend)

    console.log(`Admin Alert: New user registered! Email: ${email}, Password: ${password}`);

    showModal('Registration successful! Please login.');

    showLogin();

}

/** Handles user login. */

function handleLogin() {

    const email = document.getElementById('loginEmail').value.trim();

    const password = document.getElementById('loginPassword').value.trim();

    const users = getFromLocalStorage('skt_users', {});

    const user = users[email];

    if (!user || user.password !== password) {

        showModal('Invalid email or password.');

        return;

    }

    currentUser = email;

    saveToLocalStorage('skt_loggedInUser', email);

    localStorage.setItem('currentUserId', userId); // Persist userId for this session

    showDashboard();

    initializeMiningState(); // Initialize mining state for the logged-in user

}

/** Handles user logout. */

function handleLogout() {

    clearInterval(miningTimerInterval); // Stop the timer

    currentUser = null;

    localStorage.removeItem('skt_loggedInUser');

    // Do not remove currentUserId here, as it's meant to persist for the app instance

    showLogin();

    resetMiningUI(); // Reset UI elements on logout

}

// --- Mining System Logic ---

/**

 * Calculates the current effective mining rate based on referrals and boosts.

 * @returns {number} The effective mining rate per hour.

 */

function getEffectiveMiningRate() {

    const users = getFromLocalStorage('skt_users', {});

    const user = users[currentUser];

    let rate = BASE_MINING_RATE_PER_HOUR;

    if (user) {

        // Referral boost

        const referralBoost = 1 + (user.referrals * 0.25);

        rate *= referralBoost;

        // Top-up boost

        const boost = getFromLocalStorage(`skt_boost_${currentUser}`, null);

        if (boost && Date.now() < boost.expiryTime) {

            rate *= boost.multiplier;

        }

    }

    return parseFloat(rate.toFixed(2)); // Round to 2 decimal places

}

/**

 * Calculates the claimable SKT amount after 6 hours, considering boosts and referrals.

 * @returns {number} The claimable SKT amount.

 */

function getClaimableSKT() {

    const effectiveRate = getEffectiveMiningRate();

    return parseFloat((effectiveRate * 6).toFixed(2)); // 6 hours * effective rate

}

/** Initializes or resumes the mining state for the current user. */

function initializeMiningState() {

    mineStartTime = getFromLocalStorage(`skt_mineStartTime_${currentUser}`, null);

    isMining = getFromLocalStorage(`skt_isMining_${currentUser}`, false);

    if (isMining && mineStartTime) {

        const elapsedTime = Date.now() - mineStartTime;

        if (elapsedTime >= MINING_DURATION_MS) {

            // Mining cycle completed while user was logged out/refreshed

            isMining = false; // Mark as not mining, ready to claim

            saveToLocalStorage(`skt_isMining_${currentUser}`, isMining);

            mineButton.classList.add('hidden');

            claimButton.classList.remove('hidden');

            miningCountdown.textContent = 'Ready to Claim!';

        } else {

            // Resume countdown

            startCountdownTimer();

            mineButton.textContent = 'Mining...';

            mineButton.disabled = true;

            claimButton.classList.add('hidden');

        }

    } else {

        // Not mining, allow user to start

        mineButton.textContent = 'Mine SKT';

        mineButton.disabled = false;

        claimButton.classList.add('hidden');

        miningCountdown.textContent = '00:00:00';

    }

    updateDashboardUI(); // Ensure UI reflects current state

}

/** Starts the 6-hour mining countdown timer. */

function startMining() {

    if (isMining) return; // Prevent restarting if already mining

    mineStartTime = Date.now();

    isMining = true;

    saveToLocalStorage(`skt_mineStartTime_${currentUser}`, mineStartTime);

    saveToLocalStorage(`skt_isMining_${currentUser}`, isMining);

    mineButton.textContent = 'Mining...';

    mineButton.disabled = true;

    claimButton.classList.add('hidden');

    startCountdownTimer();

}

/** Starts the visual countdown timer and handles completion. */

function startCountdownTimer() {

    clearInterval(miningTimerInterval); // Clear any existing interval

    miningTimerInterval = setInterval(() => {

        const elapsedTime = Date.now() - mineStartTime;

        const remainingTime = MINING_DURATION_MS - elapsedTime;

        if (remainingTime <= 0) {

            clearInterval(miningTimerInterval);

            miningCountdown.textContent = 'Ready to Claim!';

            mineButton.classList.add('hidden');

            claimButton.classList.remove('hidden');

            isMining = false;

            saveToLocalStorage(`skt_isMining_${currentUser}`, isMining);

        } else {

            const hours = Math.floor(remainingTime / (1000 * 60 * 60));

            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            miningCountdown.textContent =

                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        }

    }, 1000);

}

/** Claims the SKT reward after mining is complete. */

function claimSKT() {

    if (isMining || !mineStartTime || (Date.now() - mineStartTime < MINING_DURATION_MS)) {

        showModal('Mining not complete yet or already claimed.');

        return;

    }

    const claimAmount = getClaimableSKT();

    const users = getFromLocalStorage('skt_users', {});

    if (users[currentUser]) {

        users[currentUser].sktBalance = (users[currentUser].sktBalance || 0) + claimAmount;

        // Add to claim history

        if (!users[currentUser].claimHistory) {

            users[currentUser].claimHistory = [];

        }

        users[currentUser].claimHistory.push({

            amount: claimAmount,

            timestamp: Date.now(),

            date: new Date().toLocaleString()

        });

        saveToLocalStorage('skt_users', users);

    }

    // Reset mining state

    mineStartTime = null;

    isMining = false;

    saveToLocalStorage(`skt_mineStartTime_${currentUser}`, null);

    saveToLocalStorage(`skt_isMining_${currentUser}`, false);

    clearInterval(miningTimerInterval);

    miningCountdown.textContent = '00:00:00';

    mineButton.textContent = 'Mine SKT';

    mineButton.disabled = false;

    claimButton.classList.add('hidden');

    showModal(`Successfully claimed ${claimAmount} SKT!`);

    updateDashboardUI();

}

/** Resets the mining UI elements. */

function resetMiningUI() {

    miningCountdown.textContent = '00:00:00';

    mineButton.textContent = 'Mine SKT';

    mineButton.disabled = false;

    claimButton.classList.add('hidden');

    totalSktSpan.textContent = '0.00';

    walletTotalSktSpan.textContent = '0.00';

    referralsCountSpan.textContent = '0';

    effectiveMiningRateSpan.textContent = '0.1 SKT/hour';

    currentBoostStatusSpan.textContent = '';

    claimHistoryList.innerHTML = '<li id="noClaimsMessage" class="text-center text-gray-500">No claims yet. Start mining!</li>';

}

// --- Referral System Logic ---

/** Updates the number of referrals for the current user. */

function updateReferrals() {

    const newReferrals = parseInt(addReferralInput.value, 10);

    if (isNaN(newReferrals) || newReferrals < 0) {

        showModal('Please enter a valid number for referrals.');

        return;

    }

    const users = getFromLocalStorage('skt_users', {});

    if (users[currentUser]) {

        users[currentUser].referrals = newReferrals;

        saveToLocalStorage('skt_users', users);

        showModal(`Referrals updated to ${newReferrals}. Mining rate adjusted.`);

        updateDashboardUI(); // Update UI to reflect new rate

    }

}

// --- Top-Up System Logic ---

/**

 * Activates a mining boost package.

 * @param {number} usdtAmount - The USDT amount for the package.

 * @param {number} multiplier - The mining speed multiplier.

 */

function activateBoost(usdtAmount, multiplier) {

    const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    const boost = { usdtAmount, multiplier, expiryTime };

    saveToLocalStorage(`skt_boost_${currentUser}`, boost);

    showModal(`You have selected the ${multiplier}x mining boost for ${usdtAmount} USDT. Please complete the deposit.`);

    showDepositModal(); // Prompt user to deposit after selecting

    updateDashboardUI(); // Update UI to show active boost

}

/** Checks and updates the current boost status. */

function checkBoostStatus() {

    const boost = getFromLocalStorage(`skt_boost_${currentUser}`, null);

    if (boost) {

        if (Date.now() < boost.expiryTime) {

            const remainingMs = boost.expiryTime - Date.now();

            const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

            const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            currentBoostStatusSpan.textContent = `Active: ${boost.multiplier}x boost for ${days}d ${hours}h remaining.`;

        } else {

            // Boost expired, remove it from localStorage

            localStorage.removeItem(`skt_boost_${currentUser}`);

            currentBoostStatusSpan.textContent = 'No active boost.';

        }

    } else {

        currentBoostStatusSpan.textContent = 'No active boost.';

    }

}

// --- UI Update Functions ---

/** Updates all dynamic elements on the dashboard. */

function updateDashboardUI() {

    const users = getFromLocalStorage('skt_users', {});

    const user = users[currentUser];

    if (user) {

        userNameSpan.textContent = user.name;

        totalSktSpan.textContent = (user.sktBalance || 0).toFixed(2);

        referralsCountSpan.textContent = user.referrals || 0;

        effectiveMiningRateSpan.textContent = `${getEffectiveMiningRate()} SKT/hour`;

        checkBoostStatus(); // Update boost status display

    }

}

/** Updates all dynamic elements on the wallet page. */

function updateWalletUI() {

    const users = getFromLocalStorage('skt_users', {});

    const user = users[currentUser];

    if (user) {

        walletTotalSktSpan.textContent = (user.sktBalance || 0).toFixed(2);

        claimHistoryList.innerHTML = ''; // Clear previous entries

        if (user.claimHistory && user.claimHistory.length > 0) {

            user.claimHistory.forEach(claim => {

                const li = document.createElement('li');

                li.className = 'mb-2 text-md';

                li.textContent = `Claimed ${claim.amount.toFixed(2)} SKT on ${claim.date}`;

                claimHistoryList.appendChild(li);

            });

            noClaimsMessage.classList.add('hidden');

        } else {

            noClaimsMessage.classList.remove('hidden');

        }

    }

}

// --- Gemini API Integration ---

const apiKey = ""; // Leave this empty. Canvas will automatically provide it.

/**

 * Calls the Gemini API with a given prompt.

 * @param {string} prompt - The text prompt for the LLM.

 * @returns {Promise<string>} The generated text from the LLM.

 */

async function callGeminiAPI(prompt) {

    let chatHistory = [];

    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {

        const response = await fetch(apiUrl, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload)

        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&

            result.candidates[0].content && result.candidates[0].content.parts &&

            result.candidates[0].content.parts.length > 0) {

            return result.candidates[0].content.parts[0].text;

        } else {

            console.error("Unexpected Gemini API response structure:", result);

            return "Could not generate a response. Please try again.";

        }

    } catch (error) {

        console.error("Error calling Gemini API:", error);

        return "Failed to connect to the AI. Please check your network.";

    }

}

/** Generates mining advice using the Gemini API. */

async function getMiningAdvice() {

    getMiningAdviceBtn.disabled = true;

    getMiningAdviceBtn.textContent = 'Generating Advice...';

    const currentRate = getEffectiveMiningRate();

    const users = getFromLocalStorage('skt_users', {});

    const user = users[currentUser];

    const referrals = user ? user.referrals : 0;

    const boost = getFromLocalStorage(`skt_boost_${currentUser}`, null);

    const boostStatus = boost && Date.now() < boost.expiryTime ? `${boost.multiplier}x active` : 'No active boost';

    const prompt = `As a futuristic AI mining advisor for the Sachyy X Toshi (SKT) app, provide concise, actionable advice for a user.

    Current effective mining rate: ${currentRate} SKT/hour.

    Referrals: ${referrals}.

    Boost status: ${boostStatus}.

    

    Suggest strategies to maximize SKT earnings, considering the 6-hour mining cycle, referrals, and boost packages. Focus on 2-3 key points. Make it sound encouraging and futuristic.`;

    const advice = await callGeminiAPI(prompt);

    llmResponseTitle.textContent = 'Mining Strategy Advice ✨';

    llmResponseMessage.textContent = advice;

    llmResponseModal.style.display = 'flex';

    getMiningAdviceBtn.disabled = false;

    getMiningAdviceBtn.textContent = 'Get Mining Advice ✨';

}

/** Generates a referral message using the Gemini API. */

async function generateReferralMessage() {

    const keywords = referralKeywordsInput.value.trim();

    if (!keywords) {

        showModal('Please enter some keywords to generate a referral message.');

        return;

    }

    generateReferralMsgBtn.disabled = true;

    generateReferralMsgBtn.textContent = 'Generating Message...';

    const prompt = `As a marketing AI for the Sachyy X Toshi (SKT) app, generate a short, compelling referral message for users to share.

    The message should encourage others to join and highlight the benefits of mining SKT.

    Include these keywords: "${keywords}".

    Make it sound exciting and futuristic, suitable for social media or messaging.`;

    const message = await callGeminiAPI(prompt);

    llmResponseTitle.textContent = 'Generated Referral Message ✨';

    llmResponseMessage.textContent = message;

    llmResponseModal.style.display = 'flex';

    generateReferralMsgBtn.disabled = false;

    generateReferralMsgBtn.textContent = 'Generate Referral Message ✨';

}

// --- Initialization ---

/** Initializes the application state on load. */

function initializeApp() {

    currentUser = getFromLocalStorage('skt_loggedInUser', null);

    if (currentUser) {

        showDashboard();

        initializeMiningState();

    } else {

        showLogin();

    }

}

// Run initialization when the window loads

window.onload = initializeApp;