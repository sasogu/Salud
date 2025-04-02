const form = document.getElementById('form');
const pesoInput = document.getElementById('peso');
const notaInput = document.getElementById('nota');
const fechaInput = document.getElementById('fecha');
const historial = document.getElementById('historial');
const objetivoInput = document.getElementById('objetivo');
const resumen = document.getElementById('resumen');

let chart;
let periodoActual = new Date();
let vista = 'mes';

// Guardar y cargar tema
document.getElementById('tema').addEventListener('click', () => {
  document.body.classList.toggle('oscuro');
  localStorage.setItem('tema', document.body.classList.contains('oscuro') ? 'oscuro' : 'claro');
});
if (localStorage.getItem('tema') === 'oscuro') {
  document.body.classList.add('oscuro');
}

// Cargar objetivo
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
    li.textContent = `${fechaLocal}: ${registro.peso} kg${registro.nota ? ' - ' + registro.nota : ''}`;

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
  const nuevoRegistro = { fecha, peso, nota };

  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  datos.unshift(nuevoRegistro);
  localStorage.setItem('pesos', JSON.stringify(datos));

  pesoInput.value = '';
  notaInput.value = '';
  cargarHistorial();
  renderChart();
});

document.getElementById('exportarCSV').addEventListener('click', () => {
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  const csv = ["fecha,peso,nota"];
  datos.forEach(reg => {
    csv.push(`${reg.fecha},${reg.peso},"${reg.nota || ''}"`);
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
      const [fecha, peso, nota] = linea.split(",");
      return { fecha: fecha.trim(), peso: parseFloat(peso), nota: nota?.replace(/"/g, '').trim() };
    }).filter(d => d.fecha && !isNaN(d.peso));
    const datosActuales = JSON.parse(localStorage.getItem('pesos')) || [];
    const todos = [...nuevosDatos, ...datosActuales];
    localStorage.setItem('pesos', JSON.stringify(todos));
    cargarHistorial();
    renderChart();
    alert("Importación completada.");
  };
  lector.readAsText(archivo);
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
  const pesos = [];
  const notas = [];

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
    pesos.push(reg.peso);
    notas.push(reg.nota || '');
  });

  const objetivo = parseFloat(localStorage.getItem('objetivo')) || null;
  resumen.textContent = pesos.length
    ? `Promedio: ${(pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(2)} kg`
    : '';

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('grafico'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Peso (kg)',
          data: pesos,
          fill: false,
          borderColor: 'blue',
          tension: 0.1
        },
        ...(objetivo ? [{
          label: 'Objetivo',
          data: Array(pesos.length).fill(objetivo),
          borderColor: 'green',
          borderDash: [5, 5],
          pointRadius: 0
        }] : [])
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              return `Peso: ${context.raw} kg - ${notas[idx]}`;
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

cargarHistorial();
renderChart();
