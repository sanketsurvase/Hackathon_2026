import React, { useState } from "react";

const menuItems = [
  {
    id: "home",
    icon: "⌂",
    label: "मुख्यपृष्ठ",
  },
  {
    id: "profile",
    icon: "♙",
    label: "माझी माहिती",
  },
  {
    id: "crops",
    icon: "🌱",
    label: "पिकांची माहिती",
  },
  {
    id: "market",
    icon: "📊",
    label: "लाईव्ह बाजार",
  },
  {
    id: "facility",
    icon: "🧺",
    label: "माझी सुविधा",
  },
  {
    id: "rates",
    icon: "₹",
    label: "लाईव्ह भाव",
  },
  {
    id: "purchase",
    icon: "🛒",
    label: "खरेदीची स्थिती",
  },
  {
    id: "payment",
    icon: "💳",
    label: "देयक स्थिती",
  },
  {
    id: "notification",
    icon: "🔔",
    label: "सूचना",
  },
  {
    id: "complaint",
    icon: "📝",
    label: "तक्रार / अभिप्राय",
  },
  {
    id: "help",
    icon: "❓",
    label: "मदत व संपर्क",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  /*
    Login page वरून user information localStorage मध्ये
    save केलेली असल्यास ती इथे मिळेल.
  */

  const user = JSON.parse(
    localStorage.getItem("loggedInUser")
  ) || {
    userId: "KS10245",
    name: "संकट पाटील",
    mobile: "9876543210",
  };


  /* =========================================
     MENU CLICK
  ========================================= */

  const handleMenuClick = (id) => {
    setActiveTab(id);
    setMenuOpen(false);

    if (id !== "home") {
      alert("हा विभाग लवकरच उपलब्ध होईल.");
    }
  };


  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");

    setMenuOpen(false);
    setProfileOpen(false);

    alert("आपण यशस्वीरित्या लॉगआउट झाला आहात.");
  };


  return (
    <div className="app">

      {/* =========================================
          TOP HEADER
      ========================================= */}

      <header className="mobile-header">

        <div className="brand-section">

          <div className="brand-logo">
            🌱
          </div>

          <div className="brand-details">

            <h1>
              किसानसेवा
            </h1>

            <p>
              शेतकऱ्यांसाठी डिजिटल सेवा
            </p>

          </div>

        </div>


        {/* HEADER RIGHT BUTTONS */}

        <div className="header-actions">

          <button
            className="header-button"
            onClick={() =>
              handleMenuClick("notification")
            }
            aria-label="सूचना"
          >
            🔔
          </button>


          <button
            className="profile-button"
            onClick={() =>
              setProfileOpen(!profileOpen)
            }
            aria-label="प्रोफाइल"
          >
            👨🏻‍🌾
          </button>

        </div>

      </header>


      {/* =========================================
          MENU BUTTON BELOW HEADER
      ========================================= */}

      <div className="mobile-menu-bar">

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="मेनू उघडा"
        >
          ☰
        </button>

        <span>
          मेनू
        </span>

      </div>


      {/* =========================================
          PROFILE POPUP
      ========================================= */}

      {profileOpen && (

        <div className="profile-popup">

          <div className="profile-popup-header">

            <div className="profile-large-avatar">
              👨🏻‍🌾
            </div>

            <div className="profile-popup-name">

              <h3>
                {user.name}
              </h3>

              <p>
                User ID: {user.userId}
              </p>

            </div>

            <button
              className="profile-close"
              onClick={() =>
                setProfileOpen(false)
              }
            >
              ×
            </button>

          </div>


          <div className="profile-info">

            <div className="profile-info-item">

              <span>
                🆔 User ID
              </span>

              <strong>
                {user.userId}
              </strong>

            </div>


            <div className="profile-info-item">

              <span>
                📱 मोबाईल नंबर
              </span>

              <strong>
                {user.mobile}
              </strong>

            </div>

          </div>


          <button
            className="view-profile-button"
            onClick={() =>
              handleMenuClick("profile")
            }
          >
            माझी माहिती पहा

            <span>
              →
            </span>

          </button>

        </div>

      )}


      {/* =========================================
          LEFT SIDE MENU
      ========================================= */}

      {menuOpen && (

        <div
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        >

          <aside
            className="side-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* DRAWER HEADER */}

            <div className="drawer-header">

              <div className="drawer-brand">

                <div className="drawer-logo">
                  🌱
                </div>

                <div>

                  <h2>
                    किसानसेवा
                  </h2>

                  <p>
                    शेतकऱ्यांसाठी डिजिटल सेवा
                  </p>

                </div>

              </div>


              <button
                className="drawer-close"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                ×
              </button>

            </div>


            {/* FARMER PROFILE */}

            <div className="drawer-user">

              <div className="drawer-user-avatar">
                👨🏻‍🌾
              </div>

              <div className="drawer-user-details">

                <strong>
                  {user.name}
                </strong>

                <span>
                  ID: {user.userId}
                </span>

              </div>

            </div>


            {/* ALL TABS */}

            <div className="drawer-menu">

              {menuItems.map((item) => (

                <button
                  key={item.id}
                  className={
                    activeTab === item.id
                      ? "drawer-item active"
                      : "drawer-item"
                  }
                  onClick={() =>
                    handleMenuClick(item.id)
                  }
                >

                  <span className="drawer-item-icon">
                    {item.icon}
                  </span>

                  <span className="drawer-item-label">
                    {item.label}
                  </span>

                  <span className="drawer-item-arrow">
                    ›
                  </span>

                </button>

              ))}


              {/* LOGOUT */}

              <button
                className="drawer-item logout-item"
                onClick={handleLogout}
              >

                <span className="drawer-item-icon">
                  🚪
                </span>

                <span className="drawer-item-label">
                  लॉगआउट
                </span>

                <span className="drawer-item-arrow">
                  ›
                </span>

              </button>

            </div>


            {/* FOOTER */}

            <div className="drawer-footer">

              <p>
                किसानसेवा
              </p>

              <span>
                शेतकऱ्यांसाठी • शेतकऱ्यांकडून
              </span>

            </div>

          </aside>

        </div>

      )}


      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main className="main-content">


        {/* WELCOME */}

        <section className="welcome-card">

          <div className="welcome-content">

            <p className="welcome-small">
              किसानसेवामध्ये आपले स्वागत आहे
            </p>

            <h2>
              नमस्कार, {user.name}! 👋
            </h2>

            <p className="welcome-description">
              आपल्या शेतीसाठी आवश्यक असलेल्या
              सर्व डिजिटल सेवांचा लाभ एका ठिकाणी घ्या.
            </p>


            {/* USER ID */}

            <div className="user-id-card">

              <div className="user-id-icon">
                🆔
              </div>

              <div>

                <span>
                  आपला User ID
                </span>

                <strong>
                  {user.userId}
                </strong>

              </div>

            </div>

          </div>


          <div className="welcome-farmer">
            👨🏻‍🌾
          </div>

        </section>


        {/* =========================================
            SERVICES
        ========================================= */}

        <section className="services-section">

          <div className="section-heading">

            <h2>
              शेतकऱ्यांसाठी सेवा
            </h2>

            <p>
              आवश्यक सेवा एका क्लिकवर
            </p>

          </div>


          <div className="service-list">


            {/* PIKANCHI MAHITI */}

            <button
              className="service-card"
              onClick={() =>
                handleMenuClick("crops")
              }
            >

              <div className="service-icon green">
                🌱
              </div>

              <div className="service-content">

                <h3>
                  पिकांची माहिती
                </h3>

                <p>
                  आपल्या पिकांची माहिती नोंदवा
                </p>

              </div>

              <span className="service-arrow">
                →
              </span>

            </button>


            {/* LIVE BHAV */}

            <button
              className="service-card"
              onClick={() =>
                handleMenuClick("rates")
              }
            >

              <div className="service-icon yellow">
                ₹
              </div>

              <div className="service-content">

                <h3>
                  लाईव्ह भाव
                </h3>

                <p>
                  आजचे बाजार भाव पहा
                </p>

              </div>

              <span className="service-arrow">
                →
              </span>

            </button>


            {/* LIVE BAZAR */}

            <button
              className="service-card"
              onClick={() =>
                handleMenuClick("market")
              }
            >

              <div className="service-icon blue">
                📊
              </div>

              <div className="service-content">

                <h3>
                  लाईव्ह बाजार
                </h3>

                <p>
                  बाजारपेठेची माहिती मिळवा
                </p>

              </div>

              <span className="service-arrow">
                →
              </span>

            </button>


            {/* PURCHASE */}

            <button
              className="service-card"
              onClick={() =>
                handleMenuClick("purchase")
              }
            >

              <div className="service-icon purple">
                🛒
              </div>

              <div className="service-content">

                <h3>
                  खरेदीची स्थिती
                </h3>

                <p>
                  आपल्या खरेदीची सद्यस्थिती तपासा
                </p>

              </div>

              <span className="service-arrow">
                →
              </span>

            </button>

          </div>

        </section>


        {/* =========================================
            SMALL SERVICES
        ========================================= */}

        <section className="small-services">


          <button
            className="small-service-card"
            onClick={() =>
              handleMenuClick("facility")
            }
          >

            <div className="small-service-icon">
              🧺
            </div>

            <div>

              <h3>
                माझी सुविधा
              </h3>

              <p>
                उपलब्ध सुविधा
              </p>

            </div>

            <span>
              →
            </span>

          </button>


          <button
            className="small-service-card"
            onClick={() =>
              handleMenuClick("notification")
            }
          >

            <div className="small-service-icon notification">
              🔔
            </div>

            <div>

              <h3>
                नवीन सूचना
              </h3>

              <p>
                महत्त्वाच्या सूचना
              </p>

            </div>

            <span>
              →
            </span>

          </button>

        </section>


        {/* =========================================
            FARMER BANNER
        ========================================= */}

        <section className="farmer-banner">

          <div className="banner-farmer">
            👨🏻‍🌾
          </div>

          <div className="banner-text">

            <h2>
              “समृद्ध शेतकरी
              <br />
              समृद्ध भारत”
            </h2>

            <p>
              आधुनिक तंत्रज्ञानासोबत
              शेतीला नवी दिशा.
            </p>

          </div>

          <div className="banner-plants">
            🌾🌱🌾
          </div>

        </section>


        {/* MENU HINT */}

        <div className="menu-hint">

          <span>
            ☰
          </span>

          <p>
            मेनू बटणावर क्लिक करून
            सर्व सेवा पहा.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;