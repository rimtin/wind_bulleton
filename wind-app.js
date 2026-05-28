// wind-app.js

window.windStateCentroids = {};

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
    item.areas.forEach(area => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${item.state}</td>
        <td>${area}</td>
        <td>${createWindDropdown()}</td>
        <td>${createWindDropdown()}</td>
        <td>${createWindDropdown()}</td>
      `;

      tbody.appendChild(tr);
    });
  });
}

function drawWindMap(svgId) {
  const svg = d3.select(svgId);
  svg.selectAll("*").remove();

  const projection = d3.geoMercator()
    .scale(850)
    .center([89.8, 21.5])
    .translate([430, 290]);

  const path = d3.geoPath().projection(projection);

  d3.json("https://raw.githubusercontent.com/udit-001/india-maps-data/refs/heads/main/topojson/india.json")
    .then(data => {
      const features = topojson.feature(data, data.objects.states).features;

      svg.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#333")
        .attr("stroke-width", 1);

      updateWindMapColors();
    })
    .catch(error => {
      console.error("Map loading error:", error);
      alert("Wind map could not load.");
    });
}

function getStateColor(stateCode, dayIndex) {
  const rows = document.querySelectorAll("#wind-table-body tr");

  for (const row of rows) {
    const state = row.children[0].textContent.trim();

    if (state === stateCode) {
      const selected = row.children[dayIndex].querySelector("select").value;
      return windColors[selected] || "#e0e0e0";
    }
  }

  return "#e0e0e0";
}

function updateWindMapColors() {
  const stateCodeMap = {
    "Maharashtra": "MH",
    "Madhya Pradesh": "MP",
    "Rajasthan": "RJ",
    "Gujarat": "GJ",
    "Andhra Pradesh": "AP",
    "Karnataka": "KA",
    "Tamil Nadu": "TN"
  };

  d3.selectAll("#windMapDay1 path")
    .attr("fill", function(d) {
      const stateName = d.properties.st_nm;
      const code = stateCodeMap[stateName];
      return code ? getStateColor(code, 2) : "#e0e0e0";
    });

  d3.selectAll("#windMapDay2 path")
    .attr("fill", function(d) {
      const stateName = d.properties.st_nm;
      const code = stateCodeMap[stateName];
      return code ? getStateColor(code, 3) : "#e0e0e0";
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
}

function downloadPDF() {
  const element = document.getElementById("pdf-area");

  const opt = {
    margin: 0.3,
    filename: "Wind_Forecast_Bulletin.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
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
};
