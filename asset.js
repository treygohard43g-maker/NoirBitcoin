// =========================
// COINGECKO API
// =========================

const COINGECKO_API_KEY = "CG-AEbisio9spT8HodxYnx9iyHE";

const assetId =
    localStorage.getItem("selectedAsset") || "bitcoin";


// =========================
// START
// =========================

loadAsset();


// =========================
// FETCH WITH RETRIES
// =========================

async function fetchWithRetry(url, options = {}, retries = 3) {

    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {

        try {

            const response = await fetch(url, options);

            if (response.ok) {
                return response;
            }

            // Retry temporary/server errors
            if (
                response.status === 429 ||
                response.status >= 500
            ) {
                throw new Error(
                    `CoinGecko error: ${response.status}`
                );
            }

            // Don't retry permanent errors
            throw new Error(
                `CoinGecko error: ${response.status}`
            );

        } catch (error) {

            lastError = error;

            console.warn(
                `Request failed. Attempt ${attempt + 1}/${retries}`,
                error
            );

            if (attempt < retries - 1) {

                const delay =
                    1000 * Math.pow(2, attempt);

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }
    }

    throw lastError;
}


// =========================
// LOAD ASSET
// =========================

async function loadAsset() {

    console.log("Loading asset:", assetId);

    const assetHeader =
        document.getElementById("assetHeader");

    const assetStats =
        document.getElementById("assetStats");

    const chartContainer =
        document.getElementById("chart");


    try {

        // =========================
        // CHECK ELEMENTS
        // =========================

        if (!assetHeader) {
            throw new Error(
                "assetHeader element not found"
            );
        }

        if (!assetStats) {
            throw new Error(
                "assetStats element not found"
            );
        }


        // =========================
        // GET ASSET DETAILS
        // =========================

        const response = await fetchWithRetry(

            `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}`,

            {
                headers: {
                    "x-cg-demo-api-key":
                        COINGECKO_API_KEY
                }
            },

            3
        );


        const asset =
            await response.json();

        console.log(
            "Asset loaded:",
            asset
        );


        // =========================
        // GET DATA SAFELY
        // =========================

        const currentPrice =
            asset.market_data?.current_price?.usd ?? 0;

        const marketCap =
            asset.market_data?.market_cap?.usd ?? 0;

        const volume =
            asset.market_data?.total_volume?.usd ?? 0;

        const change24h =
            asset.market_data
                ?.price_change_percentage_24h ?? 0;

        const rank =
            asset.market_cap_rank ?? "N/A";


        // =========================
        // ASSET HEADER
        // =========================

        assetHeader.innerHTML = `

            <img
                src="${asset.image?.large || asset.image?.small || ""}"
                alt="${asset.name || "Asset"}"
            >

            <div>

                <div class="asset-name">
                    ${asset.name || "Unknown"}
                </div>

                <div class="asset-symbol">
                    ${(asset.symbol || "").toUpperCase()}
                </div>

                <div class="asset-price">
                    $${Number(currentPrice).toLocaleString()}
                </div>

            </div>

        `;


        // =========================
        // STATS
        // =========================

        assetStats.innerHTML = `

            <div class="stat-card">

                <div class="stat-title">
                    Market Cap
                </div>

                <div class="stat-value">
                    $${Number(marketCap).toLocaleString()}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Change
                </div>

                <div class="stat-value">
                    ${Number(change24h).toFixed(2)}%
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    Volume
                </div>

                <div class="stat-value">
                    $${Number(volume).toLocaleString()}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    Rank
                </div>

                <div class="stat-value">
                    #${rank}
                </div>

            </div>

        `;


        // =========================
        // CHART
        // =========================

        if (!chartContainer) {
            console.warn(
                "Chart element not found"
            );

            return;
        }


        try {

            const chartResponse =
                await fetchWithRetry(

                    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}/market_chart?vs_currency=usd&days=7`,

                    {
                        headers: {
                            "x-cg-demo-api-key":
                                COINGECKO_API_KEY
                        }
                    },

                    3
                );


            const chartData =
                await chartResponse.json();

            console.log(
                "Chart data loaded:",
                chartData
            );


            // =========================
            // CHECK LIGHTWEIGHT CHARTS
            // =========================

            if (
                typeof LightweightCharts ===
                "undefined"
            ) {

                throw new Error(
                    "LightweightCharts library not loaded"
                );
            }


            // =========================
            // PREPARE CHART DATA
            // =========================

            const prices =
                (chartData.prices || [])
                    .map(price => ({

                        time:
                            Math.floor(
                                price[0] / 1000
                            ),

                        value:
                            Number(price[1])

                    }))
                    .filter(item =>
                        Number.isFinite(item.time) &&
                        Number.isFinite(item.value)
                    );


            if (!prices.length) {

                throw new Error(
                    "No chart data available"
                );

            }


            // =========================
            // REMOVE DUPLICATES
            // =========================

            const uniquePrices = [];

            const seenTimes = new Set();

            for (const item of prices) {

                if (!seenTimes.has(item.time)) {

                    seenTimes.add(item.time);

                    uniquePrices.push(item);

                }

            }


            // =========================
            // CLEAR OLD CHART
            // =========================

            chartContainer.innerHTML = "";


            // =========================
            // CREATE CHART
            // =========================

            const chart =
                LightweightCharts.createChart(
                    chartContainer,
                    {

                        width:
                            chartContainer.clientWidth,

                        height: 300,

                        layout: {

                            background: {
                                color: "#1B1E24"
                            },

                            textColor: "#ffffff"

                        },

                        grid: {

                            vertLines: {
                                color: "#2A2F38"
                            },

                            horzLines: {
                                color: "#2A2F38"
                            }

                        }

                    }
                );


            // =========================
            // LINE
            // =========================

            const lineSeries =
                chart.addLineSeries();


            lineSeries.setData(
                uniquePrices
            );


            // =========================
            // RESPONSIVE
            // =========================

            window.addEventListener(
                "resize",
                () => {

                    if (chartContainer) {

                        chart.applyOptions({

                            width:
                                chartContainer.clientWidth

                        });

                    }

                }
            );


        } catch (chartError) {

            // =========================
            // CHART FAILED
            // ASSET STILL WORKS
            // =========================

            console.warn(
                "Chart failed:",
                chartError
            );


            chartContainer.innerHTML = `

                <div style="
                    height:300px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    text-align:center;
                    color:#8b949e;
                    padding:20px;
                    box-sizing:border-box;
                ">

                    Chart temporarily unavailable.
                    <br>
                    Please try again in a moment.

                </div>

            `;

        }


    } catch (error) {

        // =========================
        // ASSET FAILED
        // =========================

        console.error(
            "Asset loading error:",
            error
        );


        if (assetHeader) {

            assetHeader.innerHTML = `

                <h2>
                    Unable to load asset
                </h2>

                <p style="
                    color:#8b949e;
                    margin-top:8px;
                ">
                    ${error.message}
                </p>

                <button
                    onclick="loadAsset()"
                    style="
                        margin-top:15px;
                        padding:10px 18px;
                        border:none;
                        border-radius:8px;
                        background:#f59e0b;
                        color:white;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    Try Again
                </button>

            `;

        }

    }

}


// =========================
// INVEST BUTTON
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const investButton =
            document.querySelector(".invest-btn");

        if (investButton) {

            investButton.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "selectedInvestment",
                        assetId
                    );

                    window.location.href =
                        "investment.html";

                }
            );

        }

    }
);