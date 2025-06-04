# F1Dashboards

**F1Dashboards** is a free, open, and ad-free web project dedicated to interactive Formula 1 data visualization.  
It aims to make F1 statistics and historical data accessible to everyone through modern, responsive dashboards built with HTML, CSS, JavaScript, and Plotly.js.

---

## 🚦 Project Overview

F1Dashboards provides interactive dashboards to explore F1 constructors, drivers, and race results with an elegant, racing-inspired design.  
All dashboards are fully client-side and require no backend, making them fast, lightweight, and easy to host.

- **Live site:** [f1dashboards.com](https://f1dashboards.com) 

---

## 📊 Available Dashboards

Currently live:
- **Constructor Standings Dashboard**  
  Visualize and compare constructor performance season by season.

Coming soon:
- **Drivers Career Dashboard**  
  Explore F1 driver careers, season results, wins, podiums, and teams.
- **Race Results Explorer**  
  Analyze race-by-race results, filter by circuit, driver, or constructor.

Additional dashboards (planned):
- **Qualifying Performance**
- **Pit Stop Analysis**
- **Circuit Insights**

*(Dashboard coverage depends on available and up-to-date open data.)*

---

## 🎨 Tech Stack & Design

- **Frontend:** HTML, CSS, JavaScript (ES6+), [Plotly.js](https://plotly.com/javascript/)
- **Design:** Modern, minimal, racing-inspired UI
    - **Palette:** `#1a1a2e` (primary), `#15151e` (secondary), `#ff1801` (accent)
    - **Fonts:** [Russo One](https://fonts.google.com/specimen/Russo+One) (titles), [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) (text)
- **Data:** CSV or JSON files based on public F1 datasets (see below)
- **Hosting:** Static site (Netlify, GitHub Pages)

---

## 🏁 Data Sources

- Main data source: [Kaggle F1 Dataset (Ergast-based)](https://www.kaggle.com/datasets)
- From 2025, data updates may rely on new open sources (e.g. [Jolpica](https://github.com/jolpica/jolpica-f1)) or manual integration (e.g. Wikipedia tables).
- Please note: Data currently covers seasons up to **2024**. Post-2024 updates depend on new open initiatives.

---

## 📂 Repository Structure

`
/data/          # CSV data files (e.g. constructor_standings.csv, drivers.csv, etc.)
app.js          # Main JavaScript logic for dashboards
index.html      # Landing page / main dashboard HTML
styles.css      # Main stylesheet for layout and design
README.md       # Project documentation
`


---

## 📝 Credits & License

- Data: [Kaggle F1 Dataset](https://www.kaggle.com/datasets), Ergast API, Wikipedia (for post-2024 manual updates)
- Logo & graphics: by Francesco Saviano 
- Dashboard code: MIT License 
- This site is an independent, non-commercial project not affiliated with Formula 1 Group.

---

## ☕ Support

If you enjoy the project, you can [buy me a coffee on Ko-fi](https://ko-fi.com/f1dashboards)!  
Your support helps keep F1Dashboards free, open, and ad-free.

---

## 📬 Contact & Feedback

- Suggestions, bug reports or contributions?  
  Open an issue or contact: [f1dashboards25@gmail.com]

---

## 🚧 Roadmap / To Do

- Add Drivers Career and Race Results dashboards
- Explore integration with Jolpica API for future data updates
- Expand dashboard analytics (qualifying, pit stops, circuits)
- Enhance mobile experience
- Add language support (EN/IT)

---

**F1Dashboards — Formula 1 data, visualized for everyone.**

