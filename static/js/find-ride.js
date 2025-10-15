document.addEventListener('DOMContentLoaded', () => {
    console.log('[find-ride.js] loaded (v2) - Teleport autocomplete active');
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

    // City suggestions using Teleport Cities API (no server-side city list required)
    // Teleport docs: https://developers.teleport.org/api/
    const cityOptions = document.getElementById('cityOptions');
    const sourceInput = document.getElementById('sourceInput');
    const destinationInput = document.getElementById('destinationInput');
    
    // Create visible dropdown containers (separate from datalist)
    function createDropdown(el) {
        const container = document.createElement('div');
        container.className = 'autocomplete-list';
        container.style.display = 'none';
        container.style.left = '0';
        container.style.top = 'calc(100% + 6px)';
        container.style.boxSizing = 'border-box';
        // ensure parent is positioned so absolute dropdown aligns to it
        const parent = el.parentNode;
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        parent.appendChild(container);
        return container;
    }

    const sourceDropdown = sourceInput ? createDropdown(sourceInput) : null;
    const destDropdown = destinationInput ? createDropdown(destinationInput) : null;

    function throttle(fn, wait) {
        let last = 0;
        let timeout = null;
        return function(...args) {
            const now = Date.now();
            const remaining = wait - (now - last);
            if (remaining <= 0) {
                if (timeout) { clearTimeout(timeout); timeout = null; }
                last = now;
                fn.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    last = Date.now();
                    timeout = null;
                    fn.apply(this, args);
                }, remaining);
            }
        };
    }

    const SUGGEST_ENDPOINT = '/api/city-suggest';
    const cityDebug = document.getElementById('cityDebug');

    async function fetchSuggestions(query) {
        if (!query || query.length < 2) return [];
        if (cityDebug) cityDebug.textContent = `Suggest: searching "${query}"...`;
        try {
            const res = await fetch(`${SUGGEST_ENDPOINT}?q=${encodeURIComponent(query)}`);
            if (!res.ok) {
                if (cityDebug) cityDebug.textContent = `Suggest: server error ${res.status}`;
                return [];
            }
            const data = await res.json();
            console.log('[find-ride] fetchSuggestions ->', query, data.suggestions ? data.suggestions.length : 'no-data');
            if (data.success !== true) {
                if (cityDebug) cityDebug.textContent = `Suggest: ${data.message || 'no results'}`;
                return [];
            }
            if (cityDebug) cityDebug.textContent = `Suggest: ${data.suggestions.length} suggestion(s) for "${query}"`;
            return data.suggestions || [];
        } catch (e) {
            console.error('Suggestion fetch failed', e);
            if (cityDebug) cityDebug.textContent = `Suggest error: ${e.message || e}`;
            return [];
        }
    }

    const updateSuggestions = throttle(async (q) => {
        if (!q || q.length < 2) return;
        const suggestions = await fetchSuggestions(q);
        // Update datalist as before
        suggestions.forEach(s => {
            if (!Array.from(cityOptions.options).some(o => o.value.toLowerCase() === s.toLowerCase())) {
                const opt = document.createElement('option');
                opt.value = s;
                cityOptions.appendChild(opt);
            }
        });
        console.log('[find-ride] render suggestions count', suggestions.length);

        // Render visible dropdowns under focused input
        function renderDropdown(listEl, items, inputEl) {
            if (!listEl) return;
            listEl.innerHTML = '';
            if (!items || items.length === 0) { listEl.style.display = 'none'; return; }
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.textContent = item;
                div.addEventListener('mousedown', (ev) => {
                    // mousedown used so input doesn't blur before click
                    ev.preventDefault();
                    if (inputEl) inputEl.value = item;
                    listEl.style.display = 'none';
                });
                listEl.appendChild(div);
            });
            listEl.style.display = 'block';
            listEl.scrollTop = 0;
        }

        // If source or destination are focused, render dropdown there
        if (document.activeElement === sourceInput) {
            renderDropdown(sourceDropdown, suggestions, sourceInput);
        }
        if (document.activeElement === destinationInput) {
            renderDropdown(destDropdown, suggestions, destinationInput);
        }
    }, 400);

    [sourceInput, destinationInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            // local datalist search first
            updateSuggestions(val);
        });
        // hide dropdown on blur (with small delay to allow click)
        inp.addEventListener('blur', () => {
            setTimeout(() => {
                if (inp === sourceInput && sourceDropdown) sourceDropdown.style.display = 'none';
                if (inp === destinationInput && destDropdown) destDropdown.style.display = 'none';
            }, 150);
        });
        inp.addEventListener('focus', (e) => {
            const val = e.target.value.trim();
            if (val.length >= 2) updateSuggestions(val);
        });
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // No server-side city list required: we allow free-form city names but suggestions
        // are provided by Teleport. Proceed directly to search.
        clearValidation();
        await fetchRides();
    });

    function markInvalid(el, message) {
        if (!el) return;
        el.classList.add('is-invalid');
        let next = el.nextElementSibling;
        // show a small invalid-feedback element
        if (!next || !next.classList || !next.classList.contains('invalid-feedback')) {
            const fb = document.createElement('div');
            fb.className = 'invalid-feedback';
            fb.textContent = message;
            el.parentNode.appendChild(fb);
        }
    }

    function clearValidation() {
        [sourceInput, destinationInput].forEach(el => {
            if (!el) return;
            el.classList.remove('is-invalid');
            const fb = el.parentNode.querySelector('.invalid-feedback');
            if (fb) fb.remove();
        });
    }

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
