document.addEventListener('DOMContentLoaded', () => {
    const dataElem = document.getElementById('tracking-data');
    if (!dataElem) return;

    let booking = {};
    try {
        booking = JSON.parse(dataElem.textContent || '{}');
    } catch (e) {
        console.error('Invalid tracking data JSON', e);
        return;
    }

    const pickupLat = Number(booking.pickup_lat || 28.6139);
    const pickupLng = Number(booking.pickup_lng || 77.2090);
    const dropoffLat = booking.dropoff_lat ? Number(booking.dropoff_lat) : null;
    const dropoffLng = booking.dropoff_lng ? Number(booking.dropoff_lng) : null;

    const map = L.map('map').setView([pickupLat, pickupLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (booking.pickup_lat && booking.pickup_lng) {
        L.marker([pickupLat, pickupLng])
            .addTo(map)
            .bindPopup(`Pickup Location: ${booking.pickup_address || ''}`)
            .openPopup();
    }

    if (dropoffLat && dropoffLng) {
        L.marker([dropoffLat, dropoffLng])
            .addTo(map)
            .bindPopup(`Dropoff Location: ${booking.dropoff_address || ''}`);
    }

    function updateDriverLocation() {
        fetch(`/api/booking/${booking.id}/location`)
            .then(response => response.json())
            .then(data => {
                if (data.current_lat && data.current_lng) {
                    if (window.driverMarker) {
                        window.driverMarker.setLatLng([data.current_lat, data.current_lng]);
                    } else {
                        window.driverMarker = L.marker([data.current_lat, data.current_lng])
                            .addTo(map)
                            .bindPopup('Your Driver')
                            .openPopup();
                    }

                    document.getElementById('statusBadge').textContent = data.status;
                    document.getElementById('statusBadge').className = 'badge ' +
                        (data.status === 'completed' ? 'bg-success' :
                         data.status === 'cancelled' ? 'bg-danger' : 'bg-warning');
                }
            });
    }

    setInterval(updateDriverLocation, 5000);
    updateDriverLocation();
});
