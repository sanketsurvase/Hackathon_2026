// ========================================================
// KISANSETU - LIVE QUEUE JAVASCRIPT (WITH DATE FILTER)
// ========================================================

(function () {
  'use strict';

  const API_BASE_URL = (typeof KISANSETU_API_BASE !== "undefined" && KISANSETU_API_BASE)
    ? KISANSETU_API_BASE
    : "https://hackathon-2026-0gus.onrender.com";
  const API_BASE = `${API_BASE_URL}/api`;

  function getTodayIsoString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getTomorrowIsoString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatMarathiDate(isoDateStr) {
    if (!isoDateStr) return "";
    const marathiMonths = [
      "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
      "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
    ];
    try {
      const parts = isoDateStr.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${marathiMonths[m] || ''} ${y}`;
      }
    } catch (e) {}
    return isoDateStr;
  }

  // 1. Get user's active token from URL or localStorage
  function getUserActiveBooking() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    try {
      const bookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const latest = JSON.parse(localStorage.getItem("latestKisanSetuBooking") || "null");
      const all = [...(latest ? [latest] : []), ...bookings];

      if (tokenFromUrl) {
        const match = all.find(b => b && String(b.token || b.token_number).trim() === tokenFromUrl.trim());
        if (match) return match;
        return { token: tokenFromUrl };
      }

      const active = all.find(b => b && b.status && (b.status.includes("Confirmed") || b.status.includes("निश्चित")));
      if (active) return active;
    } catch (e) {
      console.error("Error reading token:", e);
    }
    return null;
  }

  let currentCenterId = 1;
  let currentDateFilter = "all"; // 'all', 'today', 'tomorrow', or 'YYYY-MM-DD'
  let timerInterval = null;
  let elapsedSec = 120;
  let knownAvailableDates = new Set();

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const el = document.getElementById("servingTimeElapsed");

    timerInterval = setInterval(() => {
      elapsedSec++;
      const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const s = String(elapsedSec % 60).padStart(2, '0');
      if (el) el.textContent = `${m}:${s} मिनिटे`;
    }, 1000);
  }

  // Update date filter dropdown options dynamically with all booking dates
  function updateDateFilterOptions(availableDates) {
    const select = document.getElementById("dateFilter");
    if (!select) return;

    let hasNew = false;
    if (Array.isArray(availableDates)) {
      availableDates.forEach(d => {
        if (d && !knownAvailableDates.has(d)) {
          knownAvailableDates.add(d);
          hasNew = true;
        }
      });
    }

    // Also include dates from local storage
    try {
      const localBookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      localBookings.forEach(b => {
        const d = b.slotDate || b.date;
        if (d && !knownAvailableDates.has(d)) {
          knownAvailableDates.add(d);
          hasNew = true;
        }
      });
    } catch (e) {}

    if (hasNew) {
      const currentVal = select.value;
      select.innerHTML = `
        <option value="all">सर्व तारखा (All Dates - सर्व शेतकरी)</option>
        <option value="today">आजची रांग (Today - ${formatMarathiDate(getTodayIsoString())})</option>
        <option value="tomorrow">उद्याची रांग (Tomorrow - ${formatMarathiDate(getTomorrowIsoString())})</option>
      `;

      Array.from(knownAvailableDates).sort().forEach(dateStr => {
        const opt = document.createElement("option");
        opt.value = dateStr;
        opt.textContent = `📅 ${formatMarathiDate(dateStr)} (${dateStr})`;
        select.appendChild(opt);
      });

      select.value = currentVal;
    }
  }

  // Fetch Live Queue from API according to centre and date filters
  async function fetchLiveQueueFromDB() {
    const userBooking = getUserActiveBooking();
    const userToken = userBooking ? (userBooking.token || userBooking.token_number) : null;

    let effectiveDate = null;
    if (currentDateFilter === "today") {
      effectiveDate = getTodayIsoString();
    } else if (currentDateFilter === "tomorrow") {
      effectiveDate = getTomorrowIsoString();
    } else if (currentDateFilter !== "all" && currentDateFilter) {
      effectiveDate = currentDateFilter;
    }

    let dbServing = null;
    let dbAllBookings = [];

    try {
      const params = new URLSearchParams();
      if (currentCenterId) params.append("centre_id", currentCenterId);
      if (effectiveDate) params.append("queue_date", effectiveDate);

      const url = `${API_BASE}/live-queue${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          dbServing = data.now_serving || null;
          if (Array.isArray(data.all_bookings) && data.all_bookings.length > 0) {
            dbAllBookings = data.all_bookings;
          } else {
            const list = [];
            if (data.now_serving) list.push(data.now_serving);
            if (Array.isArray(data.waiting_list)) list.push(...data.waiting_list);
            dbAllBookings = list;
          }

          if (Array.isArray(data.available_dates)) {
            updateDateFilterOptions(data.available_dates);
          }
        }
      }
    } catch (err) {
      console.warn("DB Live queue fetch notice:", err);
    }

    // Combine DB entries with client confirmed bookings for all booked farmers
    const combinedQueue = [];
    const seenTokens = new Set();

    dbAllBookings.forEach(item => {
      const tok = String(item.token_number || item.token || "").trim();
      if (tok && !seenTokens.has(tok)) {
        seenTokens.add(tok);
        combinedQueue.push(item);
      }
    });

    // Also include confirmed local bookings matching date filter
    try {
      const localBookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const confirmedLocal = localBookings.filter(b => {
        if (!b || !b.status) return false;
        const isConf = b.status.includes("Confirmed") || b.status.includes("निश्चित");
        if (!isConf) return false;

        const bDate = b.slotDate || b.date;
        if (effectiveDate && bDate && bDate !== effectiveDate) {
          return false;
        }
        return true;
      });

      let myName = "शेतकरी मित्र";
      try {
        const ksUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");
        const lgUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
        myName = ksUser.full_name || lgUser.name || myName;
      } catch (e) {}

      confirmedLocal.forEach((b) => {
        const tok = String(b.token || b.token_number || "").trim();
        if (tok && !seenTokens.has(tok)) {
          seenTokens.add(tok);
          combinedQueue.push({
            token_number: tok,
            farmer_name: b.farmerName || myName,
            crop_name: b.crop || b.crop_name || "सोयाबीन",
            expected_quantity: parseFloat(b.quantity || b.expected_quantity || 0),
            start_time: b.slotTime ? b.slotTime.split(" - ")[0] : "०९:००",
            slot_date: b.slotDateMarathi || b.slotDate || "",
            booking_status: "confirmed"
          });
        }
      });
    } catch (e) {
      console.warn("Local storage queue sync notice:", e);
    }

    const finalServing = combinedQueue.length > 0 ? combinedQueue[0] : null;

    // Display ALL booked farmers in the queue table
    renderLiveQueueData(finalServing, combinedQueue, userToken, effectiveDate);
  }

  function renderLiveQueueData(nowServing, allBookings, userToken, effectiveDate) {
    // Header Subtitle showing active filter date
    const subtitleEl = document.querySelector(".header-title p");
    if (subtitleEl) {
      if (effectiveDate) {
        subtitleEl.textContent = `तारीख: ${formatMarathiDate(effectiveDate)} • खरेदी केंद्र थेट स्थिती`;
      } else {
        subtitleEl.textContent = `सर्व नोंदणीकृत शेतकरी • खरेदी केंद्र थेट स्थिती`;
      }
    }

    // 1. Now Serving Board
    const tokenDisplay = document.getElementById("nowServingToken");
    const farmerDisplay = document.getElementById("nowServingFarmer");
    const vehicleDisplay = document.getElementById("nowServingVehicle");
    const cropDisplay = document.getElementById("nowServingCrop");

    if (nowServing) {
      if (tokenDisplay) tokenDisplay.textContent = nowServing.token_number || "-";
      if (farmerDisplay) farmerDisplay.textContent = `शेतकरी: ${nowServing.farmer_name || 'शेतकरी'}`;
      if (vehicleDisplay) vehicleDisplay.textContent = "🚜 वजन काटा सुरू";
      if (cropDisplay) cropDisplay.textContent = `${nowServing.crop_name || 'पीक'} (${nowServing.expected_quantity || 0} क्विंटल)`;
    } else {
      if (tokenDisplay) tokenDisplay.textContent = "काटा मोकळा";
      if (farmerDisplay) farmerDisplay.textContent = "निवडलेल्या तारखेनुसार सध्या कोणताही माल काट्यावर नाही";
      if (vehicleDisplay) vehicleDisplay.textContent = "प्रतिक्षा सुरू";
      if (cropDisplay) cropDisplay.textContent = "-";
    }

    // 2. User status
    const uTokenVal = document.getElementById("uTokenVal");
    const uQueuePos = document.getElementById("uQueuePos");
    const uWaitTime = document.getElementById("uWaitTime");
    const uStatusMsg = document.getElementById("uStatusMsg");

    if (!userToken) {
      if (uTokenVal) uTokenVal.textContent = "स्लॉट बुक नाही";
      if (uQueuePos) uQueuePos.textContent = "-";
      if (uWaitTime) uWaitTime.textContent = "-";
      if (uStatusMsg) {
        uStatusMsg.innerHTML = '📢 आपण अद्याप कोणताही स्लॉट बुक केलेला नाही. <a href="../slot_booking/slot-booking.html" style="color:#08783f; font-weight:700; text-decoration:underline;">येथे स्लॉट बुक करा ➔</a>';
      }
    } else {
      if (uTokenVal) uTokenVal.textContent = userToken;

      const list = allBookings || [];
      const userIndex = list.findIndex(item => String(item.token_number).trim() === String(userToken).trim());
      const isCurrentlyServing = nowServing && String(nowServing.token_number).trim() === String(userToken).trim();

      if (isCurrentlyServing) {
        if (uQueuePos) uQueuePos.textContent = "सध्या चालू!";
        if (uWaitTime) uWaitTime.textContent = "० मिनिटे";
        if (uStatusMsg) uStatusMsg.innerHTML = "🎉 <strong>आपले वाहन वजन काट्यावर आहे!</strong> कृपया वजन पूर्ण होईपर्यंत थांबा.";
      } else if (userIndex !== -1) {
        const pos = userIndex + 1;
        if (uQueuePos) uQueuePos.textContent = `# ${pos}`;
        if (uWaitTime) uWaitTime.textContent = `~ ${pos * 8} मिनिटे`;
        if (uStatusMsg) uStatusMsg.innerHTML = `📢 रांगेत आपला क्रमांक <strong>#${pos}</strong> आहे. कृपया वजन काट्यासाठी सज्ज राहा.`;
      } else {
        if (uQueuePos) uQueuePos.textContent = "नोंदणीकृत";
        if (uWaitTime) uWaitTime.textContent = "सज्ज राहा";
        if (uStatusMsg) uStatusMsg.textContent = "📢 आपला स्लॉट बुक आहे. निवडलेल्या तारखेच्या रांगेत आपण पाहू शकता.";
      }
    }

    // 3. Queue List Table — Displays ALL booked farmers for the selected date
    renderQueueTable(allBookings, userToken);
  }

  function renderQueueTable(list, activeUserToken) {
    const container = document.getElementById("queueListContainer");
    const totalWaiting = document.getElementById("totalWaiting");
    if (!container) return;

    const count = Array.isArray(list) ? list.length : 0;
    if (totalWaiting) totalWaiting.textContent = `एकूण नोंदणीकृत शेतकरी: ${count} वाहने`;
    container.innerHTML = "";

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 28px 14px; color: #53695b;">
          <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">निवडलेल्या फिल्टरनुसार सध्या रांगेत इतर कोणतीही वाहने नाहीत.</p>
          <p style="font-size: 13px; color: #718779; margin-bottom: 14px;">सर्व शेतकरी पाहण्यासाठी वरील ड्रॉपडाऊनमधून 'सर्व तारखा (All Dates)' निवडा.</p>
          <a href="../slot_booking/slot-booking.html" style="display:inline-block; padding: 8px 18px; background:#08783f; color:#ffffff; font-weight:700; border-radius:10px; text-decoration:none; font-size:13.5px;">
            नवीन स्लॉट बुक करा ➔
          </a>
        </div>
      `;
      return;
    }

    list.forEach((item, index) => {
      const isUser = activeUserToken && String(item.token_number).trim() === String(activeUserToken).trim();
      const row = document.createElement("div");
      row.className = `queue-row ${isUser ? 'is-user' : ''}`;

      let statusText = "रांगेत (Waiting)";
      let statusClass = "q-status-waiting";

      if (index === 0) {
        statusText = "काट्यावर सुरू (Serving)";
        statusClass = "q-status-next";
      } else if (index === 1) {
        statusText = "पुढील टोकन (Next)";
        statusClass = "q-status-next";
      }

      const dateInfo = item.slot_date ? ` • तारीख: ${formatMarathiDate(item.slot_date)}` : '';

      row.innerHTML = `
        <div class="q-col-pos">#${index + 1}</div>
        <div class="q-col-token">${item.token_number || "-"}</div>
        <div class="q-col-info">
          <strong>${item.farmer_name || 'शेतकरी'} ${isUser ? '(आपण)' : ''}</strong>
          <small>${item.crop_name || 'पीक'} (${item.expected_quantity || 0} क्विंटल) • वेळ: ${item.start_time || '०९:००'}${dateInfo}</small>
        </div>
        <div class="q-status-badge ${statusClass}">${statusText}</div>
      `;

      container.appendChild(row);
    });
  }

  // Initialization
  document.addEventListener("DOMContentLoaded", () => {
    startTimer();
    updateDateFilterOptions();
    fetchLiveQueueFromDB();

    // Auto-refresh every 8 seconds for real-time live queuing
    setInterval(fetchLiveQueueFromDB, 8000);

    const centerFilter = document.getElementById("centerFilter");
    if (centerFilter) {
      centerFilter.addEventListener("change", (e) => {
        if (e.target.value === "all") {
          currentCenterId = null;
        } else if (e.target.value === "karkamb") {
          currentCenterId = 2;
        } else if (e.target.value === "mohol") {
          currentCenterId = 3;
        } else {
          currentCenterId = 1;
        }
        fetchLiveQueueFromDB();
      });
    }

    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) {
      dateFilter.addEventListener("change", (e) => {
        currentDateFilter = e.target.value || "all";
        fetchLiveQueueFromDB();
      });
    }
  });

})();
