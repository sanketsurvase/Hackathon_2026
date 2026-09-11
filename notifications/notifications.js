// ========================================================
// KISANSETU - NOTIFICATIONS JAVASCRIPT
// ========================================================

(function () {
  'use strict';

  function initSeedNotifications() {
    const existing = localStorage.getItem("kisansetu_notifications");
    if (!existing || JSON.parse(existing).length === 0) {
      const seed = [
        {
          id: "notif_1",
          category: "booking",
          title: "स्लॉट बुकिंग पुष्टी (Booking Confirmed)",
          message: "पंढरपूर मुख्य यार्ड येथे सोयाबीन विक्रीसाठी आपले टोकन #KS-SLT-2026-9214 मंजूर झाले आहे. वेळ: सकाळी ०९:०० - ११:००.",
          time: "१० मिनिटांपूर्वी",
          icon: "🧾",
          iconClass: "booking",
          link: "../my_booking/my-booking.html",
          linkText: "बुकिंग व पावती पहा →",
          unread: true
        },
        {
          id: "notif_2",
          category: "payment",
          title: "DBT देयक जमा (Payment Credited)",
          message: "हरभरा हमीभाव खरेदी लॉट LOT-MH13-2026-0422 चे ₹२,७२,००० DBT द्वारे SBI खात्यात यशस्वीरित्या जमा झाले आहेत.",
          time: "२ तासांपूर्वी",
          icon: "💰",
          iconClass: "payment",
          link: "../payment_status/payment-status.html",
          linkText: "देयक तपशील तपासा →",
          unread: true
        },
        {
          id: "notif_3",
          category: "weather",
          title: "हवामान इशारा - मुसळधार पाऊस (IMD Alert)",
          message: "सोलापूर व पंढरपूर परिसरात पुढील ४८ तासांत मेघगर्जनेसह पाऊस अपेक्षित आहे. केंद्रावर आणलेला माल ताडपत्रीने सुरक्षित झाका.",
          time: "५ तासांपूर्वी",
          icon: "⛈️",
          iconClass: "weather",
          link: "#",
          linkText: "",
          unread: true
        },
        {
          id: "notif_4",
          category: "msp",
          title: "हमीभाव दर २०२६ जाहीर",
          message: "केंद्र सरकारने खरीप हंगाम २०२६ साठी सोयाबीनचा दर ₹४,८९२ आणि कापूस ₹७,५२१ प्रति क्विंटल निश्चित केला आहे.",
          time: "काल",
          icon: "📢",
          iconClass: "msp",
          link: "../crop_information/crop-information.html",
          linkText: "दर सूची पहा →",
          unread: false
        }
      ];
      localStorage.setItem("kisansetu_notifications", JSON.stringify(seed));
    }
  }

  function getNotifications() {
    try {
      return JSON.parse(localStorage.getItem("kisansetu_notifications") || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  function saveNotifications(list) {
    localStorage.setItem("kisansetu_notifications", JSON.stringify(list));
  }

  let currentCategory = "all";

  function renderNotifications() {
    const container = document.getElementById("notificationList");
    if (!container) return;

    const list = getNotifications();

    let filtered = list;
    if (currentCategory !== "all") {
      filtered = list.filter(n => n.category === currentCategory);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-noti">
          <p>या श्रेणीमध्ये कोणतीही सूचना उपलब्ध नाही.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    filtered.forEach(n => {
      const card = document.createElement("div");
      card.className = `noti-card ${n.unread ? 'unread' : ''}`;

      card.innerHTML = `
        <div class="noti-icon ${n.iconClass}">${n.icon}</div>
        <div class="noti-body">
          <div class="noti-header">
            <h3>${n.title}</h3>
            <span class="noti-time">${n.time}</span>
          </div>
          <p>${n.message}</p>
          ${n.linkText ? `<a href="${n.link}" class="noti-link">${n.linkText}</a>` : ''}
        </div>
      `;

      card.addEventListener("click", () => {
        if (n.unread) {
          n.unread = false;
          saveNotifications(list);
          renderNotifications();
        }
      });

      container.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSeedNotifications();
    renderNotifications();

    // Category Filter
    document.querySelectorAll(".cat-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentCategory = pill.dataset.category;
        renderNotifications();
      });
    });

    // Mark All Read
    const markAllBtn = document.getElementById("markAllReadBtn");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", () => {
        const list = getNotifications();
        list.forEach(n => n.unread = false);
        saveNotifications(list);
        renderNotifications();
      });
    }
  });

})();
