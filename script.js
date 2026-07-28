// Bitcoin Investment Hub - JavaScript

// Investment Plans
const investmentPlans = [
  {
    id: 1,
    name: "Starter",
    minimumBTC: 0.01,
    monthlyReturn: 5,
    duration: 3,
    description: "Perfect for beginners",
    features: ["Daily returns", "Basic support", "Flexible withdrawal"]
  },
  {
    id: 2,
    name: "Professional",
    minimumBTC: 0.1,
    monthlyReturn: 8,
    duration: 6,
    description: "For serious investors",
    features: ["Daily returns", "Priority support", "Advanced analytics", "Early withdrawal option"]
  },
  {
    id: 3,
    name: "Premium",
    minimumBTC: 0.5,
    monthlyReturn: 12,
    duration: 12,
    description: "Maximum returns",
    features: ["Daily returns", "24/7 VIP support", "Personal manager", "Bonus rewards program"]
  }
];

// Portfolio array to store investments
let portfolio = [];

// Current Bitcoin price (simulated)
let currentBTCPrice = 42500;

// Display Investment Plans
function displayPlans() {
  const plansContainer = document.getElementById("plansContainer");
  plansContainer.innerHTML = "";

  investmentPlans.forEach(plan => {
    const planDiv = document.createElement("div");
    planDiv.className = plan.id === 3 ? "plan premium" : "plan";

    const calculateReturn = (btc) => (btc * currentBTCPrice * plan.monthlyReturn / 100).toFixed(2);

    planDiv.innerHTML = `
      <div class="plan-name">${plan.name}</div>
      <div class="plan-return">${plan.monthlyReturn}% Monthly Return</div>
      <div class="plan-duration">Duration: ${plan.duration} Months</div>
      <div class="plan-minimum">Minimum: ${plan.minimumBTC} BTC</div>
      <div class="plan-description">${plan.description}</div>
      <div class="plan-features">
        <ul>
          ${plan.features.map(feature => `<li>${feature}</li>`).join("")}
        </ul>
      </div>
      <button class="btn" onclick="selectPlan(${plan.id})">Select Plan</button>
    `;

    plansContainer.appendChild(planDiv);
  });

  // Update plan select dropdown
  updatePlanSelect();
}

// Update Plan Select Dropdown
function updatePlanSelect() {
  const planSelect = document.getElementById("planSelect");
  planSelect.innerHTML = '<option value="">-- Choose a Plan --</option>';

  investmentPlans.forEach(plan => {
    const option = document.createElement("option");
    option.value = plan.id;
    option.textContent = `${plan.name} - ${plan.monthlyReturn}% Monthly (Min: ${plan.minimumBTC} BTC)`;
    planSelect.appendChild(option);
  });
}

// Select Plan (scroll to form)
function selectPlan(planId) {
  document.getElementById("planSelect").value = planId;
  document.querySelector(".investment-form").scrollIntoView({ behavior: "smooth" });
}

// Handle Investment Form Submission
document.getElementById("investmentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const planId = parseInt(document.getElementById("planSelect").value);
  const btcAmount = parseFloat(document.getElementById("btcAmount").value);
  const walletAddress = document.getElementById("walletAddress").value;
  const email = document.getElementById("email").value;

  // Find selected plan
  const selectedPlan = investmentPlans.find(p => p.id === planId);

  // Validation
  if (!selectedPlan) {
    showMessage("Please select a plan", "error");
    return;
  }

  if (btcAmount < selectedPlan.minimumBTC) {
    showMessage(`Minimum investment for ${selectedPlan.name} is ${selectedPlan.minimumBTC} BTC`, "error");
    return;
  }

  if (btcAmount <= 0) {
    showMessage("Please enter a valid amount", "error");
    return;
  }

  if (!walletAddress || !email) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  // Add to portfolio
  const investment = {
    id: portfolio.length + 1,
    planName: selectedPlan.name,
    btcAmount: btcAmount,
    usdAmount: (btcAmount * currentBTCPrice).toFixed(2),
    monthlyReturn: selectedPlan.monthlyReturn,
    duration: selectedPlan.duration,
    investmentDate: new Date().toLocaleDateString(),
    walletAddress: walletAddress,
    email: email
  };

  portfolio.push(investment);
  const transaction =
document.createElement("div");

transaction.className = "transaction";

transaction.innerHTML = `

<strong>${investment.planName}</strong><br>

BTC: ${investment.btcAmount}<br>

Value: $${investment.usdAmount}<br>

${investment.investmentDate}

`;

if(transactionList.innerHTML.includes("No transactions")){

transactionList.innerHTML="";

}

transactionList.prepend(transaction);
activeInvestments++;

totalDeposits += Number(investment.usdAmount);

updateDashboardStats();
  // Show success message
  showMessage(`Successfully invested ${btcAmount} BTC in ${selectedPlan.name} plan!`, "success");

  // Reset form
  document.getElementById("investmentForm").reset();

  // Update portfolio display
  updatePortfolio();
const percent =
((portfolioBalance-100000)/100000*100);

document.getElementById("profitPercent").innerHTML=

percent.toFixed(2)+"%";
  // Clear message after 5 seconds
  setTimeout(() => {
    document.getElementById("message").classList.remove("success");
  }, 5000);
});

// Show Message
function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
}

// Update Portfolio Display
function updatePortfolio() {
  const portfolioContainer = document.getElementById("portfolioContainer");

  if (portfolio.length === 0) {
    portfolioContainer.innerHTML = '<p style="color: #999; text-align: center;">No investments yet. Start investing today!</p>';
    return;
  }

  let totalValue = 0;
  let totalReturn = 0;

  let portfolioHTML = "";

  portfolio.forEach((investment, index) => {
    const monthlyReturnUSD = (parseFloat(investment.usdAmount) * investment.monthlyReturn / 100).toFixed(2);
    const totalReturnProjected = (monthlyReturnUSD * investment.duration).toFixed(2);

    totalValue += parseFloat(investment.usdAmount);
    totalReturn += parseFloat(totalReturnProjected);

    portfolioHTML += `
      <div class="portfolio-item">
        <div class="portfolio-info">
          <div class="portfolio-name">${investment.planName} Plan - ${investment.btcAmount} BTC</div>
          <div class="portfolio-amount">
            Invested: $${investment.usdAmount} USD | Date: ${investment.investmentDate}
          </div>
        </div>
        <div class="portfolio-value">
          <div class="portfolio-value-amount">$${investment.usdAmount}</div>
          <div class="portfolio-value-return">+$${totalReturnProjected} (${investment.duration} months)</div>
        </div>
      </div>
    `;
  });

  portfolioHTML += `
    <div class="portfolio-item">
      <div class="portfolio-info">
        <div class="portfolio-name">Total Portfolio Value</div>
        <div class="portfolio-amount">Projected earnings over investment period</div>
      </div>
      <div class="portfolio-value">
        <div class="portfolio-value-amount">$${totalValue.toFixed(2)}</div>
        <div class="portfolio-value-return">+$${totalReturn.toFixed(2)} Total Return</div>
      </div>
    </div>
  `;

  portfolioContainer.innerHTML = portfolioHTML;
}

// Simulate Bitcoin Price Updates
function updateBitcoinPrice() {
  const change = (Math.random() - 0.5) * 1000;
  currentBTCPrice += change;

  const pricePercentage = ((change / (currentBTCPrice - change)) * 100).toFixed(2);
  const direction = change > 0 ? "↑" : "↓";
  const changeClass = change > 0 ? "positive" : "negative";

  document.getElementById("btcPrice").textContent = "$" + currentBTCPrice.toFixed(2);
  document.getElementById("priceChange").className = `price-change ${changeClass}`;
  document.getElementById("priceChange").textContent = `${direction} ${Math.abs(pricePercentage)}%`;
  document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString();
}

// Update Bitcoin price every 5 seconds
setInterval(updateBitcoinPrice, 5000);

// Initialize page
displayPlans();

// Portfolio Balance

let portfolioBalance = 100000;

const balanceElement =
document.getElementById("portfolioBalance");

const statusElement =
document.getElementById("balanceStatus");

function updatePortfolio(){

let randomMove =
Math.floor(Math.random()*2000)-1000;

portfolioBalance += randomMove;

if(portfolioBalance<0){

portfolioBalance=0;

}

balanceElement.innerHTML="$"+
portfolioBalance.toLocaleString();

if(randomMove>0){

statusElement.innerHTML="▲ Profit +$"+
randomMove;

statusElement.style.color="green";

}

else if(randomMove<0){

statusElement.innerHTML="▼ Loss -$"+
Math.abs(randomMove);

statusElement.style.color="red";

}

else{

statusElement.innerHTML="No Change";

statusElement.style.color="gray";

}

}

setInterval(updatePortfolio,3000);

let availableBalance = 100000;

let totalProfit = 0;

let activeInvestments = 1;

let totalDeposits = 100000;

const availableBalanceElement =
document.getElementById("availableBalance");

const totalProfitElement =
document.getElementById("totalProfit");

const activeInvestmentsElement =
document.getElementById("activeInvestments");

const totalDepositsElement =
document.getElementById("totalDeposits");

function updateDashboardStats(){

const change =
Math.floor(Math.random()*4000)-2000;

availableBalance += change;

if(availableBalance<0){

availableBalance=0;

}

if(change>0){

totalProfit += change;

}

availableBalanceElement.innerHTML=
"$"+availableBalance.toLocaleString();

totalProfitElement.innerHTML=
"$"+totalProfit.toLocaleString();

activeInvestmentsElement.innerHTML=
activeInvestments;

totalDepositsElement.innerHTML=
"$"+totalDeposits.toLocaleString();

}

setInterval(updateDashboardStats,3000);

let btcPrice = 118650;

const btcPriceElement =
document.getElementById("btcPrice");

const btcMovementElement =
document.getElementById("btcMovement");

function updateBitcoinPrice(){

let change =
Math.floor(Math.random()*2000)-1000;

btcPrice += change;

btcPriceElement.innerHTML =
"$"+btcPrice.toLocaleString();

if(change>0){

btcMovementElement.innerHTML =
"▲ Bitcoin +$"+change;

btcMovementElement.style.color =
"#22c55e";

}

else{

btcMovementElement.innerHTML =
"▼ Bitcoin -$"+Math.abs(change);

btcMovementElement.style.color =
"#ef4444";

}

}

setInterval(updateBitcoinPrice,5000);

const transactionList =
document.getElementById("transactionList");

const investors = [

"John - USA",

"Michael - Canada",

"David - UK",

"Sarah - Australia",

"James - Germany",

"Emily - France",

"William - Spain",

"Daniel - Italy",

"Olivia - Netherlands",

"Sophia - Sweden"

];

const investments = [

5000,

10000,

15000,

20000,

25000,

35000,

50000,

75000,

100000

];

const notification =
document.getElementById("liveNotification");

function showNotification(){

const person =
investors[Math.floor(Math.random()*investors.length)];

const amount =
investments[Math.floor(Math.random()*investments.length)];

notification.innerHTML=`

<strong>${person}</strong><br>

Just invested <strong>$${amount.toLocaleString()}</strong>

`;

notification.style.display="block";

setTimeout(function(){

notification.style.display="none";

},4000);

}

setInterval(showNotification,8000);

document
.getElementById("depositBtn")
.addEventListener("click", function(){

alert("Deposit feature coming soon.");

});

document
.getElementById("withdrawBtn")
.addEventListener("click", function(){

alert("Withdraw feature coming soon.");

});