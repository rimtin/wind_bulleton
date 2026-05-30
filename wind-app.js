const GEO_URLS = [
  "indian_met_zones.geojson",
  "./indian_met_zones.geojson",
  "assets/indian_met_zones.geojson",
  "./assets/indian_met_zones.geojson",
  "https://rimtin.github.io/wind_bulletin/indian_met_zones.geojson",
  "https://raw.githubusercontent.com/rimtin/wind_bulletin/main/indian_met_zones.geojson",
  "https://cdn.jsdelivr.net/gh/rimtin/wind_bulletin@main/indian_met_zones.geojson",
  "https://rimtin.github.io/weather_bulletin/indian_met_zones.geojson",
  "https://raw.githubusercontent.com/rimtin/weather_bulletin/main/indian_met_zones.geojson",
  "https://cdn.jsdelivr.net/gh/rimtin/weather_bulletin@main/indian_met_zones.geojson"
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

function createWindDropdown() {
  return `
    <select onchange="updateWindMapColors()">
      ${windOptions.map(option => `<option>${option}</option>`).join("")}
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
  "Gujarat Region": "Gujarat region",
  "Andhra Pradesh": "Coastal Andhra Pradesh",
  "North Interior Karnataka": "N.I. Karnataka",
  "South Interior Karnataka": "S.I. Karnataka",
  "Tamil Nadu": "Tamil Nadu & Puducherry"
};

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
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
      return windColors[selected] || "#e0e0e0";
    }
  }

  return "#e0e0e0";
}

async function drawWindMap(svgId) {
  const svg = d3.select(svgId);
  svg.selectAll("*").remove();

  const width = 860;
  const height = 520;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  try {
    const data = await loadGeoJSON();

    const projection = d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[30, 30], [width - 30, height - 30]], data);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#e0e0e0")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.6);

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
  d3.selectAll("#windMapDay1 path").attr("fill", function(d) {
    return getSubdivisionColor(getGeoNameFromFeature(d), 1);
  });

  d3.selectAll("#windMapDay2 path").attr("fill", function(d) {
    return getSubdivisionColor(getGeoNameFromFeature(d), 2);
  });

  d3.selectAll("#windMapDay3 path").attr("fill", function(d) {
    return getSubdivisionColor(getGeoNameFromFeature(d), 3);
  });
}

function buildLegend() {
  const legendHTML = `
    ${windOptions.map(option => `
      <div>
        <span class="legend-box" style="background:${windColors[option]}"></span>
        ${option}
      </div>
    `).join("")}
  `;

  const l1 = document.getElementById("legendDay1");
  const l2 = document.getElementById("legendDay2");
  const l3 = document.getElementById("legendDay3");

  if (l1) l1.innerHTML = legendHTML;
  if (l2) l2.innerHTML = legendHTML;
  if (l3) l3.innerHTML = legendHTML;
}

function downloadPDF() {
  const element = document.getElementById("pdf-area");

  const opt = {
    margin: [0.12, 0.12, 0.12, 0.12],
    filename: "Wind_Forecast_Bulletin.pdf",
    image: { type: "jpeg", quality: 0.68 },
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
  buildWindTable();
  buildLegend();

  drawWindMap("#windMapDay1");
  drawWindMap("#windMapDay2");
  drawWindMap("#windMapDay3");
};
