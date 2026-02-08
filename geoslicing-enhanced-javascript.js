/**
 * GeoSlicing Professional Platform - Enhanced JavaScript
 * Complete interactive functionality for world-class user experience
 */

class GeoSlicingPlatform {
    constructor() {
        this.globe = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.isRotating = true;
        this.demoGlobe = null;
        this.demoScene = null;
        this.demoRenderer = null;
        this.currentDemoTab = '3d-visualization';
        
        this.init();
    }

    async init() {
        this.setupLoading();
        this.setupNavigation();
        this.setupPricingToggle();
        await this.init3DGlobe();
        await this.initDemoGlobe();
        this.setupDemoTabs();
        this.setupCalculator();
        this.setupContactForm();
        this.setupAnimations();
        this.setupAIChat();
        this.setupDataVisualizations();
        this.hideLoading();
    }

    // Loading System
    setupLoading() {
        this.loadingTimeout = setTimeout(() => {
            this.hideLoading();
        }, 2000);
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        clearTimeout(this.loadingTimeout);
    }

    // Navigation System
    setupNavigation() {
        const nav = document.getElementById('mainNav');
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileNav = document.getElementById('mobileNav');

        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav?.classList.add('scrolled');
            } else {
                nav?.classList.remove('scrolled');
            }
        });

        // Mobile menu toggle
        mobileToggle?.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            mobileNav?.classList.toggle('active');
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Close mobile menu if open
                    mobileToggle?.classList.remove('active');
                    mobileNav?.classList.remove('active');
                }
            });
        });
    }

    // Pricing Toggle
    setupPricingToggle() {
        const toggle = document.getElementById('annualToggle');
        const monthlyAmounts = document.querySelectorAll('.amount.monthly');
        const annualAmounts = document.querySelectorAll('.amount.annual');
        const monthlyPeriods = document.querySelectorAll('.period.monthly');
        const annualPeriods = document.querySelectorAll('.period.annual');

        toggle?.addEventListener('change', () => {
            const isAnnual = toggle.checked;
            
            monthlyAmounts.forEach(el => el.style.display = isAnnual ? 'none' : 'inline');
            annualAmounts.forEach(el => el.style.display = isAnnual ? 'inline' : 'none');
            monthlyPeriods.forEach(el => el.style.display = isAnnual ? 'none' : 'inline');
            annualPeriods.forEach(el => el.style.display = isAnnual ? 'inline' : 'none');
        });
    }

    // 3D Globe System
    async init3DGlobe() {
        const canvas = document.getElementById('globeCanvas');
        if (!canvas) return;
        
        const container = canvas.parentElement;
        
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true 
        });

        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create professional globe
        const geometry = new THREE.SphereGeometry(2, 64, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Create animated grid pattern
                    float grid = sin(uv.x * 20.0 + time) * sin(uv.y * 15.0 + time * 0.5);
                    grid = smoothstep(0.0, 0.1, abs(grid));
                    
                    // Professional color scheme
                    vec3 oceanColor = vec3(0.04, 0.14, 0.39); // Ocean blue
                    vec3 landColor = vec3(0.0, 0.71, 0.85);   // Cyan
                    
                    vec3 color = mix(oceanColor, landColor, grid);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);

        // Add particles
        this.createParticles();

        // Position camera
        this.camera.position.z = 6;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Start animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());

        // Globe controls
        this.setupGlobeControls();
    }

    createParticles() {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00b4d8,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }

    setupGlobeControls() {
        const rotateBtn = document.getElementById('globeRotate');
        const zoomBtn = document.getElementById('globeZoom');
        const resetBtn = document.getElementById('globeReset');

        rotateBtn?.addEventListener('click', () => {
            this.isRotating = !this.isRotating;
        });

        zoomBtn?.addEventListener('click', () => {
            gsap.to(this.camera.position, {
                z: this.camera.position.z > 4 ? 8 : 4,
                duration: 1,
                ease: "power2.inOut"
            });
        });

        resetBtn?.addEventListener('click', () => {
            gsap.to(this.camera.position, {
                x: 0, y: 0, z: 6,
                duration: 1,
                ease: "power2.inOut"
            });
            gsap.to(this.globe.rotation, {
                x: 0, y: 0, z: 0,
                duration: 1,
                ease: "power2.inOut"
            });
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const time = performance.now() * 0.001;

        // Update globe shader
        if (this.globe?.material.uniforms) {
            this.globe.material.uniforms.time.value = time;
        }

        // Rotate globe
        if (this.isRotating && this.globe) {
            this.globe.rotation.y += 0.005;
        }

        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += 0.001;
        }

        this.renderer.render(this.scene, this.camera);

        // Update live data counter
        this.updateLiveDataCounter();
    }

    updateLiveDataCounter() {
        const counter = document.getElementById('liveDataCount');
        if (counter && Math.random() < 0.01) {
            const current = parseInt(counter.textContent.replace(/,/g, ''));
            const newValue = current + Math.floor(Math.random() * 100);
            counter.textContent = newValue.toLocaleString();
        }
    }

    handleResize() {
        if (!this.renderer || !this.camera) return;
        
        const canvas = document.getElementById('globeCanvas');
        const container = canvas?.parentElement;
        
        if (container) {
            this.camera.aspect = container.offsetWidth / container.offsetHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        }
    }

    // Demo Globe
    async initDemoGlobe() {
        const canvas = document.getElementById('demoGlobe');
        if (!canvas) return;

        const container = canvas.parentElement;
        
        this.demoScene = new THREE.Scene();
        const demoCamera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        this.demoRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

        this.demoRenderer.setSize(container.offsetWidth, container.offsetHeight);
        
        // Simplified demo globe
        const geometry = new THREE.SphereGeometry(1.5, 32, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00B4D8, 
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        
        this.demoGlobe = new THREE.Mesh(geometry, material);
        this.demoScene.add(this.demoGlobe);
        
        demoCamera.position.z = 4;
        
        // Animate demo globe
        const animateDemo = () => {
            requestAnimationFrame(animateDemo);
            if (this.demoGlobe) {
                this.demoGlobe.rotation.y += 0.01;
            }
            this.demoRenderer.render(this.demoScene, demoCamera);
        };
        animateDemo();
    }

    // Demo Tabs System
    setupDemoTabs() {
        const tabs = document.querySelectorAll('.demo-tab');
        const contents = document.querySelectorAll('.demo-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active states
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
                targetContent?.classList.add('active');
                
                this.currentDemoTab = targetTab;
            });
        });
    }

    // Calculator System
    setupCalculator() {
        const calcTabs = document.querySelectorAll('.calc-tab');
        const calcPanels = document.querySelectorAll('.calc-panel');

        calcTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.calc;
                
                calcTabs.forEach(t => t.classList.remove('active'));
                calcPanels.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                const targetPanel = document.querySelector(`[data-panel="${target}"]`);
                targetPanel?.classList.add('active');
            });
        });
    }

    // Contact Form
    setupContactForm() {
        const form = document.getElementById('contactForm');
        
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            // Show loading state
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            submitBtn.disabled = true;
            
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            alert('Message sent successfully! We\'ll get back to you within 24 hours.');
            
            // Reset form
            form.reset();
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        });
    }

    // AI Chat System
    setupAIChat() {
        const chatDemo = document.getElementById('aiChatDemo');
        const aiInput = document.querySelector('.ai-input');
        
        // Simulate AI responses
        const responses = [
            "🔍 Analyzing your query...",
            "📊 Processing spatial data...",
            "✅ Found 1,247 matching locations with detailed analytics.",
            "🌍 The distance between New York and London is approximately 5,585 kilometers.",
            "📈 Your area shows a population density of 2,847 people per km²."
        ];

        window.sendAIQuery = () => {
            const query = aiInput?.value.trim();
            if (!query) return;

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'ai-message user';
            userMsg.textContent = query;
            chatDemo?.appendChild(userMsg);

            // Add AI response
            setTimeout(() => {
                const aiMsg = document.createElement('div');
                aiMsg.className = 'ai-message ai';
                aiMsg.innerHTML = randomResponse;
                chatDemo?.appendChild(aiMsg);
                
                // Scroll to bottom
                chatDemo.scrollTop = chatDemo.scrollHeight;
            }, 1000);

            aiInput.value = '';
        };

        // Enter key support
        aiInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIQuery();
            }
        });
    }

    // Animations
    setupAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Hero animations
        gsap.from(".hero-content > *", {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.5
        });

        gsap.from(".hero-visual", {
            scale: 0.8,
            opacity: 0,
            duration: 1.5,
            ease: "power3.out",
            delay: 0.8
        });

        // Section animations
        gsap.utils.toArray('.feature-card').forEach(card => {
            gsap.from(card, {
                y: 60,
                opacity: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: card,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            });
        });

        // Stats counter animation
        gsap.utils.toArray('.stat-number').forEach(stat => {
            const finalValue = stat.textContent;
            stat.textContent = '0';
            
            ScrollTrigger.create({
                trigger: stat,
                start: "top 80%",
                onEnter: () => {
                    gsap.to(stat, {
                        textContent: finalValue,
                        duration: 2,
                        ease: "power2.out",
                        snap: { textContent: 1 },
                        stagger: 0.1
                    });
                }
            });
        });
    }

    // Data Visualizations
    setupDataVisualizations() {
        this.createMiniChart();
        this.createStreamingDemo();
        this.createHeatmapDemo();
    }

    createMiniChart() {
        const canvas = document.getElementById('miniChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = Array.from({length: 20}, () => Math.random() * 100);
        
        canvas.width = 200;
        canvas.height = 100;
        
        const animate = () => {
            ctx.clearRect(0, 0, 200, 100);
            ctx.strokeStyle = '#00B4D8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            data.forEach((value, index) => {
                const x = (index / (data.length - 1)) * 200;
                const y = 100 - (value / 100) * 100;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Update data for animation
            data.forEach((value, index) => {
                data[index] = value + (Math.random() - 0.5) * 5;
                data[index] = Math.max(0, Math.min(100, data[index]));
            });
            
            setTimeout(animate, 100);
        };
        
        animate();
    }

    createStreamingDemo() {
        const rateElement = document.getElementById('streamRate');
        const latencyElement = document.getElementById('streamLatency');

        if (rateElement && latencyElement) {
            setInterval(() => {
                const rate = 40 + Math.floor(Math.random() * 20);
                const latency = 20 + Math.floor(Math.random() * 15);
                
                rateElement.textContent = rate;
                latencyElement.textContent = latency + 'ms';
            }, 1000);
        }
    }

    createHeatmapDemo() {
        const canvas = document.getElementById('heatmapDemo');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 150;

        const drawHeatmap = () => {
            const imageData = ctx.createImageData(200, 150);
            
            for (let x = 0; x < 200; x++) {
                for (let y = 0; y < 150; y++) {
                    const index = (y * 200 + x) * 4;
                    const intensity = Math.sin(x * 0.05 + performance.now() * 0.001) * 
                                    Math.sin(y * 0.05 + performance.now() * 0.001);
                    
                    const normalized = (intensity + 1) / 2;
                    
                    imageData.data[index] = normalized * 255;     // R
                    imageData.data[index + 1] = normalized * 180; // G
                    imageData.data[index + 2] = normalized * 216; // B
                    imageData.data[index + 3] = 255;             // A
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            requestAnimationFrame(drawHeatmap);
        };
        
        drawHeatmap();
    }
}

// Global functions for button interactions
window.demoRotateGlobe = () => {
    if (window.geoSlicingApp?.demoGlobe) {
        gsap.to(window.geoSlicingApp.demoGlobe.rotation, {
            y: window.geoSlicingApp.demoGlobe.rotation.y + Math.PI,
            duration: 1,
            ease: "power2.inOut"
        });
    }
};

window.demoZoomGlobe = () => {
    if (window.geoSlicingApp?.demoRenderer) {
        const camera = window.geoSlicingApp.demoRenderer.camera;
        gsap.to(camera.position, {
            z: camera.position.z > 3 ? 6 : 2,
            duration: 1,
            ease: "power2.inOut"
        });
    }
};

window.demoAddData = () => {
    alert('Demo: Added 1,000 new data points to visualization');
};

window.demoReset = () => {
    alert('Demo: Globe reset to default view');
};

window.calculateDistance = () => {
    alert('Distance calculated: 5,585.2 km');
};

window.calculateArea = () => {
    alert('Area calculated: 23.7 km²');
};

window.updateVisualization = () => {
    alert('Visualization updated with new data');
};

window.selectPlan = (plan) => {
    alert(`Selected plan: ${plan}. Redirecting to checkout...`);
};

window.startFreeTrial = () => {
    alert('Starting free trial. Please create your account...');
};

window.openChat = () => {
    alert('Live chat opened. How can we help you today?');
};

window.scheduleDemo = () => {
    alert('Demo scheduled. Check your email for calendar invite.');
};

// Initialize the platform when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.geoSlicingApp = new GeoSlicingPlatform();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.geoSlicingApp) {
        window.geoSlicingApp.handleResize();
    }
});