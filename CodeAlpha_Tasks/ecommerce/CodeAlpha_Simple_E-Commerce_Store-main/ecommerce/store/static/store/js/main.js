// ── NAVBAR SCROLL EFFECT ────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ── USER DROPDOWN TOGGLE ────────────────────────────────────────────────
function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const menu = document.querySelector('.nav-user-menu');
  const dropdown = document.getElementById('userDropdown');
  if (menu && dropdown && !menu.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

// ── MOBILE MENU TOGGLE ──────────────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('mobileMenuBtn');
  if (menu) {
    menu.classList.toggle('open');
    if (btn) {
      btn.innerHTML = menu.classList.contains('open')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    }
  }
}

// ── AUTO-DISMISS MESSAGES ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(20px)';
      alert.style.transition = 'all 0.4s ease';
      setTimeout(() => alert.remove(), 400);
    }, 4000);
  });

  // ── PRODUCT CARD HOVER EFFECT ─────────────────────────────────────────
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '2';
    });
    card.addEventListener('mouseleave', () => {
      card.style.zIndex = '';
    });
  });

  // ── ADD TO CART ANIMATION ─────────────────────────────────────────────
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const original = this.innerHTML;
      this.innerHTML = '<i class="fas fa-check"></i> Added!';
      this.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      setTimeout(() => {
        this.innerHTML = original;
        this.style.background = '';
      }, 1200);
    });
  });

  // ── SMOOTH SCROLL FOR ANCHOR LINKS ───────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── QUANTITY INPUT VALIDATION ─────────────────────────────────────────
  document.querySelectorAll('input[type="number"][name="quantity"]').forEach(input => {
    input.addEventListener('change', () => {
      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || 999;
      let val = parseInt(input.value);
      if (isNaN(val) || val < min) input.value = min;
      if (val > max) input.value = max;
    });
  });

  // ── LAZY LOAD IMAGES ──────────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });
    document.querySelectorAll('img[loading="lazy"]').forEach(img => imgObserver.observe(img));
  }
});

// ── CHECKOUT FORM VALIDATION ────────────────────────────────────────────
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', function (e) {
    const btn = this.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
    }
  });
}

// ── SEARCH INPUT DEBOUNCE (UX) ──────────────────────────────────────────
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.target.closest('form').submit();
    }
  });
}
