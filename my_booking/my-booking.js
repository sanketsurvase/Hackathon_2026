// ========================================================
// KISANSETU - MY BOOKINGS JAVASCRIPT
// ========================================================

(function () {
  'use strict';

  // Seed sample initial bookings if empty
  function initSeedBookings() {
    // Only seed if localStorage is empty AND no DB farmer session exists
    const existing = localStorage.getItem("kisansetu_bookings");
        }
      ];

      localStorage.setItem("kisansetu_bookings", JSON.stringify(seedData));
    }
  }

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem("kisansetu_bookings", JSON.stringify(list));
  }

  let currentFilter = "all";

  // Render stats
  function updateMetrics(list) {
    const active = list.filter(b => b.status.includes("Confirmed") || b.status.includes("निश्चित")).length;
    const completed = list.filter(b => b.status.includes("Completed") || b.status.includes("पूर्ण")).length;
    const totalQty = list.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);

    const activeCountEl = document.getElementById("activeCount");
    const completedCountEl = document.getElementById("completedCount");
    const totalQtyEl = document.getElementById("totalQuantity");

    if (activeCountEl) activeCountEl.textContent = active;
    if (completedCountEl) completedCountEl.textContent = completed;
    if (totalQtyEl) totalQtyEl.textContent = `${totalQty} क्विंटल`;
  }

  // Render Bookings List
  function renderBookings() {
    const container = document.getElementById("bookingsContainer");
    if (!container) return;

    const allBookings = getBookings();
    updateMetrics(allBookings);

    let filtered = allBookings;
    if (currentFilter === "active") {
      filtered = allBookings.filter(b => b.status.includes("Confirmed") || b.status.includes("निश्चित"));
    } else if (currentFilter === "completed") {
      filtered = allBookings.filter(b => b.status.includes("Completed") || b.status.includes("पूर्ण"));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>कोणतीही बुकिंग सापडली नाही</h3>
          <p>आपण अद्याप या श्रेणीमध्ये कोणताही स्लॉट बुक केलेला नाही.</p>
          <a href="../slot_booking/slot-booking.html" class="btn-new-slot">+ आताच स्लॉट बुक करा</a>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    filtered.forEach(b => {
      const isConfirmed = b.status.includes("Confirmed") || b.status.includes("निश्चित");
      const isCompleted = b.status.includes("Completed") || b.status.includes("पूर्ण");
      const isCancelled = b.status.includes("Cancelled") || b.status.includes("रद्द");

      let cardClass = isConfirmed ? "confirmed" : (isCompleted ? "completed" : "cancelled");
      let badgeClass = isConfirmed ? "confirmed" : (isCompleted ? "completed" : "cancelled");

      let cropIcon = "🌱";
      if (b.crop.includes("सोयाबीन")) cropIcon = "🫘";
      else if (b.crop.includes("कापूस")) cropIcon = "☁️";
      else if (b.crop.includes("तूर")) cropIcon = "🌾";
      else if (b.crop.includes("गहू")) cropIcon = "🍞";

      const card = document.createElement("div");
      card.className = `booking-item-card ${cardClass}`;
      card.innerHTML = `
        <div class="card-top">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <span class="token-tag">ID: ${b.bookingId || b.token}</span>
            <span class="token-tag" style="background:#fef3c7; color:#b45309; border-color:#fde68a;">टोकन ${b.token}</span>
          </div>
          <span class="status-badge ${badgeClass}">${b.status}</span>
        </div>

        <div class="booking-main-details">
          <div class="crop-avatar">${cropIcon}</div>
          <div class="crop-title-group">
            <h3>${b.crop}</h3>
            <p>${b.center}</p>
          </div>
        </div>

        <div class="detail-grid">
          <div class="grid-field">
            <span>बुकिंग तारीख</span>
            <strong>📅 ${b.slotDateMarathi || b.slotDate}</strong>
          </div>
          <div class="grid-field">
            <span>वेळ स्लॉट</span>
            <strong>⏰ ${b.slotTime}</strong>
          </div>
          <div class="grid-field">
            <span>प्रमाण / वजन</span>
            <strong>⚖️ ${b.quantity} क्विंटल (गट: ${b.gatNo || '-'})</strong>
          </div>
          <div class="grid-field">
            <span>वाहन तपशील</span>
            <strong>🚜 ${b.vehicleType} (${b.vehicleNumber || 'नोंद नाही'})</strong>
          </div>
        </div>

        <div class="card-actions-bar">
          <button class="action-btn view-slip-btn" data-id="${b.id}">
            📄 पावती पहा (Slip)
          </button>
          ${isConfirmed ? `
            <a href="../live_queue/live-queue.html?token=${b.token}" class="action-btn primary">
              ⏱️ लाईव्ह रांग पहा (Live Queue)
            </a>
            <button class="action-btn danger cancel-btn" data-id="${b.id}">
              ✕ स्लॉट रद्द करा
            </button>
          ` : ''}
          ${isCompleted ? `
            <a href="../procurement_status/procurement-status.html" class="action-btn primary">
              📦 खरेदी पावती पहा
            </a>
          ` : ''}
        </div>
      `;

      container.appendChild(card);
    });

    attachCardEventListeners();
  }

  function attachCardEventListeners() {
    // View Slip
    document.querySelectorAll(".view-slip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const all = getBookings();
        const b = all.find(item => item.id === id);
        if (b) showSlipModal(b);
      });
    });

    // Cancel Booking
    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (confirm("तुम्हाला खात्री आहे का की हा स्लॉट रद्द करायचा आहे?")) {
          const all = getBookings();
          const target = all.find(item => item.id === id);
          if (target) {
            target.status = "रद्द (Cancelled)";
            saveBookings(all);
            renderBookings();
          }
        }
      });
    });
  }

  // Modal Handling
  const modal = document.getElementById("receiptModal");
  const closeBtn = document.getElementById("closeModalBtn");
  const printBtn = document.getElementById("printModalBtn");

  function showSlipModal(b) {
    const area = document.getElementById("receiptPrintArea");
    if (!area) return;

    area.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 28px;">🌱</span>
        <h2 style="font-size: 18px; color: #08783f; margin: 4px 0;">किसानसेवा - अधिकृत गेट पास</h2>
        <p style="font-size: 12px; color: #64748b;">कृषी उत्पन्न बाजार समिती, टोकन नोंदणी पावती</p>
      </div>
      <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 11px; color: #64748b;">बुकिंग आयडी (Booking ID)</span>
            <div style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 700; color: #08783f;">${b.bookingId || b.id}</div>
          </div>
          <div>
            <span style="font-size: 11px; color: #64748b;">टोकन क्रमांक</span>
            <div style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 800; color: #b45309;">${b.token}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #64748b;">स्थिती</span>
            <div style="font-size: 13px; font-weight: 700; color: #16a34a;">${b.status}</div>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
          <div><strong>शेतकरी:</strong> ${b.farmerName}</div>
          <div><strong>आयडी:</strong> ${b.farmerId}</div>
          <div><strong>केंद्र:</strong> ${b.center.slice(0, 25)}...</div>
          <div><strong>पीक:</strong> ${b.crop.split('(')[0]}</div>
          <div><strong>वजन:</strong> ${b.quantity} क्विंटल</div>
          <div><strong>वाहन:</strong> ${b.vehicleNumber}</div>
          <div><strong>तारीख:</strong> ${b.slotDateMarathi || b.slotDate}</div>
          <div><strong>वेळ:</strong> ${b.slotTime}</div>
        </div>
      </div>
    `;

    if (modal) {
      modal.hidden = false;
      modal.style.display = "flex";
    }
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.hidden = true;
      modal.style.display = "none";
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Filter Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderBookings();
    });
  });

  async function fetchApiBookings() {
    try {
      // Get logged-in farmer's ID
      let farmerId = null;
      try {
        const ksUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");
        const lgUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
        farmerId = ksUser.farmer_id || lgUser.farmer_id || null;
      } catch (e) { /* ignore */ }

      const url = farmerId
        ? `${KISANSETU_API_BASE}/api/bookings?farmer_id=${farmerId}`
        : `${KISANSETU_API_BASE}/api/bookings`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.bookings && data.bookings.length > 0) {
        // Map backend rows to frontend format
        const apiBookings = data.bookings.map(b => ({
          id: `db_${b.booking_id}`,
          bookingId: b.booking_id,
          token: b.token_number,
          farmerId: `KS${b.farmer_id}`,
          farmerName: b.farmer_name || "शेतकरी मित्र",
          mobile: b.mobile_number || "",
          center: b.centre_name || "खरेदी केंद्र",
          crop: b.crop_name,
          quantity: b.expected_quantity,
          slotDate: b.slot_date,
          slotDateMarathi: b.slot_date,
          slotTime: `${b.start_time} - ${b.end_time}`,
          status: b.booking_status === "confirmed"
            ? "निश्चित (Confirmed)"
            : b.booking_status === "cancelled"
              ? "रद्द (Cancelled)"
              : "पूर्ण (Completed)",
          createdAt: b.created_at
        }));

        // Replace localStorage with fresh DB data
        saveBookings(apiBookings);
        renderBookings();
      }
    } catch (e) {
      console.warn("API offline, using localStorage", e);
    }
  }

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    initSeedBookings();
    renderBookings();
    fetchApiBookings();
  });

})();
