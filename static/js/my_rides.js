document.addEventListener('DOMContentLoaded', () => {
    function viewRideDetails(rideId) {
        Swal.fire({ title: 'Ride Details', text: 'Feature coming soon!', icon: 'info' });
    }

    function editRide(rideId) {
        Swal.fire({ title: 'Edit Ride', text: 'Feature coming soon!', icon: 'info' });
    }

    function cancelRide(rideId) {
        Swal.fire({
            title: 'Cancel Ride?',
            text: 'Are you sure you want to cancel this ride?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Cancelled!', 'Your ride has been cancelled.', 'success');
            }
        });
    }

    document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', () => viewRideDetails(btn.dataset.id));
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => editRide(btn.dataset.id));
    });

    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
        btn.addEventListener('click', () => cancelRide(btn.dataset.id));
    });
});
