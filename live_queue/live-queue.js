// ========================================================
// KISANSETU - LIVE QUEUE JAVASCRIPT (TODAY'S SLOTS ONLY)
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

  function formatMarathiDate(dateObj) {
    const marathiMonths = [
      "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
      "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
    ];
    const day = dateObj.getDate();
    const month = marathiMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // 1. Get user's active booking (distinguishing today's slot vs future slots)
  function getUserBookingsInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    const todayStr = getTodayIsoString();

    let todayBooking = null;
    let futureBooking = null;

    try {
      const bookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const latest = JSON.parse(localStorage.getItem("latestKisanSetuBooking") || "null");
      const all = [...(latest ? [latest] : []), ...bookings];

      for (const b of all) {
        if (!b) continue;
        const bToken = String(b.token || b.token_number || "").trim();
        const bDate = String(b.slotDate || b.date || "").trim();
        const isConfirmed = b.status && (b.status.includes("Confirmed") || b.status.includes("निश्चित"));

        if (!isConfirmed) continue;

        if (tokenFromUrl && bToken === tokenFromUrl) {
          if (bDate === todayStr) {
            todayBooking = b;
          } else {
            futureBooking = b;
          }
          break;
        }

        if (bDate === todayStr && !todayBooking) {
          todayBooking = b;
        } else if (!todayBooking && !futureBooking) {
          futureBooking = b;
        }
      }
    } catch (e) {
      console.error("Error reading token:", e);
    }

    return {
      todayBooking,
      futureBooking,
      tokenFromUrl
    };
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

  // Fetch Live Queue directly from DB strictly for TODAY's date
  async function fetchLiveQueueFromDB() {
    const todayStr = getTodayIsoString();
    const userInfo = getUserBookingsInfo();

    let dbServing = null;
    let dbWaiting = [];

    try {
      const res = await fetch(`${API_BASE}/live-queue?centre_id=${currentCenterId}&queue_date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          dbServing = data.now_serving || null;
          dbWaiting = Array.isArray(data.waiting_list) ? data.waiting_list : [];
        }
      }
    } catch (err) {
      console.warn("DB Live queue fetch notice:", err);
    }

    // Combine DB entries with client confirmed bookings strictly for TODAY ONLY
    const combinedQueue = [];
    const seenTokens = new Set();

    if (dbServing && dbServing.token_number) {
      combinedQueue.push(dbServing);
      seenTokens.add(String(dbServing.token_number).trim());
    }

    dbWaiting.forEach(item => {
      const tok = String(item.token_number).trim();
      if (tok && !seenTokens.has(tok)) {
        seenTokens.add(tok);
        combinedQueue.push(item);
      }
    });

    // Also include local bookings that are strictly confirmed for TODAY
    try {
      const localBookings = JSON.parse(localStorage.getItem("kisansetu_bookings") || "[]");
      const confirmedTodayLocal = localBookings.filter(b => {
        if (!b || !b.status) return false;
        const isConf = b.status.includes("Confirmed") || b.status.includes("निश्चित");
        const isToday = (b.slotDate === todayStr) || (b.date === todayStr);
        return isConf && isToday;
      });

      let myName = "शेतकरी मित्र";
      try {
        const ksUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");
        const lgUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
        myName = ksUser.full_name || lgUser.name || myName;
      } catch (e) {}

      confirmedTodayLocal.forEach((b) => {
        const tok = String(b.token || b.token_number || "").trim();
        if (tok && !seenTokens.has(tok)) {
          seenTokens.add(tok);
          combinedQueue.push({
            token_number: tok,
            farmer_name: b.farmerName || myName,
            crop_name: b.crop || b.crop_name || "सोयाबीन",
            expected_quantity: parseFloat(b.quantity || b.expected_quantity || 0),
            start_time: b.slotTime ? b.slotTime.split(" - ")[0] : "०९:००",
            slot_date: todayStr,
            booking_status: "confirmed"
          });
        }
      });
    } catch (e) {
      console.warn("Local storage queue sync notice:", e);
    }

    const finalServing = combinedQueue.length > 0 ? combinedQueue[0] : null;
    const finalWaiting = combinedQueue.length > 1 ? combinedQueue.slice(1) : [];

    renderLiveQueueData(finalServing, finalWaiting, userInfo);
  }

  function renderLiveQueueData(nowServing, waitingList, userInfo) {
    // Update subtitle with today's date in Marathi
    const todayMarathi = formatMarathiDate(new Date());
    const subtitleEl = document.querySelector(".header-title p");
    if (subtitleEl) {
      subtitleEl.textContent = `आजची थेट रांग (${todayMarathi}) • वजन काटा थेट स्थिती`;
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
      if (farmerDisplay) farmerDisplay.textContent = "आजच्या स्लॉटनुसार सध्या कोणताही माल काट्यावर नाही";
      if (vehicleDisplay) vehicleDisplay.textContent = "प्रतिक्षा सुरू";
      if (cropDisplay) cropDisplay.textContent = "-";
    }

    // 2. User status
    const uTokenVal = document.getElementById("uTokenVal");
    const uQueuePos = document.getElementById("uQueuePos");
    const uWaitTime = document.getElementById("uWaitTime");
    const uStatusMsg = document.getElementById("uStatusMsg");

    const todayBooking = userInfo ? userInfo.todayBooking : null;
    const futureBooking = userInfo ? userInfo.futureBooking : null;
    const tokenFromUrl = userInfo ? userInfo.tokenFromUrl : null;

    if (todayBooking) {
      const myToken = todayBooking.token || todayBooking.token_number;
      if (uTokenVal) uTokenVal.textContent = myToken;

      const list = waitingList || [];
      const userIndex = list.findIndex(item => String(item.token_number).trim() === String(myToken).trim());
      const isCurrentlyServing = nowServing && String(nowServing.token_number).trim() === String(myToken).trim();

      if (isCurrentlyServing) {
        if (uQueuePos) uQueuePos.textContent = "सध्या चालू!";
        if (uWaitTime) uWaitTime.textContent = "० मिनिटे";
        if (uStatusMsg) uStatusMsg.innerHTML = "🎉 <strong>आपले वाहन वजन काट्यावर आहे!</strong> कृपया वजन पूर्ण होईपर्यंत थांबा.";
      } else if (userIndex !== -1) {
        const pos = userIndex + 1;
        if (uQueuePos) uQueuePos.textContent = `# ${pos}`;
        if (uWaitTime) uWaitTime.textContent = `~ ${pos * 8} मिनिटे`;
        if (uStatusMsg) uStatusMsg.innerHTML = `📢 आजच्या रांगेत आपल्या पुढे <strong>${pos}</strong> वाहन(ने) आहेत. कृपया वजन काट्यासाठी सज्ज राहा.`;
      } else {
        if (uQueuePos) uQueuePos.textContent = "# १";
        if (uWaitTime) uWaitTime.textContent = "~ १० मिनिटे";
        if (uStatusMsg) uStatusMsg.textContent = "📢 आपला क्रमांक लवकरच येणार आहे. कृपया वाहनासह प्रवेशद्वाराजवळ सज्ज राहा.";
      }
    } else if (futureBooking) {
      const fToken = futureBooking.token || futureBooking.token_number;
      const fDate = futureBooking.slotDateMarathi || futureBooking.slotDate || "";
      const fTime = futureBooking.slotTime || "";

      if (uTokenVal) uTokenVal.textContent = fToken;
      if (uQueuePos) uQueuePos.textContent = "आगामी तारीख";
      if (uWaitTime) uWaitTime.textContent = fDate || "आगामी";
      if (uStatusMsg) {
        uStatusMsg.innerHTML = `📅 <strong>आपला स्लॉट ${fDate} (${fTime}) साठी निश्चित आहे.</strong> हा टोकन क्रमांक त्या दिवशीच्या लाईव्ह रांगेत आपोआप सक्रिय होईल.`;
      }
    } else if (tokenFromUrl) {
      if (uTokenVal) uTokenVal.textContent = tokenFromUrl;
      if (uQueuePos) uQueuePos.textContent = "-";
      if (uWaitTime) uWaitTime.textContent = "-";
      if (uStatusMsg) {
        uStatusMsg.innerHTML = `📢 टोकन <strong>${tokenFromUrl}</strong> आजच्या थेट रांगेत नोंदणीकृत नाही.`;
      }
    } else {
      if (uTokenVal) uTokenVal.textContent = "स्लॉट बुक नाही";
      if (uQueuePos) uQueuePos.textContent = "-";
      if (uWaitTime) uWaitTime.textContent = "-";
      if (uStatusMsg) {
        uStatusMsg.innerHTML = '📢 आजच्या तारखेसाठी आपला कोणताही स्लॉट बुक नाही. <a href="../slot_booking/slot-booking.html" style="color:#08783f; font-weight:700; text-decoration:underline;">येथे स्लॉट बुक करा ➔</a>';
      }
    }

    // 3. Queue List Table
    renderQueueTable(waitingList, todayBooking ? (todayBooking.token || todayBooking.token_number) : null);
  }

  function renderQueueTable(list, activeUserToken) {
    const container = document.getElementById("queueListContainer");
    const totalWaiting = document.getElementById("totalWaiting");
    if (!container) return;

    const count = Array.isArray(list) ? list.length : 0;
    if (totalWaiting) totalWaiting.textContent = `आजची प्रतिक्षा: ${count} वाहने`;
    container.innerHTML = "";

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 28px 14px; color: #53695b;">
          <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">सध्या आजच्या रांगेत इतर कोणतीही वाहने प्रतिक्षेत नाहीत.</p>
          <p style="font-size: 13px; color: #718779; margin-bottom: 12px;">येथे फक्त आजच्या तारखेचे (Today's) सक्रिय टोकन्स दाखवले जातात.</p>
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

      const statusText = index === 0 ? "पुढील टोकन (Next)" : "रांगेत (Waiting)";
      const statusClass = index === 0 ? "q-status-next" : "q-status-waiting";

      row.innerHTML = `
        <div class="q-col-pos">#${index + 1}</div>
        <div class="q-col-token">${item.token_number || "-"}</div>
        <div class="q-col-info">
          <strong>${item.farmer_name || 'शेतकरी'} ${isUser ? '(आपण)' : ''}</strong>
          <small>${item.crop_name || 'पीक'} (${item.expected_quantity || 0} क्विंटल) • वेळ: ${item.start_time || '०९:००'}</small>
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
        currentCenterId = e.target.value === "karkamb" ? 2 : (e.target.value === "mohol" ? 3 : 1);
        fetchLiveQueueFromDB();
      });
    }
  });

})();
