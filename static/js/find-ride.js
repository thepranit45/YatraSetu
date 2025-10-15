document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchResults = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Update max price value display
    const priceRange = document.getElementById('priceRange');
    const priceRangeValue = document.getElementById('priceRangeValue');
    priceRange.addEventListener('input', () => {
        priceRangeValue.textContent = `₹${priceRange.value}`;
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchRides();
    });

    async function fetchRides() {
        searchResults.innerHTML = '';
        loadingSpinner.style.display = 'block';

        const from = searchForm.elements['source'].value;
        const to = searchForm.elements['destination'].value;
        const date = searchForm.elements['travel_date'].value;

        try {
            const response = await fetch(`/api/search-rides?source=${from}&destination=${to}&travel_date=${date}`);
            const rides = await response.json();

            resultsCount.textContent = rides.length;

            if (rides.length === 0) {
                searchResults.innerHTML = `
                    <div class="no-rides">
                        <div class="no-rides-icon"><i class="fas fa-road"></i></div>
                        <h5 class="text-muted mb-3">No rides found</h5>
                        <p class="text-muted mb-4">Try different route or date.</p>
                    </div>
                `;
            } else {
                rides.forEach(ride => {
                    const rideCard = document.createElement('div');
                    rideCard.classList.add('ride-card', `ride-type-${ride.ride_type}`);
                    rideCard.innerHTML = `
                        <div class="p-3">
                            <div class="d-flex align-items-center mb-2">
                                <div class="driver-avatar me-3">${ride.driver_name.charAt(0)}</div>
                                <div>
                                    <strong>${ride.driver_name}</strong> (${ride.ride_type})
                                    <div class="rating-stars">${'★'.repeat(Math.round(ride.rating))}</div>
                                </div>
                                <div class="ms-auto d-flex align-items-center gap-2">
                                    <div class="price-tag">₹${ride.price_per_unit}</div>
                                    <a href="/booking/${ride.id}" class="btn btn-sm btn-primary">Book</a>
                                </div>
                            </div>
                            <p><strong>From:</strong> ${ride.source_city} &nbsp; | &nbsp; <strong>To:</strong> ${ride.destination_city}</p>
                            <p><strong>Departure:</strong> ${new Date(ride.departure_time).toLocaleString()}</p>
                            <p><strong>Vehicle:</strong> ${ride.vehicle_type} (${ride.vehicle_number}) &nbsp; | &nbsp; <strong>Capacity:</strong> ${ride.available_capacity}</p>
                            <p><strong>Contact:</strong> ${ride.contact_number}</p>
                        </div>
                    `;
                    searchResults.appendChild(rideCard);
                });
            }
        } catch (error) {
            console.error('Error fetching rides:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }
});
