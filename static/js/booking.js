document.addEventListener('DOMContentLoaded', () => {
    const dataElem = document.getElementById('booking-data');
    if (!dataElem) return;

    let ride = {};
    try {
        ride = JSON.parse(dataElem.textContent || '{}');
    } catch (e) {
        console.error('Invalid booking data JSON', e);
        return;
    }

    const ridePrice = Number(ride.price_per_unit || 0);
    const availableCapacity = Number(ride.available_capacity || 0);
    const rideId = ride.id;

    const qtyInput = document.getElementById('quantityInput');
    const totalAmountEl = document.getElementById('totalAmount');
    const confirmBtn = document.getElementById('confirmBookingBtn');

    function updateTotal() {
        const qty = Number(qtyInput.value || 1);
        totalAmountEl.textContent = `₹${qty * ridePrice}`;
    }

    qtyInput.addEventListener('input', updateTotal);

    confirmBtn.addEventListener('click', async () => {
        const qty = Number(qtyInput.value || 1);
        if (qty < 1 || qty > availableCapacity) {
            Swal.fire('Invalid Quantity', 'Please enter a valid quantity within capacity.', 'warning');
            return;
        }

        try {
            const resp = await fetch('/api/book-ride', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ride_id: rideId, quantity: qty })
            });
            const result = await resp.json();
            if (result.success) {
                Swal.fire('Booked!', 'Your ride has been booked.', 'success').then(() => {
                    window.location.href = '/my-bookings';
                });
            } else {
                Swal.fire('Error', result.message || 'Could not book ride', 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'An error occurred while booking', 'error');
        }
    });

    // initial total
    updateTotal();
});
