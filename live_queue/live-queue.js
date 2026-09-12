// ========================================================
// KISANSETU - LIVE QUEUE JAVASCRIPT (ALL BOOKED FARMERS)
// ========================================================

(function () {
  'use strict';

  const API_BASE_URL = (typeof KISANSETU_API_BASE !== "undefined" && KISANSETU_API_BASE)
    ? KISANSETU_API_BASE
    : "https://hackathon-2026-0gus.onrender.com";
  const API_BASE = `${API_BASE_URL}/api`;

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
  let timerInterval = null;
  let elapsedSec = 120;

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

  // Fetch Live Queue from API and display all booked farmers
  async function fetchLiveQueueFromDB() {
    const userBooking = getUserActiveBooking();
    const userToken = userBooking ? (userBooking.token || userBooking.token_number) : null;

    let dbServing = null;
    let dbAllBookings = [];

    try {
      const url = currentCenterId
        ? `${API_BASE}/live-queue?centre_id=${currentCenterId}`
        : `${API_BASE}/live-queue`;

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

    // Also include all confirmed local bookings made by farmers
    try {
      const localBookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const confirmedLocal = localBookings.filter(b =>
        b && b.status && (b.status.includes("Confirmed") || b.status.includes("निश्चित"))
      );

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

    // Pass combinedQueue (ALL booked farmers) to be displayed in the queue table!
    renderLiveQueueData(finalServing, combinedQueue, userToken);
  }

  function renderLiveQueueData(nowServing, allBookings, userToken) {
    // Subtitle
    const subtitleEl = document.querySelector(".header-title p");
    if (subtitleEl) {
      subtitleEl.textContent = "खरेदी केंद्र व वजन काटा थेट स्थिती";
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
      if (farmerDisplay) farmerDisplay.textContent = "सध्या कोणताही माल काट्यावर नाही";
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
        if (uQueuePos) uQueuePos.textContent = "# १";
        if (uWaitTime) uWaitTime.textContent = "~ १० मिनिटे";
        if (uStatusMsg) uStatusMsg.textContent = "📢 आपला क्रमांक लवकरच येणार आहे. कृपया वाहनासह प्रवेशद्वाराजवळ सज्ज राहा.";
      }
    }

    // 3. Queue List Table — Displays ALL booked farmers
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
          <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">सध्या रांगेत इतर कोणतीही वाहने नाहीत.</p>
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

      const dateInfo = item.slot_date ? ` • तारीख: ${item.slot_date}` : '';

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
  });

})();
