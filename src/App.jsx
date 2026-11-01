import { useState, useEffect, useRef, useCallback } from "react";

/* =========================================================
   CONTENT: edit your text, prices and templates here
   ========================================================= */
const NAME = "Edmund";
const LOCATION = "South Africa";
const AGE = 20;
const CONTACT_EMAIL = "workMail_Siya@proton.me";
const FORM_URL = "https://formspree.io/f/meaarzar";

// All prices are in USD.
const PRICES = [
  { name: "Starter", detail: "One-page website", price: "from $150" },
  { name: "Standard", detail: "Multi-section website", price: "from $300" },
  { name: "Custom", detail: "Bespoke design, motion and 3D", price: "from $600" },
  { name: "Care plan", detail: "Hosting, updates and small changes", price: "$20 / month" },
];

// One object per template. Replace the placeholder with your real ones.
// - liveUrl: link to the live demo (leave "" and the row shows "Coming soon")
// - image: optional preview, e.g. import shot from "./assets/templates/barber.png"
const TEMPLATES = [
  {
    name: "Barber Shop",
    description: "One-page site for barbers: services, prices, WhatsApp booking.",
    tags: ["HTML", "CSS", "Responsive"],
    liveUrl: "",
    image: null,
  },
];

/* =========================================================
   BACKGROUND: soft moving wave lines (canvas)
   ========================================================= */
function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr, raf;
    let t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      t += 0.006;
      const rowSpacing = Math.max(34, h / 18);
      const rows = Math.ceil(h / rowSpacing) + 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      for (let r = -1; r < rows; r++) {
        const baseY = r * rowSpacing;
        const step = Math.max(10, w / 90);
        ctx.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          const y =
            baseY +
            Math.sin(x * 0.008 + t * 1.4 + r * 0.5) * 10 +
            Math.sin(x * 0.02 - t * 0.8 + r) * 4;
          if (x === -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    function onResize() {
      resize();
      if (reduceMotion) draw();
    }

    resize();
    draw();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="waves" aria-hidden="true" />;
}

/* =========================================================
   PAGES
   ========================================================= */
function Page({ active, children }) {
  return <section className={`page${active ? " is-active" : ""}`}>{children}</section>;
}

function HomePage({ active, onContact, onTemplates, year }) {
  return (
    <Page active={active}>
      <div className="page-inner page-inner--center home">
        <h1 className="hero-title">Websites, made simple.</h1>
        <p className="hero-sub">Web developer · {LOCATION}</p>
        <div className="hero-actions">
          <button className="btn btn--primary" onClick={onContact}>
            Start a project
          </button>
          <button className="btn btn--ghost" onClick={onTemplates}>
            See templates ›
          </button>
        </div>
      </div>
      <p className="footer">© {year} {NAME}</p>
    </Page>
  );
}

function AboutPage({ active }) {
  return (
    <Page active={active}>
      <div className="page-inner page-inner--center">
        <h2 className="page-title about-title">Websites that are simple, fast and clear.</h2>

        <div className="about-copy">
          <p>
            I'm {NAME}, a {AGE}-year-old web developer from {LOCATION}. I build clean,
            mobile-friendly websites for small businesses, so customers can find you, trust you
            and get in touch within seconds.
          </p>
          <p>
            I use ready-made templates when you want to get online quickly and affordably, and
            build fully custom when you need something that's only yours.
          </p>
        </div>

        <div className="pricing">
          <p className="eyebrow">Pricing</p>
          {PRICES.map((p) => (
            <div className="price-row" key={p.name}>
              <div>
                <div className="price-name">{p.name}</div>
                <div className="price-detail">{p.detail}</div>
              </div>
              <div className="price-amount">{p.price}</div>
            </div>
          ))}
          <p className="price-note">All prices in USD.</p>
        </div>
      </div>
    </Page>
  );
}

function TemplatesPage({ active }) {
  return (
    <Page active={active}>
      <div className="page-inner page-inner--top">
        <h2 className="page-title">Templates</h2>
        <p className="page-sub">Ready-made starting points for small business sites.</p>

        <div className="tpl-list">
          {TEMPLATES.map((t) => (
            <article className="tpl-row" key={t.name}>
              <div>
                <h3 className="tpl-name">{t.name}</h3>
                <p className="tpl-desc">{t.description}</p>
                <p className="tpl-tags">{t.tags.join(" · ")}</p>
                {t.image && <img className="tpl-img" src={t.image} alt={`${t.name} template preview`} />}
              </div>
              {t.liveUrl ? (
                <a className="tpl-link" href={t.liveUrl} target="_blank" rel="noopener noreferrer">
                  View live →
                </a>
              ) : (
                <span className="tpl-soon">Coming soon</span>
              )}
            </article>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* =========================================================
   CONTACT MODAL
   ========================================================= */
function ContactModal({ email, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(FORM_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.target),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const busy = status === "sending" || status === "sent";

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-head">
          <h2 className="modal-title" id="contact-title">Get in touch</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input className="field" name="name" placeholder="Your name" aria-label="Your name" autoComplete="name" required />
        <input className="field" name="email" type="email" placeholder="Your email" aria-label="Your email" autoComplete="email" required />
        <textarea className="field" name="message" placeholder="What are you looking to build?" aria-label="Message" required />
        {/* spam trap: real people never see or fill this */}
        <input className="hp" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send message"}
        </button>
        <p className={`modal-status${status === "error" ? " is-error" : ""}`}>
          {status === "sent"
            ? "Message sent. I'll reply soon."
            : status === "error"
            ? `Something went wrong. Try again, or email ${email} directly.`
            : `Goes straight to ${email}`}
        </p>
      </form>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */
export default function Portfolio() {
  const [page, setPage] = useState("home"); // home | about | templates
  const [showContact, setShowContact] = useState(false);
  const year = new Date().getFullYear();

  const openContact = useCallback(() => setShowContact(true), []);
  const closeContact = useCallback(() => setShowContact(false), []);

  const link = (id, label) => (
    <button className={`nav-link${page === id ? " is-current" : ""}`} onClick={() => setPage(id)}>
      {label}
    </button>
  );

  return (
    <div className="app">
      <WaveBackground />

      <header className="nav">
        <button className="brand" onClick={() => setPage("home")}>
          {NAME}
        </button>
        <nav className="nav-links">
          {link("about", "About")}
          {link("templates", "Templates")}
          <button className="nav-link" onClick={openContact}>
            Contact
          </button>
        </nav>
      </header>

      <HomePage
        active={page === "home"}
        onContact={openContact}
        onTemplates={() => setPage("templates")}
        year={year}
      />
      <AboutPage active={page === "about"} />
      <TemplatesPage active={page === "templates"} />

      {showContact && <ContactModal email={CONTACT_EMAIL} onClose={closeContact} />}
    </div>
  );
}
