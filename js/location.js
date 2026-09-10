// =========================
// LOCATION DETECTION SCRIPT
// =========================

const currentLocationEl = document.getElementById("current-location");
console.log("location.js loaded, currentLocationEl:", currentLocationEl);

window.estimateCoordinates = function(address, area, city) {
  const text = `${address} ${area} ${city}`.toLowerCase();
  let lat = 24.8607; // Default (Karachi center)
  let lon = 67.0011;

  if (text.includes("gulshan-e-iqbal") || text.includes("gulshan e iqbal")) { lat = 24.9180; lon = 67.0971; }
  else if (text.includes("bahadurabad")) { lat = 24.8828; lon = 67.0682; }
  else if (text.includes("nazimabad")) {
    if (text.includes("north")) { lat = 24.9452; lon = 67.0435; } else { lat = 24.9113; lon = 67.0315; }
  }
  else if (text.includes("saddar")) { lat = 24.8605; lon = 67.0261; }
  else if (text.includes("f.b. area") || text.includes("f. b. area") || text.includes("federal b") || text.includes("ancholi")) { lat = 24.9315; lon = 67.0784; }
  else if (text.includes("korangi")) { lat = 24.8258; lon = 67.1328; }
  else if (text.includes("dha") || text.includes("defence")) {
    if (text.includes("lahore")) { lat = 31.4697; lon = 74.4089; } else { lat = 24.8016; lon = 67.0681; }
  }
  else if (text.includes("gulistan-e-johar") || text.includes("johar")) {
    if (text.includes("lahore")) { lat = 31.4697; lon = 74.2728; } else { lat = 24.9111; lon = 67.1219; }
  }
  else if (text.includes("liaquatabad")) { lat = 24.9070; lon = 67.0423; }
  else if (text.includes("clifton")) { lat = 24.8138; lon = 67.0336; }
  else if (text.includes("malir")) { lat = 24.8974; lon = 67.1981; }
  else if (text.includes("model town")) { lat = 31.4805; lon = 74.3244; }
  else if (text.includes("township")) { lat = 31.4551; lon = 74.3090; }
  else if (text.includes("gulberg")) { lat = 31.5204; lon = 74.3587; }
  else if (text.includes("mall road")) { lat = 31.5657; lon = 74.3413; }
  else if (text.includes("lahore")) { lat = 31.5204; lon = 74.3587; }
  else if (text.includes("islamabad")) { lat = 33.6844; lon = 73.0479; }
  else if (text.includes("rawalpindi")) { lat = 33.5651; lon = 73.0169; }
  else if (text.includes("peshawar")) { lat = 34.0151; lon = 71.5249; }

  return { lat, lon };
};

window.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

window.getProximityTier = function(distanceKm) {
  if (distanceKm <= 2) return 0;
  if (distanceKm <= 5) return 1;
  if (distanceKm <= 10) return 2;
  return 3;
};

// Show Location Modal (Optional)
function showLocationModal() {
    detectUserLocation(true);
}

// Auto detect immediately since script is at the bottom of the body
console.log("location.js: calling detectUserLocation directly");
detectUserLocation(false);

// Main Detect Function
function detectUserLocation(showAlert = false) {
    console.log("location.js: detectUserLocation called");
    if (!currentLocationEl) {
        console.log("location.js: currentLocationEl is null! Aborting.");
        return;
    }

    // Check Browser Support
    if (!navigator.geolocation) {
        console.log("location.js: geolocation not supported");
        currentLocationEl.textContent = "Location Unsupported";
        return;
    }

    currentLocationEl.textContent = "Detecting...";
    console.log("location.js: Requesting getCurrentPosition");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            console.log("location.js: position received");
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                // Save coordinates for distance calculations
                localStorage.setItem("stopbuy_latitude", lat);
                localStorage.setItem("stopbuy_longitude", lon);

                // Reverse Geocoding API
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`
                );
                const data = await response.json();

                // Extract more precise location from display_name
                let displayLocation = "Your Location";
                if (data.display_name) {
                    const parts = data.display_name.split(',').map(p => p.trim());
                    if (parts.length > 2) {
                        displayLocation = parts[0] + ', ' + parts[1];
                    } else if (parts.length > 0) {
                        displayLocation = parts[0];
                    }
                } else {
                    const addr = data.address || {};
                    const area = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.road;
                    const city = addr.city || addr.town || addr.village || addr.state;
                    
                    if (area && city && area !== city) {
                        displayLocation = `${area}, ${city}`;
                    } else if (city) {
                        displayLocation = city;
                    } else if (area) {
                        displayLocation = area;
                    }
                }
                
                currentLocationEl.textContent = displayLocation;
                localStorage.setItem("stopbuy_location", displayLocation);

                if (showAlert) {
                    alert("Location updated to: " + city);
                }
            } catch (error) {
                console.error("location.js error:", error);
                currentLocationEl.textContent = "Karachi";
            } finally {
                if (typeof renderFoodList === 'function') {
                    renderFoodList();
                }
            }
        },
        (error) => {
            console.log("location.js position error:", error);
            const savedLocation = localStorage.getItem("stopbuy_location");
            if (savedLocation) {
                currentLocationEl.textContent = savedLocation;
            } else {
                currentLocationEl.textContent = "Karachi";
            }
            if (showAlert) {
                alert("Could not detect precise location. Defaulting to saved location or Karachi.");
            }
            if (typeof renderFoodList === 'function') {
                renderFoodList();
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}
