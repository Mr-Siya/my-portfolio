import { useState, useEffect, useRef, useCallback } from "react";

import pose1 from "./assets/photos/pose1.png";
import pose2 from "./assets/photos/pose2.png";
import pose3 from "./assets/photos/pose3.png";

const NAME = "EDMUND";
const POSES = [
  { label: "01", src: pose1 },
  { label: "02", src: pose2 },
  { label: "03", src: pose3 },
];

function useCrossfade(count, interval = 3200) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [count, interval]);
  return index;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function WaveBackground() {
  // Smoothly moving wave-line field, canvas-based, seamless and cheap.
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      t += 0.006;
      const rowSpacing = Math.max(34, h / 18);
      const rows = Math.ceil(h / rowSpacing) + 2;
      ctx.lineWidth = 1;
      for (let r = -1; r < rows; r++) {
        const baseY = r * rowSpacing;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(245,245,245,0.10)";
        const step = Math.max(10, w / 90);
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
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

function PhotoStack({ index, compact }) {
  return (
    <div
      style={{
        position: "relative",
        width: compact ? "clamp(180px, 42vw, 300px)" : "clamp(220px, 30vw, 380px)",
        height: compact ? "clamp(230px, 54vw, 380px)" : "clamp(280px, 40vw, 480px)",
        transition: "width 900ms cubic-bezier(.7,0,.2,1), height 900ms cubic-bezier(.7,0,.2,1)",
      }}
    >
      {POSES.map((p, i) => (
        <div
          key={p.label}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            opacity: i === index ? 1 : 0,
            transition: "opacity 900ms ease",
          }}
        >
          <img
            src={p.src}
            alt={`Edmund — pose ${p.label}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "grayscale(100%) contrast(1.05)",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}

function AboutPhoto({ active, src }) {
  const wrapRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 14 });
  };

  const handleLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "800px",
        opacity: active ? 1 : 0,
        transition: "opacity 700ms ease 200ms",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <img
        src={src}
        alt="Edmund"
        draggable={false}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: "grayscale(100%) contrast(1.08)",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`,
          transition: "transform 250ms ease-out",
          userSelect: "none",
        }}
      />
    </div>
  );
}

function ContactModal({ email, onClose }) {
  const [name, setName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [message, setMessage] = useState("");

  const inputStyle = {
    width: "100%",
    background: "rgba(245,245,245,0.06)",
    border: "1px solid rgba(245,245,245,0.15)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#f5f5f5",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12.5px",
    outline: "none",
  };

  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/xoeawqlg", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.target),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "rgba(245,245,245,0.06)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(245,245,245,0.14)",
          borderRadius: "20px",
          padding: "clamp(20px, 3vw, 28px)",
          boxShadow: "0 20px 50px -12px rgba(0,0,0,0.8), 0 1px 0 rgba(245,245,245,0.08) inset",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "rgba(245,245,245,0.4)",
            }}
          >
            CONTACT
          </span>
          <button
            type="button"
            onClick={onClose}
            className="nav-link"
            style={{ padding: "0" }}
          >
            ✕
          </button>
        </div>

        <input
          name="name"
          style={inputStyle}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          name="email"
          style={inputStyle}
          type="email"
          placeholder="Your email (so I can reply)"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          required
        />
        <textarea
          name="message"
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical", fontFamily: "'JetBrains Mono', monospace" }}
          placeholder="What are you looking to build?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          style={{
            marginTop: "6px",
            background: "#f5f5f5",
            color: "#050505",
            border: "none",
            borderRadius: "999px",
            padding: "12px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: status === "sending" || status === "sent" ? "default" : "pointer",
            opacity: status === "sending" ? 0.6 : 1,
          }}
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send message →"}
        </button>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: status === "error" ? "rgba(255,120,120,0.8)" : "rgba(245,245,245,0.35)",
            textAlign: "center",
          }}
        >
          {status === "sent"
            ? "Message sent — I'll reply soon."
            : status === "error"
            ? "Something went wrong — try again, or email directly."
            : `Goes straight to ${email}`}
        </span>
      </form>
    </div>
  );
}

export default function Portfolio() {
  const [page, setPage] = useState("home");
  const [showContact, setShowContact] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const poseIndex = useCrossfade(POSES.length);
  const isMobile = useIsMobile();

  const goAbout = useCallback(() => {
    setTransitioning(true);
    setPage("about");
    setTimeout(() => setTransitioning(false), 950);
  }, []);

  const goHome = useCallback(() => {
    setTransitioning(true);
    setPage("home");
    setTimeout(() => setTransitioning(false), 950);
  }, []);

  const isAbout = page === "about";
  const year = new Date().getFullYear();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "560px",
        background: "#050505",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .nav-link {
          background: none;
          border: none;
          color: rgba(245,245,245,0.75);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 8px 4px;
          transition: color 250ms ease;
          white-space: nowrap;
        }
        .nav-link:hover { color: #f5f5f5; }
        .nav-link:focus-visible { outline: 1px solid rgba(245,245,245,0.6); outline-offset: 3px; }
        @media (max-width: 760px) {
          .about-grid { grid-template-columns: 1fr !important; grid-template-rows: auto auto; gap: 18px; padding-top: 90px !important; overflow-y: auto; }
          .about-head { height: min(34vh, 260px) !important; }
        }
      `}</style>

      <WaveBackground />

      {/* Nav */}
      <div
        style={{
          position: "absolute",
          top: "22px",
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          zIndex: 10,
          padding: "0 clamp(16px, 4vw, 40px)",
          flexWrap: "wrap",
        }}
      >
        <div
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") goHome(); }}
          style={{
            background: "rgba(245,245,245,0.05)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderRadius: "999px",
            padding: "10px 20px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "13px",
            letterSpacing: "0.08em",
            color: "#f5f5f5",
            cursor: "pointer",
            boxShadow:
              "0 10px 24px -6px rgba(0,0,0,0.9), 0 1px 0 rgba(245,245,245,0.08) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
            border: "1px solid rgba(245,245,245,0.12)",
          }}
        >
          {NAME}
        </div>

        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            background: "rgba(245,245,245,0.05)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderRadius: "999px",
            padding: "6px 16px",
            border: "1px solid rgba(245,245,245,0.12)",
            boxShadow:
              "0 10px 24px -6px rgba(0,0,0,0.9), 0 1px 0 rgba(245,245,245,0.08) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
          }}
        >
          {!isAbout && (
            <button className="nav-link" onClick={goAbout}>
              About
            </button>
          )}
          {isAbout && (
            <button className="nav-link" onClick={goHome}>
              ← Back
            </button>
          )}
          <span style={{ color: "rgba(245,245,245,0.2)", padding: "8px 0" }}>/</span>
          <button className="nav-link" onClick={() => setShowContact(true)}>
            Contact
          </button>
        </div>
      </div>

      {/* HOME */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(40px, 8vh, 90px)",
          opacity: isAbout ? 0 : 1,
          transform: isAbout ? "scale(0.96)" : "scale(1)",
          transition: "opacity 700ms ease, transform 900ms cubic-bezier(.7,0,.2,1)",
          pointerEvents: isAbout ? "none" : "auto",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(40px, 10vw, 120px)",
            letterSpacing: "0.02em",
            color: "rgba(245,245,245,0.9)",
            whiteSpace: "nowrap",
            userSelect: "none",
            marginBottom: "clamp(8px, 3vh, 28px)",
            textShadow: "0 0 40px rgba(245,245,245,0.15)",
          }}
        >
          {NAME}
        </div>
        <PhotoStack index={poseIndex} compact={isMobile} />
      </div>

      {/* ABOUT */}
      <div
        className="about-grid"
        style={{
          position: "absolute",
          inset: 0,
          display: isAbout || transitioning ? "grid" : "none",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          opacity: isAbout ? 1 : 0,
          transition: "opacity 700ms ease 150ms",
          padding: "0 6vw",
        }}
      >
        <div
          className="about-head"
          style={{ height: "min(60vh, 480px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ width: "100%", height: "100%" }}>
            <AboutPhoto active={isAbout} src={pose3} />
          </div>
        </div>

        <div
          style={{
            color: "#f5f5f5",
            maxWidth: "440px",
            opacity: isAbout ? 1 : 0,
            transform: isAbout ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 600ms ease 400ms, transform 600ms ease 400ms",
            background: "rgba(245,245,245,0.05)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(245,245,245,0.12)",
            borderRadius: "20px",
            padding: "clamp(20px, 3vw, 32px)",
            boxShadow:
              "0 20px 50px -12px rgba(0,0,0,0.7), 0 1px 0 rgba(245,245,245,0.08) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "rgba(245,245,245,0.4)",
              marginBottom: "16px",
            }}
          >
            ABOUT
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: "clamp(20px, 2.4vw, 30px)",
              lineHeight: 1.25,
              margin: "0 0 18px 0",
            }}
          >
            I build websites that refuse to look ordinary.
          </h2>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12.5px",
              lineHeight: 1.8,
              color: "rgba(245,245,245,0.68)",
              margin: "0 0 22px 0",
            }}
          >
            I'm Edmund, a 20-year-old front-end developer focused on creating custom websites, motion and interactive experiences.
            <br /><br />
            Custom websites start at $500. Premium builds — custom motion, 3D, the kind of
            detail this site has — start at $750.
            <br /><br />
            What makes a site of mine different is that I make sure the website is unique to you and your brand. I don't use templates, and I don't use pre-built components. 
            Everything is built from scratch, so you get a site that is truly yours.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["Standard sites — from $500", "Premium builds — from $750"].map(
              (line) => (
                <div key={line} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "5px", height: "5px", background: "#f5f5f5", opacity: 0.5, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "rgba(245,245,245,0.8)" }}>
                    {line}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showContact && (
        <ContactModal email="mr_siya@proton.me" onClose={() => setShowContact(false)} />
      )}

      {/* Footer / copyright */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "rgba(245,245,245,0.32)",
          }}
        >
          © {year} {NAME}'S PORTFOLIO
        </span>
      </div>
    </div>
  );
}
