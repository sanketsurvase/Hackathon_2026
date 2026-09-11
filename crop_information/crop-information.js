// ========================================================
// KISANSETU - CROP INFORMATION JAVASCRIPT
// ========================================================

(function () {
  'use strict';

  function initSeedCrops() {
    const existing = localStorage.getItem("kisansetu_crops");
    if (!existing || JSON.parse(existing).length === 0) {
      const seed = [
        {
          id: "crop_1",
          name: "सोयाबीन (Soybean)",
          variety: "JS 335 (फुले कल्याणी)",
          area: "२.५ एकर",
          quantity: "४५ क्विंटल",
          gatNo: "१४२/२",
          status: "काढणीस तयार (Ready)",
          avatar: "🫘"
        },
        {
          id: "crop_2",
          name: "कापूस (Cotton)",
          variety: "अजित १५५ बीटी",
          area: "२.० एकर",
          quantity: "३० क्विंटल",
          gatNo: "१४२/३",
          status: "वाढीची अवस्था (Growing)",
          avatar: "☁️"
        },
        {
          id: "crop_3",
          name: "हरभरा (Chana)",
          variety: "दिग्विजय (काबुली)",
          area: "१.५ एकर",
          quantity: "२५ क्विंटल",
          gatNo: "११२/अ",
          status: "नियोजित रब्बी",
          avatar: "🌱"
        }
      ];
      localStorage.setItem("kisansetu_crops", JSON.stringify(seed));
    }
  }

  function getCrops() {
    try {
      return JSON.parse(localStorage.getItem("kisansetu_crops") || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  function renderCrops() {
    const container = document.getElementById("cropCardsContainer");
    const countBadge = document.getElementById("cropCountBadge");
    if (!container) return;

    const list = getCrops();
    if (countBadge) countBadge.textContent = `${list.length} पिके नोंदणीकृत`;

    container.innerHTML = "";

    list.forEach(c => {
      const card = document.createElement("div");
      card.className = "crop-card";

      let icon = c.avatar || "🌱";
      if (!c.avatar) {
        if (c.name.includes("सोयाबीन")) icon = "🫘";
        else if (c.name.includes("कापूस")) icon = "☁️";
        else if (c.name.includes("तूर")) icon = "🌾";
        else if (c.name.includes("गहू")) icon = "🍞";
      }

      card.innerHTML = `
        <div>
          <div class="crop-card-top">
            <div class="c-avatar">${icon}</div>
            <div class="c-heading">
              <h3>${c.name}</h3>
              <p>${c.variety || 'सुधारित वाण'}</p>
            </div>
          </div>
          <div class="crop-meta-list">
            <div><span>शेतजमीन क्षेत्र:</span> <strong>${c.area}</strong></div>
            <div><span>अंदाजे उत्पादन:</span> <strong>${c.quantity}</strong></div>
            <div><span>७/१२ गट क्रमांक:</span> <strong>${c.gatNo}</strong></div>
            <div><span>सद्यस्थिती:</span> <strong>${c.status || 'नोंदणीकृत'}</strong></div>
          </div>
        </div>
        <a href="../slot_booking/slot-booking.html" class="crop-book-btn">
          या पिकासाठी स्लॉट बुक करा →
        </a>
      `;

      container.appendChild(card);
    });
  }

  // Modal Setup
  document.addEventListener("DOMContentLoaded", () => {
    initSeedCrops();
    renderCrops();

    const modal = document.getElementById("newCropModal");
    const openBtn = document.getElementById("openCropModalBtn");
    const closeBtn = document.getElementById("closeCropModal");
    const cancelBtn = document.getElementById("cancelCropModal");
    const form = document.getElementById("newCropForm");

    function openModal() {
      if (modal) {
        modal.hidden = false;
        modal.style.display = "flex";
      }
    }

    function closeModal() {
      if (modal) {
        modal.hidden = true;
        modal.style.display = "none";
      }
    }

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("modalCropName").value;
        const variety = document.getElementById("modalCropVariety").value || "स्थानिक वाण";
        const area = document.getElementById("modalArea").value + " एकर";
        const qty = document.getElementById("modalQty").value + " क्विंटल";
        const gatNo = document.getElementById("modalGatNo").value;

        const newCrop = {
          id: "crop_" + Date.now(),
          name: name,
          variety: variety,
          area: area,
          quantity: qty,
          gatNo: gatNo,
          status: "नोंदणीकृत (Registered)"
        };

        const list = getCrops();
        list.push(newCrop);
        localStorage.setItem("kisansetu_crops", JSON.stringify(list));

        form.reset();
        closeModal();
        renderCrops();
        alert("नवीन पीक यशस्वीरित्या नोंदवले गेले!");
      });
    }
  });

})();
