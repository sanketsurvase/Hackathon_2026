// ========================================================
// KISANSETU - LIVE QUEUE JAVASCRIPT (DATABASE INTEGRATED)
// ========================================================

(function () {
  'use strict';

  const API_BASE_URL = "https://hackathon-2026-0gus.onrender.com";
  const API_BASE = `${API_BASE_URL}/api`;

  // 1. Get user's active token
  function getUserActiveToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) return tokenFromUrl;

    try {
      const bookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const active = bookings.find(b => b.status && (b.status.includes("Confirmed") || b.status.includes("निश्चित")));
      if (active) return active.token || active.token_number;
    } catch (e) {
      console.error(e);
    }
    return "#01";
  }

  const userToken = getUserActiveToken();

  let currentCenterId = 1;
  let timerInterval = null;
  let elapsedSec = 420;

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

  // Fetch Live Queue directly from PostgreSQL DB
  async function fetchLiveQueueFromDB() {
    try {
      const res = await fetch(`${API_BASE}/live-queue?centre_id=${currentCenterId}`);
      const data = await res.json();

      if (data.success) {
        renderLiveQueueData(data.now_serving, data.waiting_list);
        return;
      }
    } catch (err) {
      console.warn("DB Live queue offline, using fallback", err);
    }

    // Fallback if server is not running
    renderFallbackQueue();
  }

  function renderLiveQueueData(nowServing, waitingList) {
    // 1. Now Serving Board
    if (nowServing) {
      document.getElementById("nowServingToken").textContent = nowServing.token_number || "#01";
      document.getElementById("nowServingFarmer").textContent = `शेतकरी: ${nowServing.farmer_name || 'शेतकरी'}`;
      document.getElementById("nowServingVehicle").textContent = "🚜 वजन काटा सुरू";
      document.getElementById("nowServingCrop").textContent = `${nowServing.crop_name} (${nowServing.expected_quantity} क्विंटल)`;
    } else {
      document.getElementById("nowServingToken").textContent = "प्रतिक्षा सुरू";
      document.getElementById("nowServingFarmer").textContent = "सध्या कोणताही माल काट्यावर नाही";
      document.getElementById("nowServingVehicle").textContent = "काटा मोकळा";
      document.getElementById("nowServingCrop").textContent = "-";
    }

    // 2. User status
    const uTokenVal = document.getElementById("uTokenVal");
    const uQueuePos = document.getElementById("uQueuePos");
    const uWaitTime = document.getElementById("uWaitTime");
    const uStatusMsg = document.getElementById("uStatusMsg");

    if (uTokenVal) uTokenVal.textContent = userToken;

    const list = waitingList || [];
    const userIndex = list.findIndex(item => item.token_number === userToken);

    if (nowServing && nowServing.token_number === userToken) {
      if (uQueuePos) uQueuePos.textContent = "सध्या चालू!";
      if (uWaitTime) uWaitTime.textContent = "० मिनिटे";
      if (uStatusMsg) uStatusMsg.innerHTML = "🎉 <strong>आपले वाहन वजन काट्यावर आहे!</strong> कृपया वजन पूर्ण होईपर्यंत थांबा.";
    } else if (userIndex !== -1) {
      const pos = userIndex + 1;
      if (uQueuePos) uQueuePos.textContent = `# ${pos}`;
      if (uWaitTime) uWaitTime.textContent = `~ ${pos * 8} मिनिटे`;
      if (uStatusMsg) uStatusMsg.innerHTML = `📢 आपल्या पुढे <strong>${pos - 1}</strong> वाहने आहेत. कृपया गेट क्रमांक २ जवळ उपस्थित राहा.`;
    } else {
      if (uQueuePos) uQueuePos.textContent = "#१";
      if (uWaitTime) uWaitTime.textContent = "~ १० मिनिटे";
      if (uStatusMsg) uStatusMsg.textContent = "📢 आपला क्रमांक लवकरच येणार आहे. कृपया वाहनासह प्रवेशद्वाराजवळ सज्ज राहा.";
    }

    // 3. Queue List Table
    renderQueueTable(list);
  }

  function renderQueueTable(list) {
    const container = document.getElementById("queueListContainer");
    const totalWaiting = document.getElementById("totalWaiting");
    if (!container) return;

    if (totalWaiting) totalWaiting.textContent = `एकूण प्रतिक्षा: ${list.length} वाहने`;
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = "<p style='color:#64748b; font-size:13px; padding:12px;'>सध्या रांगेत कोणतीही वाहने नाहीत.</p>";
      return;
    }

    list.forEach((item, index) => {
      const isUser = item.token_number === userToken;
      const row = document.createElement("div");
      row.className = `queue-row ${isUser ? 'is-user' : ''}`;

      const statusText = index === 0 ? "पुढील टोकन (Next)" : "रांगेत (Waiting)";
      const statusClass = index === 0 ? "q-status-next" : "q-status-waiting";

      row.innerHTML = `
        <div class="q-col-pos">#${index + 1}</div>
        <div class="q-col-token">${item.token_number}</div>
        <div class="q-col-info">
          <strong>${item.farmer_name} ${isUser ? '(आपण)' : ''}</strong>
          <small>${item.crop_name} (${item.expected_quantity} क्विंटल) • वेळ: ${item.start_time || '०९:००'}</small>
        </div>
        <div class="q-status-badge ${statusClass}">${statusText}</div>
      `;

      container.appendChild(row);
    });
  }

  function renderFallbackQueue() {
    // Read real bookings from localStorage
    let myBookings = [];
    try {
      myBookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
    } catch (e) { /* ignore */ }

    // Get logged-in user name
    let myName = "शेतकरी मित्र";
    try {
      const ksUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");
      const lgUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
      myName = ksUser.full_name || lgUser.name || myName;
    } catch (e) { /* ignore */ }

    // Build a waiting list from confirmed localStorage bookings
    const confirmedBookings = myBookings.filter(b =>
      b.status && (b.status.includes("Confirmed") || b.status.includes("निश्चित"))
    );

    // Add a few placeholder entries before the user's booking
    const placeholders = [
      { token_number: "#01", farmer_name: "रमेश देशमुख", crop_name: "सोयाबीन", expected_quantity: 40, start_time: "08:00" },
      { token_number: "#02", farmer_name: "ज्ञानेश्वर शिंदे", crop_name: "तूर", expected_quantity: 35, start_time: "08:00" }
    ];

    const myEntries = confirmedBookings.slice(0, 3).map((b, i) => ({
      token_number: b.token || b.token_number || `#0${i + 3}`,
      farmer_name: myName,
      crop_name: b.crop || b.crop_name || "सोयाबीन",
      expected_quantity: parseFloat(b.quantity || b.expected_quantity || 0),
      start_time: b.slotTime ? b.slotTime.split(" - ")[0] : "10:00"
    }));

    const fallbackServing = placeholders[0];
    const waitingList = [...placeholders.slice(1), ...myEntries];

    renderLiveQueueData(fallbackServing, waitingList);
  }

  // Initialization
  document.addEventListener("DOMContentLoaded", () => {
    startTimer();
    fetchLiveQueueFromDB();

    // Auto-refresh every 10 seconds for real-time live queuing
    setInterval(fetchLiveQueueFromDB, 10000);

    const centerFilter = document.getElementById("centerFilter");
    if (centerFilter) {
      centerFilter.addEventListener("change", (e) => {
        currentCenterId = e.target.value === "karkamb" ? 2 : (e.target.value === "mohol" ? 3 : 1);
        fetchLiveQueueFromDB();
      });
    }
  });

})();
