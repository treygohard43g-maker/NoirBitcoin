import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    setDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(auth.app);

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

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;


        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            // Save the username permanently
            // inside Firebase Authentication
            await updateProfile(user, {
                displayName: name
            });


            // Keep local copy for the dashboard
            localStorage.setItem(
                "noirUser",
                JSON.stringify({
                    uid: user.uid,
                    name: name,
                    email: email,
                    phone: phone
                })
            );


            localStorage.setItem(
                "welcomeType",
                "new"
            );


            alert("Account created successfully!");


            window.location.href =
                "login.html";


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(error.message);

        }

    });

}

    // ---------- LOGIN ----------

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;


        try {

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // Get permanent username from Firebase
            const name =
                user.displayName || "User";


            localStorage.setItem(
                "loggedIn",
                "true"
            );


            localStorage.setItem(
                "firebaseUser",
                JSON.stringify({
                    uid: user.uid,
                    email: user.email
                })
            );


            // Restore username locally
            localStorage.setItem(
                "noirUser",
                JSON.stringify({
                    uid: user.uid,
                    name: name,
                    email: user.email,
                    phone: ""
                })
            );


            if (!localStorage.getItem("welcomeType")) {

                localStorage.setItem(
                    "welcomeType",
                    "back"
                );

            }


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

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

// ---------- BALANCE CARD USER NAME ----------

const balanceUserElement = document.getElementById("balanceuserName");

if (balanceUserElement) {

    const savedUser = JSON.parse(localStorage.getItem("noirUser"));

    if (savedUser) {
        balanceUserElement.textContent = savedUser.name;
    }

}

// ---------- BALANCE ----------

const balanceElement = document.getElementById("availableBalance");

let balanceVisible = true;

let balance = 500000;
let bitcoinPrice = 0;
let showingBTC = false;
let balanceLoaded = false;

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

// =========================
// FIREBASE USER BALANCE
// =========================

async function loadUserBalance(user) {

    if (!user) {
        console.log("No Firebase user available.");
        return;
    }

    try {

        const balanceRef = doc(
            db,
            "users",
            user.uid
        );

        const balanceSnapshot =
            await getDoc(balanceRef);

        if (balanceSnapshot.exists()) {

            const userData =
                balanceSnapshot.data();

            if (typeof userData.balance === "number") {

                balance = userData.balance;

            } else {

                balance = 500000;

            }

        } else {

            // Create starting balance for this user
            balance = 500000;

            await setDoc(
                balanceRef,
                {
                    balance: balance,
                    createdAt: new Date().toISOString()
                },
                {
                    merge: true
                }
            );

        }

        // Balance is now ready
        balanceLoaded = true;

        updateBalance();

        console.log(
            "User balance loaded successfully:",
            balance
        );

    } catch (error) {

        console.error(
            "Unable to load user balance:",
            error
        );

        // Prevent the interface from being stuck forever
        balanceLoaded = true;

        updateBalance();

    }

}

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

// ---------- WITHDRAW USD / BTC CONVERSION ----------

const withdrawUSD = document.getElementById("withdrawUSD");
const withdrawBTC = document.getElementById("withdrawBTC");

function updateWithdrawBTC() {

    if (!withdrawUSD || !withdrawBTC) return;

    const usdAmount = Number(withdrawUSD.value);

    if (!usdAmount || usdAmount <= 0 || !bitcoinPrice) {
        withdrawBTC.textContent = "0.00000000";
        return;
    }

    const btcAmount = usdAmount / bitcoinPrice;

    withdrawBTC.textContent =
        btcAmount.toFixed(8);
}

if (withdrawUSD) {
    withdrawUSD.addEventListener(
        "input",
        updateWithdrawBTC
    );
}

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

// ---------- COPY DEPOSIT BITCOIN ADDRESS ----------

const copyAddress = document.getElementById("copyAddress");

if (copyAddress) {

    copyAddress.onclick = function () {

        const walletAddress =
            document.querySelector(".wallet-address").textContent.trim();

        navigator.clipboard.writeText(walletAddress)
            .then(() => {
                alert("Bitcoin address copied");
            })
            .catch(() => {
                alert("Unable to copy Bitcoin address.");
            });

    };

}

function investNow(plan) {

    // Only remember which plan the user selected.
    // The investment is NOT saved until they confirm it.
    localStorage.setItem("selectedPlan", plan);

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

    planMinimum.textContent =
        "Unlimited Investments";

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

async function confirmInvestment() {

    const amountInput =
        document.getElementById("investmentAmount");

    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid investment amount.");
        return;
    }

    // Get the currently logged-in Firebase user
    const user = auth.currentUser;

    if (!user) {
        alert("Your login session has expired. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    // Get selected investment plan
    const plan =
        localStorage.getItem("selectedPlan");

    if (!plan) {
        alert("Please select an investment plan.");
        return;
    }

    // Monthly profit rates
    const rates = {
        "Starter Plan": 5,
        "Professional Plan": 8,
        "Premium Plan": 12,
        "Diamond Plan": 20
    };

    const rate = rates[plan] || 0;

    const monthlyProfit =
        amount * (rate / 100);

    try {

        // Save investment to Firestore
        await addDoc(
            collection(db, "investments"),
            {
                userId: user.uid,

                plan: plan,

                amount: amount,

                profitRate: rate,

                monthlyProfit: monthlyProfit,

                date: new Date().toISOString(),

                status: "Active"
            }
        );

        // Show success information
        const successPlan =
            document.getElementById("successPlan");

        const successAmount =
            document.getElementById("successAmount");

        const successMessage =
            document.getElementById("successMessage");

        if (successPlan) {
            successPlan.textContent = plan;
        }

        if (successAmount) {
            successAmount.textContent =
                amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
        }

        if (successMessage) {
            successMessage.style.display = "block";
        }

        // Go back to dashboard
        setTimeout(function () {

            window.location.href =
                "dashboard.html";

        }, 2500);

    } catch (error) {

        console.error(
            "Error saving investment:",
            error
        );

        alert(
            "Unable to save your investment. Please try again."
        );
    }
}

        async function forceRepairInvestmentHistory() {

    const container =
        document.getElementById("recentHistory");

    if (!container) return;

    const user = auth.currentUser;

    if (!user) {
        console.log("No Firebase user logged in.");
        return;
    }

    try {

        // =========================
        // LOAD INVESTMENTS
        // =========================

        const investmentsQuery = query(
            collection(db, "investments"),
            where("userId", "==", user.uid)
        );

        const investmentSnapshot =
            await getDocs(investmentsQuery);

        const transactions = [];

        investmentSnapshot.forEach(function(doc) {

            transactions.push({
                id: doc.id,
                transactionType: "investment",
                ...doc.data()
            });

        });


        // =========================
        // LOAD TRADES
        // =========================

        const tradesQuery = query(
            collection(db, "trades"),
            where("userId", "==", user.uid)
        );

        const tradeSnapshot =
            await getDocs(tradesQuery);

        tradeSnapshot.forEach(function(doc) {

            transactions.push({
                id: doc.id,
                transactionType: "trade",
                ...doc.data()
            });

        });


        // =========================
        // SORT NEWEST FIRST
        // =========================

        transactions.sort(function(a, b) {

            return new Date(b.date) - new Date(a.date);

        });


        // =========================
        // CLEAR HISTORY
        // =========================

        container.innerHTML = "";


        // =========================
        // SHOW LATEST 3
        // =========================

        transactions
            .slice(0, 3)
            .forEach(function(transaction) {

                const amount =
                    Number(
                        transaction.amountUSD ??
                        transaction.amount ??
                        0
                    );


                const formattedAmount =
                    amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });


                const formattedDate =
                    transaction.date
                        ? new Date(
                            transaction.date
                        ).toLocaleString()
                        : "";


                // =========================
                // TRADE
                // =========================

                if (
                    transaction.transactionType === "trade"
                ) {

                    const isBuy =
                        transaction.type === "BUY";

                    const sign =
                        isBuy ? "-" : "+";


                    const colorClass =
                        isBuy
                            ? "history-amount-negative"
                            : "history-amount-positive";


                    const icon =
                        isBuy
                            ? "fa-bitcoin-sign"
                            : "fa-arrow-trend-up";


                    container.innerHTML += `

                    <div class="history-item">

                        <div
                            class="history-header"
                            onclick="toggleHistory(this)"
                        >

                            <div class="history-info">

                                <h3>
                                    <i class="fa-brands fa-bitcoin"></i>
                                    Bitcoin
                                </h3>

                                <p>
                                    ${isBuy ? "Bought BTC" : "Sold BTC"}
                                    • ${formattedDate}
                                </p>

                            </div>

                            <div class="history-right">

                                <span class="${colorClass}">
                                    ${sign}$${formattedAmount}
                                </span>

                                <i
                                    class="fa-solid fa-chevron-down history-chevron"
                                ></i>

                            </div>

                        </div>


                        <div class="history-details">

                            <p>
                                <span>Transaction:</span>
                                <strong>
                                    ${isBuy ? "Buy Bitcoin" : "Sell Bitcoin"}
                                </strong>
                            </p>

                            <p>
                                <span>Amount:</span>

                                <strong class="${colorClass}">
                                    ${sign}$${formattedAmount}
                                </strong>
                            </p>

                            <p>
                                <span>BTC Received:</span>

                                <strong>
                                    ${Number(
                                        transaction.btcAmount || 0
                                    ).toFixed(8)} BTC
                                </strong>
                            </p>

                            <p>
                                <span>Bitcoin Price:</span>

                                <strong>
                                    $${Number(
                                        transaction.price || 0
                                    ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </strong>
                            </p>

                            <p>
                                <span>Status:</span>

                                <strong>
                                    ${transaction.status || "Completed"}
                                </strong>
                            </p>

                            <p>
                                <span>Date:</span>

                                <strong>
                                    ${formattedDate}
                                </strong>
                            </p>

                        </div>

                    </div>

                    `;

                    return;
                }


                // =========================
                // INVESTMENT
                // =========================

                const investmentAmount =
                    Number(transaction.amount) || 0;


                const investmentFormatted =
                    investmentAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });


                container.innerHTML += `

                <div class="history-item">

                    <div
                        class="history-header"
                        onclick="toggleHistory(this)"
                    >

                        <div class="history-info">

                            <h3>
                                <i class="fa-solid fa-chart-line"></i>
                                ${transaction.plan || "Investment"}
                            </h3>

                            <p>
                                ${transaction.status || "Active"}
                                • ${formattedDate}
                            </p>

                        </div>


                        <div class="history-right">

                            <span class="history-amount-positive">
                                +$${investmentFormatted}
                            </span>

                            <i
                                class="fa-solid fa-chevron-down history-chevron"
                            ></i>

                        </div>

                    </div>


                    <div class="history-details">

                        <p>
                            <span>Investment Plan:</span>

                            <strong>
                                ${transaction.plan || "Investment"}
                            </strong>
                        </p>


                        <p>
                            <span>Amount:</span>

                            <strong class="history-detail-amount">
                                +$${investmentFormatted}
                            </strong>
                        </p>


                        <p>
                            <span>Profit Rate:</span>

                            <strong>
                                ${transaction.profitRate || 0}%
                            </strong>
                        </p>


                        <p>
                            <span>Monthly Profit:</span>

                            <strong class="history-detail-amount">
                                +$${Number(
                                    transaction.monthlyProfit || 0
                                ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </p>


                        <p>
                            <span>Status:</span>

                            <strong>
                                ${transaction.status || "Active"}
                            </strong>
                        </p>


                        <p>
                            <span>Date:</span>

                            <strong>
                                ${formattedDate}
                            </strong>
                        </p>

                    </div>

                </div>

                `;

            });


        console.log(
            "Transaction history loaded:",
            transactions
        );


    } catch (error) {

        console.error(
            "Error loading transaction history:",
            error
        );

    }

}

// ---------- BTC MARKET COLOR ----------

let btcMarketIsUp = true;

function updateBTCMarketColor(isUp) {

    btcMarketIsUp = isUp;

    const btcPriceElement =
        document.getElementById("btcPrice");

    if (btcPriceElement) {

        btcPriceElement.style.setProperty(
            "color",
            isUp ? "#22c55e" : "#ef4444",
            "important"
        );

    }
}
    
// ---------- BITCOIN CHART ----------

const chartContainer = document.getElementById("btcChart");

if (chartContainer && typeof LightweightCharts !== "undefined") {

    const chart = LightweightCharts.createChart(chartContainer, {

        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight,

        layout: {
            background: {
                 color: document.body.classList.contains("light-mode")
                     ? "#ffffff"
                     : "transparent"
            
            },
            
            textColor: document.body.classList.contains("light-mode")
                ? "#6b7280"
                : "#8b949e"
    },

        grid: {
            vertLines: {
                color: "rgba(255,255,255,0.025)"
            },

            horzLines: {
                color: "rgba(255,255,255,0.025)"
            }
        },

        rightPriceScale: {
            borderColor: "#252b33"
        },

        timeScale: {
             visible: true,
             timeVisible: true,
             secondsVisible: false
         },
        
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,

           vertLine: {
               visible: false,
               labelVisible: false
       },

           horzLine: {
               visible: false,
               labelVisible: false
     }
  }

});


   // Create Bitcoin price area chart
   const series = chart.addAreaSeries({

    lineColor: "#22c55e",

    topColor: "rgba(34, 197, 94, 0.30)",

    bottomColor: "rgba(34, 197, 94, 0)",

    lineWidth: 2,

    priceLineVisible: false,

    lastValueVisible: false

});

      window.addEventListener("resize", () => {

    chart.resize(
        chartContainer.clientWidth,
        chartContainer.clientHeight
    );

});

setTimeout(() => {

    chart.resize(
        chartContainer.clientWidth,
        chartContainer.clientHeight
    );

}, 300);

    // ---------- LOAD BITCOIN CHART DATA ----------

    async function loadChartData(days = 7) {

        try {

            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
            );

            if (!response.ok) {
                throw new Error(
                    "CoinGecko request failed: " + response.status
                );
            }

            const data = await response.json();


            if (!data.prices || !data.prices.length) {
                throw new Error("No Bitcoin chart data received");
            }


            const prices = data.prices.map(item => ({

                time: Math.floor(item[0] / 1000),

                value: Number(item[1])

            }));


            // Remove duplicate timestamps
            const uniquePrices = [];

            const seenTimes = new Set();

            prices.forEach(price => {

                if (!seenTimes.has(price.time)) {

                    seenTimes.add(price.time);

                    uniquePrices.push(price);

                }

            });


            // Determine market movement
            const firstPrice =
                uniquePrices[0].value;

            const lastPrice =
                uniquePrices[uniquePrices.length - 1].value;


            const isUp =
    lastPrice >= firstPrice;

   updateBTCMarketColor(isUp);

// Update chart colors
series.applyOptions({

    lineColor: isUp
        ? "#22c55e"
        : "#ef4444",

    topColor: isUp
        ? "rgba(34, 197, 94, 0.30)"
        : "rgba(239, 68, 68, 0.30)",

    bottomColor: isUp
        ? "rgba(34, 197, 94, 0)"
        : "rgba(239, 68, 68, 0)"

});

            series.setData(uniquePrices);


            chart.timeScale().fitContent();


            console.log(
                "Bitcoin chart loaded:",
                uniquePrices.length,
                "points"
            );


        } catch (error) {

            console.error(
                "Bitcoin chart error:",
                error
            );

        }

    }


    // Load 24-hour chart
    loadChartData(1);


    // ---------- TIME BUTTONS ----------

    document.querySelectorAll(".time-btn").forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".time-btn")
                .forEach(btn =>
                    btn.classList.remove("active")
                );


            button.classList.add("active");


            const days =
                Number(button.dataset.days);


            loadChartData(days);

        });

    });


    // ---------- CHART CROSSHAIR ----------

    chart.subscribeCrosshairMove(param => {

        if (!param.point || !param.time) return;


        const price =
            param.seriesData.get(series);


        if (!price) return;


        const chartValue =
            document.getElementById("chartValue");


        const chartDate =
            document.getElementById("chartDate");


        if (chartValue) {

            chartValue.textContent =
                "$" +
                Number(price.value).toLocaleString(
                    "en-US",
                    {
                        maximumFractionDigits: 2
                    }
                );

        }


        if (chartDate) {

            chartDate.textContent =
                new Date(
                    param.time * 1000
                ).toLocaleDateString();

        }

    });


    // ---------- RESPONSIVE CHART ----------

    function resizeBitcoinChart() {

        if (!chartContainer) return;


        chart.applyOptions({

            width:
                chartContainer.clientWidth,

            height:
                chartContainer.clientHeight || 260

        });

    }


    window.addEventListener(
        "resize",
        resizeBitcoinChart
    );


    // Update Bitcoin chart every 30 seconds
setInterval(() => {

    const activeButton = document.querySelector(".time-btn.active");

    const days = activeButton
        ? Number(activeButton.dataset.days)
        : 1;

    loadChartData(days);

}, 30000);

}

async function loadBitcoinPrice() {

    try {

        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
        );

        const data = await response.json();

        const price = Number(data.bitcoin.usd);
        
        bitcoinPrice = price;
        updateWithdrawBTC();
        
        const change24h = Number(data.bitcoin.usd_24h_change);

        const btcMovementElement =
            document.getElementById("btcMovement");

        if (btcMovementElement && Number.isFinite(change24h)) {

           const isUp = change24h >= 0;

           btcMovementElement.textContent =
                `${isUp ? "▲" : "▼"} ${isUp ? "+" : ""}${change24h.toFixed(2)}% (24h)`;

           btcMovementElement.style.color =
                 isUp ? "#22c55e" : "#ef4444";
}

        const btcPriceElement =
            document.getElementById("btcPrice");

        if (!btcPriceElement || !Number.isFinite(price)) return;

        // Display live price
        btcPriceElement.textContent =
            "$" + price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
         // Keep BTC price the same color as the chart
        btcPriceElement.style.setProperty(
        "color",
        btcMarketIsUp
            ? "#22c55e"
            : "#ef4444",
    "important"
);

    } catch (error) {

        console.error(
            "Unable to load Bitcoin price:",
            error
        );

    }

}


// Load immediately
loadBitcoinPrice();

// Update every 30 seconds
setInterval(loadBitcoinPrice, 30000);

// ---------- LIVE BALANCE ----------

// Balance remains unchanged until a real account transaction updates it.
function updateLiveBalance() {
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

    saveSettingsBtn.addEventListener("click", async function () {

        const newUsername =
            document.getElementById("newUsername").value.trim();

        const currentPassword =
            document.getElementById("oldPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Get saved user information
        let savedUser =
            JSON.parse(localStorage.getItem("noirUser")) || {};


        // ---------- UPDATE USERNAME ----------

if (newUsername !== "") {

    const currentUser = auth.currentUser;

    if (!currentUser) {

        alert("Your login session has expired. Please log in again.");
        return;

    }

    try {

        // Save username permanently in Firebase
        await updateProfile(currentUser, {
            displayName: newUsername
        });

        // Update local copy
        savedUser.name = newUsername;

        localStorage.setItem(
            "noirUser",
            JSON.stringify(savedUser)
        );

    } catch (error) {

        console.error("Username update error:", error);

        alert("Unable to update username. Please try again.");
        return;

    }

}

        // ---------- UPDATE PASSWORD ----------

        if (newPassword !== "" || confirmPassword !== "") {

            if (currentPassword === "") {

                alert("Please enter your current password.");
                return;

            }


            if (newPassword.length < 8) {

                alert(
                    "Your new password must be at least 8 characters long."
                );

                return;

            }


            if (newPassword !== confirmPassword) {

                alert("New passwords do not match.");
                return;

            }


            const currentUser = auth.currentUser;


            if (!currentUser) {

                alert(
                    "Your login session has expired. Please log in again."
                );

                return;

            }


            try {

                // Verify current password
                const credential =
                    EmailAuthProvider.credential(
                        currentUser.email,
                        currentPassword
                    );


                await reauthenticateWithCredential(
                    currentUser,
                    credential
                );


                // Update password in Firebase
                await updatePassword(
                    currentUser,
                    newPassword
                );


                alert("Account updated successfully!");


                // Clear password fields
                document.getElementById("oldPassword").value = "";
                document.getElementById("newPassword").value = "";
                document.getElementById("confirmPassword").value = "";


            } catch (error) {

                console.error("Settings error:", error);


                if (
                    error.code === "auth/wrong-password" ||
                    error.code === "auth/invalid-credential"
                ) {

                    alert("Current password is incorrect.");

                }

                else if (
                    error.code === "auth/requires-recent-login"
                ) {

                    alert(
                        "For security, please log out and log in again before changing your password."
                    );

                }

                else {

                    alert(error.message);

                }

                return;

            }

        } else {

            alert("Username updated successfully!");

        }


        // ---------- UPDATE DASHBOARD USERNAME ----------

        const balanceUserElement =
            document.getElementById("balanceuserName");


        if (balanceUserElement && savedUser.name) {

            balanceUserElement.textContent =
                savedUser.name;

        }

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
        price: "$63,800",
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
        price: "$73.77",
        movement: "-0.7%",
        status: "down",
        address: "YOUR_SOL_ADDRESS"
    },

    {
        name: "XRP",
        symbol: "XRP",
        icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
        price: "$1.06",
        movement: "+3.2%",
        status: "up",
        address: "YOUR_XRP_ADDRESS"
    }

];

// ---------- DISPLAY DIGITAL ASSETS ----------

const assetsContainer =
    document.getElementById("assetsContainer");

if (assetsContainer) {

    assets.forEach(function(asset) {

        assetsContainer.innerHTML += `

        <div
            class="asset-card"
            onclick="openAsset('${asset.symbol}')"
        >

            <img
                src="${asset.icon}"
                class="asset-icon"
                alt="${asset.name}"
            >

            <h3>
                ${asset.name} (${asset.symbol})
            </h3>

            <p
                class="asset-price"
                id="price-${asset.symbol}"
            >
                Loading...
            </p>

            <p
                class="asset-movement"
                id="movement-${asset.symbol}"
            >
                Loading...
            </p>

            <button
                class="receive-btn"
                onclick="event.stopPropagation(); openReceive('${asset.symbol}')"
            >
                Receive
            </button>

        </div>

        `;

    });

}

// ---------- LIVE DIGITAL ASSET PRICES ----------

async function loadLiveAssetPrices() {

    const coinIds = [
        "bitcoin",
        "ethereum",
        "tether",
        "solana",
        "ripple"
    ];

    try {

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_24hr_change=true`,
            {
                headers: {
                    "x-cg-demo-api-key":
                        COINGECKO_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `CoinGecko error: ${response.status}`
            );
        }

        const data = await response.json();

        const assetIds = {
            BTC: "bitcoin",
            ETH: "ethereum",
            USDT: "tether",
            SOL: "solana",
            XRP: "ripple"
        };

        assets.forEach(function(asset) {

            const coinId = assetIds[asset.symbol];

            const coin = data[coinId];

            if (!coin) return;

            const priceElement =
                document.getElementById(
                    `price-${asset.symbol}`
                );

            const movementElement =
                document.getElementById(
                    `movement-${asset.symbol}`
                );

            const price =
                coin.usd ?? 0;

            const change =
                coin.usd_24h_change ?? 0;

            if (priceElement) {

                priceElement.textContent =
                    `$${Number(price).toLocaleString(
                        undefined,
                        {
                            minimumFractionDigits:
                                price < 1 ? 2 : 2,
                            maximumFractionDigits:
                                price < 1 ? 6 : 2
                        }
                    )}`;

            }

            if (movementElement) {

                const isUp =
                    change >= 0;

                movementElement.textContent =
                    `${isUp ? "+" : ""}${change.toFixed(2)}%`;

                movementElement.classList.remove(
                    "up",
                    "down"
                );

                movementElement.classList.add(
                    isUp ? "up" : "down"
                );

            }

        });

    } catch (error) {

        console.error(
            "Live asset prices failed:",
            error
        );

    }

}


// Load prices
loadLiveAssetPrices();


// Refresh every 60 seconds
setInterval(
    loadLiveAssetPrices,
    60000
);

// ---------- PORTFOLIO STATISTICS ----------

async function updatePortfolio() {

    const totalInvestedElement =
        document.getElementById("totalInvested");

    const activePlansElement =
        document.getElementById("activePlans");

    const portfolioBalanceElement =
        document.getElementById("portfolioBalance");


    if (!totalInvestedElement) return;


    // Get currently logged-in Firebase user
    const user = auth.currentUser;

    if (!user) return;


    try {

        // Get this user's investments from Firestore
        const investmentsRef =
            collection(db, "investments");

        const investmentsQuery = query(
            investmentsRef,
            where("userId", "==", user.uid)
        );

        const snapshot =
            await getDocs(investmentsQuery);


        let totalInvested = 0;

        let totalProfit = 0;

        let activePlans = 0;


        // Calculate investments
        snapshot.forEach(function(doc) {

            const investment = doc.data();

            const amount =
                Number(investment.amount) || 0;


            // Only count active investments
            if (investment.status === "Active") {

                activePlans++;

                totalInvested += amount;


                // Use saved profit if available
                if (
                    typeof investment.monthlyProfit === "number"
                ) {

                    totalProfit +=
                        investment.monthlyProfit;

                }

                // Support older investments
                else {

                    let rate = 0;


                    if (
                        investment.plan === "Starter Plan"
                    ) {

                        rate = 5;

                    }

                    else if (
                        investment.plan === "Professional Plan"
                    ) {

                        rate = 8;

                    }

                    else if (
                        investment.plan === "Premium Plan"
                    ) {

                        rate = 12;

                    }

                    else if (
                        investment.plan === "Diamond Plan"
                    ) {

                        rate = 20;

                    }


                    totalProfit +=
                        amount * (rate / 100);

                }

            }

        });


        // ---------- TOTAL INVESTED ----------

        totalInvestedElement.textContent =
            "$" +
            totalInvested.toLocaleString("en-US", {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

            });


        // ---------- ACTIVE PLANS ----------

        if (activePlansElement) {

            activePlansElement.textContent =
                activePlans;

        }


        // ---------- PORTFOLIO BALANCE ----------

        if (portfolioBalanceElement) {

            const portfolioValue =
                balance +
                totalInvested +
                totalProfit;


            portfolioBalanceElement.textContent =
                "$" +
                portfolioValue.toLocaleString("en-US", {

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2

                });

        }
        
const allocationTotal =
    document.getElementById("allocationTotal");

if (allocationTotal) {

    allocationTotal.textContent =
        "$" +
        portfolioValue.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

}

    } catch (error) {

        console.error(
            "Error loading portfolio:",
            error
        );

    }

}

onAuthStateChanged(auth, async function(user) {

    if (!user) return;

    await loadUserBalance(user);
    
    // ---------- SYNC USERNAME FROM FIREBASE ----------

    const firebaseName = user.displayName || "User";

    let savedUser =
        JSON.parse(localStorage.getItem("noirUser")) || {};

    savedUser.uid = user.uid;
    savedUser.name = firebaseName;
    savedUser.email = user.email || savedUser.email || "";

    localStorage.setItem(
        "noirUser",
        JSON.stringify(savedUser)
    );

    // Update dashboard username
    const balanceUserElement =
        document.getElementById("balanceuserName");

    if (balanceUserElement) {
        balanceUserElement.textContent = firebaseName;
    }

    // Update portfolio and history
    updatePortfolio();
    forceRepairInvestmentHistory();

});

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
address:"0xe081017b467b01Ed4b5Dc7216d6e326d6Be54E92",
network:"TRC20 Network",
icon:"https://cryptologos.cc/logos/tether-usdt-logo.png"
},

SOL:{
address:"VMtJj7dRKPs25yr7Z5gxoiAkZfMrqnJ9xwuvAuQK5nY",
network:"Solana Network",
icon:"https://cryptologos.cc/logos/solana-sol-logo.png"
},

XRP:{
address:"rfKitJiPQeaQLEwb8BmnujABKBTvKB49m6",
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

    const amount = document.getElementById("withdrawUSD").value.trim();
    const wallet = document.getElementById("withdrawWallet").value.trim();

    const numericAmount = Number(amount);

    if (
    amount === "" ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    wallet === ""
) {
    alert("Please enter a valid withdrawal amount and your Bitcoin wallet address.");
    return;
}

if (numericAmount > balance) {
    alert("Insufficient available balance.");
    return;
}

    document.getElementById("withdrawModal").style.display = "none";

    document.getElementById("pendingModal").style.display = "flex";
}

function closeWithdrawModal() {
    document.getElementById("withdrawModal").style.display = "none";
}

function closePendingModal() {
    document.getElementById("pendingModal").style.display = "none";
}

function copyWallet() {

    const walletElement =
        document.getElementById("btcWallet");

    if (!walletElement) return;

    const wallet =
        walletElement.textContent.trim();

    navigator.clipboard.writeText(wallet)
        .then(() => {

            const btn =
                document.querySelector(".copy-wallet-btn");

            if (!btn) return;

            const oldText = btn.innerHTML;

            btn.innerHTML =
                '<i class="fa-solid fa-check"></i> Wallet Copied!';

            setTimeout(() => {
                btn.innerHTML = oldText;
            }, 2000);

        })
        .catch(() => {

            alert("Unable to copy wallet address.");

        });

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

document.addEventListener("DOMContentLoaded", () => {
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    if (!profileBtn || !profileMenu) return;
    
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            profileMenu.classList.remove("show");
        }
    });
});

function openAsset(symbol) {

    const asset = assets.find(function(item) {
        return item.symbol === symbol;
    });

    if (!asset) return;

    const assetIds = {
        BTC: "bitcoin",
        ETH: "ethereum",
        USDT: "tether",
        SOL: "solana",
        XRP: "ripple"
    };

    const coinId = assetIds[symbol];

    if (!coinId) return;

    localStorage.setItem(
        "selectedAsset",
        coinId
    );

    window.location.href = "asset.html";
}

window.openAsset = openAsset;

// =========================
// PORTFOLIO ALLOCATION
// =========================

function updatePortfolioAllocation() {

    const allocationTotal =
        document.getElementById("allocationTotal");

    if (!allocationTotal) return;

    const totalPortfolio = balance;

    allocationTotal.textContent =
        "$" + totalPortfolio.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

    // Current allocation
    const bitcoinPercent = 50;
    const ethereumPercent = 25;
    const solanaPercent = 15;
    const otherPercent = 10;

    const bitcoinElement =
        document.getElementById("bitcoinAllocation");

    const ethereumElement =
        document.getElementById("ethereumAllocation");

    const solanaElement =
        document.getElementById("solanaAllocation");

    const otherElement =
        document.getElementById("otherAllocation");

    if (bitcoinElement)
        bitcoinElement.textContent = bitcoinPercent + "%";

    if (ethereumElement)
        ethereumElement.textContent = ethereumPercent + "%";

    if (solanaElement)
        solanaElement.textContent = solanaPercent + "%";

    if (otherElement)
        otherElement.textContent = otherPercent + "%";
}

updatePortfolioAllocation();

// =========================
// PORTFOLIO ALLOCATION TOGGLE
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const card = document.getElementById("portfolioAllocationCard");
    const details = document.getElementById("allocationDetails");

    if (!card || !details) return;

    card.addEventListener("click", function () {

        card.classList.toggle("allocation-open");

    });

});

// =========================
// NOIRBITCOIN TRADING
// =========================

async function executeTrade(type) {

    const amountInput =
        document.getElementById("tradeAmount");

    if (!amountInput) return;

    const amount = Number(amountInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {

        alert("Please enter a valid amount.");

        return;
    }

    const user = auth.currentUser;

    if (!user) {

        alert(
            "Your login session has expired. Please log in again."
        );

        window.location.href = "login.html";

        return;
    }

    if (!balanceLoaded) {

        alert(
            "Your balance is still loading. Please try again."
        );

        return;
    }

    if (!bitcoinPrice || bitcoinPrice <= 0) {

        alert(
            "Bitcoin price is unavailable. Please try again."
        );

        return;
    }

    // =========================
    // BUY
    // =========================

    if (type === "BUY") {

        if (amount > balance) {

            alert("Insufficient available balance.");

            return;
        }

    }

    // =========================
    // SELL
    // =========================

    if (type === "SELL") {

        alert(
            "Sell trading will be connected after the Bitcoin holdings system is added."
        );

        return;
    }

    const btcAmount =
        amount / bitcoinPrice;

    const balanceRef =
        doc(db, "users", user.uid);

    try {

        await runTransaction(
            db,
            async (transaction) => {

                const balanceSnapshot =
                    await transaction.get(balanceRef);

                let currentBalance = 0;

                if (balanceSnapshot.exists()) {

                    currentBalance =
                        Number(
                            balanceSnapshot.data().balance
                        ) || 0;

                }

                if (amount > currentBalance) {

                    throw new Error(
                        "INSUFFICIENT_BALANCE"
                    );

                }

                const newBalance =
                    currentBalance - amount;

                transaction.set(
                    balanceRef,
                    {
                        balance: newBalance,
                        updatedAt:
                            new Date().toISOString()
                    },
                    {
                        merge: true
                    }
                );

            }
        );

        // Update local balance immediately
        balance -= amount;

        updateBalance();

        // =========================
        // SAVE TRADE HISTORY
        // =========================

        await addDoc(
            collection(db, "trades"),
            {
                userId: user.uid,

                type: "BUY",

                asset: "Bitcoin",

                symbol: "BTC",

                amountUSD: amount,

                btcAmount: btcAmount,

                price: bitcoinPrice,

                date: new Date().toISOString(),

                status: "Completed"
            }
        );

        amountInput.value = "";

        alert(
            `Bitcoin purchased successfully!\n\n` +
            `Amount: $${amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}\n` +
            `BTC: ${btcAmount.toFixed(8)}\n` +
            `Price: $${bitcoinPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`
        );

    } catch (error) {

    console.error("TRADE ERROR:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.message === "INSUFFICIENT_BALANCE") {

        alert("Insufficient available balance.");

    } else {

        alert(
            "Trade failed:\n\n" +
            (error.message || "Unknown error")
        );

    }

  }

}

// =========================
// BUY BUTTON
// =========================

const tradeBuyButton =
    document.getElementById("buyBtn");

if (tradeBuyButton) {

    tradeBuyButton.addEventListener(
        "click",
        function () {

            executeTrade("BUY");

        }
    );

}


// =========================
// SELL BUTTON
// =========================

const tradeSellButton =
    document.getElementById("sellBtn");

if (tradeSellButton) {

    tradeSellButton.addEventListener(
        "click",
        function () {

            executeTrade("SELL");

        }
    );

}


// Make trading function available globally
window.executeTrade = executeTrade;

// =========================
// PROFILE PHOTO
// =========================

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const profilePhoto =
    document.getElementById("profilePhoto");

const profilePhotoPlaceholder =
    document.getElementById("profilePhotoPlaceholder");

const profileDisplayName =
    document.getElementById("profileDisplayName");

const profileDisplayEmail =
    document.getElementById("profileDisplayEmail");


// Load saved profile photo
function loadProfilePhoto() {

    const savedPhoto =
        localStorage.getItem("noirProfilePhoto");

    if (!savedPhoto) return;

    if (profilePhoto) {

        profilePhoto.src = savedPhoto;
        profilePhoto.style.display = "block";

    }

    if (profilePhotoPlaceholder) {

        profilePhotoPlaceholder.style.display = "none";

    }

}


// Display logged-in user's information
function loadProfileInformation() {

    const savedUser =
        JSON.parse(
            localStorage.getItem("noirUser")
        );

    if (!savedUser) return;

    if (profileDisplayName) {

        profileDisplayName.textContent =
            savedUser.name || "User";

    }

    if (profileDisplayEmail) {

        profileDisplayEmail.textContent =
            savedUser.email || "";

    }

}


// Select profile photo
if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        function () {

            const file =
                profilePhotoInput.files[0];

            if (!file) return;


            // Make sure it is an image
            if (!file.type.startsWith("image/")) {

                alert("Please select an image.");

                return;

            }


            const reader =
                new FileReader();


            reader.onload = function (event) {

    const image = new Image();

    image.onload = function () {

        const canvas = document.createElement("canvas");

        const maxSize = 500;

        let width = image.width;
        let height = image.height;

        // Resize large photos
        if (width > height) {

            if (width > maxSize) {

                height =
                    height * (maxSize / width);

                width = maxSize;

            }

        } else {

            if (height > maxSize) {

                width =
                    width * (maxSize / height);

                height = maxSize;

            }

        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
            canvas.getContext("2d");

        ctx.drawImage(
            image,
            0,
            0,
            width,
            height
        );

        // Compress the image
        const photoData =
            canvas.toDataURL(
                "image/jpeg",
                0.75
            );


        // Save compressed photo
        try {

            localStorage.setItem(
                "noirProfilePhoto",
                photoData
            );

        } catch (error) {

            console.error(
                "Unable to save profile photo:",
                error
            );

            alert(
                "This photo is too large. Please choose another photo."
            );

            return;

        }


        // Display photo immediately
        if (profilePhoto) {

            profilePhoto.src =
                photoData;

            profilePhoto.style.display =
                "block";

        }


        if (profilePhotoPlaceholder) {

            profilePhotoPlaceholder.style.display =
                "none";

        }

    };

    image.src = event.target.result;

};

            reader.readAsDataURL(file);

        }
    );

}


// Load profile when page opens
loadProfilePhoto();
loadProfileInformation();

// =========================
// HEADER PROFILE PHOTO
// =========================

function loadHeaderProfilePhoto() {

    const savedPhoto =
        localStorage.getItem("noirProfilePhoto");

    const photo =
        document.getElementById("headerProfilePhoto");

    const icon =
        document.getElementById("headerProfileIcon");

    if (!photo || !icon) return;

    if (savedPhoto) {

        photo.src = savedPhoto;

        photo.style.display = "block";

        icon.style.display = "none";

    } else {

        photo.style.display = "none";

        icon.style.display = "block";

    }

}

loadHeaderProfilePhoto();

// =========================
// PROFILE ACCOUNT DETAILS
// =========================

function updateProfileAccountDetails(user) {

    if (!user) return;

    const name =
        document.getElementById("profileInfoName");

    const email =
        document.getElementById("profileInfoEmail");

    const accountId =
        document.getElementById("profileInfoId");


    if (name) {

        name.textContent =
            user.displayName || "User";

    }


    if (email) {

        email.textContent =
            user.email || "—";

    }


    if (accountId) {

        accountId.textContent =
            user.uid
                ? user.uid.substring(0, 12) + "..."
                : "—";

    }

}


// Wait for Firebase authentication
onAuthStateChanged(auth, function(user) {

    if (!user) return;

    updateProfileAccountDetails(user);

});

// =========================
// PROFILE PHOTO VIEWER
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const profilePhotoBtn = document.getElementById("profilePhotoBtn");
    const viewer = document.getElementById("profilePhotoViewer");
    const viewerImage = document.getElementById("profilePhotoViewerImage");
    const viewerPlaceholder = document.getElementById("profilePhotoViewerPlaceholder");
    const headerPhoto = document.getElementById("headerProfilePhoto");

    if (!profilePhotoBtn || !viewer) return;

    profilePhotoBtn.addEventListener("click", () => {

        const photo = headerPhoto ? headerPhoto.src : "";

        if (photo && photo !== window.location.href) {

            viewerImage.src = photo;
            viewerImage.style.display = "block";
            viewerPlaceholder.style.display = "none";

        } else {

            viewerImage.src = "";
            viewerImage.style.display = "none";
            viewerPlaceholder.style.display = "flex";

        }

        viewer.style.display = "flex";

    });


    // Tap anywhere on the viewer to close
    viewer.addEventListener("click", () => {

        viewer.style.display = "none";

        viewerImage.src = "";

    });

});