export function initDemoCaption() {
  if (new URLSearchParams(window.location.search).get("demo") !== "1") return;

  const bar = document.createElement("div");
  bar.id = "demo-caption";
  bar.style.cssText = [
    "position:fixed",
    "bottom:0",
    "left:0",
    "right:0",
    "background:rgba(7,19,31,0.92)",
    "color:#f2e8be",
    'font-family:"Share Tech Mono",monospace',
    "font-size:18px",
    "line-height:1.45",
    "padding:13px 32px",
    "text-align:center",
    "z-index:9999",
    "border-top:2px solid rgba(70,217,196,0.45)",
    "pointer-events:none",
    "opacity:0",
    "transition:opacity 0.35s ease",
    "letter-spacing:0.02em",
  ].join(";");
  document.body.appendChild(bar);

  // Playwright drives captions by calling window.__demoSetCaption(text).
  // An empty string fades the bar out.
  window.__demoSetCaption = (text) => {
    bar.textContent = text ?? "";
    bar.style.opacity = text ? "1" : "0";
  };
}
