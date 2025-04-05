// ====================
// Variables globales
// ====================
const sleepData = JSON.parse(localStorage.getItem('sleepData')) || {};
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

// Guardar datos de sueño
function saveSleepData(date, hours, comment) {
  sleepData[date] = { hours, comment };
  localStorage.setItem('sleepData', JSON.stringify(sleepData));
  loadSleepData();
  renderChart();
}

// Cargar historial de sueño
function loadSleepData() {
  const sleepList = document.getElementById('sleep-list');
  sleepList.innerHTML = '';

  Object.entries(sleepData).forEach(([date, record]) => {
    const div = document.createElement('div');
    div.textContent = `${date}: ${record.hours} horas, Comentario: ${record.comment || 'N/A'}`;

    // Botón de edición
    const editButton = document.createElement('button');
    editButton.textContent = '✏️';
    editButton.style.marginLeft = '10px';
    editButton.addEventListener('click', () => {
      editSleepEntry(date, record);
    });

    // Botón de eliminación
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '❌';
    deleteButton.style.marginLeft = '10px';
    deleteButton.addEventListener('click', () => {
      deleteSleepEntry(date);
    });

    div.appendChild(editButton);
    div.appendChild(deleteButton);
    sleepList.appendChild(div);
  });
}

// Editar un registro
function editSleepEntry(date, record) {
  // Cargar los datos en el formulario
  document.getElementById('sleep-hours').value = record.hours;
  document.getElementById('sleep-comment').value = record.comment || '';
  
  // Marcar el formulario como en modo edición
  const saveButton = document.getElementById('save-button');
  saveButton.dataset.editingDate = date;
}

// Renderizar el gráfico
function renderChart() {
  const ctx = document.getElementById('sleep-chart').getContext('2d');
  const labels = Object.keys(sleepData).sort();
  const data = labels.map(date => sleepData[date].hours);

  if (window.sleepChart) {
    window.sleepChart.destroy();
  }

  window.sleepChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Horas de sueño',
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

// Mostrar consejo de sueño
function showTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById('sleep-tip').textContent = tip;
}

// Eliminar un registro concreto
function deleteSleepEntry(date) {
  if (confirm(`¿Seguro que quieres eliminar el registro del ${date}?`)) {
    delete sleepData[date];
    localStorage.setItem('sleepData', JSON.stringify(sleepData));
    renderChart();
    loadSleepData();
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
document.getElementById('save-button').addEventListener('click', () => {
  const hours = parseFloat(document.getElementById('sleep-hours').value);
  const comment = document.getElementById('sleep-comment').value;

  if (isNaN(hours) || hours < 0 || hours > 24) {
    alert('Por favor, ingresa un número válido entre 0 y 24.');
    return;
  }

  const saveButton = document.getElementById('save-button');
  const editingDate = saveButton.dataset.editingDate;
  const date = editingDate || new Date().toISOString().split('T')[0];

  // Guardar o actualizar el registro
  sleepData[date] = { hours, comment };

  // Si se estaba editando, limpiar el estado de edición
  if (editingDate) {
    delete saveButton.dataset.editingDate;
  }

  localStorage.setItem('sleepData', JSON.stringify(sleepData));
  loadSleepData();
  renderChart();
  alert('Datos guardados correctamente.');
});
document.getElementById('view-selector').addEventListener('change', renderChart);
document.getElementById('notify-permission').addEventListener('click', requestNotificationPermission);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadSleepData();
  renderChart();
});
showTip();
