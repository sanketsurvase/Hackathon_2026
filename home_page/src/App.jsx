import React from "react";

function App() {
  const menuItems = [
    { icon: "⌂", name: "मुख्यपृष्ठ" },
    { icon: "♙", name: "माझी माहिती" },
    { icon: "🌾", name: "पिकांची माहिती" },
    { icon: "▣", name: "शेती मार्गदर्शन" },
    { icon: "₹", name: "माझी सुविधा" },
    { icon: "↗", name: "लाईव्ह भाव" },
    { icon: "✓", name: "खरेदीची स्थिती" },
    { icon: "☀", name: "हवामान" },
    { icon: "🔔", name: "सूचना" },
    { icon: "⚑", name: "तक्रार / अभिप्राय" },
    { icon: "?", name: "मदत व संपर्क" },
  ];

  const handleMenuClick = (name) => {
    if (name === "मुख्यपृष्ठ") {
      return;
    }

    alert(`${name} विभाग लवकरच उपलब्ध होईल.`);
  };

  return (
    <div className="app">

      {/* ================= HEADER ================= */}
      <header className="header">

        <div className="logo-section">
          <div className="logo-icon">
            🌱
          </div>

          <div className="logo-text">
            <h1>किसानसेवा</h1>
            <p>शेतकऱ्यांसाठी माहिती, सेवा आणि सुविधा</p>
          </div>
        </div>

        <div className="header-right">

          <button
            className="notification-btn"
            onClick={() => alert("सूचना विभाग लवकरच उपलब्ध होईल.")}
          >
            🔔
          </button>

          <button
            className="profile-btn"
            onClick={() => alert("माझी माहिती विभाग लवकरच उपलब्ध होईल.")}
          >
            <div className="profile-photo">
              👨🏻‍🌾
            </div>

            <div className="profile-text">
              <strong>संकट पाटील</strong>
              <span>शेतकरी</span>
            </div>
          </button>

        </div>
      </header>


      {/* ================= MAIN BODY ================= */}
      <div className="main-layout">

        {/* ================= SIDEBAR ================= */}
        <aside className="sidebar">

          <div className="sidebar-menu">

            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`menu-item ${
                  index === 0 ? "active" : ""
                }`}
                onClick={() => handleMenuClick(item.name)}
              >

                <span className="menu-icon">
                  {item.icon}
                </span>

                <span className="menu-name">
                  {item.name}
                </span>

              </button>
            ))}

          </div>


          {/* Sidebar bottom */}
          <div className="sidebar-bottom">

            <button
              onClick={() =>
                alert("खाते सेटिंग लवकरच उपलब्ध होईल.")
              }
            >
              ⚙ खाते सेटिंग
            </button>

            <button
              onClick={() =>
                alert("लॉगआउट")
              }
            >
              ⇥ लॉगआउट
            </button>

          </div>

        </aside>


        {/* ================= CONTENT ================= */}
        <main className="content">

          {/* Welcome section */}
          <section className="welcome-card">

            <div className="welcome-content">

              <div className="step-circle">
                १
              </div>

              <div className="welcome-small">
                नमस्कार शेतकरी
              </div>

              <h2>
                किसानसेवामध्ये
                <br />
                <span>आपले स्वागत आहे!</span>
              </h2>

              <p>
                शेतीशी संबंधित माहिती, बाजार भाव,
                हवामान आणि शेतकऱ्यांसाठी उपलब्ध
                विविध सुविधांचा लाभ एका ठिकाणी घ्या.
              </p>

              <button
                className="main-btn"
                onClick={() =>
                  alert("पिकांची माहिती विभाग लवकरच उपलब्ध होईल.")
                }
              >
                माझी पिके पहा
                <span>→</span>
              </button>

            </div>


            {/* Farmer illustration area */}
            <div className="farmer-area">

              <div className="sun">
                ☀️
              </div>

              <div className="cloud cloud-one">
                ☁️
              </div>

              <div className="cloud cloud-two">
                ☁️
              </div>

              <div className="mountain mountain-one">
                ▲
              </div>

              <div className="mountain mountain-two">
                ▲
              </div>

              <div className="farmer">
                👨🏻‍🌾
              </div>

              <div className="crops">
                🌱 🌾 🌱 🌾 🌱 🌾
              </div>

            </div>

          </section>


          {/* ================= SERVICES ================= */}
          <section className="services-section">

            <div className="section-heading">

              <div>
                <h3>
                  आजच्या महत्त्वाच्या सेवा
                </h3>

                <p>
                  खालील पर्यायावर क्लिक करून संबंधित
                  माहिती पहा.
                </p>
              </div>

            </div>


            <div className="service-grid">

              {/* Card 1 */}
              <button
                className="service-card"
                onClick={() =>
                  handleMenuClick("पिकांची माहिती")
                }
              >

                <div className="service-icon">
                  🌾
                </div>

                <div className="service-content">
                  <strong>
                    पिकांची माहिती
                  </strong>

                  <span>
                    तुमच्या पिकांची नोंद व माहिती
                  </span>
                </div>

                <span className="service-arrow">
                  →
                </span>

              </button>


              {/* Card 2 */}
              <button
                className="service-card"
                onClick={() =>
                  handleMenuClick("लाईव्ह भाव")
                }
              >

                <div className="service-icon">
                  💰
                </div>

                <div className="service-content">
                  <strong>
                    लाईव्ह बाजार भाव
                  </strong>

                  <span>
                    आजचे बाजार भाव पहा
                  </span>
                </div>

                <span className="service-arrow">
                  →
                </span>

              </button>


              {/* Card 3 */}
              <button
                className="service-card"
                onClick={() =>
                  handleMenuClick("हवामान")
                }
              >

                <div className="service-icon">
                  ☀️
                </div>

                <div className="service-content">
                  <strong>
                    हवामान
                  </strong>

                  <span>
                    आजचे आणि पुढील हवामान
                  </span>
                </div>

                <span className="service-arrow">
                  →
                </span>

              </button>


              {/* Card 4 */}
              <button
                className="service-card"
                onClick={() =>
                  handleMenuClick("खरेदीची स्थिती")
                }
              >

                <div className="service-icon">
                  📋
                </div>

                <div className="service-content">
                  <strong>
                    खरेदीची स्थिती
                  </strong>

                  <span>
                    तुमच्या नोंदणीची स्थिती
                  </span>
                </div>

                <span className="service-arrow">
                  →
                </span>

              </button>

            </div>

          </section>


          {/* ================= INFORMATION BOXES ================= */}
          <section className="info-grid">

            <div className="info-card green-card">

              <div className="info-icon">
                🌿
              </div>

              <div className="info-text">
                <h4>
                  शेती मार्गदर्शन
                </h4>

                <p>
                  पिकांची लागवड, खत व्यवस्थापन
                  आणि कीड नियंत्रणाची माहिती.
                </p>
              </div>

              <button
                onClick={() =>
                  handleMenuClick("शेती मार्गदर्शन")
                }
              >
                पहा →
              </button>

            </div>


            <div className="info-card yellow-card">

              <div className="info-icon">
                📢
              </div>

              <div className="info-text">
                <h4>
                  नवीन सूचना
                </h4>

                <p>
                  खरेदी, योजना आणि शेतकऱ्यांसाठी
                  महत्त्वाच्या सूचना.
                </p>
              </div>

              <button
                onClick={() =>
                  handleMenuClick("सूचना")
                }
              >
                पहा →
              </button>

            </div>

          </section>


          {/* ================= FARMER QUOTE ================= */}
          <section className="farmer-quote">

            <div className="quote-farmer">
              👨🏻‍🌾
            </div>

            <div className="quote-content">

              <h2>
                “समृद्ध शेतकरी”
              </h2>

              <h3>
                “समृद्ध भारत”
              </h3>

              <p>
                आधुनिक माहिती आणि योग्य मार्गदर्शनासोबत
                आपल्या शेतीला नवी दिशा देऊया.
              </p>

            </div>

            <div className="field">
              🌱 🌾 🌱 🌾 🌱 🌾 🌱
            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default App;