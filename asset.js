const assetId = localStorage.getItem("selectedAsset") || "bitcoin";

loadAsset();

async function loadAsset() {

    try {

        // Get asset details
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${assetId}`
        );

        const asset = await response.json();

        // Header
        document.getElementById("assetHeader").innerHTML = `
            <img src="${asset.image.large}">
            <div>
                <div class="asset-name">${asset.name}</div>
                <div class="asset-symbol">${asset.symbol.toUpperCase()}</div>
                <div class="asset-price">
                    $${asset.market_data.current_price.usd.toLocaleString()}
                </div>
            </div>
        `;

        // Stats
        document.getElementById("assetStats").innerHTML = `
            <div class="stat-card">
                <div class="stat-title">Market Cap</div>
                <div class="stat-value">
                    $${asset.market_data.market_cap.usd.toLocaleString()}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-title">24h Change</div>
                <div class="stat-value">
                    ${asset.market_data.price_change_percentage_24h.toFixed(2)}%
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-title">Volume</div>
                <div class="stat-value">
                    $${asset.market_data.total_volume.usd.toLocaleString()}
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-title">Rank</div>
                <div class="stat-value">
                    #${asset.market_cap_rank}
                </div>
            </div>
        `;

        // Chart data
        const chartResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${assetId}/market_chart?vs_currency=usd&days=7`
        );

        const chartData = await chartResponse.json();

        const chart = LightweightCharts.createChart(
            document.getElementById("chart"),
            {
                width: document.getElementById("chart").clientWidth,
                height: 300,
                layout: {
                    background: { color: "#1B1E24" },
                    textColor: "#ffffff"
                },
                grid: {
                    vertLines: { color: "#2A2F38" },
                    horzLines: { color: "#2A2F38" }
                }
            }
        );

        const lineSeries = chart.addLineSeries();

        lineSeries.setData(
            chartData.prices.map(price => ({
                time: Math.floor(price[0] / 1000),
                value: price[1]
            }))
        );

    } catch (error) {
        console.error(error);

        document.getElementById("assetHeader").innerHTML =
            "<h2>Unable to load asset.</h2>";
    }
}

document.querySelector(".invest-btn").addEventListener("click", () => {

    localStorage.setItem("selectedInvestment", assetId);

    window.location.href = "investment.html";

});