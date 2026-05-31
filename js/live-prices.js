// Default prices
let livePrices = {
    petrol: "272.15",
    petrolOld: "280.00",
    diesel: "284.35",
    dieselOld: "290.00",
    gold: "351,000",
    goldOld: "360,000"
};

async function initLivePrices() {
    // 1. First populate from localStorage for instant load
    try {
        const savedRates = localStorage.getItem("stopbuyLiveRates");
        if (savedRates) {
            const parsedRates = JSON.parse(savedRates);
            Object.assign(livePrices, parsedRates);
        }
    } catch (err) {
        console.error("Error parsing live rates", err);
    }
    
    renderPrices();

    // 2. Fetch fresh data from Google Apps Script if DataService is available
    if (typeof DataService !== 'undefined') {
        const freshRates = await DataService.getLiveRates();
        if (freshRates) {
            Object.assign(livePrices, freshRates);
            renderPrices();
        }
    }
}

function renderPrices() {
    // Petrol
    const petrolEl = document.getElementById("petrolPrice");
    if (petrolEl) {
        petrolEl.innerHTML = `Rs. ${livePrices.petrol} <span class="text-[10px] font-medium text-orange-500">/L</span>`;
    }
    const petrolOldEl = document.getElementById("petrolPriceOld");
    if (petrolOldEl && livePrices.petrolOld) {
        petrolOldEl.innerHTML = `Rs. ${livePrices.petrolOld}`;
    }

    // Diesel
    const dieselEl = document.getElementById("dieselPrice");
    if (dieselEl) {
        dieselEl.innerHTML = `Rs. ${livePrices.diesel} <span class="text-[10px] font-medium text-blue-500">/L</span>`;
    }
    const dieselOldEl = document.getElementById("dieselPriceOld");
    if (dieselOldEl && livePrices.dieselOld) {
        dieselOldEl.innerHTML = `Rs. ${livePrices.dieselOld}`;
    }

    // Gold
    const goldEl = document.getElementById("goldPrice");
    if (goldEl) {
        goldEl.innerHTML = `Rs. ${livePrices.gold} <span class="text-[10px] font-medium text-yellow-500">/Tola</span>`;
    }
    const goldOldEl = document.getElementById("goldPriceOld");
    if (goldOldEl && livePrices.goldOld) {
        goldOldEl.innerHTML = `Rs. ${livePrices.goldOld}`;
    }
}

document.addEventListener("DOMContentLoaded", initLivePrices);