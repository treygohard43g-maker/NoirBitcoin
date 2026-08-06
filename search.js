const COINGECKO_API_KEY ="CG-AEbisio9spT8HodxYnx9iyHE";

const assets = [
    {
        name: "Bitcoin",
        symbol: "BTC",
        icon: "fa-brands fa-bitcoin"
    },
    {
        name: "Ethereum",
        symbol: "ETH",
        icon: "fa-brands fa-ethereum"
    },
    {
        name: "Gold",
        symbol: "XAU",
        icon: "fa-solid fa-coins"
    }
];

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

        const filtered = assets.filter(asset =>
            asset.name.toLowerCase().includes(value) ||
            asset.symbol.toLowerCase().includes(value)
        );

        filtered.forEach(asset => {

            searchResults.innerHTML += `
                <div class="search-item">
                    <i class="${asset.icon}"></i>
                    <div>
                        <h4>${asset.name}</h4>
                        <span>${asset.symbol}</span>
                    </div>
                </div>
            `;

        });

        searchResults.style.display = filtered.length ? "block" : "none";

    });

}