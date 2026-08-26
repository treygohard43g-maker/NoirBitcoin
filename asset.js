// =========================
// COINGECKO API
// =========================

const COINGECKO_API_KEY = "CG-AEbisio9spT8HodxYnx9iyHE";

const assetId =
    localStorage.getItem("selectedAsset") || "bitcoin";


// =========================
// CACHE SETTINGS
// =========================

// Asset information stays fresh for 60 seconds
const ASSET_CACHE_TIME = 60 * 1000;

// Chart stays fresh for 2 minutes
const CHART_CACHE_TIME = 2 * 60 * 1000;


// Prevent multiple loads at the same time
let assetLoading = false;


// =========================
// CACHE HELPERS
// =========================

function getCache(key) {

    try {

        const saved =
            localStorage.getItem(key);

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.warn(
            "Cache read error:",
            error
        );

        return null;
    }
}


function setCache(key, data) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify({
                timestamp: Date.now(),
                data: data
            })
        );

    } catch (error) {

        console.warn(
            "Cache save error:",
            error
        );
    }
}


function isCacheFresh(cache, maxAge) {

    if (!cache) {
        return false;
    }

    return (
        Date.now() - cache.timestamp <
        maxAge
    );
}


// =========================
// FETCH WITH CONTROL
// =========================

async function fetchWithRetry(
    url,
    options = {},
    retries = 2
) {

    let lastError;

    for (
        let attempt = 0;
        attempt < retries;
        attempt++
    ) {

        try {

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 15000);


            const response =
                await fetch(
                    url,
                    {
                        ...options,
                        signal:
                            controller.signal
                    }
                );


            clearTimeout(timeout);


            if (response.ok) {
                return response;
            }


            // Rate limit or server error
            if (
                response.status === 429 ||
                response.status >= 500
            ) {

                throw new Error(
                    `CoinGecko error: ${response.status}`
                );
            }


            // Permanent error
            throw new Error(
                `CoinGecko error: ${response.status}`
            );


        } catch (error) {

            lastError = error;

            console.warn(
                `CoinGecko request failed (${attempt + 1}/${retries}):`,
                error
            );


            if (
                attempt <
                retries - 1
            ) {

                // Wait before retry
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1500 * (attempt + 1)
                        )
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

    // Prevent duplicate requests
    if (assetLoading) {
        console.log(
            "Asset already loading..."
        );
        return;
    }

    assetLoading = true;


    console.log(
        "Loading asset:",
        assetId
    );


    const assetHeader =
        document.getElementById(
            "assetHeader"
        );

    const assetStats =
        document.getElementById(
            "assetStats"
        );

    const chartContainer =
        document.getElementById(
            "chart"
        );


    if (!assetHeader) {

        console.error(
            "assetHeader element not found"
        );

        assetLoading = false;

        return;
    }


    // =========================
    // CACHE KEYS
    // =========================

    const assetCacheKey =
        `noir_asset_${assetId}`;

    const chartCacheKey =
        `noir_chart_${assetId}`;


    // =========================
    // GET CACHED DATA
    // =========================

    const cachedAsset =
        getCache(assetCacheKey);

    const cachedChart =
        getCache(chartCacheKey);


    // =========================
    // SHOW CACHED ASSET
    // =========================

    if (cachedAsset) {

        console.log(
            "Using cached asset data"
        );

        displayAsset(
            cachedAsset.data,
            assetHeader,
            assetStats
        );

    } else {

        // Initial loading message
        assetHeader.innerHTML = `

            <div style="
                padding:20px;
                color:#8b949e;
            ">
                Loading asset...
            </div>

        `;
    }


    // =========================
    // LOAD CHART FROM CACHE
    // =========================

    if (
        cachedChart &&
        chartContainer
    ) {

        console.log(
            "Using cached chart"
        );

        createChart(
            cachedChart.data,
            chartContainer
        );

    }


    // =========================
    // FETCH FRESH ASSET DATA
    // =========================

    try {

        // If cache is still fresh,
        // don't make another request.
        if (
            isCacheFresh(
                cachedAsset,
                ASSET_CACHE_TIME
            )
        ) {

            console.log(
                "Asset cache is still fresh"
            );

        } else {

            console.log(
                "Getting fresh asset data..."
            );


            const response =
                await fetchWithRetry(

                    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}`,

                    {
                        headers: {
                            "x-cg-demo-api-key":
                                COINGECKO_API_KEY
                        }
                    },

                    2
                );


            const asset =
                await response.json();


            console.log(
                "Fresh asset loaded:",
                asset
            );


            // Save asset to cache
            setCache(
                assetCacheKey,
                asset
            );


            // Display asset
            displayAsset(
                asset,
                assetHeader,
                assetStats
            );

        }


    } catch (error) {

        console.error(
            "Asset request failed:",
            error
        );


        // If we already have cached data,
        // KEEP showing it.
        if (cachedAsset) {

            console.log(
                "Using old cached asset because network failed"
            );

            displayAsset(
                cachedAsset.data,
                assetHeader,
                assetStats
            );

        } else {

            showAssetError(
                assetHeader,
                error
            );

        }

    }


    // =========================
    // CHART
    // =========================

    if (chartContainer) {

        try {

            // Don't request chart if
            // fresh cached chart exists
            if (
                isCacheFresh(
                    cachedChart,
                    CHART_CACHE_TIME
                )
            ) {

                console.log(
                    "Chart cache is still fresh"
                );

            } else {

                console.log(
                    "Getting fresh chart data..."
                );


                const chartResponse =
                    await fetchWithRetry(

                        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}/market_chart?vs_currency=usd&days=7`,

                        {
                            headers: {
                                "x-cg-demo-api-key":
                                    COINGECKO_API_KEY
                            }
                        },

                        2
                    );


                const chartData =
                    await chartResponse.json();


                if (
                    !chartData.prices ||
                    !chartData.prices.length
                ) {

                    throw new Error(
                        "No chart data available"
                    );

                }


                // Save chart
                setCache(
                    chartCacheKey,
                    chartData
                );


                // Create chart
                createChart(
                    chartData,
                    chartContainer
                );

            }


        } catch (chartError) {

            console.warn(
                "Chart request failed:",
                chartError
            );


            // If we have an older chart,
            // keep showing it.
            if (cachedChart) {

                console.log(
                    "Using old cached chart"
                );

                createChart(
                    cachedChart.data,
                    chartContainer
                );

            } else {

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
                        Your asset information is still available.

                    </div>

                `;

            }

        }

    }


    assetLoading = false;

}


// =========================
// DISPLAY ASSET
// =========================

function displayAsset(
    asset,
    assetHeader,
    assetStats
) {

    const currentPrice =
        asset.market_data
            ?.current_price
            ?.usd ?? 0;


    const marketCap =
        asset.market_data
            ?.market_cap
            ?.usd ?? 0;


    const volume =
        asset.market_data
            ?.total_volume
            ?.usd ?? 0;


    const change24h =
        asset.market_data
            ?.price_change_percentage_24h ?? 0;


    const rank =
        asset.market_cap_rank ??
        "N/A";


    // =========================
    // HEADER
    // =========================

    assetHeader.innerHTML = `

        <img
            src="${
                asset.image?.large ||
                asset.image?.small ||
                ""
            }"
            alt="${asset.name || "Asset"}"
        >

        <div>

            <div class="asset-name">
                ${asset.name || "Unknown"}
            </div>

            <div class="asset-symbol">
                ${
                    asset.symbol
                        ? asset.symbol.toUpperCase()
                        : ""
                }
            </div>

            <div class="asset-price">
                $${Number(
                    currentPrice
                ).toLocaleString()}
            </div>

        </div>

    `;


    // =========================
    // STATS
    // =========================

    if (assetStats) {

        assetStats.innerHTML = `

            <div class="stat-card">

                <div class="stat-title">
                    Market Cap
                </div>

                <div class="stat-value">
                    $${Number(
                        marketCap
                    ).toLocaleString()}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Change
                </div>

                <div class="stat-value">
                    ${Number(
                        change24h
                    ).toFixed(2)}%
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    Volume
                </div>

                <div class="stat-value">
                    $${Number(
                        volume
                    ).toLocaleString()}
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

    }

}


// =========================
// CREATE CHART
// =========================

function createChart(
    chartData,
    chartContainer
) {

    if (
        typeof LightweightCharts ===
        "undefined"
    ) {

        console.error(
            "LightweightCharts is not loaded"
        );

        return;
    }


    if (
        !chartData ||
        !chartData.prices ||
        !chartData.prices.length
    ) {

        console.warn(
            "No chart prices available"
        );

        return;
    }


    // Clear previous chart
    chartContainer.innerHTML = "";


    // =========================
    // PREPARE DATA
    // =========================

    const prices =
        chartData.prices
            .map(price => ({

                time:
                    Math.floor(
                        price[0] / 1000
                    ),

                value:
                    Number(price[1])

            }))
            .filter(item =>
                Number.isFinite(
                    item.time
                ) &&
                Number.isFinite(
                    item.value
                )
            );


    // =========================
    // REMOVE DUPLICATE TIMES
    // =========================

    const uniquePrices = [];

    const seenTimes =
        new Set();


    for (
        const item of prices
    ) {

        if (
            !seenTimes.has(
                item.time
            )
        ) {

            seenTimes.add(
                item.time
            );

            uniquePrices.push(
                item
            );

        }

    }


    if (!uniquePrices.length) {

        return;

    }


    // =========================
    // CREATE
    // =========================

    const chart =
        LightweightCharts.createChart(
            chartContainer,
            {

                width:
                    chartContainer.clientWidth,

                height:chartContainer.clientHeight || 300,

                layout: {

                background: {
                color: "transparent"
          },

                textColor: "#ffffff"

},

        grid: {

          vertLines: {
          visible: false
     },

          horzLines: {
          visible: false
    }

}
            }
        );


    // =========================
// LINE CHART
// =========================

const firstPrice =
    uniquePrices[0].value;

const lastPrice =
    uniquePrices[
        uniquePrices.length - 1
    ].value;


const lineColor =
    lastPrice >= firstPrice
        ? "#16a34a"
        : "#dc2626";


const lineSeries =
    chart.addLineSeries({

        color: lineColor,

        lineWidth: 2,

        crosshairMarkerVisible: false,

        crosshairMarkerRadius: 4,

        lastValueVisible: true,

        priceLineVisible: false

    });


lineSeries.setData(
    uniquePrices
);

    // =========================
    // RESPONSIVE
    // =========================

    window.addEventListener(
        "resize",
        () => {

            if (
                chartContainer
            ) {

                chart.applyOptions({

                    width:
                        chartContainer.clientWidth

                });

            }

        }
    );

}


// =========================
// ERROR DISPLAY
// =========================

function showAssetError(
    assetHeader,
    error
) {

    assetHeader.innerHTML = `

        <div style="
            width:100%;
        ">

            <h2>
                Unable to load asset
            </h2>

            <p style="
                color:#8b949e;
                margin-top:8px;
            ">
                ${error?.message || "Connection failed"}
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

        </div>

    `;

}


// =========================
// INVEST BUTTON
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const investButton =
            document.querySelector(
                ".invest-btn"
            );


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

// =========================
// START ASSET LOADING
// =========================

loadAsset(); xx