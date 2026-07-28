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

const welcomeUser = document.getElementById("welcomeUser");

if (welcomeUser) {

    const savedUser = JSON.parse(localStorage.getItem("noirUser"));

    if (savedUser) {

        welcomeUser.innerHTML = "Welcome, " + savedUser.name + " 👋";

    }

}



// ---------- BALANCE ----------

const balanceElement = document.getElementById("availableBalance");

let balanceVisible = true;

const startingBalance = "$500,000.00";

if (balanceElement) {

    balanceElement.innerHTML = startingBalance;

}



// ---------- HIDE / SHOW BALANCE ----------

const toggleBalance = document.getElementById("toggleBalance");

if (toggleBalance && balanceElement) {

    toggleBalance.addEventListener("click", function () {

        if (balanceVisible) {

            balanceElement.innerHTML = "••••••••";

            toggleBalance.innerHTML = "👁 Show Balance";

            balanceVisible = false;

        } else {

            balanceElement.innerHTML = startingBalance;

            toggleBalance.innerHTML = "👁 Hide Balance";

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



<!-- Withdraw Popup -->

<div id="withdrawModal" class="modal">

    <div class="modal-content">

        <span class="close" id="closeWithdraw">
            &times;
        </span>

        <h2>Withdraw Bitcoin</h2>

        <p>Enter withdrawal details</p>


        <input 
        type="number" 
        id="withdrawAmount" 
        placeholder="Amount in BTC">


        <input 
        type="text" 
        id="withdrawWallet" 
        placeholder="Bitcoin wallet address">


        <button id="confirmWithdraw">
            Confirm Withdrawal
        </button>


        <p class="notice">
            Withdrawal request will be processed.
        </p>

    </div>

</div>



// ---------- LOGOUT ----------

function logout() {

    localStorage.removeItem("loggedIn");

    window.location.href = "login.html";

}

// Deposit Popup

const depositBtn = document.getElementById("depositBtn");

const depositModal = document.getElementById("depositModal");

const closeDeposit = document.getElementById("closeDeposit");


if(depositBtn){

depositBtn.onclick = function(){

depositModal.style.display = "flex";

}

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

                                                        
