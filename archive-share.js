<script>
(function(){
  const SHARE_LABEL = "مشاركة واتساب";
  const clean = (s) => s.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
  const lines = (s) => s.split(/\r?\n/).map(clean).filter(Boolean);
  const findValue = (ls, labels) => {
    for (const line of ls) {
      for (const label of labels) {
        const m = line.match(new RegExp("^" + label + "\\s*[:：-]?\\s*(.+)$"));
        if (m) return clean(m[1]);
      }
    }
    return "";
  };
  function buildMessage(card){
    const ls = lines(card.innerText || "");
    const work = findValue(ls, ["اسم العمل","نوع العمل","العمل"]);
    const shippingIndex = ls.findIndex(x => x.includes("مصاريف الشحن"));
    const totalIndex = ls.findIndex(x => x.startsWith("المجموع"));
    const materialsIndex = ls.findIndex(x => x === "المواد" || x.startsWith("المواد:"));
    let materialLines = [];
    if (materialsIndex >= 0) {
      const end = shippingIndex >= 0 ? shippingIndex : (totalIndex >= 0 ? totalIndex : ls.length);
      materialLines = ls.slice(materialsIndex + 1, end).filter(x => !/^اسم العميل|^التاريخ|^طريقة الدفع|^المدفوع|^المتبقي/.test(x));
    }
    const shipping = shippingIndex >= 0 ? (ls[shippingIndex].split(/[:：]/).slice(1).join(":").trim() || ls[shippingIndex]) : "";
    const total = totalIndex >= 0 ? (ls[totalIndex].split(/[:：]/).slice(1).join(":").trim() || ls[totalIndex]) : "";
    const out = [];
    if (work) out.push("اسم العمل: " + work);
    if (materialLines.length) out.push("", "المواد:", ...materialLines);
    if (shipping) out.push("", "مصاريف الشحن: " + shipping.replace(/^مصاريف الشحن\s*/, ""));
    if (total) out.push("", "المجموع: " + total.replace(/^المجموع\s*/, ""));
    return out.join("\n").trim();
  }
  function addButtons(){
    const candidates = Array.from(document.querySelectorAll("button")).filter(b => clean(b.textContent || "") === "تعديل");
    for (const edit of candidates) {
      const card = edit.closest("article, [role='article'], .rounded-2xl, .rounded-xl, .border");
      if (!card || card.querySelector("[data-whatsapp-share]")) continue;
      const share = document.createElement("button");
      share.type = "button";
      share.setAttribute("data-whatsapp-share", "true");
      share.textContent = "📤 " + SHARE_LABEL;
      share.style.cssText = "margin-inline-start:8px;border:1px solid hsl(var(--border));border-radius:10px;padding:8px 12px;background:hsl(var(--card)/.7);color:inherit;font-weight:700;font-size:12px;cursor:pointer";
      share.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        const message = buildMessage(card);
        if (!message) return;
        window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
      });
      edit.parentElement && edit.parentElement.appendChild(share);
    }
  }
  const observer = new MutationObserver(addButtons);
  observer.observe(document.body, {childList:true, subtree:true});
  window.addEventListener("load", addButtons);
  addButtons();
})();
</script>
