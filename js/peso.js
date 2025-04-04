const form = document.getElementById('form');
const pesoInput = document.getElementById('peso');
const notaInput = document.getElementById('nota');
const fechaInput = document.getElementById('fecha');
const cinturaInput = document.getElementById('cintura');
const pechoInput = document.getElementById('pecho');
const caderaInput = document.getElementById('cadera');
const musloInput = document.getElementById('muslo');
const brazoInput = document.getElementById('brazo');
const historial = document.getElementById('historial');
const objetivoInput = document.getElementById('objetivo');
const medidaSeleccion = document.getElementById('medidaSeleccion');

let weightData = JSON.parse(localStorage.getItem('weightData')) || {};
let chart;
let periodoActual = new Date();
let vista = 'mes';

// Cambiar tema
document.getElementById('tema').addEventListener('click', () => {
  document.body.classList.toggle('oscuro');
  localStorage.setItem('tema', document.body.classList.contains('oscuro') ? 'oscuro' : 'claro');
});
if (localStorage.getItem('tema') === 'oscuro') {
  document.body.classList.add('oscuro');
}

// Guardar el objetivo
objetivoInput.value = localStorage.getItem('objetivo') || '';
objetivoInput.addEventListener('change', () => {
  localStorage.setItem('objetivo', objetivoInput.value);
  renderChart();
});

// Cargar historial
function cargarHistorial() {
  historial.innerHTML = '';
  const datos = JSON.parse(localStorage.getItem('weightData')) || {};

  Object.entries(datos).forEach(([fecha, registro]) => {
    const li = document.createElement('li');
    const medidasTexto = Object.entries(registro.measures || {})
      .filter(([_, val]) => val)
      .map(([k, v]) => `${k}: ${v} cm`).join(', ');

    li.textContent = `${fecha}: ${registro.weight} kg${registro.note ? ' - ' + registro.note : ''}${medidasTexto ? ' | ' + medidasTexto : ''}`;

    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.style.marginLeft = '10px';
    btn.onclick = () => {
      delete datos[fecha];
      localStorage.setItem('weightData', JSON.stringify(datos));
      cargarHistorial();
      renderChart();
    };

    li.appendChild(btn);
    historial.appendChild(li);
  });
}

// Guardar datos al enviar el formulario
form.addEventListener('submit', e => {
  e.preventDefault();
  const peso = parseFloat(pesoInput.value);
  const nota = notaInput.value;
  let fecha = fechaInput.value;
  if (!fecha) {
    fecha = new Date().toISOString().split('T')[0];
  }

  const medidas = {
    cintura: cinturaInput.value,
    pecho: pechoInput.value,
    cadera: caderaInput.value,
    muslo: musloInput.value,
    brazo: brazoInput.value
  };

  const nuevoRegistro = {
    weight: peso,
    note: nota,
    measures: medidas
  };

  weightData[fecha] = nuevoRegistro;
  localStorage.setItem('weightData', JSON.stringify(weightData));

  cargarHistorial();
  renderChart();
});

// Renderizar el gráfico
function renderChart() {
  const datos = JSON.parse(localStorage.getItem('weightData')) || {};
  const labels = Object.keys(datos).sort();
  const data = labels.map(fecha => datos[fecha].weight);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('grafico'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso',
        data,
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { autoSkip: true } }
      }
    }
  });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  cargarHistorial();
  renderChart();
});
