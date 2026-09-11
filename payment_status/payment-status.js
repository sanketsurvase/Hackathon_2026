// ========================================================
// KISANSETU - PAYMENT STATUS JAVASCRIPT
// ========================================================

(function () {
  'use strict';

  document.addEventListener("DOMContentLoaded", () => {
    const filterPills = document.querySelectorAll(".filter-pill");
    const txnCards = document.querySelectorAll(".txn-card");

    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        filterPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        const filter = pill.dataset.filter;

        txnCards.forEach(card => {
          if (filter === "all") {
            card.style.display = "block";
          } else if (card.dataset.type === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  });

})();
