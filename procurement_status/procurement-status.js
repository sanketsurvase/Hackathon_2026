// ========================================================
// KISANSETU - PROCUREMENT STATUS JAVASCRIPT
// ========================================================

(function () {
  'use strict';

  document.addEventListener("DOMContentLoaded", () => {
    // Check logged in user
    try {
      const user = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
      if (user.name) {
        const userChip = document.querySelector(".user-chip span");
        if (userChip) {
          userChip.textContent = `👨🏻‍🌾 ${user.name} (${user.userId || 'KS10245'})`;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // Print Procurement Slip (J-Form)
    const printBtn = document.getElementById("printProcurementBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }
  });

})();
