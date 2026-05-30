function createWindDropdown() {
  return `
    <select onchange="updateWindMapColors()">
      ${windOptions.map(option => `<option>${option}</option>`).join("")}
    </select>
  `;
}

function buildWindTable() {
  const tbody = document.getElementById("wind-table-body");
  tbody.innerHTML = "";

  windForecastData.forEach(item => {
    item.areas.forEach((area, index) => {
      const tr = document.createElement("tr");

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

function getSubdivisionColor(geoName, dayColumnIndex) {
  const rows = document.querySelectorAll("#wind-table-body tr");

  for (const row of rows) {
    const area = row.children[row.children.length - 4]?.textContent.trim();
    const mappedGeoName = geoNameMap[area];

    if (mappedGeoName === geoName) {
      const selectCell = row.children[dayColumnIndex];
      const selected = selectCell?.querySelector("select")?.value;
      return windColors[selected] || "#e0e0e0";
    }
  }

  return "#e0e0e0";
}

function drawWindMap(svgId) {
  const svg = d3.select(svgId);
  svg.selectAll("*").remove();

  const projection = d3.geoMercator()
    .scale(680)
    .center([82.8, 22.5])
    .translate([420, 235]);

  const path = d3.geoPath().projection(projection);

  d3.json("./indian_met_zones.geojson")
    .then(data => {
      svg.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.6);

      updateWindMapColors();
    })
    .catch(error => {
      console.error("Map loading error:", error);
      alert("Map could not load. Check indian_met_zones.geojson file name/path.");
    });
}

function updateWindMapColors() {
  d3.selectAll("#windMapDay1 path").attr("fill", function(d) {
    return getSubdivisionColor(d.properties.ST_NM, 2);
  });

  d3.selectAll("#windMapDay2 path").attr("fill", function(d) {
    return getSubdivisionColor(d.properties.ST_NM, 3);
  });

  d3.selectAll("#windMapDay3 path").attr("fill", function(d) {
    return getSubdivisionColor(d.properties.ST_NM, 4);
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

  document.getElementById("legendDay1").innerHTML = legendHTML;
  document.getElementById("legendDay2").innerHTML = legendHTML;
  document.getElementById("legendDay3").innerHTML = legendHTML;
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
