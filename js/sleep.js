// ====================
// Variables globales
// ====================
let sleepData = JSON.parse(localStorage.getItem('sleepData')) || {};
let chart;
const tips = [
  "Duerme al menos 7-8 horas cada noche.",
  "Evita pantallas brillantes antes de acostarte.",
  "Mantén un horario de sueño constante.",
  "Evita comidas pesadas antes de dormir.",
  "Realiza actividad física regularmente.",
  "Crea un ambiente oscuro y fresco para dormir."
];

// ====================
// Funciones principales
// ====================

// Guardar horas de sueño
function saveSleepHours() {
  const hours = parseFloat(document.getElementById('sleep-hours').value);
  if (isNaN(hours) || hours < 0 || hours > 24) {
    alert('Por favor, introduce un número válido entre 0 y 24.');
    return;
  }
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  sleepData[today] = hours;
  localStorage.setItem('sleepData', JSON.stringify(sleepData));
  updateChart();
  renderSleepList();
  alert('Horas de sueño guardadas.');
}

// Actualizar gráfico
function updateChart() {
  const view = document.getElementById('view-selector').value;
  const labels = [];
  const data = [];
  const now = new Date();

  if (view === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      labels.push(key.slice(5)); // MM-DD
      data.push(sleepData[key] || 0);
    }
  } else if (view === 'month') {
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      labels.push(key.slice(5));
      data.push(sleepData[key] || 0);
    }
  } else if (view === 'year') {
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = month.toISOString().slice(0, 7); // YYYY-MM
      labels.push(key);
      const sum = Object.keys(sleepData)
        .filter(date => date.startsWith(key))
        .reduce((acc, date) => acc + sleepData[date], 0);
      data.push(sum);
    }
  }

  if (chart) chart.destroy();

  const ctx = document.getElementById('sleep-chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Horas de sueño',
        data,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Mostrar consejo de sueño
function showTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById('sleep-tip').textContent = tip;
}

// Exportar datos
function exportData() {
  const blob = new Blob([JSON.stringify(sleepData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sleep-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Importar datos
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const importedData = JSON.parse(e.target.result);
      sleepData = importedData;
      localStorage.setItem('sleepData', JSON.stringify(sleepData));
      updateChart();
      renderSleepList();
      alert('Datos importados correctamente.');
    } catch {
      alert('Archivo no válido.');
    }
  };
  reader.readAsText(file);
}

// Renderizar listado de registros
function renderSleepList() {
  const listContainer = document.getElementById('sleep-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  const sortedDates = Object.keys(sleepData).sort((a, b) => b.localeCompare(a)); // Más recientes primero

  sortedDates.forEach(date => {
    const item = document.createElement('div');
    item.className = 'sleep-item';
    item.innerHTML = `
      <span>${date}: ${sleepData[date]} h</span>
      <button onclick="deleteSleepEntry('${date}')">Eliminar</button>
    `;
    listContainer.appendChild(item);
  });
}

// Eliminar un registro concreto
function deleteSleepEntry(date) {
  if (confirm(`¿Seguro que quieres eliminar el registro del ${date}?`)) {
    delete sleepData[date];
    localStorage.setItem('sleepData', JSON.stringify(sleepData));
    updateChart();
    renderSleepList();
  }
}

// Pedir permiso de notificaciones
function requestNotificationPermission() {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      scheduleDailyNotification();
      alert('Recordatorios activados.');
    } else {
      alert('No se pudo activar las notificaciones.');
    }
  });
}

// Programar notificación diaria
function scheduleDailyNotification() {
  const now = new Date();
  const target = new Date();
  target.setHours(21, 0, 0, 0); // 21:00 horas
  if (now > target) target.setDate(target.getDate() + 1);

  const timeout = target - now;
  setTimeout(() => {
    new Notification('Recuerda registrar tus horas de sueño 🛏️');
    scheduleDailyNotification(); // Reprogramar para el siguiente día
  }, timeout);
}

// ====================
// Eventos
// ====================
document.getElementById('save-button').addEventListener('click', saveSleepHours);
document.getElementById('view-selector').addEventListener('change', updateChart);
document.getElementById('export-button').addEventListener('click', exportData);
document.getElementById('import-button').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', importData);
document.getElementById('notify-permission').addEventListener('click', requestNotificationPermission);

// Inicializar
updateChart();
renderSleepList();
showTip();
