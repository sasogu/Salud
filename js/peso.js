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
const resumen = document.getElementById('resumen');
const medidaSeleccion = document.getElementById('medidaSeleccion');

let chart;
let periodoActual = new Date();
let vista = 'mes';

document.getElementById('tema').addEventListener('click', () => {
  document.body.classList.toggle('oscuro');
  localStorage.setItem('tema', document.body.classList.contains('oscuro') ? 'oscuro' : 'claro');
});
if (localStorage.getItem('tema') === 'oscuro') {
  document.body.classList.add('oscuro');
}

objetivoInput.value = localStorage.getItem('objetivo') || '';
objetivoInput.addEventListener('change', () => {
  localStorage.setItem('objetivo', objetivoInput.value);
  renderChart();
});

function cargarHistorial() {
  historial.innerHTML = '';
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];

  datos.forEach((registro, index) => {
    const li = document.createElement('li');
    const f = new Date(registro.fecha);
    const fechaLocal = f.toLocaleDateString();
    const hora = registro.hora || ''; // Mostrar la hora si está disponible
    const medidas = registro.medidas || {};
    const medidasTexto = Object.entries(medidas)
      .filter(([_, val]) => val)
      .map(([k, v]) => `${k}: ${v} cm`).join(', ');
    li.textContent = `${fechaLocal} ${hora}: ${registro.peso} kg${registro.nota ? ' - ' + registro.nota : ''}${medidasTexto ? ' | ' + medidasTexto : ''}`;

    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.style.marginLeft = '10px';
    btn.onclick = () => {
      if (confirm('¿Eliminar este registro?')) {
        datos.splice(index, 1);
        localStorage.setItem('pesos', JSON.stringify(datos));
        cargarHistorial();
        renderChart();
      }
    };

    li.appendChild(btn);
    historial.appendChild(li);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const peso = parseFloat(pesoInput.value);
  const nota = notaInput.value;
  let fecha = fechaInput.value;
  if (!fecha) {
    fecha = new Date().toISOString().split('T')[0];
  } else {
    const f = new Date(fecha);
    fecha = f.toISOString().split('T')[0];
  }

  const ahora = new Date();
  const hora = ahora.toLocaleTimeString(); // Obtener la hora actual

  const nuevoRegistro = {
    fecha,
    hora, // Guardar la hora
    peso,
    nota,
    medidas: {
      cintura: cinturaInput.value,
      pecho: pechoInput.value,
      cadera: caderaInput.value,
      muslo: musloInput.value,
      brazo: brazoInput.value
    }
  };

  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  datos.unshift(nuevoRegistro);
  localStorage.setItem('pesos', JSON.stringify(datos));

  pesoInput.value = '';
  notaInput.value = '';
  fechaInput.value = '';
  cinturaInput.value = '';
  pechoInput.value = '';
  caderaInput.value = '';
  musloInput.value = '';
  brazoInput.value = '';
  cargarHistorial();
  renderChart();
});

document.getElementById('exportarCSV').addEventListener('click', () => {
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  const csv = ["fecha,hora,peso,nota,cintura,pecho,cadera,muslo,brazo"];
  datos.forEach(reg => {
    csv.push(`${reg.fecha},${reg.hora || ''},${reg.peso},"${reg.nota || ''}",${reg.medidas?.cintura || ""},${reg.medidas?.pecho || ""},${reg.medidas?.cadera || ""},${reg.medidas?.muslo || ""},${reg.medidas?.brazo || ""}`);
  });
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historial_peso.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importarCSV').addEventListener('change', e => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (event) => {
    const contenido = event.target.result;
    const lineas = contenido.split("\n").slice(1);
    const nuevosDatos = lineas.map(linea => {
      const [fecha, hora, peso, nota, cintura, pecho, cadera, muslo, brazo] = linea.split(",");
      return {
        fecha: fecha.trim(),
        hora: hora?.trim(), // Procesar la hora
        peso: parseFloat(peso),
        nota: nota?.replace(/\"/g, '').trim(),
        medidas: { cintura, pecho, cadera, muslo, brazo }
      };
    }).filter(d => d.fecha && !isNaN(d.peso));

    const datosActuales = JSON.parse(localStorage.getItem('pesos')) || [];
    const fechasExistentes = new Set(datosActuales.map(d => d.fecha));
    const duplicados = nuevosDatos.filter(d => fechasExistentes.has(d.fecha));

    if (duplicados.length > 0) {
      const opcion = confirm("Hay registros con fechas ya existentes. ¿Quieres sobrescribirlos?");
      if (opcion) {
        const datosSinDuplicados = datosActuales.filter(d => !duplicados.some(n => n.fecha === d.fecha));
        const todos = [...nuevosDatos, ...datosSinDuplicados];
        localStorage.setItem('pesos', JSON.stringify(todos));
      } else {
        const nuevosSinDuplicados = nuevosDatos.filter(d => !fechasExistentes.has(d.fecha));
        const todos = [...nuevosSinDuplicados, ...datosActuales];
        localStorage.setItem('pesos', JSON.stringify(todos));
      }
    } else {
      const todos = [...nuevosDatos, ...datosActuales];
      localStorage.setItem('pesos', JSON.stringify(todos));
    }

    cargarHistorial();
    renderChart();
    alert("Importación completada.");
  };
  lector.readAsText(archivo);
});

medidaSeleccion.addEventListener('change', () => {
  renderChart();
});

document.getElementById('vista').addEventListener('change', e => {
  vista = e.target.value;
  renderChart();
});

document.getElementById('prev').addEventListener('click', () => {
  ajustarPeriodo(-1);
  renderChart();
});

document.getElementById('next').addEventListener('click', () => {
  ajustarPeriodo(1);
  renderChart();
});

document.getElementById('hoy').addEventListener('click', () => {
  periodoActual = new Date();
  renderChart();
});

function ajustarPeriodo(valor) {
  if (vista === 'semana') {
    periodoActual.setDate(periodoActual.getDate() + valor * 7);
  } else if (vista === 'mes') {
    periodoActual.setMonth(periodoActual.getMonth() + valor);
  } else if (vista === 'anio') {
    periodoActual.setFullYear(periodoActual.getFullYear() + valor);
  }
}

function renderChart() {
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  const labels = [];
  const datasets = [];

  const inicio = new Date(periodoActual);
  let fin = new Date(periodoActual);

  if (vista === 'semana') {
    inicio.setDate(inicio.getDate() - inicio.getDay());
    fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
  } else if (vista === 'mes') {
    inicio.setDate(1);
    fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  } else if (vista === 'anio') {
    inicio.setMonth(0, 1);
    fin = new Date(inicio.getFullYear(), 11, 31);
  }

  const datosFiltrados = datos.filter(reg => {
    const fecha = new Date(reg.fecha);
    return fecha >= inicio && fecha <= fin;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  datosFiltrados.forEach(reg => {
    labels.push(reg.fecha);
  });

  const medidasSeleccionadas = Array.from(medidaSeleccion.selectedOptions).map(opt => opt.value);

  medidasSeleccionadas.forEach(medida => {
    const valores = medida === 'peso'
      ? datosFiltrados.map(reg => reg.peso)
      : datosFiltrados.map(reg => parseFloat(reg.medidas?.[medida]) || null);

    datasets.push({
      label: medida.charAt(0).toUpperCase() + medida.slice(1),
      data: valores,
      fill: false,
      borderColor: getRandomColor(),
      tension: 0.1
    });
  });

  // Agregar línea del objetivo
  const objetivo = parseFloat(objetivoInput.value);
  if (!isNaN(objetivo)) {
    datasets.push({
      label: 'Objetivo',
      data: Array(labels.length).fill(objetivo), // Línea horizontal
      borderColor: 'red',
      borderDash: [5, 5], // Línea discontinua
      fill: false,
      tension: 0.1
    });
  }

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('grafico'), {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { autoSkip: true }
        }
      }
    }
  });
}

function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

// Seleccionar "Peso" por defecto en el select de medidaSeleccion
document.addEventListener('DOMContentLoaded', () => {
  const pesoOption = medidaSeleccion.querySelector('option[value="peso"]');
  if (pesoOption) {
    pesoOption.selected = true; // Seleccionar "Peso" por defecto
  }
  renderChart(); // Renderizar el gráfico con la selección inicial
});

cargarHistorial();
renderChart();
