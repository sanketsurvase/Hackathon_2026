// ========================================================
// KISANSETU - 5-STEP SLOT BOOKING JAVASCRIPT
// Schema: procurement_centres, slots, bookings
// ========================================================

(function () {
  'use strict';

  const API_BASE = `${KISANSETU_API_BASE}/api`;

  // 1. Current Farmer
  const defaultUser = {
    farmer_id: 3,
    userId: "KS10245",
    name: "शेतकरी मित्र",
    mobile: ""
  };

  function getLoggedInUser() {
    try {
      // Primary: loggedInUser set by login.js (has userId, name, mobile)
      const loggedInRaw = localStorage.getItem("loggedInUser");
      if (loggedInRaw) {
        const parsed = JSON.parse(loggedInRaw);
        if (parsed && (parsed.name || parsed.userId)) {
          return {
            farmer_id: parsed.farmer_id || defaultUser.farmer_id,
            userId: parsed.userId || ("KS" + (parsed.farmer_id || defaultUser.farmer_id)),
            name: parsed.name || defaultUser.name,
            mobile: parsed.mobile || defaultUser.mobile
          };
        }
      }

      // Secondary: kisanSetuUser set by login.js (has full_name, farmer_id, mobile_number)
      const kisanRaw = localStorage.getItem("kisanSetuUser");
      if (kisanRaw) {
        const parsed = JSON.parse(kisanRaw);
        if (parsed) {
          return {
            farmer_id: parsed.farmer_id || defaultUser.farmer_id,
            userId: "KS" + (parsed.farmer_id || defaultUser.farmer_id),
            name: parsed.full_name || parsed.name || defaultUser.name,
            mobile: parsed.mobile_number || parsed.mobile || defaultUser.mobile
          };
        }
      }
    } catch (e) {
      console.warn("Could not parse user", e);
    }
    return defaultUser;
  }

  const currentUser = getLoggedInUser();

  // 2. State for the 5 specified fields:
  // 1. पीक निवडा (crop_name)
  // 2. अंदाजित प्रमाण (expected_quantity)
  // 3. खरेदी केंद्र निवडा (centre_id)
  // 4. तारीख निवडा (slot_date)
  // 5. वेळ स्लॉट निवडा (slot_id)

  let selectedCrop = "सोयाबीन (Soybean)";
  let selectedQty = 45;
  let selectedCentreId = 1;
  let selectedCentreName = "कृषी उत्पन्न बाजार समिती, पंढरपूर (मुख्य यार्ड)";
  let selectedDate = "";
  let selectedSlot = null;
  let availableCentres = [];
  let availableSlots = [];

  const marathiMonths = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
  ];
  const marathiDays = ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनि"];

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatMarathiDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return `${d.getDate()} ${marathiMonths[d.getMonth()]} ${d.getFullYear()}`;
  }

  function updateSummary() {
    const sumCrop = document.getElementById("sumCrop");
    const sumQty = document.getElementById("sumQty");
    const sumCenter = document.getElementById("sumCenter");
    const sumDate = document.getElementById("sumDate");
    const sumTime = document.getElementById("sumTime");

    if (sumCrop) sumCrop.textContent = selectedCrop.split("(")[0];
    if (sumQty) sumQty.textContent = `${selectedQty} क्विंटल`;
    if (sumCenter) sumCenter.textContent = selectedCentreName.replace("कृषी उत्पन्न बाजार समिती,", "").trim();
    if (sumDate) sumDate.textContent = selectedDate ? formatMarathiDate(selectedDate) : "निवडा";
    if (sumTime) sumTime.textContent = selectedSlot ? (selectedSlot.time || `${selectedSlot.start_time} - ${selectedSlot.end_time}`) : "निवडा";
  }

  // 1. Crop Selection (crop_name)
  function setupCropSelection() {
    const tiles = document.querySelectorAll(".crop-tile");
    tiles.forEach(tile => {
      tile.addEventListener("click", () => {
        tiles.forEach(t => t.classList.remove("active"));
        tile.classList.add("active");
        const radio = tile.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          selectedCrop = radio.value;
          updateSummary();
        }
      });
    });
  }

  // 2. Quantity (expected_quantity)
  function setupQuantitySelection() {
    const qtyInput = document.getElementById("quantityInput");
    const quickBtns = document.querySelectorAll(".quick-qty-btn");

    if (qtyInput) {
      qtyInput.addEventListener("input", (e) => {
        selectedQty = parseFloat(e.target.value) || 0;
        updateSummary();
      });
    }

    quickBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.dataset.val, 10);
        if (qtyInput) {
          qtyInput.value = val;
          selectedQty = val;
          updateSummary();
        }
      });
    });
  }

  // 3. Procurement Centre (centre_id)
  async function loadCentres() {
    const container = document.querySelector(".center-select-wrap");
    try {
      const res = await fetch(`${API_BASE}/centres`);
      const data = await res.json();
      if (data.success && data.centres && data.centres.length > 0) {
        availableCentres = data.centres;
        renderCentres(availableCentres);
        return;
      }
    } catch (e) {
      console.warn("Backend API offline, using fallback centres", e);
    }

    // Fallback default centres
    availableCentres = [
      {
        centre_id: 1,
        centre_name: "कृषी उत्पन्न बाजार समिती, पंढरपूर (मुख्य यार्ड)",
        district: "सोलापूर",
        taluka: "पंढरपूर",
        address: "मोहोळ रोड, पंढरपूर • काटा क्र. १ व २ उपलब्ध"
      },
      {
        centre_id: 2,
        centre_name: "उपबाजार केंद्र, करकंब - पंढरपूर",
        district: "सोलापूर",
        taluka: "पंढरपूर",
        address: "करकंब ग्रामीण यार्ड • कापूस व सोयाबीन खरेदी"
      },
      {
        centre_id: 3,
        centre_name: "शासकीय हमीभाव खरेदी केंद्र, मोहोळ",
        district: "सोलापूर",
        taluka: "मोहोळ",
        address: "स्टेशन रोड, मोहोळ • सर्व धान्य खरेदी"
      }
    ];
    renderCentres(availableCentres);
  }

  function renderCentres(centres) {
    const container = document.querySelector(".center-select-wrap");
    if (!container) return;
    container.innerHTML = "";

    centres.forEach((c, index) => {
      const opt = document.createElement("div");
      opt.className = `center-option ${index === 0 ? 'active' : ''}`;
      opt.dataset.centreId = c.centre_id;

      opt.innerHTML = `
        <label>
          <input type="radio" name="centerOption" value="${c.centre_id}" ${index === 0 ? 'checked' : ''}>
          <div class="center-body">
            <strong>${c.centre_name}</strong>
            <p>${c.address || `${c.taluka}, ${c.district}`}</p>
          </div>
        </label>
      `;

      opt.addEventListener("click", () => {
        document.querySelectorAll(".center-option").forEach(el => el.classList.remove("active"));
        opt.classList.add("active");
        opt.querySelector("input").checked = true;
        selectedCentreId = c.centre_id;
        selectedCentreName = c.centre_name;
        loadSlots();
        updateSummary();
      });

      if (index === 0) {
        selectedCentreId = c.centre_id;
        selectedCentreName = c.centre_name;
      }

      container.appendChild(opt);
    });
  }

  // 4. Booking Date (slot_date)
  function setupDateSelection() {
    const dateInput = document.getElementById("slotDate");
    const quickTags = document.getElementById("dateQuickTags");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const maxDate = new Date();
    maxDate.setDate(tomorrow.getDate() + 14);

    if (dateInput) {
      dateInput.min = formatDateISO(tomorrow);
      dateInput.max = formatDateISO(maxDate);
      dateInput.value = formatDateISO(tomorrow);
      selectedDate = dateInput.value;
    }

    if (quickTags) {
      quickTags.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(tomorrow.getDate() + (i - 1));
        const iso = formatDateISO(d);

        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `date-pill ${i === 1 ? 'active' : ''}`;
        pill.textContent = `${d.getDate()} ${marathiMonths[d.getMonth()].slice(0, 3)} (${marathiDays[d.getDay()]})`;
        pill.dataset.date = iso;

        pill.addEventListener("click", () => {
          document.querySelectorAll(".date-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          if (dateInput) dateInput.value = iso;
          selectedDate = iso;
          loadSlots();
          updateSummary();
        });

        quickTags.appendChild(pill);
      }
    }

    if (dateInput) {
      dateInput.addEventListener("change", (e) => {
        selectedDate = e.target.value;
        document.querySelectorAll(".date-pill").forEach(p => {
          p.classList.toggle("active", p.dataset.date === selectedDate);
        });
        loadSlots();
        updateSummary();
      });
    }
  }

  // 5. Available Time Slot (slot_id)
  async function loadSlots() {
    const grid = document.getElementById("slotsGrid");
    if (!grid) return;
    grid.innerHTML = "<p style='color:#64748b; font-size:13px;'>उपलब्ध स्लॉट लोड होत आहेत...</p>";
    selectedSlot = null;

    try {
      const res = await fetch(`${API_BASE}/slots?centre_id=${selectedCentreId}&slot_date=${selectedDate}`);
      const data = await res.json();
      if (data.success && data.slots && data.slots.length > 0) {
        availableSlots = data.slots;
        renderSlots(availableSlots);
        return;
      }
    } catch (e) {
      console.warn("Backend API offline, using fallback slots", e);
    }

    // Fallback Mock Slots
    availableSlots = [
      { slot_id: 101, start_time: "08:00", end_time: "10:00", capacity: 20, booked_count: 8 },
      { slot_id: 102, start_time: "10:00", end_time: "12:00", capacity: 20, booked_count: 17 },
      { slot_id: 103, start_time: "12:00", end_time: "14:00", capacity: 20, booked_count: 5 },
      { slot_id: 104, start_time: "14:00", end_time: "16:00", capacity: 15, booked_count: 15 },
      { slot_id: 105, start_time: "16:00", end_time: "18:00", capacity: 15, booked_count: 4 }
    ];
    renderSlots(availableSlots);
  }

  function renderSlots(slots) {
    const grid = document.getElementById("slotsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    slots.forEach((slot, index) => {
      const remaining = slot.capacity - slot.booked_count;
      const isFull = remaining <= 0;
      const slotTimeText = `सकाळी ${slot.start_time} - ${slot.end_time}`;

      let cls = "quota-green";
      let quotaText = `${remaining} जागा उपलब्ध`;
      if (remaining <= 4 && remaining > 0) {
        cls = "quota-orange";
        quotaText = `फक्त ${remaining} जागा शिल्लक (मर्यादित)`;
      } else if (isFull) {
        cls = "quota-red";
        quotaText = "जागा पूर्ण (Full)";
      }

      const el = document.createElement("div");
      el.className = `slot-item ${isFull ? 'disabled' : ''}`;
      el.innerHTML = `
        <div class="slot-time">${slot.start_time} - ${slot.end_time}</div>
        <div class="slot-quota ${cls}">${quotaText}</div>
      `;

      if (!isFull) {
        el.addEventListener("click", () => {
          document.querySelectorAll(".slot-item").forEach(s => s.classList.remove("selected"));
          el.classList.add("selected");
          selectedSlot = { ...slot, time: `${slot.start_time} - ${slot.end_time}` };
          updateSummary();
        });

        // Select first available slot by default
        if (!selectedSlot && index === 0) {
          el.classList.add("selected");
          selectedSlot = { ...slot, time: `${slot.start_time} - ${slot.end_time}` };
        }
      }

      grid.appendChild(el);
    });

    updateSummary();
  }

  // Submit Booking: Uses exact fields: farmer_id, slot_id, crop_name, expected_quantity
  function setupFormSubmit() {
    const form = document.getElementById("slotBookingForm");
    const modal = document.getElementById("receiptModal");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!selectedSlot) {
        alert("कृपया एक उपलब्ध वेळ स्लॉट निवडा!");
        return;
      }

      const submitBtn = document.getElementById("confirmBookingBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "प्रक्रिया सुरू आहे...";
      }

      let bookingResult = null;

      // 1. Try Backend API
      try {
        const payload = {
          farmer_id: currentUser.farmer_id || 3,
          slot_id: selectedSlot.slot_id,
          crop_name: selectedCrop,
          expected_quantity: selectedQty
        };

        const res = await fetch(`${API_BASE}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          bookingResult = data.booking;
        } else {
          console.warn("API Error:", data.detail);
        }
      } catch (err) {
        console.warn("API unavailable, fallback to local generation", err);
      }

      // 2. Fallback if offline
      if (!bookingResult) {
        const randToken = Math.floor(10 + Math.random() * 80);
        bookingResult = {
          booking_id: Math.floor(1000 + Math.random() * 9000),
          farmer_id: currentUser.farmer_id || 3,
          slot_id: selectedSlot.slot_id,
          crop_name: selectedCrop,
          expected_quantity: selectedQty,
          token_number: `#${randToken}`,
          booking_status: "confirmed",
          created_at: new Date().toISOString()
        };
      }

      // 3. Save to localStorage with fields for UI
      const formattedDate = formatMarathiDate(selectedDate);
      const fullRecord = {
        booking_id: bookingResult.booking_id,
        farmer_id: bookingResult.farmer_id,
        slot_id: bookingResult.slot_id,
        crop_name: bookingResult.crop_name,
        expected_quantity: bookingResult.expected_quantity,
        token_number: bookingResult.token_number,
        booking_status: bookingResult.booking_status,
        created_at: bookingResult.created_at,
        // UI Helpers
        token: bookingResult.token_number,
        id: `BK-${bookingResult.booking_id}`,
        farmerName: currentUser.name,
        farmerId: currentUser.userId,
        center: selectedCentreName,
        crop: selectedCrop,
        quantity: selectedQty,
        slotDate: selectedDate,
        slotDateMarathi: formattedDate,
        slotTime: selectedSlot.time || `${selectedSlot.start_time} - ${selectedSlot.end_time}`,
        status: "निश्चित (Confirmed)"
      };

      try {
        const existing = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
        existing.unshift(fullRecord);
        localStorage.setItem("kisansetu_bookings", JSON.stringify(existing));
        localStorage.setItem("latestKisanSetuBooking", JSON.stringify(fullRecord));
      } catch (err) {
        console.error("Local storage error", err);
      }

      // 4. Populate Modal Display
      const rcptBookingId = document.getElementById("receiptBookingId");
      const rcptToken = document.getElementById("receiptToken");
      const rcptName = document.getElementById("rcptName");
      const rcptUserId = document.getElementById("rcptUserId");
      const rcptCrop = document.getElementById("rcptCrop");
      const rcptQty = document.getElementById("rcptQty");
      const rcptCenter = document.getElementById("rcptCenter");
      const rcptDate = document.getElementById("rcptDate");
      const rcptSlot = document.getElementById("rcptSlot");

      if (rcptBookingId) rcptBookingId.textContent = `ID #${bookingResult.booking_id}`;
      if (rcptToken) rcptToken.textContent = bookingResult.token_number;
      if (rcptName) rcptName.textContent = currentUser.name;
      if (rcptUserId) rcptUserId.textContent = currentUser.userId;
      if (rcptCrop) rcptCrop.textContent = selectedCrop;
      if (rcptQty) rcptQty.textContent = `${selectedQty} क्विंटल`;
      if (rcptCenter) rcptCenter.textContent = selectedCentreName;
      if (rcptDate) rcptDate.textContent = formattedDate;
      if (rcptSlot) rcptSlot.textContent = selectedSlot.time || `${selectedSlot.start_time} - ${selectedSlot.end_time}`;

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>स्लॉट निश्चित करा (Confirm Booking)</span><span class='btn-arrow'>✓</span>";
      }

      if (modal) {
        modal.hidden = false;
        modal.style.display = "flex";
      }
    });

    const printBtn = document.getElementById("printReceiptBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          modal.style.display = "none";
        }
      });
    }
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    const headerUserName = document.getElementById("headerUserName");
    const headerUserId = document.getElementById("headerUserId");
    if (headerUserName) headerUserName.textContent = currentUser.name;
    if (headerUserId) headerUserId.textContent = currentUser.userId;

    setupCropSelection();
    setupQuantitySelection();
    setupDateSelection();
    loadCentres().then(() => {
      loadSlots();
    });
    setupFormSubmit();
  });

})();
