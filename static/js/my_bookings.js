document.addEventListener('DOMContentLoaded', () => {
    function viewBookingDetails(bookingId) {
        Swal.fire({ title: 'Booking Details', text: 'Feature coming soon!', icon: 'info' });
    }

    function cancelBooking(bookingId) {
        Swal.fire({
            title: 'Cancel Booking?',
            text: 'Are you sure you want to cancel this booking?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
            }
        });
    }

    function contactDriver(driverName, phoneNumber) {
        if (phoneNumber) {
            Swal.fire({
                title: `Contact ${driverName}`,
                html: `
                    <p>Driver: <strong>${driverName}</strong></p>
                    <p>Phone: <strong>${phoneNumber}</strong></p>
                    <div class="mt-3">
                        <a href="tel:${phoneNumber}" class="btn btn-success me-2"><i class="fas fa-phone me-1"></i> Call Now</a>
                        <a href="https://wa.me/91${phoneNumber}" class="btn btn-success" target="_blank"><i class="fab fa-whatsapp me-1"></i> WhatsApp</a>
                    </div>
                `,
                icon: 'info'
            });
        } else {
            Swal.fire({ title: 'Contact Driver', text: 'Phone number not available for this driver.', icon: 'warning' });
        }
    }

    document.querySelectorAll('[data-action="view-booking"]').forEach(btn => {
        btn.addEventListener('click', () => viewBookingDetails(btn.dataset.id));
    });

    document.querySelectorAll('[data-action="cancel-booking"]').forEach(btn => {
        btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
    });

    document.querySelectorAll('[data-action="contact-driver"]').forEach(btn => {
        btn.addEventListener('click', () => contactDriver(btn.dataset.name, btn.dataset.phone));
    });
});
