// ==================== INITIALIZATION ====================
const cards = document.querySelectorAll('.character-card');
const cursor = document.querySelector('.custom-cursor');
const cursorFollower = document.querySelector('.cursor-follower');
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
const navbar = document.querySelector('.navbar');
const navProgress = document.querySelector('.nav-progress');
const navToggle = document.querySelector('.nav-toggle');
const navLinksList = document.getElementById('navLinks');
const navScrim = document.querySelector('.nav-scrim');
const scrollContainer = document.querySelector('.scroll-container');
const aliensSection = document.getElementById('aliens');
const aliensBg = document.querySelector('.aliens-bg');

let stars = [];
let particles = [];
let currentColor = '#00ff00';
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let bgParticles = [];
let aliensBgEnabled = false;

// ==================== RESPONSIVE SCROLL LENGTH ====================
function setScrollLength() {
    if (!scrollContainer) return;
    const totalScenes = 1 + cards.length; // hero + each card
    scrollContainer.style.height = (totalScenes * 100) + 'vh';
}

// ==================== MOBILE NAV ====================
function setMenuOpen(open) {
    if (!navbar || !navToggle) return;
    navbar.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (navScrim) {
        navScrim.hidden = !open;
        navScrim.style.pointerEvents = open ? 'auto' : 'none';
    }

    document.body.style.overflow = open ? 'hidden' : '';
}

function toggleMenu() {
    const open = !navbar.classList.contains('menu-open');
    setMenuOpen(open);
}

// ==================== STARFIELD ENGINE ====================
function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    stars = Array.from({length: 300}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5,
        opacity: Math.random(),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2
    }));

    const baseCount = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ? 40 : 85;
    bgParticles = Array.from({ length: baseCount }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.6;
        const opacity = Math.random() * 0.35 + 0.08;
        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.12,
            size,
            o: opacity,
            phase: Math.random() * Math.PI * 2,
            pulse: 0.008 + Math.random() * 0.02
        };
    });
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars with pulsing effect
    stars.forEach(s => {
        // Pulse animation
        s.pulsePhase += s.pulseSpeed;
        const pulse = (Math.sin(s.pulsePhase) + 1) / 2;
        const opacity = s.opacity * (0.3 + pulse * 0.7);
        
        // Draw star
        ctx.fillStyle = currentColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow for larger stars
        if (s.size > 1.5) {
            ctx.fillStyle = currentColor + '20';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Movement
        s.x += s.vx;
        s.y += s.vy;
        
        // Wrap around edges
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;
    });

    if (aliensBgEnabled && bgParticles.length) {
        bgParticles.forEach(p => {
            p.phase += p.pulse;
            const pulse = 0.55 + (Math.sin(p.phase) + 1) * 0.225;

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -50) p.x = canvas.width + 50;
            if (p.x > canvas.width + 50) p.x = -50;
            if (p.y < -50) p.y = canvas.height + 50;
            if (p.y > canvas.height + 50) p.y = -50;

            const a = Math.max(0, Math.min(1, p.o * pulse));

            ctx.fillStyle = '#ff2a2a' + Math.floor(a * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff2a2a' + Math.floor(a * 80).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    requestAnimationFrame(animateStars);
}

// ==================== PARTICLE SYSTEM ====================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 3 + 1;
        this.life = 1;
        this.decay = 0.01 + Math.random() * 0.02;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color + Math.floor(this.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticleBurst(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function animateParticles() {
    particles = particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw(ctx);
        return alive;
    });
}

// ==================== SCROLL HANDLING ====================
let lastScrollY = 0;
let ticking = false;

function updateOnScroll() {
    const scrollPos = window.scrollY;
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;

    // Toggle omni background for aliens section
    if (aliensSection && aliensBg) {
        const aliensTop = aliensSection.getBoundingClientRect().top;
        const shouldEnable = aliensTop <= vh * 0.25;
        aliensBg.classList.toggle('on', shouldEnable);
        aliensBgEnabled = shouldEnable;
    }
    
    // Update navbar
    if (scrollPos > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Update progress bar
    const progress = (scrollPos / maxScroll) * 100;
    navProgress.style.width = progress + '%';
    
    // Handle character cards
    const cardIndex = Math.floor((scrollPos - vh) / vh);
    
    cards.forEach((card, i) => {
        if (i === cardIndex) {
            if (!card.classList.contains('active')) {
                card.classList.add('active');
                currentColor = card.dataset.color;
                document.documentElement.style.setProperty('--primary', currentColor);
                
                // Create particle burst on card activation
                const rect = card.getBoundingClientRect();
                createParticleBurst(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    currentColor,
                    30
                );
            }
        } else {
            card.classList.remove('active');
        }
    });
    
    // Smooth parallax for active card
    const activeCard = document.querySelector('.character-card.active');
    if (activeCard) {
        const cardProgress = ((scrollPos - vh) % vh) / vh;
        const scale = 1 + cardProgress * 0.02;
        
        const char = activeCard.querySelector('.character-layer');
        const bgTitle = activeCard.querySelector('.bg-title');
        
        if (char) {
            const baseTransform = char.style.transform || '';
            // Keep existing mouse parallax, add scroll effect
            if (!baseTransform.includes('translate')) {
                char.style.transform = `scale(${scale})`;
            }
        }
    }
    
    lastScrollY = scrollPos;
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
});

// Escape closes mobile menu
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar && navbar.classList.contains('menu-open')) {
        setMenuOpen(false);
    }
});

// Close menu on navigation
if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
}

if (navScrim) {
    navScrim.addEventListener('click', () => setMenuOpen(false));
}

if (navLinksList) {
    navLinksList.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) setMenuOpen(false);
    });
}

// ==================== MOUSE TRACKING ====================
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update cursor position
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    // Calculate parallax values
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    // Apply parallax to active card
    const activeCard = document.querySelector('.character-card.active');
    if (activeCard) {
        const char = activeCard.querySelector('.character-layer');
        const bgTitle = activeCard.querySelector('.bg-title');
        const aura = activeCard.querySelector('.action-aura');
        const rings = activeCard.querySelector('.energy-rings');
        
        if (char) {
            char.style.transform = `translate(${x * 30}px, ${y * 15}px) scale(1.02)`;
        }
        
        if (bgTitle) {
            bgTitle.style.transform = `translate(${x * -60}px, ${y * -30}px)`;
        }
        
        if (aura) {
            aura.style.transform = `translate(-50%, -50%) translate(${x * 20}px, ${y * 20}px)`;
        }
        
        if (rings) {
            rings.style.transform = `translate(-50%, -50%) translate(${x * 15}px, ${y * 15}px)`;
        }
    }
});

// ==================== CURSOR FOLLOWER ====================
function animateCursorFollower() {
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
    
    cursorX += dx * 0.15;
    cursorY += dy * 0.15;
    
    cursorFollower.style.left = cursorX + 'px';
    cursorFollower.style.top = cursorY + 'px';
    
    requestAnimationFrame(animateCursorFollower);
}

// ==================== BUTTON INTERACTIONS ====================
const buttons = document.querySelectorAll('.btn-play, .btn-info');
buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        cursor.style.width = '50px';
        cursor.style.height = '50px';
        cursor.style.background = currentColor;
        cursor.style.mixBlendMode = 'normal';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });
    
    btn.addEventListener('mouseleave', () => {
        cursor.style.width = '12px';
        cursor.style.height = '12px';
        cursor.style.background = '#fff';
        cursor.style.mixBlendMode = 'difference';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    btn.addEventListener('click', function(e) {
        // Ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn-play, .btn-info {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// ==================== LINK HOVER EFFECTS ====================
const navLinks = document.querySelectorAll('.nav-link-item');
navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        cursor.style.width = '40px';
        cursor.style.height = '40px';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1.3)';
    });
    
    link.addEventListener('mouseleave', () => {
        cursor.style.width = '12px';
        cursor.style.height = '12px';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
    });
});

// ==================== TYPING EFFECT FOR ALIEN NAMES ====================
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Observe when cards become active
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const bgTitle = card.querySelector('.bg-title');
            const alienName = card.dataset.name;
            
            if (bgTitle && alienName && !bgTitle.textContent) {
                setTimeout(() => {
                    typeWriter(bgTitle, alienName, 80);
                }, 500);
            }
        }
    });
}, { threshold: 0.5 });

cards.forEach(card => observer.observe(card));

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const navOffset = navbar ? navbar.offsetHeight + 10 : 90;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navOffset;

        window.scrollTo({
            top,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
});

// ==================== ENHANCED ANIMATION LOOP ====================
function animate() {
    animateParticles();
    requestAnimationFrame(animate);
}

// ==================== INITIALIZATION ====================
function init() {
    setScrollLength();
    initStars();
    animateStars();
    animateCursorFollower();
    animate();
    
    // Initial scroll update
    updateOnScroll();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
}

// ==================== RESIZE HANDLER ====================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setScrollLength();
        initStars();
    }, 250);
});

// ==================== KEYBOARD NAVIGATION ====================
document.addEventListener('keydown', (e) => {
    const scrollAmount = window.innerHeight;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
        });
    }
});

// ==================== PERFORMANCE OPTIMIZATION ====================
// Reduce animations on low-end devices
if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    document.body.classList.add('low-performance');
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .low-performance .action-aura,
        .low-performance .energy-rings,
        .low-performance .stat-fill::after {
            display: none;
        }
    `;
    document.head.appendChild(styleSheet);
}

// ==================== START EVERYTHING ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== EASTER EGG ====================
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-konamiSequence.length);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Secret alien unlocked!
        document.body.style.filter = 'hue-rotate(180deg)';
        createParticleBurst(window.innerWidth / 2, window.innerHeight / 2, '#00ff00', 100);
        
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 3000);
        
        console.log('🎮 Omnitrix activated! All aliens unlocked!');
    }
});
// ==================== FOOTER TYPING EFFECT ====================
const footerTypingMessages = [
    "All Systems Online ✓",
    "Omnitrix Database Active ⬡",
    "24 Heroes Ready for Action 🚀",
    "Protecting Earth from Alien Threats 🌍",
    "It's Hero Time! ⚡"
];

let currentMessageIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeFooterText() {
    const typingElement = document.getElementById('footerTyping');
    if (!typingElement) return;
    
    const currentMessage = footerTypingMessages[currentMessageIndex];
    
    if (isDeleting) {
        typingElement.textContent = currentMessage.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingSpeed = 50;
    } else {
        typingElement.textContent = currentMessage.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100;
    }
    
    if (!isDeleting && currentCharIndex === currentMessage.length) {
        // Pause at end
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentMessageIndex = (currentMessageIndex + 1) % footerTypingMessages.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeFooterText, typingSpeed);
}

// Start typing effect when footer is visible
const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            typeFooterText();
            footerObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const footer = document.querySelector('.site-footer');
if (footer) {
    footerObserver.observe(footer);
}