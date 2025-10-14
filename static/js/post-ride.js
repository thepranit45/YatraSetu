// Post Ride Page Functionality
class PostRidePage {
    constructor() {
        this.form = document.getElementById('postRideForm');
        this.init();
    }

    init() {
        this.initRideTypeHandler();
        this.initPriceCalculator();
        this.initFormValidation();
        this.initDateTimeHandlers();
    }

    // Handle ride type changes
    initRideTypeHandler() {
        const rideTypeRadios = document.querySelectorAll('input[name="ride_type"]');
        
        rideTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateFormForRideType(e.target.value);
            });
        });

        // Initialize form for default ride type
        this.updateFormForRideType('car');
    }

    updateFormForRideType(rideType) {
        const capacityLabel = document.getElementById('capacityLabel');
        const priceUnit = document.getElementById('priceUnit');
        const capacityInput = document.querySelector('input[name="available_capacity"]');
        const vehicleSelect = document.querySelector('select[name="vehicle_type"]');

        switch(rideType) {
            case 'car':
                capacityLabel.textContent = 'Available Seats *';
                priceUnit.textContent = 'per seat';
                capacityInput.max = 6;
                capacityInput.value = 4;
                capacityInput.min = 1;
                this.updateVehicleOptions('car');
                break;

            case 'bike':
                capacityLabel.textContent = 'Available Seats *';
                priceUnit.textContent = 'per seat';
                capacityInput.max = 1;
                capacityInput.value = 1;
                capacityInput.min = 1;
                this.updateVehicleOptions('bike');
                break;

            case 'logistics':
                capacityLabel.textContent = 'Available Capacity (kg) *';
                priceUnit.textContent = 'per kg';
                capacityInput.max = 5000;
                capacityInput.value = 500;
                capacityInput.min = 1;
                this.updateVehicleOptions('logistics');
                break;
        }

        this.updatePricePreview();
    }

    updateVehicleOptions(rideType) {
        const vehicleSelect = document.querySelector('select[name="vehicle_type"]');
        const currentValue = vehicleSelect.value;

        // Clear existing options except the first one
        while (vehicleSelect.options.length > 1) {
            vehicleSelect.remove(1);
        }

        let options = [];
        switch(rideType) {
            case 'car':
                options = [
                    {value: 'hatchback', text: 'Hatchback', group: 'Cars'},
                    {value: 'sedan', text: 'Sedan', group: 'Cars'},
                    {value: 'suv', text: 'SUV', group: 'Cars'},
                    {value: 'luxury', text: 'Luxury Car', group: 'Cars'}
                ];
                break;
            case 'bike':
                options = [
                    {value: 'motorcycle', text: 'Motorcycle', group: 'Bikes'},
                    {value: 'scooter', text: 'Scooter', group: 'Bikes'}
                ];
                break;
            case 'logistics':
                options = [
                    {value: 'tempo', text: 'Tempo', group: 'Commercial'},
                    {value: 'truck', text: 'Truck', group: 'Commercial'},
                    {value: 'van', text: 'Delivery Van', group: 'Commercial'}
                ];
                break;
        }

        // Group options by category
        const groups = {};
        options.forEach(option => {
            if (!groups[option.group]) {
                groups[option.group] = [];
            }
            groups[option.group].push(option);
        });

        // Add options to select
        Object.keys(groups).forEach(groupName => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            
            groups[groupName].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                optgroup.appendChild(optionElement);
            });
            
            vehicleSelect.appendChild(optgroup);
        });

        // Restore previous value if it exists in new options
        if (options.some(opt => opt.value === currentValue)) {
            vehicleSelect.value = currentValue;
        }
    }

    // Initialize price calculator
    initPriceCalculator() {
        const capacityInput = document.querySelector('input[name="available_capacity"]');
        const priceInput = document.querySelector('input[name="price_per_unit"]');

        [capacityInput, priceInput].forEach(input => {
            input.addEventListener('input', () => {
                this.updatePricePreview();
            });
        });
    }

    updatePricePreview() {
        const capacity = parseInt(document.querySelector('input[name="available_capacity"]').value) || 0;
        const price = parseInt(document.querySelector('input[name="price_per_unit"]').value) || 0;
        const estimatedEarnings = capacity * price;

        document.getElementById('estimatedEarnings').textContent = estimatedEarnings.toLocaleString();
    }

    // Initialize form validation
    initFormValidation() {
        // Bootstrap validation
        this.form.addEventListener('submit', (e) => {
            if (!this.form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                e.preventDefault();
                this.handleFormSubmit();
            }

            this.form.classList.add('was-validated');
        }, false);

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            });
        });
    }

    // Initialize date/time handlers
    initDateTimeHandlers() {
        const departureInput = document.querySelector('input[name="departure_time"]');
        const arrivalInput = document.querySelector('input[name="arrival_time"]');

        // Set min date to today
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        departureInput.min = localDateTime;

        // Update arrival time when departure changes
        departureInput.addEventListener('change', () => {
            if (departureInput.value) {
                const departureDate = new Date(departureInput.value);
                const minArrival = new Date(departureDate.getTime() + 30 * 60000); // 30 minutes later
                arrivalInput.min = new Date(minArrival.getTime() - minArrival.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                
                if (!arrivalInput.value || new Date(arrivalInput.value) < minArrival) {
                    const suggestedArrival = new Date(departureDate.getTime() + 2 * 60 * 60000); // 2 hours later
                    arrivalInput.value = new Date(suggestedArrival.getTime() - suggestedArrival.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                }
            }
        });
    }

    // Handle form submission
    async handleFormSubmit() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<div class="loading-spinner me-2"></div> Posting Your Ride...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);

            // Validate departure time is in future
            const departureTime = new Date(data.departure_time);
            if (departureTime <= new Date()) {
                throw new Error('Departure time must be in the future.');
            }

            // Send data to server
            const response = await fetch('/api/post-ride', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                await Swal.fire({
                    title: '🎉 Ride Posted Successfully!',
                    html: `
                        <div class="text-start">
                            <p><strong>Route:</strong> ${data.source_city} → ${data.destination_city}</p>
                            <p><strong>Departure:</strong> ${new Date(data.departure_time).toLocaleString()}</p>
                            <p><strong>Available:</strong> ${data.available_capacity} ${data.ride_type === 'logistics' ? 'kg' : 'seats'}</p>
                            <p><strong>Price:</strong> ₹${data.price_per_unit} per ${data.ride_type === 'logistics' ? 'kg' : 'seat'}</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'View My Rides'
                });

                // Redirect to my rides page
                window.location.href = '/my-rides';
            } else {
                throw new Error(result.message || 'Failed to post ride. Please try again.');
            }

        } catch (error) {
            await Swal.fire({
                title: 'Posting Failed',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PostRidePage();
});

// Add custom validation for vehicle number
document.addEventListener('DOMContentLoaded', function() {
    const vehicleNumberInput = document.querySelector('input[name="vehicle_number"]');
    
    if (vehicleNumberInput) {
        vehicleNumberInput.addEventListener('input', function() {
            const value = this.value.toUpperCase();
            this.value = value;
            
            // Basic Indian vehicle number validation
            const pattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/;
            if (value && !pattern.test(value)) {
                this.setCustomValidity('Please enter a valid Indian vehicle number (e.g., MH12AB1234)');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});