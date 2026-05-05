document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userTravelForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const newPkg = {
                id: Date.now(),
                company: document.getElementById('travelCompany').value,
                contact: document.getElementById('travelContact').value,
                whatsapp: document.getElementById('travelWhatsapp').value,
                email: document.getElementById('travelEmail').value,
                title: document.getElementById('travelTitle').value,
                category: document.getElementById('travelCategory').value,
                departure: document.getElementById('travelDeparture').value,
                destination: document.getElementById('travelDestination').value,
                duration: document.getElementById('travelDuration').value,
                price: document.getElementById('travelPrice').value,
                priceType: document.getElementById('travelPriceType').value,
                transport: Array.from(document.querySelectorAll('input[name="transportOption"]:checked')).map(cb => cb.value).join(', ') || 'None',
                hotel: document.getElementById('travelHotel').value,
                meals: document.getElementById('travelMeals').value,
                guide: document.getElementById('travelGuide').value,
                ziyarat: document.getElementById('travelZiyarat').value,
                image: document.getElementById('travelImage').value,
                brochure: document.getElementById('travelBrochure').value,
                details: document.getElementById('travelDetails').value,
                listingType: 'Basic', // Default for user submissions
                verified: 'No', // Default
                status: 'Pending', // ALWAYS pending for user submissions
                dateAdded: Date.now()
            };

            // 1. Try to send WhatsApp Alert via Backend
            try {
                // Change to your actual backend URL when deployed
                await fetch('http://localhost:3000/api/create-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPkg)
                });
            } catch (error) {
                console.warn('Backend alert failed or not running, but post will still be saved as Pending.', error);
            }

            // 2. Save in DataService (LocalStorage/GAS)
            try {
                // Fetch existing
                const existingPackages = await DataService.getTravelPackages() || [];
                existingPackages.push(newPkg);
                // Save updated
                await DataService.saveTravelPackages(existingPackages);
                
                alert("Your post is submitted for approval!");
                form.reset();
            } catch (error) {
                console.error('Error saving package:', error);
                alert("Failed to submit package. Please try again later.");
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
