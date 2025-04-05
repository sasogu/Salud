let tensionChart; // Variable global para la gráfica

function interpretar(sis, dia) {
  if (sis < 90 || dia < 60) return "Hipotensión";
  if (sis <= 120 && dia <= 80) return "Normal";
  if (sis <= 139 || dia <= 89) return "Elevada";
  if (sis <= 159 || dia <= 99) return "Hipertensión 1";
  return "Hipertensión 2";
}

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();
  const sis = parseInt(document.getElementById("sistolica").value);
  const dia = parseInt(document.getElementById("diastolica").value);
  const pulso = parseInt(document.getElementById("pulso").value);
  const comentario = document.getElementById("comentario").value;
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString();
  const hora = ahora.toLocaleTimeString();
  const resultado = interpretar(sis, dia);

  agregarFila(fecha, hora, sis, dia, resultado, pulso, comentario);
  guardarDatos(); // Guardar los datos en LocalStorage
  renderChart(); // Actualizar la gráfica

  e.target.reset();
});

function agregarFila(fecha, hora, sis, dia, resultado, pulso, comentario) {
  const tbody = document.querySelector("#tabla tbody");

  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>${fecha}</td>
    <td>${hora}</td>
    <td>${sis}</td>
    <td>${dia}</td>
    <td>${resultado}</td>
    <td>${pulso}</td>
    <td>${comentario}</td>
    <td class="acciones"><button onclick="eliminarFila(this)">Eliminar</button></td>
  `;
  tbody.appendChild(fila);
}

function eliminarFila(boton) {
  const fila = boton.parentNode.parentNode;
  fila.remove();
  guardarDatos(); // Guardar los datos actualizados en LocalStorage
  renderChart(); // Actualizar la gráfica
}

function guardarDatos() {
  const filas = document.querySelectorAll("#tabla tbody tr");
  const datos = Array.from(filas).map((fila) => {
    const celdas = fila.querySelectorAll("td");
    return {
      fecha: celdas[0].textContent,
      hora: celdas[1].textContent,
      sis: celdas[2].textContent,
      dia: celdas[3].textContent,
      resultado: celdas[4].textContent,
      pulso: celdas[5].textContent,
      comentario: celdas[6].textContent,
    };
  });
  localStorage.setItem("tensionDatos", JSON.stringify(datos));
}

function cargarDatos() {
  const datos = JSON.parse(localStorage.getItem("tensionDatos")) || [];
  datos.forEach(({ fecha, hora, sis, dia, resultado, pulso, comentario }) => {
    agregarFila(fecha, hora, sis, dia, resultado, pulso, comentario);
  });
}

// Renderizar la gráfica
function renderChart() {
  const ctx = document.getElementById("tension-chart").getContext("2d");

  const datos = JSON.parse(localStorage.getItem("tensionDatos")) || [];
  const labels = datos.map((d) => `${d.fecha} ${d.hora}`);
  const sistolica = datos.map((d) => parseInt(d.sis));
  const diastolica = datos.map((d) => parseInt(d.dia));
  const pulso = datos.map((d) => parseInt(d.pulso));

  if (tensionChart) {
    tensionChart.destroy();
  }

  tensionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Sistólica",
          data: sistolica,
          borderColor: "red",
          fill: false,
        },
        {
          label: "Diastólica",
          data: diastolica,
          borderColor: "blue",
          fill: false,
        },
        {
          label: "Pulso",
          data: pulso,
          borderColor: "green",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  renderChart();
});
