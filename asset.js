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

        const parsed =
            JSON.parse(saved);

        if (
            !parsed ||
            typeof parsed !== "object"
        ) {
            return null;
        }

        return parsed;

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


function isCacheFresh(
    cache,
    maxAge
) {

    if (
        !cache ||
        !cache.timestamp
    ) {
        return false;
    }

    return (
        Date.now() - cache.timestamp <
        maxAge
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

    let lastError = null;

    for (
        let attempt = 0;
        attempt < retries;
        attempt++
    ) {

        let timeout = null;

        try {

            const controller =
                new AbortController();


            timeout =
                setTimeout(
                    () => {
                        controller.abort();
                    },
                    15000
                );


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


            if (
                response.ok
            ) {

                return response;

            }


            let message =
                `CoinGecko error: ${response.status}`;


            if (
                response.status === 401
            ) {

                message =
                    "CoinGecko API key is invalid or unauthorized.";

            }


            if (
                response.status === 429
            ) {

                message =
                    "CoinGecko rate limit reached. Please try again shortly.";

            }


            throw new Error(
                message
            );


        } catch (error) {

            if (timeout) {
                clearTimeout(timeout);
            }


            lastError =
                error;


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
                            1500 *
                            (attempt + 1)
                        )
                );

            }

        }

    }


    throw (
        lastError ||
        new Error(
            "CoinGecko request failed."
        )
    );
}


// =========================
// LOAD ASSET
// =========================

async function loadAsset() {

    if (assetLoading) {

        console.log(
            "Asset is already loading."
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
            "ERROR: #assetHeader was not found."
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
        getCache(
            assetCacheKey
        );


    const cachedChart =
        getCache(
            chartCacheKey
        );


    // =========================
    // SHOW CACHED ASSET
    // =========================

    if (
        cachedAsset &&
        cachedAsset.data
    ) {

        try {

            displayAsset(
                cachedAsset.data,
                assetHeader,
                assetStats
            );

        } catch (error) {

            console.warn(
                "Cached asset display failed:",
                error
            );

        }

    } else {

        assetHeader.innerHTML = `

            <div style="
                width:100%;
                padding:20px;
                box-sizing:border-box;
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
        cachedChart.data &&
        chartContainer
    ) {

        try {

            createChart(
                cachedChart.data,
                chartContainer
            );

        } catch (error) {

            console.warn(
                "Cached chart failed:",
                error
            );

        }

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
                "Using fresh asset cache."
            );

        } else {

            console.log(
                "Getting fresh asset data..."
            );


            const assetUrl =
                `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;


            const response =
                await fetchWithRetry(
                    assetUrl,
                    {
                        method:
                            "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            "x-cg-demo-api-key":
                                COINGECKO_API_KEY

                        }
                    },
                    2
                );


            const asset =
                await response.json();


            if (
                !asset ||
                !asset.id
            ) {

                throw new Error(
                    "CoinGecko returned invalid asset data."
                );

            }


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


        if (
            cachedAsset &&
            cachedAsset.data
        ) {

            console.log(
                "Using cached asset because fresh request failed."
            );


            try {

                displayAsset(
                    cachedAsset.data,
                    assetHeader,
                    assetStats
                );

            } catch (displayError) {

                showAssetError(
                    assetHeader,
                    displayError
                );

            }

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
                    "Using fresh chart cache."
                );


                if (
                    cachedChart.data
                ) {

                    createChart(
                        cachedChart.data,
                        chartContainer
                    );

                }

            } else {

                console.log(
                    "Getting fresh chart data..."
                );


                const chartUrl =
                    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}/market_chart?vs_currency=usd&days=7&interval=hourly`;


                const chartResponse =
                    await fetchWithRetry(
                        chartUrl,
                        {
                            method:
                                "GET",

                            headers: {

                                "Accept":
                                    "application/json",

                                "x-cg-demo-api-key":
                                    COINGECKO_API_KEY

                            }
                        },
                        2
                    );


                const chartData =
                    await chartResponse.json();


                if (
                    !chartData ||
                    !Array.isArray(
                        chartData.prices
                    ) ||
                    !chartData.prices.length
                ) {

                    throw new Error(
                        "No chart data available."
                    );

                }


                console.log(
                    "Fresh chart loaded:",
                    chartData.prices.length,
                    "points"
                );


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


            if (
                cachedChart &&
                cachedChart.data
            ) {

                try {

                    createChart(
                        cachedChart.data,
                        chartContainer
                    );

                } catch (error) {

                    showChartError(
                        chartContainer
                    );

                }

            } else {

                showChartError(
                    chartContainer
                );

            }

        }

    }


    // =========================
    // FINISHED
    // =========================

    assetLoading = false;


    console.log(
        "Asset loading finished."
    );
}


// =========================
// DISPLAY ASSET
// =========================

function displayAsset(
    asset,
    assetHeader,
    assetStats
) {

    if (
        !asset ||
        !assetHeader
    ) {

        return;
    }


    const marketData =
        asset.market_data || {};


    // =========================
    // MARKET DATA
    // =========================

    const currentPrice =
        Number(
            marketData.current_price?.usd
        ) || 0;


    const marketCap =
        Number(
            marketData.market_cap?.usd
        ) || 0;


    const volume =
        Number(
            marketData.total_volume?.usd
        ) || 0;


    const change24h =
        Number(
            marketData.price_change_percentage_24h
        ) || 0;


    const high24h =
        Number(
            marketData.high_24h?.usd
        ) || 0;


    const low24h =
        Number(
            marketData.low_24h?.usd
        ) || 0;


    const rank =
        asset.market_cap_rank ??
        "N/A";


    // =========================
    // SUPPLY
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
    // FORMAT MONEY
    // =========================

    function formatMoney(value) {

        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(
                Number(value)
            )
        ) {

            return "N/A";
        }


        const number =
            Number(value);


        if (
            number >= 1e12
        ) {

            return (
                "$" +
                (
                    number / 1e12
                ).toFixed(2) +
                "T"
            );

        }


        if (
            number >= 1e9
        ) {

            return (
                "$" +
                (
                    number / 1e9
                ).toFixed(2) +
                "B"
            );

        }


        if (
            number >= 1e6
        ) {

            return (
                "$" +
                (
                    number / 1e6
                ).toFixed(2) +
                "M"
            );

        }


        if (
            number >= 1e3
        ) {

            return (
                "$" +
                (
                    number / 1e3
                ).toFixed(2) +
                "K"
            );

        }


        return (
            "$" +
            number.toLocaleString(
                undefined,
                {
                    maximumFractionDigits:
                        2
                }
            )
        );

    }


    // =========================
    // FORMAT SUPPLY
    // =========================

    function formatSupply(value) {

        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(
                Number(value)
            )
        ) {

            return "N/A";
        }


        const number =
            Number(value);


        if (
            number >= 1e12
        ) {

            return (
                (
                    number / 1e12
                ).toFixed(2) +
                "T"
            );

        }


        if (
            number >= 1e9
        ) {

            return (
                (
                    number / 1e9
                ).toFixed(2) +
                "B"
            );

        }


        if (
            number >= 1e6
        ) {

            return (
                (
                    number / 1e6
                ).toFixed(2) +
                "M"
            );

        }


        if (
            number >= 1e3
        ) {

            return (
                (
                    number / 1e3
                ).toFixed(2) +
                "K"
            );

        }


        return number.toLocaleString(
            undefined,
            {
                maximumFractionDigits:
                    2
            }
        );

    }


    // =========================
    // FORMAT PRICE
    // =========================

    let formattedPrice;


    if (
        currentPrice < 1
    ) {

        formattedPrice =
            currentPrice.toLocaleString(
                undefined,
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        8
                }
            );

    } else {

        formattedPrice =
            currentPrice.toLocaleString(
                undefined,
                {
                    maximumFractionDigits:
                        2
                }
            );

    }


    // =========================
    // HEADER
    // =========================

    assetHeader.innerHTML = `

       <img
    src="${
        asset.id === "bitcoin"
            ? "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
            : (
                asset.image?.large ||
                asset.image?.small ||
                ""
            )
    }"
    alt="${
        asset.name ||
        "Asset"
    }"
>

        <div>

            <div class="asset-name">

                ${
                    asset.name ||
                    "Unknown"
                }

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

                $${formattedPrice}

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
                    ${formatMoney(
                        marketCap
                    )}
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

                    ${changeSign}${
                        change24h.toFixed(2)
                    }%

                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Volume
                </div>

                <div class="stat-value">

                    ${formatMoney(
                        volume
                    )}

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

                    ${formatMoney(
                        high24h
                    )}

                </div>

            </div>


            <div class="stat-card">

                <div class="stat-title">
                    24h Low
                </div>

                <div class="stat-value">

                    ${formatMoney(
                        low24h
                    )}

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


    if (
        descriptionElement
    ) {

        let description =
            asset.description?.en ||
            "";


        description =
            description
                .replace(
                    /<[^>]*>/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        if (!description) {

            description =
                `Learn more about ${
                    asset.name ||
                    "this asset"
                } and its market data.`;

        }


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


    if (
        circulatingElement
    ) {

        circulatingElement.textContent =
            formatSupply(
                circulatingSupply
            );

    }


    if (
        totalElement
    ) {

        totalElement.textContent =
            formatSupply(
                totalSupply
            );

    }


    if (
        maxElement
    ) {

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
        String(
            currentPrice
        )
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
            "LightweightCharts is not loaded."
        );

        showChartError(
            chartContainer
        );

        return;
    }


    if (
        !chartData ||
        !Array.isArray(
            chartData.prices
        ) ||
        !chartData.prices.length
    ) {

        console.warn(
            "No chart prices available."
        );

        showChartError(
            chartContainer
        );

        return;
    }


    if (
        !chartContainer
    ) {

        return;
    }


    // =========================
    // CLEAR OLD CHART
    // =========================

    chartContainer.innerHTML = "";


    // =========================
    // PREPARE DATA
    // =========================

    const prices =
        chartData.prices
            .map(
                price => ({

                    time:
                        Math.floor(
                            Number(
                                price[0]
                            ) / 1000
                        ),

                    value:
                        Number(
                            price[1]
                        )

                })
            )
            .filter(
                item =>
                    Number.isFinite(
                        item.time
                    ) &&
                    Number.isFinite(
                        item.value
                    ) &&
                    item.value > 0
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
            "Not enough chart data."
        );

        showChartError(
            chartContainer
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
            ? "rgba(34,197,94,0.30)"
            : "rgba(239,68,68,0.30)";


    const bottomColor =
        isUp
            ? "rgba(34,197,94,0)"
            : "rgba(239,68,68,0)";


    // =========================
    // CREATE CHART
    // =========================

    let chart;


    try {

        chart =
            LightweightCharts.createChart(
                chartContainer,
                {

                    width:
                        chartContainer.clientWidth ||
                        600,

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

                            visible:
                                true,

                            color:
                                "rgba(255,255,255,0.045)"

                        },

                        horzLines: {

                            visible:
                                true,

                            color:
                                "rgba(255,255,255,0.045)"

                        }

                    },


                    // =====================
                    // PRICE SCALE
                    // =====================

                    rightPriceScale: {

                        visible:
                            true,

                        borderVisible:
                            false,

                        scaleMargins: {

                            top:
                                0.08,

                            bottom:
                                0.08

                        },

                        entireTextOnly:
                            false

                    },


                    // =====================
                    // TIME SCALE
                    // =====================

                    timeScale: {

                        visible:
                            true,

                        borderVisible:
                            false,

                        timeVisible:
                            true,

                        secondsVisible:
                            false,

                        rightOffset:
                            3,

                        barSpacing:
                            6,

                        minBarSpacing:
                            2

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

                            width:
                                1,

                            style:
                                LightweightCharts
                                    .LineStyle
                                    .Dashed,

                            visible:
                                true,

                            labelVisible:
                                false

                        },


                        horzLine: {

                            color:
                                "rgba(255,255,255,0.25)",

                            width:
                                1,

                            style:
                                LightweightCharts
                                    .LineStyle
                                    .Dashed,

                            visible:
                                true,

                            labelVisible:
                                true

                        }

                    }

                }
            );


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
        // RESIZE
        // =========================

        const resizeChart =
            () => {

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
        // RESIZE OBSERVER
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


            chartContainer
                ._resizeObserver =
                resizeObserver;

        }


        // =========================
        // STORE REFERENCES
        // =========================

        chartContainer._chart =
            chart;


        chartContainer._areaSeries =
            areaSeries;


        console.log(
            "Realistic chart created successfully."
        );


    } catch (error) {

        console.error(
            "Chart creation error:",
            error
        );


        showChartError(
            chartContainer
        );

    }

}


// =========================
// CHART ERROR
// =========================

function showChartError(
    chartContainer
) {

    if (
        !chartContainer
    ) {

        return;
    }


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


// =========================
// ASSET ERROR
// =========================

function showAssetError(
    assetHeader,
    error
) {

    if (
        !assetHeader
    ) {

        return;
    }


    assetHeader.innerHTML = `

        <div style="
            width:100%;
            padding:20px;
            box-sizing:border-box;
        ">

            <h2>
                Unable to load asset
            </h2>


            <p style="
                color:#8b949e;
                margin-top:8px;
                line-height:1.5;
            ">

                ${
                    error?.message ||
                    "Connection failed."
                }

            </p>


            <button
                onclick="retryAssetLoad()"
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
// RETRY
// =========================

function retryAssetLoad() {

    assetLoading = false;

    loadAsset();

}


// =========================
// INVEST ASSET
// =========================

function investAsset() {

    localStorage.setItem(
        "selectedInvestment",
        assetId
    );


    window.location.href =
        "investment.html";

}


// =========================
// WATCHLIST
// =========================

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


    if (
        !Array.isArray(
            watchlist
        )
    ) {

        watchlist = [];

    }


    if (
        !watchlist.includes(
            assetId
        )
    ) {

        watchlist.push(
            assetId
        );


        localStorage.setItem(
            "noirWatchlist",
            JSON.stringify(
                watchlist
            )
        );


        alert(
            "Added to Watchlist"
        );

    } else {

        alert(
            "Already in Watchlist"
        );

    }

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


        if (
            investButton
        ) {

            investButton.addEventListener(
                "click",
                () => {

                    investAsset();

                }
            );

        }

    }
);


// =========================
// START ASSET LOADING
// =========================

function startAssetPage() {

    console.log(
        "Asset page ready."
    );


    console.log(
        "Selected asset:",
        assetId
    );


    loadAsset();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAssetPage
    );

} else {

    startAssetPage();

}

// =========================
// ABOUT ASSET DROPDOWN
// =========================

function toggleAboutAsset() {

    const description =
        document.getElementById(
            "assetDescription"
        );

    const arrow =
        document.getElementById(
            "aboutAssetArrow"
        );

    const title =
        document.querySelector(
            ".asset-info-title"
        );


    if (!description) {

        console.error(
            "assetDescription element not found."
        );

        return;
    }


    // Check if currently hidden

    const isHidden =
        description.hidden;


    // =========================
    // OPEN
    // =========================

    if (isHidden) {

        description.hidden = false;

        description.classList.add(
            "about-open"
        );


        if (arrow) {

            arrow.style.transform =
                "rotate(180deg)";

        }


        if (title) {

            title.setAttribute(
                "aria-expanded",
                "true"
            );

        }


    }

    // =========================
    // CLOSE
    // =========================

    else {

        description.hidden = true;

        description.classList.remove(
            "about-open"
        );


        if (arrow) {

            arrow.style.transform =
                "rotate(0deg)";

        }


        if (title) {

            title.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }

}


console.log(
    "ABOUT DROPDOWN FUNCTION LOADED"
);

// =========================
// PREMIUM WATCHLIST
// =========================

function addToWatchlist() {

    const assetId =
        localStorage.getItem("selectedAsset");

    if (!assetId) return;

    let watchlist =
        JSON.parse(
            localStorage.getItem("watchlist")
        ) || [];

    const index =
        watchlist.indexOf(assetId);

    const button =
        document.getElementById("watchlistBtn");

    const star =
        button?.querySelector(".watchlist-star");

    const text =
        button?.querySelector(".watchlist-text");

    // Remove from watchlist
    if (index !== -1) {

        watchlist.splice(index, 1);

        localStorage.setItem(
            "watchlist",
            JSON.stringify(watchlist)
        );

        if (button) {
            button.classList.remove("watchlisted");
        }

        if (star) {
            star.textContent = "☆";
        }

        if (text) {
            text.textContent = "Watchlist";
        }

        showWatchlistToast(
            "Removed from Watchlist",
            false
        );

        return;
    }

    // Add to watchlist
    watchlist.push(assetId);

    localStorage.setItem(
        "watchlist",
        JSON.stringify(watchlist)
    );

    if (button) {
        button.classList.add("watchlisted");
    }

    if (star) {
        star.textContent = "★";
    }

    if (text) {
        text.textContent = "Watchlisted";
    }

    showWatchlistToast(
        "Added to Watchlist",
        true
    );
}


// =========================
// WATCHLIST TOAST
// =========================

function showWatchlistToast(message, added = true) {

    let toast =
        document.getElementById(
            "watchlistToast"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "watchlistToast";

        toast.className =
            "watchlist-toast";

        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <i class="fa-solid ${
            added
                ? "fa-star"
                : "fa-check"
        }"></i>
        <span>${message}</span>
    `;

    toast.classList.add("show");

    clearTimeout(
        window.watchlistToastTimer
    );

    window.watchlistToastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);
}


// =========================
// RESTORE WATCHLIST STATE
// =========================

function restoreWatchlistState() {

    const assetId =
        localStorage.getItem("selectedAsset");

    const button =
        document.getElementById("watchlistBtn");

    if (!assetId || !button) return;

    const watchlist =
        JSON.parse(
            localStorage.getItem("watchlist")
        ) || [];

    if (watchlist.includes(assetId)) {

        button.classList.add(
            "watchlisted"
        );

        const star =
            button.querySelector(
                ".watchlist-star"
            );

        const text =
            button.querySelector(
                ".watchlist-text"
            );

        if (star) {
            star.textContent = "★";
        }

        if (text) {
            text.textContent = "Watchlisted";
        }
    }
}

document.addEventListener(
    "DOMContentLoaded",
    restoreWatchlistState
);
