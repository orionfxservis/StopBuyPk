// =========================
// LOCATION DETECTION SCRIPT
// =========================

const currentLocationEl = document.getElementById("current-location");
const locationBox = document.getElementById("locationBox");

// Show Location Modal (Optional)
function showLocationModal() {
    detectUserLocation(true);
}

// Auto detect on page load
window.addEventListener("load", () => {
    detectUserLocation(false);
});

// Main Detect Function
function detectUserLocation(showAlert = false) {
    if (!currentLocationEl) return;

    // Check Browser Support
    if (!navigator.geolocation) {
        currentLocationEl.textContent = "Location Unsupported";
        return;
    }

    currentLocationEl.textContent = "Detecting...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                // Reverse Geocoding API
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                );
                const data = await response.json();
                
                const city = data.address.city || data.address.town || data.address.village || data.address.state || "Your Location";
                currentLocationEl.textContent = city;
                localStorage.setItem("stopbuy_location", city);

                if (showAlert) {
                    alert("Location updated to: " + city);
                }
            } catch (error) {
                console.error(error);
                currentLocationEl.textContent = "Karachi";
            }
        },
        (error) => {
            console.log(error);
            const savedLocation = localStorage.getItem("stopbuy_location");
            if (savedLocation) {
                currentLocationEl.textContent = savedLocation;
            } else {
                currentLocationEl.textContent = "Karachi";
            }
            if (showAlert) {
                alert("Could not detect precise location. Defaulting to saved location or Karachi.");
            }
        }
    );
}
