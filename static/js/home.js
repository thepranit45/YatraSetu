// Home page specific functionality
class HomePage {
    constructor() {
        this.init();
    }

    init() {
        this.initServiceCards();
        this.initStatsCounter();
        this.initTestimonials();
    }

    // Initialize service card interactions
    initServiceCards() {
        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover.bind(this));
            card.addEventListener('mouseleave', this.handleCardLeave.bind(this));
            card.addEventListener('click', this.handleCardClick.bind(this));
        });
    }

    handleCardHover(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(-10px) scale(1.02)';
        
        // Add ripple effect
        this.createRippleEffect(card);
    }

    handleCardLeave(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(0) scale(1)';
    }

    handleCardClick(e) {
        const card = e.currentTarget;
        const rideType = card.dataset.type || this.getRideTypeFromCard(card);
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);

        // Navigate to find rides page with filter
        window.location.href = `/find-ride?type=${rideType}`;
    }

    getRideTypeFromCard(card) {
        if (card.querySelector('.fa-car')) return 'car';
        if (card.querySelector('.fa-motorcycle')) return 'bike';
        if (card.querySelector('.fa-truck')) return 'logistics';
        return 'all';
    }

    createRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        const size = Math.max(element.offsetWidth, element.offsetHeight);
        const rect = element.getBoundingClientRect();
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size/2}px`;
        ripple.style.top = `${event.clientY - rect.top - size/2}px`;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Animate stats counter
    initStatsCounter() {
        const stats = document.querySelectorAll('.stat-card h3');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateValue(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => observer.observe(stat));
    }

    animateValue(element) {
        const finalValue = parseInt(element.textContent);
        const duration = 2000;
        const step = finalValue / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= finalValue) {
                element.textContent = finalValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Initialize testimonials carousel
    initTestimonials() {
        // This would be implemented if we had a testimonials section
        console.log('Testimonials initialized');
    }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new HomePage();
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);