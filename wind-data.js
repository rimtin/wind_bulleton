
const windColors = {
  "Low Wind Speed (< 3 m/s)": "#8BC34A",
  "Medium Wind Speed (3 to 8 m/s)": "#FFF200",
  "High Wind Speed (8 to 11 m/s)": "#FF9800",
  "Very High Wind Speed (> 11 m/s)": "#FF1E1E",
  "Gust / Circulation": "#3F51B5"
};

const windOptions = Object.keys(windColors);

const windForecastData = [
  { state: "MH", areas: ["Konkan & Goa", "Madhya Maharashtra", "Marathwada", "Vidarbha"] },
  { state: "MP", areas: ["West MP", "East MP"] },
  { state: "RJ", areas: ["West Rajasthan", "East Rajasthan"] },
  { state: "GJ", areas: ["Saurashtra & Kutch", "Gujarat Region"] },
  { state: "AP", areas: ["Andhra Pradesh"] },
  { state: "KA", areas: ["North Interior Karnataka", "South Interior Karnataka"] },
  { state: "TN", areas: ["Tamil Nadu"] }
];

function updateForecastDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  document.getElementById("forecast-date").innerText =
    `Forecast dated ${formatted}`;
}
