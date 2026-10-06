(() => {
  "use strict";

  const normalize = (value) =>
    String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();

  const getLines = (element) =>
    (element?.innerText || "")
      .split(/\r?\n/)
      .map(normalize)
      .filter(Boolean);

  const findLine = (lines, prefix) =>
    lines.findIndex((line) => line.startsWith(prefix));

  function getRecordCard(button) {
    let node = button;
    for (let i = 0; i < 10 && node; i += 1) {
      const text = node.innerText || "";
      if (
        text.includes("نوع العمل") &&
        text.includes("الأقسام المستخدمة") &&
        text.includes("المجموع النهائي")
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function valueAfterLabel(lines, label) {
    const index = findLine(lines, label);
    if (index < 0) return "";
    const line = lines[index];
    const inline = normalize(line.slice(label.length).replace(/^[:：-]\s*/, ""));
    return inline || lines[index + 1] || "";
  }

  function buildMessage(card) {
    const lines = getLines(card);
    const workType = valueAfterLabel(lines, "نوع العمل");
    const customer = valueAfterLabel(lines, "اسم العميل");

    const sectionsIndex = findLine(lines, "الأقسام المستخدمة");
    const sectionsTotalIndex = findLine(lines, "مجموع الأقسام");
    const shippingIndex = lines.findIndex((line) => line.includes("مصاريف الشحن"));
    const finalTotalIndex = findLine(lines, "المجموع النهائي");

    const sectionLines =
      sectionsIndex >= 0
        ? lines.slice(
            sectionsIndex + 1,
            sectionsTotalIndex > sectionsIndex ? sectionsTotalIndex : (shippingIndex > sectionsIndex ? shippingIndex : lines.length)
          )
        : [];

    const shippingLabel = shippingIndex >= 0 ? lines[shippingIndex] : "";
    const shippingValue =
      shippingIndex >= 0
        ? normalize(shippingLabel.replace(/^مصاريف الشحن(?:\s*\([^)]*\))?\s*[:：-]?\s*/i, "")) ||
          lines[shippingIndex + 1] ||
          ""
        : "";

    const finalTotalLabel = finalTotalIndex >= 0 ? lines[finalTotalIndex] : "";
    const finalTotal =
      normalize(finalTotalLabel.replace(/^المجموع النهائي\s*[:：-]?\s*/i, "")) ||
      (finalTotalIndex >= 0 ? lines[finalTotalIndex + 1] || "" : "");

    const message = [];
    if (customer) message.push("العميل: " + customer);
    if (workType) message.push("نوع العمل: " + workType);

    if (sectionLines.length) {
      message.push("", "الأقسام والمواد:");
      message.push(...sectionLines);
    }

    if (shippingValue) {
      message.push("", "مصاريف الشحن: " + shippingValue);
    }

    if (finalTotal) {
      message.push("المجموع النهائي: " + finalTotal);
    }

    return message.join("\n").trim();
  }

  function addShareButtons() {
    const buttons = Array.from(document.querySelectorAll("button"));
    for (const editButton of buttons) {
      const label = normalize(editButton.textContent);
      if (!label.includes("تعديل العملية")) continue;

      const card = getRecordCard(editButton);
      if (!card || card.querySelector("[data-whatsapp-share]")) continue;

      const shareButton = document.createElement("button");
      shareButton.type = "button";
      shareButton.setAttribute("data-whatsapp-share", "true");
      shareButton.setAttribute("aria-label", "مشاركة العملية عبر واتساب");
      shareButton.textContent = "مشاركة واتساب";
      shareButton.style.cssText =
        "margin-inline-start:8px;border:1px solid hsl(var(--border));border-radius:10px;padding:8px 12px;background:hsl(var(--card)/.7);color:inherit;font-weight:700;font-size:12px;cursor:pointer";

      shareButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const message = buildMessage(card);
        if (!message) return;
        const url = "https://wa.me/?text=" + encodeURIComponent(message);
        window.open(url, "_blank", "noopener,noreferrer");
      });

      editButton.parentElement?.appendChild(shareButton);
    }
  }

  const observer = new MutationObserver(addShareButtons);
  observer.observe(document.body, { childList: true, subtree: true });
  addShareButtons();
})();
