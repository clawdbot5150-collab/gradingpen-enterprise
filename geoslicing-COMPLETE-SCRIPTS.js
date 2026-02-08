// === COMPLETE JAVASCRIPT FOR WORLD-CLASS GEOSLICING PLATFORM ===

// === GLOBAL VARIABLES ===
let temperatureChart = null;
let regionalChart = null;
let currentCalc = 'distance';
let isAnnualPricing = false;

// === SOLUTION CARDS FUNCTIONALITY ===
function learnMore(industry) {
    const industryInfo = {
        'smart-cities': {
            title: 'Smart Cities Solutions',
            content: `Comprehensive urban intelligence platform featuring:
• Real-time traffic optimization with AI-powered routing
• Infrastructure monitoring via IoT sensor networks  
• Emergency response coordination with geofenced alerts
• Citizen services integration with location-based features
• Environmental monitoring and sustainability metrics`
        },
        'agriculture': {
            title: 'Precision Agriculture Platform', 
            content: `Advanced agricultural intelligence system including:
• Satellite imagery analysis for crop health monitoring
• Variable rate application mapping for optimal resource use
• Weather integration with predictive modeling
• Yield optimization through machine learning algorithms
• Field boundary mapping with GPS accuracy`
        },
        'energy': {
            title: 'Energy & Utilities Intelligence',
            content: `Comprehensive utility management platform offering:
• Smart grid optimization with real-time monitoring
• Asset tracking and maintenance scheduling
• Renewable energy site analysis and planning
• Environmental impact assessment tools
• Outage prediction and response coordination`
        },
        'logistics': {
            title: 'Supply Chain & Logistics Solutions',
            content: `Advanced logistics optimization platform featuring:
• Multi-modal route optimization with real-time traffic
• Fleet tracking with predictive maintenance alerts
• Warehouse location optimization analysis
• Supply chain visibility with geospatial analytics
• Last-mile delivery optimization`
        },
        'healthcare': {
            title: 'Healthcare & Emergency Solutions',
            content: `Medical and emergency response platform including:
• Disease outbreak tracking and prediction modeling
• Hospital catchment area analysis and optimization
• Emergency resource allocation and routing
• Public health spatial intelligence dashboards
• Healthcare facility accessibility analysis`
        },
        'financial': {
            title: 'Financial Services Intelligence',
            content: `Geospatial risk and market analysis platform offering:
• Location-based risk assessment modeling
• Market penetration analysis with demographic overlay
• Fraud detection using spatial pattern analysis
• Branch and ATM location optimization
• Real estate investment analysis tools`
        }
    };
    
    const info = industryInfo[industry];
    if (info) {
        showModal(info.title, info.content);
    }
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <pre>${content}</pre>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="startFreeTrial()">Start Free Trial</button>
                <button class="btn-secondary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// === DASHBOARD CHARTS INITIALIZATION ===
function initDashboardCharts() {
    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart');
    if (tempCtx) {
        temperatureChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(24),
                datasets: [{
                    label: 'Global Average (°C)',
                    data: generateTemperatureData(24),
                    borderColor: '#00B4D8',
                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    // Regional Activity Chart
    const regionCtx = document.getElementById('regionalChart');
    if (regionCtx) {
        regionalChart = new Chart(regionCtx, {
            type: 'doughnut',
            data: {
                labels: ['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa'],
                datasets: [{
                    data: [35, 28, 22, 10, 5],
                    backgroundColor: [
                        '#0A2463',
                        '#00B4D8', 
                        '#F77F00',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

function generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    for (let i = hours; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
        labels.push(time.getHours() + ':00');
    }
    return labels;
}

function generateTemperatureData(points) {
    const data = [];
    const baseTemp = 15; // Base temperature in Celsius
    for (let i = 0; i < points; i++) {
        const variation = (Math.sin(i / 3) * 5) + (Math.random() * 4 - 2);
        data.push(Math.round((baseTemp + variation) * 10) / 10);
    }
    return data;
}

function switchTimeframe(timeframe) {
    // Update chart based on timeframe
    const buttons = document.querySelectorAll('.control-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let hours, labels, data;
    switch(timeframe) {
        case '24h':
            hours = 24;
            break;
        case '7d':
            hours = 7 * 24;
            labels = generateDayLabels(7);
            data = generateTemperatureData(7);
            break;
        case '30d':
            hours = 30 * 24;
            labels = generateDayLabels(30);
            data = generateTemperatureData(30);
            break;
        default:
            hours = 24;
    }
    
    if (timeframe === '24h') {
        labels = generateTimeLabels(24);
        data = generateTemperatureData(24);
    }
    
    if (temperatureChart) {
        temperatureChart.data.labels = labels;
        temperatureChart.data.datasets[0].data = data;
        temperatureChart.update();
    }
}

function generateDayLabels(days) {
    const labels = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
}

// === AI QUERY INTERFACE ===
function askAI(question) {
    const input = document.getElementById('aiQueryInput');
    if (input) {
        input.value = question;
        sendAIQuery();
    }
}

function sendAIQuery() {
    const input = document.getElementById('aiQueryInput');
    const chatMessages = document.getElementById('chatMessages');
    const processingIndicator = document.getElementById('processingIndicator');
    const aiResults = document.getElementById('aiResults');
    
    const question = input.value.trim();
    if (!question) return;
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `
        <div class="message-content">
            <p><strong>You:</strong> ${question}</p>
        </div>
    `;
    chatMessages.appendChild(userMessage);
    
    // Show processing indicator
    processingIndicator.classList.add('active');
    
    // Clear input
    input.value = '';
    
    // Simulate AI processing
    setTimeout(() => {
        // Hide processing indicator
        processingIndicator.classList.remove('active');
        
        // Add AI response
        const aiResponse = generateAIResponse(question);
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        aiMessage.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p><strong>AI Assistant:</strong> ${aiResponse.text}</p>
            </div>
        `;
        chatMessages.appendChild(aiMessage);
        
        // Update results panel
        aiResults.innerHTML = aiResponse.visualization;
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    }, 2000 + Math.random() * 2000);
}

function generateAIResponse(question) {
    const responses = {
        'population density': {
            text: 'Based on recent census data and satellite imagery, urban areas show highest density in metropolitan corridors. I\'ve generated a heat map visualization showing population distribution patterns.',
            visualization: `
                <div class="ai-visualization">
                    <h4>Population Density Analysis</h4>
                    <div class="viz-content">
                        <div class="density-map" style="height: 200px; background: linear-gradient(45deg, #0A2463, #00B4D8, #F77F00); border-radius: 8px; position: relative;">
                            <div class="density-points">
                                <div class="point" style="position: absolute; top: 30%; left: 20%; width: 12px; height: 12px; background: #F77F00; border-radius: 50%;"></div>
                                <div class="point" style="position: absolute; top: 60%; left: 70%; width: 8px; height: 8px; background: #00B4D8; border-radius: 50%;"></div>
                                <div class="point" style="position: absolute; top: 45%; left: 45%; width: 15px; height: 15px; background: #F77F00; border-radius: 50%;"></div>
                            </div>
                        </div>
                        <div class="viz-stats">
                            <div>Highest Density: 8,547 people/km²</div>
                            <div>Average: 2,156 people/km²</div>
                            <div>Growth Rate: +2.3% annually</div>
                        </div>
                    </div>
                </div>
            `
        },
        'climate trends': {
            text: 'Coastal regions show increasing temperature variability and rising sea levels. The analysis indicates accelerated warming patterns in the past decade with significant implications for infrastructure planning.',
            visualization: `
                <div class="ai-visualization">
                    <h4>Coastal Climate Trends</h4>
                    <div class="viz-content">
                        <div class="trend-chart" style="height: 200px; background: #f8fafc; border-radius: 8px; padding: 20px;">
                            <svg width="100%" height="100%" viewBox="0 0 300 160">
                                <polyline points="20,140 60,120 100,100 140,80 180,85 220,70 260,60" 
                                         fill="none" stroke="#F77F00" stroke-width="3"/>
                                <polyline points="20,150 60,135 100,130 140,115 180,110 220,100 260,95" 
                                         fill="none" stroke="#00B4D8" stroke-width="3"/>
                            </svg>
                        </div>
                        <div class="viz-stats">
                            <div>Temperature Rise: +1.8°C since 1990</div>
                            <div>Sea Level: +12cm increase</div>
                            <div>Extreme Events: +45% frequency</div>
                        </div>
                    </div>
                </div>
            `
        },
        'wind farms': {
            text: 'Optimal wind farm locations identified using elevation, wind speed, and proximity data. The analysis shows 47 high-potential sites with capacity for 2.3 GW of clean energy generation.',
            visualization: `
                <div class="ai-visualization">
                    <h4>Wind Farm Site Analysis</h4>
                    <div class="viz-content">
                        <div class="wind-map" style="height: 200px; background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%); border-radius: 8px; position: relative;">
                            <div class="wind-sites">
                                <div style="position: absolute; top: 25%; left: 15%; color: #F77F00; font-size: 20px;">🏭</div>
                                <div style="position: absolute; top: 45%; left: 60%; color: #F77F00; font-size: 20px;">🏭</div>
                                <div style="position: absolute; top: 70%; left: 30%; color: #F77F00; font-size: 20px;">🏭</div>
                                <div style="position: absolute; top: 35%; left: 80%; color: #F77F00; font-size: 20px;">🏭</div>
                            </div>
                        </div>
                        <div class="viz-stats">
                            <div>Optimal Sites: 47 locations</div>
                            <div>Total Capacity: 2.3 GW</div>
                            <div>Avg Wind Speed: 7.2 m/s</div>
                        </div>
                    </div>
                </div>
            `
        }
    };
    
    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
        if (question.toLowerCase().includes(key)) {
            return response;
        }
    }
    
    // Default response
    return {
        text: 'I\'ve analyzed your geospatial query and generated insights based on current datasets. The results show interesting spatial patterns that could inform strategic decisions.',
        visualization: `
            <div class="ai-visualization">
                <h4>Geospatial Analysis Results</h4>
                <div class="viz-content">
                    <div class="generic-viz" style="height: 200px; background: var(--gradient-data); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--ocean-blue);">
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🌍</div>
                            <div>Custom analysis visualization</div>
                        </div>
                    </div>
                    <div class="viz-stats">
                        <div>Data Points Analyzed: ${(Math.random() * 50000 + 10000).toFixed(0)}</div>
                        <div>Processing Time: ${(Math.random() * 5 + 1).toFixed(1)}s</div>
                        <div>Confidence Level: ${(Math.random() * 20 + 80).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `
    };
}

// === GEOSPATIAL CALCULATOR ===
function switchCalc(calcType) {
    // Update tab states
    const tabs = document.querySelectorAll('.calc-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update panels
    const panels = document.querySelectorAll('.calc-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    const targetPanel = document.getElementById(`${calcType}-calc`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    currentCalc = calcType;
}

function calculateDistance() {
    const lat1 = parseFloat(document.getElementById('lat1').value);
    const lon1 = parseFloat(document.getElementById('lon1').value);
    const lat2 = parseFloat(document.getElementById('lat2').value);
    const lon2 = parseFloat(document.getElementById('lon2').value);
    
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        alert('Please enter valid coordinates');
        return;
    }
    
    // Calculate great circle distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Calculate bearing
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    // Calculate travel time (assuming 60 mph)
    const travelTimeHours = distance * 0.621371 / 60; // Convert km to miles, then divide by 60 mph
    
    // Update results
    document.getElementById('greatCircleDistance').textContent = `${distance.toFixed(2)} km (${(distance * 0.621371).toFixed(2)} mi)`;
    document.getElementById('bearing').textContent = `${bearing.toFixed(1)}°`;
    document.getElementById('travelTime').textContent = `${Math.floor(travelTimeHours)}h ${Math.round((travelTimeHours % 1) * 60)}m`;
}

function calculateArea() {
    const coordsText = document.getElementById('polygonCoords').value.trim();
    if (!coordsText) {
        alert('Please enter polygon coordinates');
        return;
    }
    
    // Parse coordinates
    const lines = coordsText.split('\n');
    const coords = [];
    
    for (const line of lines) {
        const parts = line.trim().split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon)) {
                coords.push([lat, lon]);
            }
        }
    }
    
    if (coords.length < 3) {
        alert('Please enter at least 3 coordinate pairs');
        return;
    }
    
    // Calculate area using spherical excess formula (simplified)
    const area = calculatePolygonArea(coords);
    const perimeter = calculatePolygonPerimeter(coords);
    
    // Update results
    document.getElementById('areaKm').textContent = `${area.toFixed(3)} km²`;
    document.getElementById('areaMiles').textContent = `${(area * 0.386102).toFixed(3)} mi²`;
    document.getElementById('perimeter').textContent = `${perimeter.toFixed(2)} km`;
}

function calculatePolygonArea(coords) {
    // Simplified area calculation (not accounting for Earth's curvature)
    let area = 0;
    const n = coords.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += coords[i][0] * coords[j][1];
        area -= coords[j][0] * coords[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to approximate square kilometers (rough calculation)
    const kmPerDegreeLat = 111;
    const kmPerDegreeLon = 111 * Math.cos(coords[0][0] * Math.PI / 180);
    
    return area * kmPerDegreeLat * kmPerDegreeLon;
}

function calculatePolygonPerimeter(coords) {
    let perimeter = 0;
    const n = coords.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const distance = haversineDistance(coords[i][0], coords[i][1], coords[j][0], coords[j][1]);
        perimeter += distance;
    }
    
    return perimeter;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// === PRICING FUNCTIONALITY ===
function togglePricing() {
    isAnnualPricing = document.getElementById('pricingToggle').checked;
    
    const starterPrice = document.getElementById('starterPrice');
    const proPrice = document.getElementById('proPrice');
    
    if (isAnnualPricing) {
        starterPrice.textContent = '0';
        proPrice.textContent = '79'; // 20% discount
    } else {
        starterPrice.textContent = '0';
        proPrice.textContent = '99';
    }
}

function selectPlan(plan) {
    const planDetails = {
        starter: 'Starting your free Starter plan...',
        professional: 'Setting up your Professional trial...',
        enterprise: 'Connecting you with our Enterprise sales team...'
    };
    
    alert(`${planDetails[plan]}\n\nThis demo will be available soon with full billing integration.`);
    
    // In production, this would redirect to a checkout/signup flow
    if (plan === 'enterprise') {
        // Scroll to contact form
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    }
}

// === CONTACT FORM ===
function submitContact(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const formResult = document.getElementById('formResult');
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitSpinner.classList.remove('hidden');
    
    // Get form data
    const formData = new FormData(event.target);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        company: formData.get('company'),
        interest: formData.get('interest'),
        message: formData.get('message')
    };
    
    // Simulate form submission
    setTimeout(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
        
        // Show success message
        formResult.className = 'form-result success';
        formResult.textContent = 'Thank you! Your message has been sent. We\'ll get back to you within 24 hours.';
        
        // Clear form
        event.target.reset();
        
        // Hide message after 5 seconds
        setTimeout(() => {
            formResult.textContent = '';
            formResult.className = 'form-result';
        }, 5000);
        
        console.log('Contact form submitted:', data);
        
    }, 2000);
}

function bookDemo() {
    alert('🚀 Demo Booking\n\nOur team will contact you within 24 hours to schedule a personalized demo of the GeoSlicing platform.\n\nPlease fill out the contact form below to get started!');
    
    // Scroll to contact form
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// === REAL-TIME METRICS ANIMATION ===
function animateMetrics() {
    const metrics = {
        throughput: { element: 'throughput', base: 847, variance: 50 },
        accuracy: { element: 'accuracy', base: 99.7, variance: 0.3 },
        latency: { element: 'latency', base: 12, variance: 5 },
        uptime: { element: 'uptime', base: 99.99, variance: 0.01 }
    };
    
    setInterval(() => {
        Object.entries(metrics).forEach(([key, config]) => {
            const element = document.getElementById(config.element);
            if (element) {
                const variation = (Math.random() - 0.5) * 2 * config.variance;
                const newValue = config.base + variation;
                
                if (key === 'throughput') {
                    element.textContent = Math.round(newValue);
                } else if (key === 'accuracy' || key === 'uptime') {
                    element.textContent = newValue.toFixed(2) + '%';
                } else if (key === 'latency') {
                    element.textContent = Math.round(newValue) + 'ms';
                }
            }
        });
    }, 3000);
}

// === ENHANCED SCROLL ANIMATIONS ===
function initScrollAnimations() {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Solutions cards
    gsap.fromTo('.solution-card', {
        opacity: 0,
        y: 50,
        scale: 0.95
    }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.solutions-grid',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        }
    });
    
    // Dashboard cards
    gsap.fromTo('.dashboard-card', {
        opacity: 0,
        y: 30,
        rotateX: -15
    }, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.dashboard-grid',
            start: 'top 75%',
            end: 'bottom 25%',
            toggleActions: 'play none none reverse'
        }
    });
    
    // Pricing cards
    gsap.fromTo('.pricing-card', {
        opacity: 0,
        y: 40,
        scale: 0.9
    }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.pricing-grid',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        }
    });
    
    // Number counting animations
    gsap.utils.toArray('.stat-number, .metric-value').forEach(element => {
        gsap.fromTo(element, {
            textContent: 0
        }, {
            textContent: element.textContent,
            duration: 2,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: {
                trigger: element,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

// === PERFORMANCE MONITORING ===
function initPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        console.log(`🚀 Page Load Performance:
        - Load Time: ${loadTime.toFixed(2)}ms
        - DOM Content Loaded: ${navigation.domContentLoadedEventEnd.toFixed(2)}ms
        - First Paint: ${performance.getEntriesByType('paint')[0]?.startTime.toFixed(2)}ms`);
        
        // Track if we meet our <3s target
        if (loadTime < 3000) {
            console.log('✅ Performance target met: <3s load time');
        } else {
            console.warn('⚠️ Performance target missed: >3s load time');
        }
    });
}

// === ENHANCED NAVIGATION ===
function enhanceNavigation() {
    const nav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    // Smooth scrolling with offset for fixed header
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileNavMenu');
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                }
            }
        });
    });
    
    // Update active nav item on scroll
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { rootMargin: '-80px 0px -80px 0px' });
    
    sections.forEach(section => observer.observe(section));
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌍 Initializing World-Class GeoSlicing Platform...');
    
    // Initialize all components
    setTimeout(() => {
        initDashboardCharts();
        animateMetrics();
        enhanceNavigation();
        initPerformanceMonitoring();
        
        // Initialize GSAP animations if available
        if (window.gsap && window.ScrollTrigger) {
            initScrollAnimations();
        }
        
        // Add modal styles dynamically
        addModalStyles();
        
        console.log('✅ All systems initialized - Platform ready!');
    }, 100);
});

// === MODAL STYLES ===
function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1060;
            padding: var(--space-4);
        }
        
        .modal-content {
            background: var(--white);
            border-radius: var(--radius-xl);
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-6);
            border-bottom: 1px solid var(--gray-200);
        }
        
        .modal-header h3 {
            color: var(--gray-900);
            font-family: var(--font-heading);
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: var(--text-2xl);
            cursor: pointer;
            color: var(--gray-500);
            transition: var(--transition-base);
        }
        
        .modal-close:hover {
            color: var(--gray-900);
        }
        
        .modal-body {
            padding: var(--space-6);
        }
        
        .modal-body pre {
            white-space: pre-wrap;
            line-height: 1.6;
            color: var(--gray-700);
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-3);
            padding: var(--space-6);
            border-top: 1px solid var(--gray-200);
        }
        
        .ai-visualization {
            background: var(--white);
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            border: 1px solid var(--gray-200);
        }
        
        .ai-visualization h4 {
            color: var(--gray-900);
            margin-bottom: var(--space-4);
            font-family: var(--font-heading);
        }
        
        .viz-stats {
            margin-top: var(--space-4);
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: var(--space-2);
            font-size: var(--text-sm);
            color: var(--gray-600);
        }
        
        @media (max-width: 768px) {
            .viz-stats {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
}

console.log('📝 GeoSlicing Complete Scripts Loaded Successfully!');