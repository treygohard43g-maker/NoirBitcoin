const COINGECKO_API_KEY = "CG-AEbisio9spT8HodxYnx9iyHE";

const assetId = localStorage.getItem("selectedAsset") || "bitcoin";

loadAsset();

async function loadAsset() {

    try {

        console.log("Loading asset:", assetId);

        // =========================
        // GET ASSET DETAILS
        // =========================

        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}`,
            {
                headers: {
                    "x-cg-demo-api-key": COINGECKO_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `CoinGecko error: ${response.status}`
            );
        }

        const asset = await response.json();

        console.log("Asset loaded:", asset);


        // =========================
        // ASSET HEADER
        // =========================

        const assetHeader = document.getElementById("assetHeader");

        if (!assetHeader) {
            throw new Error("assetHeader element not found");
        }

        assetHeader.innerHTML = `
            <img 
                src="${asset.image?.large || asset.image?.small || ""}" 
                alt="${asset.name}"
            >

            <div>
                <div class="asset-name">
                    ${asset.name}
                </div>

                <div class="asset-symbol">
                    ${asset.symbol.toUpperCase()}
                </div>

                <div class="asset-price">
                    $${Number(
                        asset.market_data.current_price.usd
                    ).toLocaleString()}
                </div>
            </div>
        `;


        // =========================
        // STATS
        // =========================

        const assetStats = document.getElementById("assetStats");

        if (!assetStats) {
            throw new Error("assetStats element not found");
        }

        const marketCap =
            asset.market_data.market_cap?.usd ?? 0;

        const volume =
            asset.market_data.total_volume?.usd ?? 0;

        const change24h =
            asset.market_data.price_change_percentage_24h ?? 0;

        const rank =
            asset.market_cap_rank ?? "N/A";

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
        // GET CHART DATA
        // =========================

        const chartResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(assetId)}/market_chart?vs_currency=usd&days=7`,
            {
                headers: {
                    "x-cg-demo-api-key": COINGECKO_API_KEY
                }
            }
        );

        if (!chartResponse.ok) {
            throw new Error(
                `Chart error: ${chartResponse.status}`
            );
        }

        const chartData = await chartResponse.json();

        console.log("Chart data loaded:", chartData);


        // =========================
        // CREATE CHART
        // =========================

        const chartContainer =
            document.getElementById("chart");

        if (!chartContainer) {
            throw new Error("chart element not found");
        }

        if (
            typeof LightweightCharts === "undefined"
        ) {
            throw new Error(
                "LightweightCharts library not loaded"
            );
        }

        const chart = LightweightCharts.createChart(
            chartContainer,
            {
                width: chartContainer.clientWidth,
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


        const lineSeries =
            chart.addLineSeries();


        lineSeries.setData(
            (chartData.prices || []).map(price => ({
                time: Math.floor(price[0] / 1000),
                value: price[1]
            }))
        );


        // Make chart responsive

        window.addEventListener("resize", () => {

            chart.applyOptions({
                width: chartContainer.clientWidth
            });

        });


    } catch (error) {

        console.error(
            "Asset loading error:",
            error
        );

        const assetHeader =
            document.getElementById("assetHeader");

        if (assetHeader) {

            assetHeader.innerHTML = `
                <h2>Load failed</h2>
                <p style="color:#8b949e;">
                    ${error.message}
                </p>
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