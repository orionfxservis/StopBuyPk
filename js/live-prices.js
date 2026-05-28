// Default prices
let livePrices = {
    petrol: "272.15",
    diesel: "284.35",
    gold: "351,000"
};

// Check if admin has updated prices in localStorage
try {
    const savedRates = localStorage.getItem("stopbuyLiveRates");
    if (savedRates) {
        const parsedRates = JSON.parse(savedRates);
        if (parsedRates.petrol) livePrices.petrol = parsedRates.petrol;
        if (parsedRates.diesel) livePrices.diesel = parsedRates.diesel;
        if (parsedRates.gold) livePrices.gold = parsedRates.gold;
    }
} catch (err) {
    console.error("Error parsing live rates", err);
}

// Petrol
const petrolEl = document.getElementById("petrolPrice");
if (petrolEl) {
    petrolEl.innerHTML = `Rs. ${livePrices.petrol} <span class="text-[10px] font-medium text-orange-500">/L</span>`;
}

// Diesel
const dieselEl = document.getElementById("dieselPrice");
if (dieselEl) {
    dieselEl.innerHTML = `Rs. ${livePrices.diesel} <span class="text-[10px] font-medium text-blue-500">/L</span>`;
}

// Gold
const goldEl = document.getElementById("goldPrice");
if (goldEl) {
    goldEl.innerHTML = `Rs. ${livePrices.gold} <span class="text-[10px] font-medium text-yellow-500">/Tola</span>`;
}