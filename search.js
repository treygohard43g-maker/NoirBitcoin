const COINGECKO_API_KEY ="CG-AEbisio9spT8HodxYnx9iyHE";

async function searchAssets(query) {

    if (!query) return [];

    const url =
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        headers: {
            "x-cg-demo-api-key": COINGECKO_API_KEY
        }
    });

    const data = await response.json();

    return data.coins || [];
}

const searchInput = document.getElementById("assetSearch");
const searchResults = document.getElementById("searchResults");

if (searchInput && searchResults) {

    searchInput.addEventListener("input", function () {

        const value = this.value.toLowerCase();

        searchResults.innerHTML = "";

        if (value === "") {
            searchResults.style.display = "none";
            return;
        }

        const filtered = await searchAssets(value);

searchResults.innerHTML = "";

filtered.forEach(asset => {

    searchResults.innerHTML += `
        <div class="search-item">

            <img
                src="${asset.thumb}"
                alt="${asset.name}"
                class="search-logo">

            <div class="search-info">

                <h4>${asset.name}</h4>

                <span>${asset.symbol.toUpperCase()}</span>

            </div>

        </div>
    `;

});

searchResults.style.display = filtered.length ? "block" : "none";