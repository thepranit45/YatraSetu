document.addEventListener('DOMContentLoaded', () => {
    window.updateStatus = function(bookingId, status) {
        fetch(`/api/booking/${bookingId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Status updated successfully!');
                window.location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        });
    };

    // Delegate buttons with data-action="update-status"
    document.querySelectorAll('[data-action="update-status"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const status = btn.dataset.status;
            if (id && status) window.updateStatus(id, status);
        });
    });
});
