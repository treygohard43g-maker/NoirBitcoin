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
        asset.market_cap_rank ?? "N/A";


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
                Number.isFinite(item.time) &&
                Number.isFinite(item.value)
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
    // PRICE DIRECTION
    // =========================

    const firstPrice =
        uniquePrices[0].value;

    const lastPrice =
        uniquePrices[
            uniquePrices.length - 1
        ].value;


    const lineColor =
        lastPrice >= firstPrice
            ? "#22c55e"
            : "#dc2626";


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
                        color: "transparent"
                    },

                    textColor: "#ffffff"

                },

                rightPriceScale: {

                    visible: true,

                    borderVisible: false,

                    scaleMargins: {
                        top: 0.15,
                        bottom: 0.15
                    }

                },

                timeScale: {

                    visible: true,

                    borderVisible: false,

                    timeVisible: false,

                    secondsVisible: false

                },

                crosshair: {

                    mode:
                        LightweightCharts
                            .CrosshairMode
                            .Normal,

                    vertLine: {

                        visible: true,

                        labelVisible: false

                    },

                    horzLine: {

                        visible: true,

                        labelVisible: true

                    }

                }

            }
        );


    // =========================
    // LINE SERIES
    // =========================

    const lineSeries =
        chart.addLineSeries({

            color: lineColor,

            lineWidth: 2,

            crosshairMarkerVisible: false,

            crosshairMarkerRadius: 4,

            lastValueVisible: false,

            priceLineVisible: false

        });


    lineSeries.setData(
        uniquePrices
    );


    chart.timeScale().fitContent();


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

                chart.timeScale().fitContent();
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
// START ASSET LOADING
// =========================

loadAsset();