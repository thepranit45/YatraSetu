// Global utility functions
class YatraSetuApp {
    constructor() {
        this.init();
    }

    init() {
        this.initSOS();
        this.initAnimations();
        this.initFormValidations();
    }

    // SOS functionality
    initSOS() {
        window.triggerSOS = async function() {
            const triggerBtn = document.querySelector('#sosModal .btn-danger');
            const originalText = triggerBtn.innerHTML;
            triggerBtn.innerHTML = '<div class="loading-spinner me-2"></div> Sending...';
            triggerBtn.disabled = true;

            try {
                if (!navigator.geolocation) {
                    throw new Error('Geolocation is not supported by your browser.');
                }

                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Get address using reverse geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                const address = data.display_name || 'Address not available';

                // Send SOS alert
                const sosResponse = await fetch('/sos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        latitude: lat,
                        longitude: lng,
                        address: address
                    })
                });

                const result = await sosResponse.json();

                if (result.success) {
                    await Swal.fire({
                        title: '🚨 Help is on the way!',
                        text: result.message,
                        icon: 'success',
                        confirmButtonColor: '#2563eb',
                        background: '#f8fafc',
                        timer: 5000,
                        showConfirmButton: true
                    });
                    
                    // Close modal
                    const sosModal = bootstrap.Modal.getInstance(document.getElementById('sosModal'));
                    if (sosModal) sosModal.hide();
                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                await Swal.fire({
                    title: 'SOS Failed',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                triggerBtn.innerHTML = originalText;
                triggerBtn.disabled = false;
            }
        };

        // Show location in SOS modal
        const sosModal = document.getElementById('sosModal');
        if (sosModal) {
            sosModal.addEventListener('show.bs.modal', function() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const locationEl = document.getElementById('sosLocation');
                        if (locationEl) {
                            locationEl.innerHTML = 
                                `<i class="fas fa-map-marker-alt me-1"></i> Your location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        }
                    });
                }
            });
        }
    }

    // Initialize animations
    initAnimations() {
        // Add fade-in animation to elements with data-animate attribute
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all cards and sections
        document.querySelectorAll('.card, section').forEach(el => {
            observer.observe(el);
        });
    }

    // Form validations
    initFormValidations() {
        // Add loading states to all forms
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (submitBtn && !form.classList.contains('no-loading')) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<div class="loading-spinner me-2"></div> Processing...';
                submitBtn.disabled = true;

                // Re-enable button after 30 seconds if still disabled
                setTimeout(() => {
                    if (submitBtn.disabled) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                }, 30000);
            }
        });
    }

    // Utility function to show loading
    static showLoading(element, text = 'Loading...') {
        const originalHTML = element.innerHTML;
        element.innerHTML = `<div class="loading-spinner me-2"></div> ${text}`;
        element.disabled = true;
        return originalHTML;
    }

    // Utility function to hide loading
    static hideLoading(element, originalHTML) {
        element.innerHTML = originalHTML;
        element.disabled = false;
    }

    // API call helper
    static async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new YatraSetuApp();
});

// SweetAlert2 defaults
