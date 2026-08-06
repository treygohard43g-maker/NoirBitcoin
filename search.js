const COINGECKO_API_KEY = "CG-AEbisio9spT8HodxYnx9iyHE";

const searchInput = document.getElementById("assetSearch");
const searchResults = document.getElementById("searchResults");

async function searchCoins(query) {

    if (!query || query.length < 2) {

        searchResults.innerHTML = "";
        searchResults.style.display = "none";
        return;

    }

    try {

        const response = await fetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
            {
                headers: {
                    "x-cg-demo-api-key": COINGECKO_API_KEY
                }
            }
        );

        if (!response.ok) {

            throw new Error("Failed to fetch assets");

        }

        const data = await response.json();

        displayResults(data.coins || []);

    } catch (error) {

        console.error(error);

        searchResults.innerHTML =
            `<div class="search-item">Unable to load assets.</div>`;

        searchResults.style.display = "block";

    }

}

async function displayResults(coins) {

    searchResults.innerHTML = "";

    if (coins.length === 0) {

        searchResults.innerHTML =
            `<div class="search-item">No assets found</div>`;

        searchResults.style.display = "block";
        return;

    }

    for (const coin of coins.slice(0, 10)) {

        let price = "Loading...";

        try {

            const res = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`,
                {
                    headers: {
                        "x-cg-demo-api-key": COINGECKO_API_KEY
                    }
                }
            );

            const data = await res.json();

            if (data[coin.id]) {
                price = "$" + data[coin.id].usd.toLocaleString();
            }

        } catch (e) {}

        searchResults.innerHTML += `
        
            <div class="search-item"
     onclick="selectAsset('${coin.id}','${coin.name}','${coin.symbol}','${coin.large}')">

                <img src="${coin.thumb}" class="search-logo">

                <div class="search-info">
                    <h4>${coin.name}</h4>
                    <span>${coin.symbol.toUpperCase()}</span>
                </div>

                <div class="search-price">
                    ${price}
                </div>

            </div>
        `;

    }

    searchResults.style.display = "block";

}

    coins.slice(0, 10).forEach((coin) => {

        searchResults.innerHTML += `
            <div class="search-item">

                <img src="${coin.thumb}" class="search-logo">

                <div class="search-info">

                    <h4>${coin.name}</h4>

                    <span>${coin.symbol.toUpperCase()}</span>

                </div>

            </div>
        `;

    });

    searchResults.style.display = "block";

}

if (searchInput) {

    searchInput.addEventListener("input", (e) => {

        searchCoins(e.target.value.trim());

    });

}

