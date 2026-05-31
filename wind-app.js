const GEO_URLS = [
  "indian_met_zones.geojson",
  "./indian_met_zones.geojson",
  "assets/indian_met_zones.geojson",
  "./assets/indian_met_zones.geojson",
  "https://rimtin.github.io/wind_bulletin/indian_met_zones.geojson",
  "https://raw.githubusercontent.com/rimtin/wind_bulletin/main/indian_met_zones.geojson",
  "https://cdn.jsdelivr.net/gh/rimtin/wind_bulletin@main/indian_met_zones.geojson"
];

let cachedGeoJSON = null;

async function loadGeoJSON() {
  if (cachedGeoJSON) return cachedGeoJSON;

  for (const url of GEO_URLS) {
    try {
      console.log("Trying GeoJSON:", url);
      const data = await d3.json(url);

      if (data && data.features && data.features.length > 0) {
        console.log("GeoJSON loaded from:", url);
        console.log("First feature properties:", data.features[0].properties);
        cachedGeoJSON = data;
        return data;
      }
    } catch (error) {
      console.warn("GeoJSON failed:", url, error);
    }
  }

  throw new Error("No GeoJSON source could be loaded.");
}

function updateForecastDate() {
  const dateEl = document.getElementById("forecast-dated");
  if (!dateEl) return;

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  dateEl.textContent = `Dated: ${formattedDate}`;
}

function updateIssueTime() {
  const issueEl = document.getElementById("issue-time");
  if (!issueEl) return;

  const time = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  issueEl.textContent = `Time of Issue: ${time} IST`;
}

function createWindDropdown() {
  return `
    <select onchange="updateWindMapColors(); applyDropdownColor(this)">
      ${windOptions.map(option => `<option value="${option}">${option}</option>`).join("")}
    </select>
  `;
}

function buildWindTable() {
  const tbody = document.getElementById("wind-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  windForecastData.forEach(item => {
    item.areas.forEach((area, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-area", area);

      const stateCell = index === 0
        ? `<td rowspan="${item.areas.length}" class="state-cell">${item.state}</td>`
        : "";

      tr.innerHTML = `
        ${stateCell}
        <td>${area}</td>
        <td>${createWindDropdown()}</td>
        <td>${createWindDropdown()}</td>
        <td>${createWindDropdown()}</td>
      `;

      tbody.appendChild(tr);
    });
  });

  document.querySelectorAll("#wind-table-body select")
    .forEach(select => applyDropdownColor(select));
}

function applyDropdownColor(select) {
  const color = windColors[select.value] || "#ffffff";

  select.style.backgroundColor = color;
  select.style.fontWeight = "700";

  if (
    select.value === "Very High Wind Speed (> 11 m/s)" ||
    select.value === "Gust / Circulation"
  ) {
    select.style.color = "#ffffff";
  } else {
    select.style.color = "#000000";
  }
}

const geoNameMap = {
  "Konkan & Goa": "Konkan & Goa",
  "Madhya Maharashtra": "Madhya Maharashtra",
  "Marathwada": "Marathwada",
  "Vidarbha": "Vidarbha",

  "West MP": "West Madhya Pradesh",
  "East MP": "East Madhya Pradesh",

  "West Rajasthan": "West Rajasthan",
  "East Rajasthan": "East Rajasthan",

  "Saurashtra & Kutch": "Saurashtra & Kachh",
  "Saurashtra & Kachh": "Saurashtra & Kachh",
  "Gujarat Region": "Gujarat region",

  "Andhra Pradesh": "Coastal Andhra Pradesh",
  "Coastal Andhra Pradesh": "Coastal Andhra Pradesh",
  "Rayalaseema": "Rayalaseema",

  "North Interior Karnataka": "N.I. Karnataka",
  "South Interior Karnataka": "S.I. Karnataka",
  "N.I. Karnataka": "N.I. Karnataka",
  "S.I. Karnataka": "S.I. Karnataka",

  "Tamil Nadu": "Tamil Nadu & Puducherry",
  "Tamil Nadu & Puducherry": "Tamil Nadu & Puducherry",

  "Punjab": "Punjab",
  "Telangana": "Telangana",
  "Chhattisgarh": "Chhattisgarh"
};

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/kachh/g, "kutch")
    .replace(/\s+/g, " ")
    .trim();
}

function getGeoNameFromFeature(d) {
  return (
    d.properties?.ST_NM ||
    d.properties?.st_nm ||
    d.properties?.ST_NAME ||
    d.properties?.SUBDIVISION ||
    d.properties?.subdivision ||
    d.properties?.SUBDIV_NAME ||
    d.properties?.subdiv_name ||
    d.properties?.NAME ||
    d.properties?.name ||
    d.properties?.Name ||
    ""
  );
}

function getSubdivisionColor(geoName, dayNumber) {
  const rows = document.querySelectorAll("#wind-table-body tr");
  const target = normalizeName(geoName);

  for (const row of rows) {
    const area = row.getAttribute("data-area");
    const mappedGeoName = geoNameMap[area] || area;

    if (normalizeName(mappedGeoName) === target) {
      const select = row.querySelectorAll("select")[dayNumber - 1];
      const selected = select?.value;
      return windColors[selected] || null;
    }
  }

  return null;
}

function addNoForecastPattern(svg, patternId) {
  const defs = svg.append("defs");

  const pattern = defs.append("pattern")
    .attr("id", patternId)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 10)
    .attr("height", 10)
    .attr("patternTransform", "rotate(45)");

  pattern.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "#ffffff");

  pattern.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 10)
    .attr("stroke", "#777")
    .attr("stroke-width", 1.4);
}

async function drawWindMap(svgId, dayNumber) {
  const svg = d3.select(svgId);
  svg.selectAll("*").remove();

  const width = 860;
  const height = 520;
  const patternId = `noForecastPatternDay${dayNumber}`;

  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  addNoForecastPattern(svg, patternId);

  try {
    const data = await loadGeoJSON();

    const projection = d3.geoIdentity()
  .reflectY(true)
  .fitExtent([[25, 25], [width - 25, height - 25]], data);

const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", `url(#${patternId})`)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.6)
      .attr("data-geo-name", d => getGeoNameFromFeature(d));

    updateWindMapColors();

  } catch (error) {
    console.error("Final map loading error:", error);

    svg.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("fill", "red")
      .attr("font-size", 14)
      .text("Map could not load. Check GeoJSON file path.");
  }
}

function updateWindMapColors() {
  updateSingleMap("#windMapDay1", 1);
  updateSingleMap("#windMapDay2", 2);
  updateSingleMap("#windMapDay3", 3);
}

function updateSingleMap(svgId, dayNumber) {
  d3.selectAll(`${svgId} path`).attr("fill", function(d) {
    const color = getSubdivisionColor(getGeoNameFromFeature(d), dayNumber);
    return color || `url(#noForecastPatternDay${dayNumber})`;
  });
}

function buildLegend() {
  const legendHTML = `
    ${windOptions.map(option => `
      <div class="legend-item">
        <span class="legend-box" style="background:${windColors[option]}"></span>
        ${option}
      </div>
    `).join("")}
    <div class="legend-item">
      <span class="legend-box no-forecast-box"></span>
      No Forecast / Not Used
    </div>
  `;

  ["legendDay1", "legendDay2", "legendDay3"].forEach(id => {
    const legend = document.getElementById(id);
    if (legend) legend.innerHTML = legendHTML;
  });
}

function downloadPDF() {
  updateIssueTime();

  const element = document.getElementById("pdf-area");

  const opt = {
    margin: [0.12, 0.12, 0.12, 0.12],
    filename: "Wind_Forecast_Bulletin.pdf",
    image: { type: "jpeg", quality: 0.7 },
    html2canvas: {
      scale: 1.05,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollY: 0
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
      compress: true
    },
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: ["table", ".map-wrapper"]
    }
  };

  html2pdf().set(opt).from(element).save();
}

window.onload = function() {
  updateForecastDate();
  updateIssueTime();
  buildWindTable();
  buildLegend();

  drawWindMap("#windMapDay1", 1);
  drawWindMap("#windMapDay2", 2);
  drawWindMap("#windMapDay3", 3);
};
