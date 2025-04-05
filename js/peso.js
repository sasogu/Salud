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

    // Botón de edición
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.style.marginLeft = '10px';
    editBtn.onclick = () => {
      editarRegistro(fecha, registro);
    };

    // Botón de eliminación
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.onclick = () => {
      delete datos[fecha];
      localStorage.setItem('weightData', JSON.stringify(datos));
      cargarHistorial();
      renderChart();
    };

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    historial.appendChild(li);
  });
}

// Editar un registro
function editarRegistro(fecha, registro) {
  // Cargar los datos en el formulario
  fechaInput.value = fecha;
  pesoInput.value = registro.weight;
  notaInput.value = registro.note || '';
  cinturaInput.value = registro.measures?.cintura || '';
  pechoInput.value = registro.measures?.pecho || '';
  caderaInput.value = registro.measures?.cadera || '';
  musloInput.value = registro.measures?.muslo || '';
  brazoInput.value = registro.measures?.brazo || '';

  // Marcar el formulario como en modo edición
  form.dataset.editingDate = fecha;
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

  // Verificar si se está editando un registro
  const editingDate = form.dataset.editingDate;
  if (editingDate) {
    // Actualizar el registro existente
    delete weightData[editingDate]; // Eliminar el registro anterior si la fecha cambió
    weightData[fecha] = nuevoRegistro;

    // Limpiar el estado de edición
    delete form.dataset.editingDate;
  } else {
    // Agregar un nuevo registro
    weightData[fecha] = nuevoRegistro;
  }

  localStorage.setItem('weightData', JSON.stringify(weightData));

  cargarHistorial();
  renderChart();
  form.reset(); // Limpiar el formulario
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
