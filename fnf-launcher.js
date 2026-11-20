(() => {
  const root = document.getElementById("fnf-launcher");
  if (!root) return;
  root.innerHTML = '<main><h1>Friday Night Funkin\'</h1><p>Click below to open the game in an about:blank tab.</p><button type="button" id="play-fnf">Play FNF</button></main>';
  Object.assign(root.style, {
    minHeight: "100vh", display: "grid", placeItems: "center",
    padding: "24px", boxSizing: "border-box", background: "#111",
    color: "#fff", fontFamily: "Arial,sans-serif", textAlign: "center"
  });
  const style = document.createElement("style");
  style.textContent = '#fnf-launcher *{box-sizing:border-box}#fnf-launcher h1{font-size:clamp(28px,5vw,42px);margin:0 0 12px}#fnf-launcher p{color:#ccc;line-height:1.5;margin:0 0 24px}#fnf-launcher button{border:0;border-radius:10px;padding:15px 28px;background:#ff4b9a;color:#111;font-size:18px;font-weight:700;cursor:pointer}';
  document.head.appendChild(style);
  document.getElementById("play-fnf").addEventListener("click", () => {
    const tab = window.open("about:blank", "_blank");
    if (!tab) { alert("Allow pop-ups for this site, then try again."); return; }
    const gameUrl = "https://kbhgames.com/game/friday-night-funkin";
    const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Friday Night Funkin'</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#090a0d}.crop{position:fixed;inset:0;overflow:hidden;aspect-ratio:1.782}.crop iframe{position:absolute;left:-12.85%;top:-17.7%;width:100%;height:400%;border:0;transform:scale(1.327,1.177);transform-origin:top left}</style></head><body><div class="crop"><iframe src="${gameUrl}" title="Friday Night Funkin' on KBH Games" scrolling="no" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation" allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write" allowfullscreen></iframe></div></body></html>`;
    tab.document.open(); tab.document.write(page); tab.document.close();
  });
})();