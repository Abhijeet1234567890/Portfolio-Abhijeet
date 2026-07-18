// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Navbar scroll state
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 12);
});

// ---------- MOBILE NAV (state, focus management, scroll lock) ----------
const navToggle = document.getElementById("nav-toggle");
const navLinksEl = document.getElementById("nav-links");
const navBackdrop = document.getElementById("nav-backdrop");
const mobileSidebarClose = document.getElementById("mobile-sidebar-close");

// FIX: single source of truth for open/closed state, instead of inferring
// state from classList in multiple places (which was error-prone).
let isNavOpen = false;
let lastFocusedEl = null; // FIX: remembers what to restore focus to on close

function getFocusableItems() {
  // The fixed internal close button plus all drawer links, used for focus trapping.
  return Array.from(navLinksEl.querySelectorAll("button, a"));
}

function openMobileNav() {
  if (isNavOpen) return;
  isNavOpen = true;

  lastFocusedEl = document.activeElement; // FIX: remember trigger for focus restore

  navToggle.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Close menu"); // FIX: dynamic label

  navLinksEl.classList.add("open");
  navBackdrop.classList.add("open");

  // FIX: body scroll lock set directly via inline style (per spec),
  // in addition to the CSS class fallback in style.css.
  document.body.style.overflow = "hidden";
  document.body.classList.add("nav-open");

  // FIX: move focus into the sidebar (internal close button) once it's open.
  const focusables = getFocusableItems();
  if (focusables.length) {
    // Wait a frame so focus doesn't fight the opening transition.
    requestAnimationFrame(() => focusables[0].focus());
  }

  document.addEventListener("keydown", handleNavKeydown);
}

function closeMobileNav() {
  if (!isNavOpen) return;
  isNavOpen = false;

  navToggle.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");

  navLinksEl.classList.remove("open");
  navBackdrop.classList.remove("open");

  document.body.style.overflow = "auto"; // FIX: explicit restore, per spec
  document.body.classList.remove("nav-open");

  document.removeEventListener("keydown", handleNavKeydown);

  // FIX: restore focus to whatever opened the menu (usually the toggle button).
  (lastFocusedEl || navToggle).focus();
  lastFocusedEl = null;
}

// FIX: single keydown handler bound only while the drawer is open.
// Escape closes it; Tab is trapped inside the drawer so keyboard focus
// can't silently land on hidden/underlying page content.
function handleNavKeydown(e) {
  if (e.key === "Escape") {
    closeMobileNav();
    return;
  }

  if (e.key === "Tab") {
    const focusables = getFocusableItems();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

navToggle.addEventListener("click", () => {
  if (isNavOpen) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

// Overlay click closes the sidebar.
navBackdrop.addEventListener("click", closeMobileNav);

// Internal sidebar header close button; keeps the close control inside the drawer.
mobileSidebarClose.addEventListener("click", closeMobileNav);

// Every menu link closes the sidebar on click. Reliable now that the
// z-index stacking bug in the CSS is fixed (see style.css).
navLinksEl.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileNav);
});

// NOTE on "remove listeners on unmount": this is a static page, not a
// component with a lifecycle, so there is no unmount event to hook here.
// If this is ever ported to React, tear the keydown listener down in a
// useEffect cleanup, e.g.:
//
//   useEffect(() => {
//     if (!isNavOpen) return;
//     document.addEventListener("keydown", handleNavKeydown);
//     return () => document.removeEventListener("keydown", handleNavKeydown);
//   }, [isNavOpen]);

// Typing effect for hero role
const roles = [
  "Full Stack Developer",
  "MERN Stack Developer",
  "React.js Developer",
  "Node.js Developer"
];
const typingEl = document.getElementById("typing");
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const current = roles[roleIndex];

  if (!deleting) {
    charIndex++;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1400);
      return;
    }
  } else {
    charIndex--;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }

  setTimeout(typeLoop, deleting ? 45 : 75);
}
typeLoop();

// Scroll reveal
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

// Active nav link on scroll
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);
sections.forEach((section) => sectionObserver.observe(section));

// ---------- SCROLL TO TOP ----------
const scrollTopBtn = document.getElementById("scroll-top-btn");

window.addEventListener("scroll", () => {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---------- CONTACT FORM (EmailJS — no backend needed) ----------
// 1. Create a free account at https://www.emailjs.com
// 2. Add an Email Service (e.g. connect gajadhanetathaget@gmail.com) -> copy the Service ID
// 3. Create an Email Template with variables: {{name}}, {{email}}, {{message}} -> copy the Template ID
// 4. Account > General -> copy your Public Key
// 5. Paste all three values below.


const EMAILJS_PUBLIC_KEY = "PezGOtbz37OdqODZV";
const EMAILJS_SERVICE_ID = "service_cpwbgb9";
const EMAILJS_TEMPLATE_ID = "template_irt86qb";

if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

const contactForm = document.getElementById("contact-form");
const sendBtn = document.getElementById("send-btn");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
      formStatus.textContent =
        "Email sending isn't configured yet — add your EmailJS keys in script.js.";
      formStatus.classList.add("form-status-error");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    formStatus.textContent = "";
    formStatus.classList.remove("form-status-error", "form-status-ok");

    const params = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      message: document.getElementById("message").value
    };

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
      .then(() => {
        formStatus.textContent = "Message sent — thank you! I'll reply soon.";
        formStatus.classList.add("form-status-ok");
        contactForm.reset();
      })
      .catch((err) => {
        formStatus.textContent = "Something went wrong. Please email me directly instead.";
        formStatus.classList.add("form-status-error");
        console.error("EmailJS error:", err);
      })
      .finally(() => {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Message";
      });
  });
}




