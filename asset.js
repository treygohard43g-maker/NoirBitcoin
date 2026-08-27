// =========================
// COINGECKO API
// =========================

const COINGECKO_API_KEY = "CG-AEbisio9spT8HodxYnx9iyHE";

const assetId =
    localStorage.getItem("selectedAsset") || "bitcoin";


// =========================
// CACHE SETTINGS
// =========================

const ASSET_CACHE_TIME = 60 * 1000;
const CHART_CACHE_TIME = 2 * 60 * 1000;

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

        console.warn("Cache read error:", error);

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

        console.warn("Cache save error:", error);
    }
}


function isCacheFresh(cache, maxAge) {

    if (!cache) {
        return false;
    }

    return (
        Date.now() - cache.timestamp < maxAge
    );
}


// =========================
// FETCH WITH RETRY
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

        let timeout;

        try {

            const controller =
                new AbortController();

            timeout = setTimeout(() => {
                controller.abort();
            }, 15000);


            const response =
                await fetch(
                    url,
                    {
                        ...options,
                        signal: controller.signal
                    }
                );


            clearTimeout(timeout);


            if (response.ok) {
                return response;
            }


            throw new Error(
                `CoinGecko error: ${response.status}`
            );


        } catch (error) {

            clearTimeout(timeout);

            lastError = error;

            console.warn(
                `CoinGecko request failed (${attempt + 1}/${retries}):`,
                error
            );


            if (
                attempt <
                retries - 1
            ) {

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

    if (assetLoading) {
        return;
    }

    assetLoading = true;


    console.log(
        "Loading asset:",
        assetId
    );


    const assetHeader =
        document.getElementById("assetHeader");

    const assetStats =
        document.getElementById("assetStats");

    const chartContainer =
        document.getElementById("chart");


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
    // GET CACHE
    // =========================

    const cachedAsset =
        getCache(assetCacheKey);

    const cachedChart =
        getCache(chartCacheKey);


    // =========================
    // SHOW CACHED ASSET
    // =========================

    if (cachedAsset) {

        displayAsset(
            cachedAsset.data,
            assetHeader,
            assetStats
        );

    } else {

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
    // SHOW CACHED CHART
    // =========================

    if (
        cachedChart &&
        chartContainer
    ) {

        createChart(
            cachedChart.data,
            chartContainer
        );
    }


    // =========================
    // LOAD ASSET INFORMATION
    // =========================

    try {

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


            setCache(
                assetCacheKey,
                asset
            );


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


        if (cachedAsset) {

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
    // LOAD CHART
    // =========================

    if (chartContainer) {

        try {

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


                setCache(
                    chartCacheKey,
                    chartData
                );


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


            if (cachedChart) {

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

    // =========================
    // BASIC MARKET DATA
    // =========================

    const marketData =
        asset.market_data || {};


    const currentPrice =
        marketData.current_price?.usd ?? 0;


    const marketCap =
        marketData.market_cap?.usd ?? 0;


    const volume =
        marketData.total_volume?.usd ?? 0;


    const change24h =
        marketData.price_change_percentage_24h ?? 0;


    const high24h =
        marketData.high_24h?.usd ?? 0;


    const low24h =
        marketData.low_24h?.usd ?? 0;


    const rank =
        asset.market_cap_rank ?? "N/A";


    // =========================
    // SUPPLY DATA
    // =========================

    const circulatingSupply =
        marketData.circulating_supply;


    const totalSupply =
        marketData.total_supply;


    const maxSupply =
        marketData.max_supply;


    // =========================
    // COLORS
    // =========================

    const changeColor =
        change24h >= 0
            ? "#22c55e"
            : "#ef4444";


    const changeSign =
        change24h > 0
            ? "+"
            : "";


    // =========================
    // FORMATTERS
    // =========================

    function formatMoney(value) {

        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(Number(value))
        ) {

            return "N/A";

        }


        const number =
            Number(value);


        if (number >= 1e12) {

            return (
                "$" +
                (number / 1e12)
                    .toFixed(2) +
                "T"
            );

        }


        if (number >= 1e9) {

            return (
                "$" +
                (number / 1e9)
                    .toFixed(2) +
                "B"
            );

        }


        if (number >= 1e6) {

            return (
                "$" +
                (number / 1e6)
                    .toFixed(2) +
                "M"
            );

        }


        if (number >= 1e3) {

            return (
                "$" +
                (number / 1e3)
                    .toFixed(2) +
                "K"
            );

        }


        return (
            "$" +
            number.toLocaleString(
                undefined,
                {
                    maximumFractionDigits: 2
                }
            )
        );

    }


    function formatSupply(value) {

        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(Number(value))
        ) {

            return "N/A";

        }


        const number =
            Number(value);


        if (number >= 1e12) {

            return (
                (number / 1e12)
                    .toFixed(2) +
                "T"
            );

        }


        if (number >= 1e9) {

            return (
                (number / 1e9)
                    .toFixed(2) +
                "B"
            );

        }


        if (number >= 1e6) {

            return (
                (number / 1e6)
                    .toFixed(2) +
                "M"
            );

        }


        return number.toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2
            }
        );

    }


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


            <div
                class="asset-price"
                style="
                    color:${changeColor};
                "
            >
                $${Number(
                    currentPrice
                ).toLocaleString(
                    undefined,
                    {
                        maximumFractionDigits:
                            currentPrice < 1
                                ? 6
                                : 2
                    }
                )}
            </div>

        </div>

    `;


    // =========================
    // MARKET STATISTICS
    // =========================

    if (assetStats) {

        assetStats.innerHTML = `

            <div class="stat-card">

                <div class="stat-title">
                    Market Cap
                </div>

                <div class="stat-value">
                    ${formatMoney(marketCap)}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Change
                </div>

                <div
                    class="stat-value"
                    style="
                        color:${changeColor};
                    "
                >
                    ${changeSign}${Number(
                        change24h
                    ).toFixed(2)}%
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Volume
                </div>

                <div class="stat-value">
                    ${formatMoney(volume)}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    Market Rank
                </div>

                <div class="stat-value">
                    #${rank}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h High
                </div>

                <div class="stat-value">
                    ${formatMoney(high24h)}
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Low
                </div>

                <div class="stat-value">
                    ${formatMoney(low24h)}
                </div>

            </div>

        `;
    }


    // =========================
    // DESCRIPTION
    // =========================

    const descriptionElement =
        document.getElementById(
            "assetDescription"
        );


    if (descriptionElement) {

        let description =
            asset.description?.en || "";


        // Remove HTML tags
        description =
            description
                .replace(/<[^>]*>/g, "")
                .replace(/\s+/g, " ")
                .trim();


        if (!description) {

            description =
                `Learn more about ${
                    asset.name || "this asset"
                } and its market data.`;

        }


        // Keep the page compact
        if (
            description.length > 600
        ) {

            description =
                description.substring(
                    0,
                    600
                ) +
                "...";

        }


        descriptionElement.textContent =
            description;

    }


    // =========================
    // SUPPLY INFORMATION
    // =========================

    const circulatingElement =
        document.getElementById(
            "circulatingSupply"
        );


    const totalElement =
        document.getElementById(
            "totalSupply"
        );


    const maxElement =
        document.getElementById(
            "maxSupply"
        );


    if (circulatingElement) {

        circulatingElement.textContent =
            formatSupply(
                circulatingSupply
            );

    }


    if (totalElement) {

        totalElement.textContent =
            formatSupply(
                totalSupply
            );

    }


    if (maxElement) {

        maxElement.textContent =
            formatSupply(
                maxSupply
            );

    }


    // =========================
    // STORE CURRENT ASSET
    // =========================

    localStorage.setItem(
        "currentAssetName",
        asset.name || ""
    );


    localStorage.setItem(
        "currentAssetSymbol",
        asset.symbol || ""
    );


    localStorage.setItem(
        "currentAssetPrice",
        String(currentPrice)
    );

}

// =========================
// CREATE REALISTIC CHART
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


    if (!chartContainer) {
        return;
    }


    // =========================
    // CLEAR OLD CHART
    // =========================

    chartContainer.innerHTML = "";


    // =========================
    // PREPARE PRICE DATA
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
                Number.isFinite(item.time) &&
                Number.isFinite(item.value)
            )
            .sort(
                (a, b) =>
                    a.time - b.time
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


    if (
        uniquePrices.length < 2
    ) {

        console.warn(
            "Not enough chart data"
        );

        return;
    }


    // =========================
    // DETERMINE DIRECTION
    // =========================

    const firstPrice =
        uniquePrices[0].value;

    const lastPrice =
        uniquePrices[
            uniquePrices.length - 1
        ].value;


    const isUp =
        lastPrice >= firstPrice;


    // =========================
    // REALISTIC COLORS
    // =========================

    const lineColor =
        isUp
            ? "#22c55e"
            : "#ef4444";


    const topColor =
        isUp
            ? "rgba(34, 197, 94, 0.30)"
            : "rgba(239, 68, 68, 0.30)";


    const bottomColor =
        isUp
            ? "rgba(34, 197, 94, 0.00)"
            : "rgba(239, 68, 68, 0.00)";


    // =========================
    // CREATE CHART
    // =========================

    const chart =
        LightweightCharts.createChart(
            chartContainer,
            {

                width:
                    chartContainer.clientWidth,

                height:
                    chartContainer.clientHeight ||
                    300,


                // =====================
                // LAYOUT
                // =====================

                layout: {

                    background: {
                        color:
                            "transparent"
                    },

                    textColor:
                        "#8b949e"

                },


                // =====================
                // GRID
                // =====================

                grid: {

                    vertLines: {

                        visible: true,

                        color:
                            "rgba(255,255,255,0.045)"

                    },

                    horzLines: {

                        visible: true,

                        color:
                            "rgba(255,255,255,0.045)"

                    }

                },


                // =====================
                // PRICE SCALE
                // =====================

                rightPriceScale: {

                    visible: true,

                    borderVisible: false,

                    scaleMargins: {

                        top: 0.08,

                        bottom: 0.08

                    },

                    entireTextOnly: false

                },


                // =====================
                // TIME SCALE
                // =====================

                timeScale: {

                    visible: true,

                    borderVisible: false,

                    timeVisible: true,

                    secondsVisible: false,

                    rightOffset: 3,

                    barSpacing: 6,

                    minBarSpacing: 2

                },

 // =====================
// CROSSHAIR
// =====================

crosshair: {

    mode:
        LightweightCharts
            .CrosshairMode
            .Normal,

    vertLine: {

        color:
            "rgba(255,255,255,0.25)",

        width: 1,

        style:
            LightweightCharts
                .LineStyle
                .Dashed,

        visible: true,

        labelVisible: false

    },

    horzLine: {

        color:
            "rgba(255,255,255,0.25)",

        width: 1,

        style:
            LightweightCharts
                .LineStyle
                .Dashed,

        visible: true,

        labelVisible: true

    }

},


    // =========================
    // AREA SERIES
    // =========================

    const areaSeries =
        chart.addAreaSeries({

            lineColor:
                lineColor,

            topColor:
                topColor,

            bottomColor:
                bottomColor,

            lineWidth:
                2,


            // =====================
            // CROSSHAIR POINT
            // =====================

            crosshairMarkerVisible:
                true,

            crosshairMarkerRadius:
                4,

            crosshairMarkerBorderColor:
               lineColor,

            crosshairMarkerBackgroundColor:
                lineColor,


// =====================
// LAST PRICE
// =====================

lastValueVisible:
    true,

priceLineVisible:
    true,

priceLineColor:
    lineColor,

priceLineWidth:
    1,

priceLineStyle:
    LightweightCharts
        .LineStyle
        .Dashed

 });


    // =========================
    // SET DATA
    // =========================

    areaSeries.setData(
        uniquePrices
    );


    // =========================
    // FIT CONTENT
    // =========================

    chart.timeScale()
        .fitContent();


    // =========================
    // RESPONSIVE RESIZE
    // =========================

    const resizeChart = () => {

        if (
            !chartContainer ||
            !chart
        ) {
            return;
        }


        const width =
            chartContainer.clientWidth;


        const height =
            chartContainer.clientHeight;


        if (
            width <= 0
        ) {
            return;
        }


        chart.applyOptions({

            width:
                width,

            height:
                height > 0
                    ? height
                    : 300

        });

    };


    window.addEventListener(
        "resize",
        resizeChart
    );


    // =========================
    // MOBILE RESIZE
    // =========================

    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        const resizeObserver =
            new ResizeObserver(
                () => {

                    resizeChart();

                }
            );


        resizeObserver.observe(
            chartContainer
        );

    }


    // =========================
    // STORE CHART REFERENCE
    // =========================

    chartContainer._chart =
        chart;

    chartContainer._areaSeries =
        areaSeries;

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
                ${
                    error?.message ||
                    "Connection failed"
                }
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
// ASSET ACTIONS
// =========================

function investAsset() {

    localStorage.setItem(
        "selectedInvestment",
        assetId
    );

    window.location.href =
        "investment.html";
}


function addToWatchlist() {

    let watchlist = [];

    try {

        watchlist =
            JSON.parse(
                localStorage.getItem(
                    "noirWatchlist"
                )
            ) || [];

    } catch (error) {

        watchlist = [];

    }


    if (!watchlist.includes(assetId)) {

        watchlist.push(assetId);

        localStorage.setItem(
            "noirWatchlist",
            JSON.stringify(watchlist)
        );

        alert("Added to Watchlist");

    } else {

        alert("Already in Watchlist");

    }

}

// =========================
// START ASSET LOADING
// =========================

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", () => {

        console.log("Asset page ready");

        loadAsset();

    });

} else {

    console.log("Asset page already ready");

    loadAsset();

}