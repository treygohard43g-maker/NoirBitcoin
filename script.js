// ===============================
// NOIRBITCOIN SCRIPT
// Version 1.0
// ===============================

// ---------- REGISTER ----------

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const user = {

            name: document.getElementById("name").value.trim(),

            email: document.getElementById("email").value.trim(),

            phone: document.getElementById("phone").value.trim(),

            password: document.getElementById("password").value

        };

        localStorage.setItem("noirUser", JSON.stringify(user));

        alert("Account created successfully!");

        window.location.href = "login.html";

    });

}



// ---------- LOGIN ----------

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        const password = document.getElementById("loginPassword").value;

        const savedUser = JSON.parse(localStorage.getItem("noirUser"));

        if (

            savedUser &&

            email === savedUser.email &&

            password === savedUser.password

        ) {

            localStorage.setItem("loggedIn", "true");

            window.location.href = "dashboard.html";

        } else {

            alert("Incorrect email or password.");

        }

    });

}



// ---------- PROTECT DASHBOARD ----------

if (window.location.pathname.includes("dashboard.html")) {

    if (localStorage.getItem("loggedIn") !== "true") {

        window.location.href = "login.html";

    }

}



// ---------- DISPLAY USER NAME ----------

const welcomeUserElement = document.getElementById("welcomeUser");

if (welcomeUserElement) {

    const savedUser = JSON.parse(localStorage.getItem("noirUser"));

    if (savedUser) {

        welcomeUserElement.innerHTML =
        "Welcome, " + savedUser.name + ' <i class="fa-solid fa-hand"></i>';

    }

}


// ---------- BALANCE ----------

const balanceElement = document.getElementById("availableBalance");

let balanceVisible = true;

let balance = 500000;
let bitcoinPrice = 120000;
let showingBTC = false;

function updateBalance() {

    if (!balanceElement) return;

    if (showingBTC) {

        let btc = balance / bitcoinPrice;
        balanceElement.innerHTML = "₿" + btc.toFixed(8);

    } else {

        balanceElement.innerHTML =
            "$" + balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

    }

}

updateBalance();


// ---------- HIDE / SHOW BALANCE ----------

const toggleBalance = document.getElementById("toggleBalance");

if (toggleBalance && balanceElement) {

    toggleBalance.addEventListener("click", function () {

        if (balanceVisible) {

            balanceElement.innerHTML = "••••••••";

            toggleBalance.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Show Balance';
            balanceVisible = false;

        } else {

            updateBalance();

            toggleBalance.innerHTML = '<i class="fa-solid fa-eye"></i> Hide Balance';
            balanceVisible = true;

        }

    });

}



// ---------- LIVE BTC PRICE ----------

const btcPrice = document.getElementById("btcPrice");

const btcMovement = document.getElementById("btcMovement");

let bitcoin = 118650;

function updateBitcoin() {

    if (!btcPrice) return;

    const move = Math.floor(Math.random() * 1000) - 500;

    bitcoin += move;

    btcPrice.innerHTML =

        "$" + bitcoin.toLocaleString();

    if (btcMovement) {

        if (move >= 0) {

            btcMovement.innerHTML =

                "▲ +$" + move.toLocaleString();

            btcMovement.style.color = "#22c55e";

        } else {

            btcMovement.innerHTML =

                "▼ -$" + Math.abs(move).toLocaleString();

            btcMovement.style.color = "#ef4444";

        }

    }

}

setInterval(updateBitcoin, 5000);



// ---------- DEPOSIT POPUP ----------

const depositBtn = document.getElementById("depositBtn");
const depositModal = document.getElementById("depositModal");
const closeDeposit = document.getElementById("closeDeposit");

if (depositBtn && depositModal) {

    depositBtn.addEventListener("click", function () {

        depositModal.style.display = "flex";

    });

}


if (closeDeposit) {

    closeDeposit.addEventListener("click", function () {

        depositModal.style.display = "none";

    });

}

// ---------- WITHDRAW POPUP ----------

const withdrawBtn = document.getElementById("withdrawBtn");

const withdrawModal = document.getElementById("withdrawModal");

const closeWithdraw = document.getElementById("closeWithdraw");


if (withdrawBtn && withdrawModal) {

    withdrawBtn.addEventListener("click", function () {

        withdrawModal.style.display = "flex";

    });

}


if (closeWithdraw) {

    closeWithdraw.addEventListener("click", function () {

        withdrawModal.style.display = "none";

    });

}


const confirmWithdraw = document.getElementById("confirmWithdraw");


if (confirmWithdraw) {

    confirmWithdraw.addEventListener("click", function () {

        const amount = document.getElementById("withdrawAmount").value;

        const wallet = document.getElementById("withdrawWallet").value;


        if (!amount || !wallet) {

            alert("Please fill all withdrawal details");

            return;

        }

 alert(
"Withdrawal is currently unavailable.\n\nTo continue, a withdrawal fee of $1,000 is required before withdrawals can be processed."
);


        withdrawModal.style.display = "none";

    });

}
// ---------- INVEST BUTTON ----------

const investBtn = document.getElementById("investBtn");

const investmentPlans = document.getElementById("InvestmentPlans");


if (investBtn && investmentPlans) {

    investBtn.addEventListener("click", function () {

        investmentPlans.scrollIntoView({

            behavior: "smooth"

        });

    });

}
                                                        
// ---------- HISTORY BUTTON ----------

const historyBtn = document.getElementById("historyBtn");

const transactionHistory = document.getElementById("transactionHistory");


if (historyBtn && transactionHistory) {

    historyBtn.addEventListener("click", function () {

        transactionHistory.scrollIntoView({

            behavior: "smooth"

        });

    });

}

// ---------- PROFILE MENU ----------


const profileBtn = document.getElementById("profileBtn");

const profileMenu = document.getElementById("profileMenu");


if(profileBtn && profileMenu){

    profileBtn.addEventListener("click", function(){

        if(profileMenu.style.display === "block"){

            profileMenu.style.display = "none";

        } else {

            profileMenu.style.display = "block";

        }

    });

}


// Display profile details

const profileName = document.getElementById("profileName");

const profileEmail = document.getElementById("profileEmail");


const userData = JSON.parse(localStorage.getItem("noirUser"));


if(userData){

    if(profileName){

        profileName.innerHTML = userData.name;

    }


    if(profileEmail){

        profileEmail.innerHTML = userData.email;

    }

}

// ---------- NOTIFICATION MENU ----------

const notificationBtn = document.getElementById("notificationBtn");

const notificationMenu = document.getElementById("notificationMenu");


if (notificationBtn && notificationMenu) {

    notificationBtn.addEventListener("click", function () {

        if (notificationMenu.style.display === "block") {

            notificationMenu.style.display = "none";

        } else {

            notificationMenu.style.display = "block";

        }

    });

}

// ---------- LIVE NOTIFICATIONS ----------

const notificationContent = document.getElementById("notificationContent");


const updates = [

"₿ Bitcoin price increased by 2.5%",

"💰 Your investment portfolio is active",

"🔐 Security check completed",

"📈 Market analysis updated",

"✅ Wallet activity confirmed"

];


function updateNotification(){

    if(!notificationContent) return;


    const randomUpdate = updates[
        Math.floor(Math.random() * updates.length)
    ];


    notificationContent.innerHTML = `

    <div class="notification-item">

    ${randomUpdate}

    <p>
    Just now
    </p>

    </div>

    `;

}


setInterval(updateNotification,10000);

// ---------- LOGOUT ----------

function logout() {

    localStorage.removeItem("loggedIn");

    window.location.href = "login.html";

}


if(closeDeposit){

closeDeposit.onclick = function(){

depositModal.style.display = "none";

}

}


// Copy Bitcoin Address

const copyAddress = document.getElementById("copyAddress");


if(copyAddress){

copyAddress.onclick = function(){

navigator.clipboard.writeText("12345667990018682929");

alert("Bitcoin address copied");

}

}

function investNow(plan) {
    localStorage.setItem("selectedPlan", plan);
    window.location.href = "investment.html";
}

function toggleHistory(header){

    const details = header.parentElement.querySelector(".history-details");
    const arrow = header.querySelector(".arrow");

    if(!details) return;

    document.querySelectorAll(".history-details").forEach(function(item){
        if(item !== details){
            item.classList.remove("active");
        }
    });

    document.querySelectorAll(".arrow").forEach(function(item){
        if(item !== arrow){
            item.classList.remove("rotate");
        }
    });

    details.classList.toggle("active");
    arrow.classList.toggle("rotate");
}


// ---------- INVESTMENT PAGE ----------

const selectedPlan = localStorage.getItem("selectedPlan");

const planTitle = document.getElementById("selectedPlan");
const planReturn = document.getElementById("planReturn");
const planMinimum = document.getElementById("planMinimum");

if (planTitle) {

    if (selectedPlan === "Starter Plan") {

        planTitle.textContent = "Starter Plan";
        planReturn.textContent = "5% Monthly Return";
        planMinimum.textContent = "Minimum Investment: 0.01 BTC";

    }

    else if (selectedPlan === "Professional Plan") {

        planTitle.textContent = "Professional Plan";
        planReturn.textContent = "8% Monthly Return";
        planMinimum.textContent = "Minimum Investment: 0.10 BTC";

    }

    else if (selectedPlan === "Premium Plan") {

        planTitle.textContent = "Premium Plan";
        planReturn.textContent = "12% Monthly Return";
        planMinimum.textContent = "Minimum Investment: 0.50 BTC";

    }

    else if (selectedPlan === "Diamond Plan") {

        planTitle.textContent = "Diamond Plan";
        planReturn.textContent = "20% Monthly Return";
        planMinimum.textContent = "Minimum Investment: 0.50 BTC";

    }

}
// ---------- CALCULATE PROFIT ----------

function calculateProfit() {

    const amount = Number(document.getElementById("investmentAmount").value);

    const profitText = document.getElementById("estimatedProfit");

    if (!amount || amount <= 0) {
        alert("Please enter an investment amount.");
        return;
    }

    let rate = 0;

    if (selectedPlan === "Starter Plan") {
        rate = 5;
    }
    else if (selectedPlan === "Professional Plan") {
        rate = 8;
    }
    else if (selectedPlan === "Premium Plan") {
        rate = 12;
    }
    else if (selectedPlan === "Diamond Plan") {
        rate = 20;
    }

    const profit = amount * (rate / 100);

    profitText.textContent =
        "Estimated Monthly Profit: $" + profit.toFixed(2);

}

function confirmInvestment() {

    const amount = document.getElementById("investmentAmount").value;

    if (!amount || Number(amount) <= 0) {
        alert("Please enter an investment amount.");
        return;
    }

    const investment = {
        plan: selectedPlan,
        amount: amount,
        date: new Date().toLocaleString(),
        status: "Active"
    };

    let investments = JSON.parse(localStorage.getItem("investments")) || [];

    investments.unshift(investment);

    localStorage.setItem("investments", JSON.stringify(investments));

    document.getElementById("successPlan").textContent = selectedPlan;
    document.getElementById("successAmount").textContent = amount;

    document.getElementById("successMessage").style.display = "block";

    setTimeout(function () {
        window.location.href = "dashboard.html";
    }, 2500);

}

    
// ---------- LOAD INVESTMENT HISTORY ----------

const investmentHistory = document.getElementById("investmentHistory");

if (investmentHistory) {

    const investments =
        JSON.parse(localStorage.getItem("investments")) || [];

    investments.forEach(function (investment) {

        investmentHistory.innerHTML += `

        <div class="history-item">

            <div class="history-header" onclick="toggleHistory(this)">

                <div>

                    <h3><span class="arrow">▶</span> ${investment.plan}</h3>

                    <p>${investment.date}</p>

                </div>

                <span class="amount negative">-$${investment.amount}</span>

            </div>

            <div class="history-details">

                <p><strong>Investment Plan:</strong> ${investment.plan}</p>

                <p><strong>Amount:</strong> $${investment.amount}</p>

                <p><strong>Status:</strong> ${investment.status}</p>

            </div>

        </div>

        <hr>

        `;

    });

}

const chartContainer = document.getElementById("btcChart");

if (chartContainer && typeof LightweightCharts !== "undefined") {
const chart = LightweightCharts.createChart(chartContainer, {

    width: document.getElementById("btcChart").clientWidth,

    height: 350,

    layout: {

        background: { color: "#111827" },

        textColor: "#ffffff"

    },

    grid: {

        vertLines: {

            color: "rgba(255,255,255,0.05)"

        },

        horzLines: {

            color: "rgba(255,255,255,0.05)"

        }

    },

    crosshair: {

        mode: LightweightCharts.CrosshairMode.Normal

    },

    rightPriceScale: {

        borderColor: "#374151"

    },

    timeScale: {

        borderColor: "#374151"

    }

});

const series = chart.addAreaSeries({

    lineColor: "#f7931a",

    topColor: "rgba(247,147,26,0.45)",

    bottomColor: "rgba(247,147,26,0.05)"

});

series.setData([

    { time: "2026-07-24", value: 64200 },

    { time: "2026-07-25", value: 65100 },

    { time: "2026-07-26", value: 64650 },

    { time: "2026-07-27", value: 66300 },

    { time: "2026-07-28", value: 67100 },

    { time: "2026-07-29", value: 66700 },

    { time: "2026-07-30", value: 68400 }

]);

window.addEventListener("resize", () => {

    chart.applyOptions({

        width: document.getElementById("btcChart").clientWidth

    });

});

}

// ---------- LIVE BALANCE MOVEMENT ----------

function updateLiveBalance() {

    let change = Math.floor(Math.random() * 500) - 200;

    balance += change;

    if (balance < 0) {
        balance = 0;
    }

    updateBalance();

}

setInterval(updateLiveBalance, 5000);

function goToHistory(){

    const history = document.getElementById("historySection");

    if(history){

        history.scrollIntoView({
            behavior:"smooth"
        });

    }

}

// ---------- USD / BTC TOGGLE ----------

const currencyToggle = document.getElementById("currencyToggle");

if (currencyToggle) {

    currencyToggle.addEventListener("click", function () {

        showingBTC = !showingBTC;

        if (showingBTC) {
            currencyToggle.innerHTML = "Show USD";
        } else {
            currencyToggle.innerHTML = "Show BTC";
        }

        updateBalance();

    });

}

// ---------- SETTINGS ----------
const saveSettingsBtn = document.getElementById("saveSettings");

if (saveSettingsBtn) {

    saveSettingsBtn.addEventListener("click", function () {

        const savedUser = JSON.parse(localStorage.getItem("noirUser"));

        const newUsername = document.getElementById("newUsername").value.trim();
        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (oldPassword !== savedUser.password) {
            alert("Current password is incorrect.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }

        if (newUsername !== "") {
            savedUser.name = newUsername;
        }

        if (newPassword.length < 8) {
    alert("Your new password must be at least 8 characters long.");
    return;
}

savedUser.password = newPassword;

        localStorage.setItem("noirUser", JSON.stringify(savedUser));

        alert("Account updated successfully!");
    });

}

// ---------- DASHBOARD WELCOME ----------
const dashboardWelcomeUser = document.getElementById("welcomeUser");

if (dashboardWelcomeUser) {

    const savedUser = JSON.parse(localStorage.getItem("noirUser"));

    if (savedUser) {
        welcomeUser.innerHTML = 'Welcome, ' + savedUser.name + ' <i class="fa-solid fa-hand"></i>';
   }

}


// ---------- SHOW / HIDE PASSWORD ----------
function setupPasswordToggle(inputId, iconId) {

    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (!input || !icon) return;

    icon.addEventListener("click", function () {

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }

    });

}

setupPasswordToggle("oldPassword", "toggleOldPassword");
setupPasswordToggle("newPassword", "toggleNewPassword");
setupPasswordToggle("confirmPassword", "toggleConfirmPassword");