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
document.getElementById('objetivo').addEventListener('change', renderChart);

// Cargar historial
function cargarHistorial() {
  historial.innerHTML = '';
  const datos = JSON.parse(localStorage.getItem('weightData')) || {};

  // Ordenar los datos por fecha (más recientes primero)
  const registrosOrdenados = Object.entries(datos).sort(([fechaA], [fechaB]) => {
    const fechaHoraA = new Date(fechaA);
    const fechaHoraB = new Date(fechaB);
    return fechaHoraB - fechaHoraA; // Orden descendente
  });

  // Agregar los registros ordenados al historial
  registrosOrdenados.forEach(([fecha, registro]) => {
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
      // Mostrar confirmación antes de borrar
      const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el registro del ${fecha}?`);
      if (confirmDelete) {
        delete datos[fecha];
        localStorage.setItem('weightData', JSON.stringify(datos));
        cargarHistorial();
        renderChart();
      }
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

  // Mostrar popup de confirmación
  alert('Registro añadido correctamente.');
});

// Renderizar el gráfico
function renderChart() {
  const datos = JSON.parse(localStorage.getItem('weightData')) || {};
  const labels = Object.keys(datos).sort();

  // Verificar si hay datos
  if (labels.length === 0) {
    console.warn('No hay datos para mostrar en la gráfica.');
    return;
  }

  // Filtrar los datos según la vista seleccionada
  const inicioPeriodo = calcularInicioPeriodo(periodoActual, vista);
  const finPeriodo = calcularFinPeriodo(periodoActual, vista);

  const labelsFiltrados = labels.filter(fecha => {
    const fechaActual = new Date(fecha);
    return fechaActual >= inicioPeriodo && fechaActual <= finPeriodo;
  });

  // Mapear los datos filtrados
  const pesoData = labelsFiltrados.map(fecha => datos[fecha]?.weight || null);

  // Crear el array de datasets con la línea de peso
  const datasets = [
    {
      label: 'Peso (kg)',
      data: pesoData,
      borderColor: 'blue',
      fill: false
    }
  ];

  // Obtener las métricas seleccionadas
  const selectedMetrics = Array.from(document.getElementById('data-selector').selectedOptions).map(option => option.value);

  // Agregar las métricas seleccionadas al gráfico
  selectedMetrics.forEach(metric => {
    const metricData = labelsFiltrados.map(fecha => parseFloat(datos[fecha]?.measures?.[metric]) || null);
    const metricColors = {
      cintura: 'green',
      pecho: 'red',
      cadera: 'purple',
      muslo: 'orange',
      brazo: 'brown'
    };

    if (metricData.some(value => value !== null)) { // Solo agregar si hay datos válidos
      datasets.push({
        label: `${metric.charAt(0).toUpperCase() + metric.slice(1)} (cm)`,
        data: metricData,
        borderColor: metricColors[metric] || 'gray',
        fill: false
      });
    }
  });

  // Agregar la línea de objetivo si está definida
  const objetivo = parseFloat(document.getElementById('objetivo').value) || null;
  if (objetivo) {
    const objetivoData = labelsFiltrados.map(() => objetivo);
    datasets.push({
      label: 'Objetivo',
      data: objetivoData,
      borderColor: 'black',
      borderDash: [5, 5], // Línea punteada
      fill: false
    });
  }

  // Destruir la gráfica anterior si existe
  if (chart) chart.destroy();

  // Crear la nueva gráfica con los datos filtrados
  chart = new Chart(document.getElementById('grafico'), {
    type: 'line',
    data: {
      labels: labelsFiltrados,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { autoSkip: true } },
        y: { beginAtZero: true }
      }
    }
  });
}

function calcularInicioPeriodo(fecha, vista) {
  const inicio = new Date(fecha);
  if (vista === 'semana') {
    const diaSemana = inicio.getDay();
    inicio.setDate(inicio.getDate() - diaSemana); // Ir al inicio de la semana (domingo)
  } else if (vista === 'mes') {
    inicio.setDate(1); // Ir al primer día del mes
  } else if (vista === 'año') {
    inicio.setMonth(0, 1); // Ir al primer día del año
  }
  inicio.setHours(0, 0, 0, 0); // Establecer la hora al inicio del día
  return inicio;
}

function calcularFinPeriodo(fecha, vista) {
  const fin = new Date(fecha);
  if (vista === 'semana') {
    const diaSemana = fin.getDay();
    fin.setDate(fin.getDate() + (6 - diaSemana)); // Ir al final de la semana (sábado)
  } else if (vista === 'mes') {
    fin.setMonth(fin.getMonth() + 1, 0); // Ir al último día del mes
  } else if (vista === 'año') {
    fin.setMonth(11, 31); // Ir al último día del año
  }
  fin.setHours(23, 59, 59, 999); // Establecer la hora al final del día
  return fin;
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  cargarHistorial();
  renderChart();
});

document.getElementById('data-selector').addEventListener('change', renderChart);

document.getElementById('anterior').addEventListener('click', () => {
  if (vista === 'semana') {
    periodoActual.setDate(periodoActual.getDate() - 7); // Retroceder una semana
  } else if (vista === 'mes') {
    periodoActual.setMonth(periodoActual.getMonth() - 1); // Retroceder un mes
  } else if (vista === 'año') {
    periodoActual.setFullYear(periodoActual.getFullYear() - 1); // Retroceder un año
  }
  renderChart();
});

document.getElementById('siguiente').addEventListener('click', () => {
  if (vista === 'semana') {
    periodoActual.setDate(periodoActual.getDate() + 7); // Avanzar una semana
  } else if (vista === 'mes') {
    periodoActual.setMonth(periodoActual.getMonth() + 1); // Avanzar un mes
  } else if (vista === 'año') {
    periodoActual.setFullYear(periodoActual.getFullYear() + 1); // Avanzar un año
  }
  renderChart();
});

document.getElementById('hoy').addEventListener('click', () => {
  periodoActual = new Date(); // Volver a la fecha actual
  renderChart();
});

document.getElementById('vista-selector').addEventListener('change', (e) => {
  vista = e.target.value; // Cambiar la vista seleccionada
  renderChart();
});
