alert("SCRIPT JS LOADED");
import { auth } from "./firebase.js";
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.onerror = function (message, source, line, column, error) {
    alert("JS Error:\n" + message + "\nLine: " + line);
};

// ===============================
// NOIRBITCOIN SCRIPT
// Version 1.0
// ===============================

// Load saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
} else {
    document.body.classList.remove("light-mode");
}

// ---------- THEME TOGGLE ----------

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    if (savedTheme === "light") {

        themeToggle.checked = false;

    } else {

        themeToggle.checked = true;

    }

    themeToggle.addEventListener("change", function () {

        if (themeToggle.checked) {

            document.body.classList.remove("light-mode");

            localStorage.setItem("theme", "dark");

        } else {

            document.body.classList.add("light-mode");

            localStorage.setItem("theme", "light");

        }

    });

}

// ---------- REGISTER ----------

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;


        try {

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            const user = userCredential.user;


            localStorage.setItem("noirUser", JSON.stringify({
                uid: user.uid,
                name: name,
                email: email,
                phone: phone
            }));


            alert("Account created successfully!");

localStorage.setItem("welcomeType", "new");

window.location.href = "login.html";

        } catch (error) {

            alert(error.message);

        }

    });

}


// ---------- LOGIN ----------

const loginForm = document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        alert("Login button clicked");

        const email = document.getElementById("loginEmail").value.trim();

        const password = document.getElementById("loginPassword").value;

        alert("Email: " + email);

        try {
            
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            const user = userCredential.user;


            localStorage.setItem("loggedIn", "true");

            localStorage.setItem("firebaseUser", JSON.stringify({
                uid: user.uid,
                email: user.email
            }));

if (!localStorage.getItem("welcomeType")) {
    localStorage.setItem("welcomeType", "back");
}

            window.location.href = "dashboard.html";


        } catch (error) {

    alert(error.message);

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

    const portfolioBalance = document.getElementById("portfolioBalance");

    if (showingBTC) {

        let btc = balance / bitcoinPrice;

        if(balanceElement){
            balanceElement.innerHTML = "₿" + btc.toFixed(8);
        }

        if(portfolioBalance){
            portfolioBalance.innerHTML = "₿" + btc.toFixed(8);
        }

    } else {

        let formattedBalance =
            "$" + balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        if(balanceElement){
            balanceElement.innerHTML = formattedBalance;
        }

        if(portfolioBalance){
            portfolioBalance.innerHTML = formattedBalance;
        }

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

    let investments = JSON.parse(localStorage.getItem("investments")) || [];

    let newInvestment = {
        plan: plan,
        amount: "5000",
        date: new Date().toLocaleDateString(),
        status: "Pending"
    };

    investments.push(newInvestment);

    localStorage.setItem(
        "investments",
        JSON.stringify(investments)
    );

    window.location.href = "investment.html";
}


function toggleHistory(header){

    const details = header.parentElement.querySelector(".history-details");
    const chevron = header.querySelector(".history-chevron");

    if(!details) return;

    document.querySelectorAll(".history-details").forEach(function(item){
        if(item !== details){
            item.classList.remove("active");
        }
    });

    document.querySelectorAll(".history-chevron").forEach(function(item){
        if(item !== chevron){
            item.classList.remove("rotate");
        }
    });

    details.classList.toggle("active");

    if(chevron){
        chevron.classList.toggle("rotate");
    }
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

// ---------- INVESTMENT DATA MIGRATION ----------

let savedInvestments = JSON.parse(localStorage.getItem("investments")) || [];

savedInvestments = savedInvestments.map(function(investment){

    if (typeof investment.amount === "string") {

        investment.amount = investment.amount
            .replace("$", "")
            .replace("+", "")
            .replace(",", "");

    }

    return investment;

});


localStorage.setItem(
    "investments",
    JSON.stringify(savedInvestments)
);

// ---------- FORCE INVESTMENT HISTORY REPAIR ----------

function forceRepairInvestmentHistory(){

    const container = document.getElementById("investmentHistory");

    if(!container) return;

    const investments =
        JSON.parse(localStorage.getItem("investments")) || [];


    container.innerHTML = "";


    investments.forEach(function(investment){

        container.innerHTML += `

        <div class="history-item">

            <div class="history-header" onclick="toggleHistory(this)">

                <div class="history-info">

                    <h3>
                        <i class="fa-solid fa-chart-line history-icon"></i>
                        ${investment.plan}
                    </h3>

                    <p>
                        <span class="status-badge pending">
                            ${investment.status}
                        </span>
                        • ${investment.date}
                    </p>

                </div>


                <div class="history-right">

                    <span class="amount positive">
                        +$${investment.amount}
                    </span>

                    <i class="fa-solid fa-chevron-down history-chevron"></i>

                </div>

            </div>


            <div class="history-details">

                <div class="detail-row">
                    <span>Investment Plan</span>
                    <span>${investment.plan}</span>
                </div>


                <div class="detail-row">
                    <span>Amount</span>
                    <span>$${investment.amount}</span>
                </div>


                <div class="detail-row">
                    <span>Status</span>
                    <span class="status-badge pending">
                        ${investment.status}
                    </span>
                </div>

            </div>

        </div>

        <hr>

        `;

    });

}


// Run repair automatically when dashboard loads

forceRepairInvestmentHistory();

    // ---------- LOAD INVESTMENT HISTORY ----------

const investmentHistory = document.getElementById("investmentHistory");

if (investmentHistory) {

    const investments =
        JSON.parse(localStorage.getItem("investments")) || [];

    investments.forEach(function (investment) {

        investmentHistory.innerHTML += `

        <div class="history-item">

            <div class="history-header" onclick="toggleHistory(this)">

                <div class="history-info">

                    <h3>
                        <i class="fa-solid fa-chart-line history-icon"></i>
                        ${investment.plan}
                    </h3>

                    <p>
                        <span class="status-badge ${investment.status.toLowerCase()}">
                            ${investment.status}
                        </span>
                        • ${investment.date}
                    </p>

                </div>


                <div class="history-right">

                    <span class="amount negative">
                        -$${investment.amount}
                    </span>

                    <i class="fa-solid fa-chevron-down history-chevron"></i>

                </div>

            </div>


            <div class="history-details">

                <div class="detail-row">
                    <span>Investment Plan</span>
                    <span>${investment.plan}</span>
                </div>


                <div class="detail-row">
                    <span>Amount</span>
                    <span>$${investment.amount}</span>
                </div>


                <div class="detail-row">
                    <span>Status</span>
                    <span class="status-badge ${investment.status.toLowerCase()}">
                        ${investment.status}
                    </span>
                </div>

            </div>

        </div>

        <hr>

        `;

    });

}
    
// ---------- BITCOIN CHART ----------

const chartContainer = document.getElementById("btcChart");

if (chartContainer && typeof LightweightCharts !== "undefined") {

    const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 350,

        layout: {
            background: {
                color: "#111827"
            },
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

        rightPriceScale: {
            borderColor: "#374151"
        },

        timeScale: {
            borderColor: "#374151",
            timeVisible: true
        },

        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal
        }
    });

    const series = chart.addAreaSeries({
        lineColor: "#f7931a",
        topColor: "rgba(247,147,26,0.35)",
        bottomColor: "rgba(247,147,26,0.03)",
        lineWidth: 2
    });

    async function loadChartData(days = 7) {

        try {

            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
            );

            const data = await response.json();

            const prices = data.prices.map(item => ({
                time: Math.floor(item[0] / 1000),
                value: item[1]
            }));

            series.setData(prices);

        } catch (error) {

            console.error("Chart error:", error);

        }

    }

    loadChartData();
    
document.querySelectorAll(".time-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".time-btn").forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        loadChartData(Number(button.dataset.days));

    });

});

chart.subscribeCrosshairMove(param => {

    if (!param.point || !param.time) return;

    const price = param.seriesData.get(series);

    if (price) {

        const chartValue = document.getElementById("chartValue");
        const chartDate = document.getElementById("chartDate");

        if (chartValue) {
            chartValue.textContent =
                "$" + Number(price.value).toLocaleString(undefined, {
                    maximumFractionDigits: 2
                });
        }

        if (chartDate) {
            chartDate.textContent =
                new Date(param.time * 1000).toLocaleDateString();
        }

    }

});


window.addEventListener("resize", () => {

    chart.applyOptions({

        width: chartContainer.clientWidth

    });

});

setInterval(() => {

    loadChartData();

}, 30000);

}


async function loadBitcoinPrice() {

    try {

        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");

        const data = await response.json();

        const price = data.bitcoin.usd;

        document.getElementById("btcPrice").textContent =
            "$" + price.toLocaleString();

    } catch (error) {

        console.error("Unable to load Bitcoin price:", error);

    }

}


loadBitcoinPrice();

setInterval(loadBitcoinPrice, 30000);

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
        dashboardWelcomeUser.innerHTML = 'Welcome, ' + savedUser.name + ' <i class="fa-solid fa-hand"></i>';

        // Play welcome voice after the page loads
        setTimeout(() => {
            speakWelcome(savedUser.name);
        }, 800);
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


// ---------- DIGITAL ASSETS ----------

const assets = [

    {
        name: "Bitcoin",
        symbol: "BTC",
        icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
        price: "$118,000",
        movement: "+2.5%",
        status: "up",
        address: "YOUR_BTC_ADDRESS"
    },

    {
        name: "Ethereum",
        symbol: "ETH",
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        price: "$3,800",
        movement: "+1.8%",
        status: "up",
        address: "YOUR_ETH_ADDRESS"
    },

    {
        name: "Tether",
        symbol: "USDT",
        icon: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        price: "$1.00",
        movement: "+0.01%",
        status: "up",
        address: "YOUR_USDT_ADDRESS"
    },

    {
        name: "Solana",
        symbol: "SOL",
        icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
        price: "$180",
        movement: "-0.7%",
        status: "down",
        address: "YOUR_SOL_ADDRESS"
    },

    {
        name: "XRP",
        symbol: "XRP",
        icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
        price: "$2.50",
        movement: "+3.2%",
        status: "up",
        address: "YOUR_XRP_ADDRESS"
    }

];

// ---------- DISPLAY DIGITAL ASSETS ----------

const assetsContainer = document.getElementById("assetsContainer");

if (assetsContainer) {

    assets.forEach(function(asset){

        assetsContainer.innerHTML += `

        <div class="asset-card">
   
         <img src="${asset.icon}" class="asset-icon">

            <h3>${asset.name} (${asset.symbol})</h3>

            <p class="asset-price">
                ${asset.price}
            </p>

            <p class="asset-movement ${asset.status}">
                ${asset.movement}
            </p>

            <button class="receive-btn" onclick="openReceive('${asset.symbol}')">
    Receive
</button>

        </div>

        `;

    });

}

// ---------- PORTFOLIO STATISTICS ----------

function updatePortfolio() {

    const totalInvestedElement = document.getElementById("totalInvested");
    const activePlansElement = document.getElementById("activePlans");
    const totalProfitElement = document.getElementById("totalProfit");
    const portfolioBalanceElement = document.getElementById("portfolioBalance");


    if (!totalInvestedElement) return;


    const investments =
        JSON.parse(localStorage.getItem("investments")) || [];


    let totalInvested = 0;
    let totalProfit = 0;


    investments.forEach(function(investment){

        const amount = Number(investment.amount);

        totalInvested += amount;


        let profitRate = 0;


        if(investment.plan === "Starter Plan"){
            profitRate = 5;
        }

        else if(investment.plan === "Professional Plan"){
            profitRate = 8;
        }

        else if(investment.plan === "Premium Plan"){
            profitRate = 12;
        }

        else if(investment.plan === "Diamond Plan"){
            profitRate = 20;
        }


        totalProfit += amount * (profitRate / 100);

    });


    totalInvestedElement.textContent =
        "$" + totalInvested.toLocaleString();


    activePlansElement.textContent =
        investments.length;


    totalProfitElement.textContent =
        "$" + totalProfit.toFixed(2);


    portfolioBalanceElement.textContent =
        "$" + (balance + totalProfit).toLocaleString();

}


updatePortfolio();

// ---------- RECEIVE MODAL ----------

const walletAddresses = {

BTC:{
address:"bc1q3kjwt332fqwfvxjq0wls4rt38zkk0f4k8yv2hc",
network:"Bitcoin Network",
icon:"https://cryptologos.cc/logos/bitcoin-btc-logo.png"
},

ETH:{
address:"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
network:"Ethereum Network",
icon:"https://cryptologos.cc/logos/ethereum-eth-logo.png"
},

USDT:{
address:"TRXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
network:"TRC20 Network",
icon:"https://cryptologos.cc/logos/tether-usdt-logo.png"
},

SOL:{
address:"YOUR_SOL_ADDRESS",
network:"Solana Network",
icon:"https://cryptologos.cc/logos/solana-sol-logo.png"
},

XRP:{
address:"rXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
network:"XRP Ledger",
icon:"https://cryptologos.cc/logos/xrp-xrp-logo.png"
}

};

let qr = null;

function openReceive(symbol){

const asset=walletAddresses[symbol];

document.getElementById("receiveModal").style.display="flex";

document.getElementById("receiveTitle").textContent="Receive "+symbol;

document.getElementById("walletAddress").textContent=asset.address;

document.getElementById("networkName").textContent=asset.network;

document.getElementById("receiveIcon").src=asset.icon;

const qrBox=document.getElementById("qrCode");

qrBox.innerHTML="";

new QRCode(qrBox,{
text:asset.address,
width:220,
height:220,
correctLevel:QRCode.CorrectLevel.H
});

}

function closeReceive() {

    document.getElementById("receiveModal").style.display = "none";

}

function copyWalletAddress(){

    const address =
        document.getElementById("walletAddress").textContent;

    navigator.clipboard.writeText(address).then(() => {

        const toast = document.getElementById("toast");

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2000);

    });

}


function shareWalletAddress(){

    const address =
        document.getElementById("walletAddress").textContent;

    if(navigator.share){

        navigator.share({
            title: "Crypto Wallet Address",
            text: address
        });

    }else{

        alert("Sharing is not supported on this device.");

    }

}

function saveQRCode(){

    const qr =
        document.querySelector("#qrCode img, #qrCode canvas");

    if(!qr) return;

    const link = document.createElement("a");

    if(qr.tagName === "IMG"){
        link.href = qr.src;
    }else{
        link.href = qr.toDataURL("image/png");
    }

    link.download = "wallet-qr.png";
    link.click();

}

function copyFeeWallet() {

    const wallet = document.getElementById("feeWallet");

    navigator.clipboard.writeText(wallet.value);

    alert("Bitcoin wallet copied successfully.");

}

function closeWithdrawFeeModal() {

    document.getElementById("withdrawFeeModal").style.display = "none";

}

console.log(JSON.parse(localStorage.getItem("investments")));

/* ==========================
   PREMIUM WITHDRAW FLOW
========================== */

function showWithdrawalPending() {

    const amount = document.getElementById("withdrawAmount").value.trim();
    const wallet = document.getElementById("withdrawWallet").value.trim();

    if (amount === "" || wallet === "") {
        alert("Please enter the withdrawal amount and your Bitcoin wallet address.");
        return;
    }

    // Hide the withdraw form
    document.getElementById("withdrawModal").style.display = "none";

    // Show the premium pending modal
    document.getElementById("pendingModal").style.display = "flex";
}

function closeWithdrawModal() {
    document.getElementById("withdrawModal").style.display = "none";
}

function closePendingModal() {
    document.getElementById("pendingModal").style.display = "none";
}

function copyWallet() {

    const wallet =
        document.getElementById("btcWallet").innerText.trim();

    navigator.clipboard.writeText(wallet);

    const btn =
        document.querySelector(".copy-wallet-btn");

    const oldText = btn.innerHTML;

    btn.innerHTML =
        '<i class="fa-solid fa-check"></i> Wallet Copied!';

    setTimeout(() => {
        btn.innerHTML = oldText;
    }, 2000);
}

// ===========================
// WELCOME VOICE
// ===========================

function speakWelcome(username, isNewUser = false) {

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const message = isNewUser
        ? `Welcome to NoirBitcoin, ${username}.`
        : `Welcome back to NoirBitcoin, ${username}.`;

    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = 1;
    speech.volume = 1;

    // Try to use a female English voice if available
    const voices = speechSynthesis.getVoices();

    const femaleVoice = voices.find(voice =>
        voice.lang.startsWith("en") &&
        (
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("zira") ||
            voice.name.toLowerCase().includes("karen") ||
            voice.name.toLowerCase().includes("victoria")
        )
    );

    if (femaleVoice) {
        speech.voice = femaleVoice;
    }

    speechSynthesis.speak(speech);
}

// Make HTML onclick functions available

window.logout = logout;
window.toggleHistory = toggleHistory;
window.openReceive = openReceive;
window.copyFeeWallet = copyFeeWallet;
window.closeWithdrawFeeModal = closeWithdrawFeeModal;
window.closeReceive = closeReceive;
window.copyWalletAddress = copyWalletAddress;
window.shareWalletAddress = shareWalletAddress;
window.saveQRCode = saveQRCode;
window.showWithdrawalPending = showWithdrawalPending;
window.closeWithdrawModal = closeWithdrawModal;
window.closePendingModal = closePendingModal;
window.copyWallet = copyWallet;
window.investNow = investNow;
window.calculateProfit = calculateProfit;
window.confirmInvestment = confirmInvestment;
window.goToHistory = goToHistory;
