document.addEventListener('DOMContentLoaded', () => {
    const dataElem = document.getElementById('profile-data');
    let user = {};
    if (dataElem) {
        try { user = JSON.parse(dataElem.textContent || '{}'); } catch(e){ console.error(e); }
    }

    function editProfile() {
        Swal.fire({ title: 'Edit Profile', text: 'Profile editing feature coming soon!', icon: 'info' });
    }

    function changePassword() {
        Swal.fire({ title: 'Change Password', text: 'Password change feature coming soon!', icon: 'info' });
    }

    function showVerification() {
        Swal.fire({
            title: 'Account Verification',
            html: `
                <div class="text-start">
                    <p>Complete these verifications for enhanced safety:</p>
                    <ul class="text-start">
                        <li>✅ Email Verified - <strong>${user.email ? 'Verified' : 'Pending'}</strong></li>
                        <li>📱 Phone Number - <strong>${user.phone ? 'Verified' : 'Pending'}</strong></li>
                        <li>🆔 Government ID - <strong>Pending</strong></li>
                        <li>📸 Selfie Verification - <strong>Pending</strong></li>
                    </ul>
                </div>
            `,
            icon: 'info'
        });
    }

    document.querySelectorAll('[data-action="edit-profile"]').forEach(btn => btn.addEventListener('click', editProfile));
    document.querySelectorAll('[data-action="change-password"]').forEach(btn => btn.addEventListener('click', changePassword));
    document.querySelectorAll('[data-action="show-verification"]').forEach(btn => btn.addEventListener('click', showVerification));
});
