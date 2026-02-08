// HayMax Pro - Main Application JavaScript
class HayMaxPro {
    constructor() {
        this.map = null;
        this.drawControl = null;
        this.fields = JSON.parse(localStorage.getItem('haymax_fields') || '[]');
        this.cuttingData = JSON.parse(localStorage.getItem('haymax_cutting_data') || '[]');
        this.drawnItems = new L.FeatureGroup();
        this.isDrawing = false;
        
        this.init();
    }

    init() {
        this.initMap();
        this.loadFields();
        this.updateStats();
        this.updateFieldSelect();
        this.loadWeather();
        this.setupEventListeners();
        this.loadActivityLog();
        console.log('🌾 HayMax Pro initialized successfully!');
    }

    initMap() {
        // Initialize map centered on Iowa (hay country!)
        this.map = L.map('map').setView([42.0, -93.0], 10);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add drawing layer
        this.map.addLayer(this.drawnItems);

        // Initialize draw control (but don't add to map yet)
        this.drawControl = new L.Control.Draw({
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            },
            draw: {
                polygon: {
                    allowIntersection: false,
                    shapeOptions: {
                        color: '#22c55e',
                        fillOpacity: 0.3
                    }
                },
                rectangle: {
                    shapeOptions: {
                        color: '#22c55e',
                        fillOpacity: 0.3
                    }
                },
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false
            }
        });

        // Handle drawing events
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            this.drawnItems.addLayer(layer);
            
            // Calculate area
            const area = this.calculateAcres(layer);
            this.showFieldModal(layer, area);
        });

        // Handle edit events
        this.map.on(L.Draw.Event.EDITED, (e) => {
            const layers = e.layers;
            layers.eachLayer((layer) => {
                const fieldId = layer.fieldId;
                if (fieldId) {
                    const area = this.calculateAcres(layer);
                    this.updateField(fieldId, { 
                        area: area,
                        coordinates: this.layerToGeoJSON(layer)
                    });
                }
            });
        });

        // Handle delete events
        this.map.on(L.Draw.Event.DELETED, (e) => {
            const layers = e.layers;
            layers.eachLayer((layer) => {
                const fieldId = layer.fieldId;
                if (fieldId) {
                    this.deleteField(fieldId);
                }
            });
        });
    }

    calculateAcres(layer) {
        let area = 0;
        
        if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            // Get the coordinates
            const latLngs = layer.getLatLngs()[0];
            
            // Convert to area in square meters using spherical excess formula
            let coords = [];
            for (let i = 0; i < latLngs.length; i++) {
                coords.push([latLngs[i].lat, latLngs[i].lng]);
            }
            
            // Simple approximate calculation for small areas
            area = this.polygonArea(coords);
        }
        
        // Convert square meters to acres (1 acre = 4046.86 sq meters)
        return Math.round((area / 4046.86) * 10) / 10;
    }

    polygonArea(coords) {
        let area = 0;
        let j = coords.length - 1;
        
        for (let i = 0; i < coords.length; i++) {
            area += (coords[j][1] + coords[i][1]) * (coords[j][0] - coords[i][0]);
            j = i;
        }
        
        return Math.abs(area * 111000 * 111000 / 2); // Approximate conversion
    }

    layerToGeoJSON(layer) {
        return layer.toGeoJSON();
    }

    toggleDrawing() {
        if (!this.isDrawing) {
            this.map.addControl(this.drawControl);
            this.isDrawing = true;
            document.getElementById('draw-btn-text').innerHTML = '❌ Stop Drawing';
        } else {
            this.map.removeControl(this.drawControl);
            this.isDrawing = false;
            document.getElementById('draw-btn-text').innerHTML = '🖊️ Draw Field';
        }
    }

    showFieldModal(layer, area) {
        this.currentLayer = layer;
        document.getElementById('field-acres').value = area;
        document.getElementById('field-modal').style.display = 'block';
    }

    closeFieldModal() {
        document.getElementById('field-modal').style.display = 'none';
        document.getElementById('field-form').reset();
        
        // Remove the layer if cancelled
        if (this.currentLayer) {
            this.drawnItems.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
    }

    saveField() {
        const name = document.getElementById('field-name').value;
        const acres = parseFloat(document.getElementById('field-acres').value);
        
        if (!name.trim()) {
            alert('Please enter a field name');
            return;
        }

        const fieldId = Date.now().toString();
        const field = {
            id: fieldId,
            name: name.trim(),
            acres: acres,
            coordinates: this.layerToGeoJSON(this.currentLayer),
            created: new Date().toISOString()
        };

        this.currentLayer.fieldId = fieldId;
        this.currentLayer.bindPopup(`<strong>${name}</strong><br>${acres} acres`);

        this.fields.push(field);
        this.saveData();
        this.updateStats();
        this.updateFieldSelect();
        this.logActivity(`Added new field: ${name} (${acres} acres)`);
        
        this.closeFieldModal();
    }

    updateField(fieldId, updates) {
        const fieldIndex = this.fields.findIndex(f => f.id === fieldId);
        if (fieldIndex >= 0) {
            Object.assign(this.fields[fieldIndex], updates);
            this.saveData();
            this.updateStats();
        }
    }

    deleteField(fieldId) {
        this.fields = this.fields.filter(f => f.id !== fieldId);
        this.cuttingData = this.cuttingData.filter(c => c.fieldId !== fieldId);
        this.saveData();
        this.updateStats();
        this.updateFieldSelect();
        this.logActivity(`Deleted field`);
    }

    loadFields() {
        this.drawnItems.clearLayers();
        
        this.fields.forEach(field => {
            try {
                const layer = L.geoJSON(field.coordinates).getLayers()[0];
                layer.fieldId = field.id;
                layer.setStyle({
                    color: '#22c55e',
                    fillOpacity: 0.3
                });
                layer.bindPopup(`<strong>${field.name}</strong><br>${field.acres} acres`);
                this.drawnItems.addLayer(layer);
            } catch (error) {
                console.warn('Could not load field:', field.name, error);
            }
        });
    }

    clearFields() {
        if (confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
            this.fields = [];
            this.cuttingData = [];
            this.drawnItems.clearLayers();
            this.saveData();
            this.updateStats();
            this.updateFieldSelect();
            this.logActivity('Cleared all fields');
        }
    }

    updateStats() {
        const totalFields = this.fields.length;
        const totalAcres = this.fields.reduce((sum, field) => sum + field.acres, 0);
        
        // Calculate average yield
        let avgYield = 0;
        if (this.cuttingData.length > 0) {
            const totalYield = this.cuttingData.reduce((sum, cut) => {
                const field = this.fields.find(f => f.id === cut.fieldId);
                return sum + (cut.yield / (field ? field.acres : 1));
            }, 0);
            avgYield = Math.round((totalYield / this.cuttingData.length) * 10) / 10;
        }
        
        // Last cut date
        let lastCut = '--';
        if (this.cuttingData.length > 0) {
            const sortedCuts = this.cuttingData.sort((a, b) => new Date(b.date) - new Date(a.date));
            lastCut = new Date(sortedCuts[0].date).toLocaleDateString();
        }

        document.getElementById('total-fields').textContent = totalFields;
        document.getElementById('total-acres').textContent = Math.round(totalAcres);
        document.getElementById('avg-yield').textContent = avgYield;
        document.getElementById('last-cut').textContent = lastCut;
        
        // Update other stats
        this.updateAnalytics();
    }

    updateFieldSelect() {
        const select = document.getElementById('field-select');
        select.innerHTML = '<option value="">Choose a field...</option>';
        
        this.fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.id;
            option.textContent = `${field.name} (${field.acres} acres)`;
            select.appendChild(option);
        });
    }

    async loadWeather() {
        try {
            // Using a free weather service (OpenWeatherMap requires API key)
            // For demo purposes, we'll show sample weather data
            this.showSampleWeather();
            
            // In production, you would use:
            // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`);
            // const data = await response.json();
            // this.updateWeatherDisplay(data);
            
        } catch (error) {
            console.error('Weather loading error:', error);
            this.showSampleWeather();
        }
    }

    showSampleWeather() {
        // Sample weather data for demo
        const sampleWeather = {
            temp: 72,
            conditions: 'Partly Cloudy',
            humidity: 65,
            wind: 8,
            forecast: 'Sunny'
        };
        
        document.querySelector('.weather-temp').textContent = `${sampleWeather.temp}°F`;
        document.querySelector('.weather-conditions').textContent = sampleWeather.conditions;
        
        const details = document.querySelectorAll('.weather-detail span');
        details[0].textContent = `${sampleWeather.humidity}%`;
        details[1].textContent = `${sampleWeather.wind} mph`;
        details[2].textContent = sampleWeather.forecast;
    }

    recordCutting() {
        const fieldId = document.getElementById('field-select').value;
        const date = document.getElementById('cut-date').value;
        const cutNumber = document.getElementById('cut-number').value;
        const yield = parseFloat(document.getElementById('yield').value);
        const moisture = parseFloat(document.getElementById('moisture').value) || null;
        const notes = document.getElementById('notes').value.trim() || null;

        if (!fieldId || !date || !cutNumber || !yield) {
            alert('Please fill in all required fields');
            return;
        }

        const field = this.fields.find(f => f.id === fieldId);
        if (!field) {
            alert('Invalid field selected');
            return;
        }

        const cutting = {
            id: Date.now().toString(),
            fieldId: fieldId,
            fieldName: field.name,
            date: date,
            cutNumber: parseInt(cutNumber),
            yield: yield,
            yieldPerAcre: Math.round((yield / field.acres) * 10) / 10,
            moisture: moisture,
            notes: notes,
            created: new Date().toISOString()
        };

        this.cuttingData.push(cutting);
        this.saveData();
        this.updateStats();
        this.logActivity(`Recorded ${cutting.yieldPerAcre} tons/acre from ${field.name}`);
        
        // Reset form
        document.getElementById('cutting-form').reset();
        
        // Show success message
        this.showAlert('Cutting data recorded successfully!', 'success');
        
        // Update displays
        this.updateRecentEntries();
    }

    updateRecentEntries() {
        const container = document.getElementById('recent-entries');
        if (this.cuttingData.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No cutting data recorded yet.</p>';
            return;
        }

        const recent = this.cuttingData
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);

        container.innerHTML = recent.map(cut => `
            <div class="field-item">
                <div class="field-info">
                    <h4>${cut.fieldName} - Cut #${cut.cutNumber}</h4>
                    <p>${new Date(cut.date).toLocaleDateString()} • ${cut.yieldPerAcre} tons/acre ${cut.moisture ? `• ${cut.moisture}% moisture` : ''}</p>
                    ${cut.notes ? `<p style="font-style: italic;">${cut.notes}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateAnalytics() {
        if (this.cuttingData.length === 0) return;

        // Total production
        const totalProduction = Math.round(this.cuttingData.reduce((sum, cut) => sum + cut.yield, 0));
        document.getElementById('total-production').textContent = totalProduction;

        // Best field by average yield per acre
        const fieldYields = {};
        this.cuttingData.forEach(cut => {
            if (!fieldYields[cut.fieldId]) {
                fieldYields[cut.fieldId] = { name: cut.fieldName, yields: [] };
            }
            fieldYields[cut.fieldId].yields.push(cut.yieldPerAcre);
        });

        let bestField = '--';
        let bestAvg = 0;
        Object.values(fieldYields).forEach(field => {
            const avg = field.yields.reduce((sum, y) => sum + y, 0) / field.yields.length;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestField = field.name;
            }
        });

        document.getElementById('best-field').textContent = bestField;

        // Create yield chart
        this.createYieldChart();
    }

    createYieldChart() {
        const ctx = document.getElementById('yield-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.yieldChart) {
            this.yieldChart.destroy();
        }

        // Prepare data
        const monthlyData = {};
        this.cuttingData.forEach(cut => {
            const month = new Date(cut.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) {
                monthlyData[month] = { total: 0, count: 0 };
            }
            monthlyData[month].total += cut.yieldPerAcre;
            monthlyData[month].count += 1;
        });

        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData).map(d => Math.round((d.total / d.count) * 10) / 10);

        this.yieldChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Yield (tons/acre)',
                    data: data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tons per Acre'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    logActivity(message) {
        const activity = {
            message: message,
            timestamp: new Date().toISOString()
        };
        
        let activities = JSON.parse(localStorage.getItem('haymax_activities') || '[]');
        activities.unshift(activity);
        activities = activities.slice(0, 20); // Keep last 20 activities
        localStorage.setItem('haymax_activities', JSON.stringify(activities));
        
        this.loadActivityLog();
    }

    loadActivityLog() {
        const activities = JSON.parse(localStorage.getItem('haymax_activities') || '[]');
        const container = document.getElementById('activity-log');
        
        if (activities.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No activity yet. Start by drawing your first field on the map above!</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                <span style="color: var(--text);">${activity.message}</span>
                <small style="color: var(--text-light); float: right;">${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = message;
        
        const main = document.querySelector('.main');
        main.insertBefore(alert, main.firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    saveData() {
        localStorage.setItem('haymax_fields', JSON.stringify(this.fields));
        localStorage.setItem('haymax_cutting_data', JSON.stringify(this.cuttingData));
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('cutting-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordCutting();
        });

        document.getElementById('field-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveField();
        });

        // Set default date to today
        document.getElementById('cut-date').value = new Date().toISOString().split('T')[0];
    }
}

// Navigation functions
function showDashboard() {
    hideAllViews();
    document.getElementById('dashboard-view').style.display = 'block';
    setActiveNav('dashboard');
}

function showFields() {
    hideAllViews();
    document.getElementById('fields-view').style.display = 'block';
    setActiveNav('fields');
    updateFieldsList();
}

function showAnalytics() {
    hideAllViews();
    document.getElementById('analytics-view').style.display = 'block';
    setActiveNav('analytics');
    setTimeout(() => app.updateAnalytics(), 100); // Delay to ensure canvas is visible
}

function showData() {
    hideAllViews();
    document.getElementById('data-view').style.display = 'block';
    setActiveNav('data');
    app.updateRecentEntries();
}

function hideAllViews() {
    const views = ['dashboard-view', 'fields-view', 'analytics-view', 'data-view'];
    views.forEach(viewId => {
        document.getElementById(viewId).style.display = 'none';
    });
}

function setActiveNav(section) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    // This is simplified - in production you'd match the actual links
}

function updateFieldsList() {
    const container = document.getElementById('fields-list');
    
    if (app.fields.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No fields added yet. Use the map to draw your field boundaries.</p>';
        return;
    }

    container.innerHTML = app.fields.map(field => {
        const cuttings = app.cuttingData.filter(c => c.fieldId === field.id);
        const avgYield = cuttings.length > 0 
            ? Math.round((cuttings.reduce((sum, c) => sum + c.yieldPerAcre, 0) / cuttings.length) * 10) / 10
            : 0;

        return `
            <div class="field-item">
                <div class="field-info">
                    <h4>${field.name}</h4>
                    <p>${field.acres} acres • ${cuttings.length} cuts recorded • ${avgYield} avg tons/acre</p>
                    <small>Added: ${new Date(field.created).toLocaleDateString()}</small>
                </div>
                <div class="field-actions">
                    <button class="btn btn-small" onclick="viewFieldOnMap('${field.id}')">📍 View</button>
                </div>
            </div>
        `;
    }).join('');
}

function viewFieldOnMap(fieldId) {
    showDashboard();
    
    // Find and highlight the field
    app.drawnItems.eachLayer((layer) => {
        if (layer.fieldId === fieldId) {
            app.map.fitBounds(layer.getBounds());
            layer.openPopup();
        }
    });
}

// Global functions for buttons
function toggleDrawing() {
    app.toggleDrawing();
}

function clearFields() {
    app.clearFields();
}

function closeFieldModal() {
    app.closeFieldModal();
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HayMaxPro();
    console.log('🚜 HayMax Pro loaded successfully!');
});