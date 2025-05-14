// Función para obtener los datos de las cuatro secciones
function getBackupData() {
    const sleepData = JSON.parse(localStorage.getItem('sleepData')) || {};
    const weightData = JSON.parse(localStorage.getItem('weightData')) || {};
    const tensionData = JSON.parse(localStorage.getItem('tensionData')) || {};
    const medicationData = JSON.parse(localStorage.getItem('medicationData')) || [];

    return {
        sleep: sleepData,
        weight: weightData,
        tension: tensionData,
        medication: medicationData,
    };
}

// Función para exportar la copia de seguridad
function exportBackup() {
    const sleepData = JSON.parse(localStorage.getItem('sleepData')) || {};
    const weightData = JSON.parse(localStorage.getItem('weightData')) || {};
    const tensionData = JSON.parse(localStorage.getItem('tensionDatos')) || {};
    const medicationData = JSON.parse(localStorage.getItem('medicationData')) || [];

    const backupData = {
        sleep: sleepData,
        weight: weightData,
        tension: tensionData,
        medication: medicationData,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();

    URL.revokeObjectURL(url);
}

// Función para importar la copia de seguridad
function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const backupData = JSON.parse(event.target.result);

            if (backupData.sleep && typeof backupData.sleep === 'object') {
                localStorage.setItem('sleepData', JSON.stringify(backupData.sleep));
            }
            if (backupData.weight && typeof backupData.weight === 'object') {
                localStorage.setItem('weightData', JSON.stringify(backupData.weight));
            }
            if (backupData.tension && typeof backupData.tension === 'object') {
                localStorage.setItem('tensionDatos', JSON.stringify(backupData.tension));
            }
            if (backupData.medication && Array.isArray(backupData.medication)) {
                localStorage.setItem('medicationData', JSON.stringify(backupData.medication));
            }

            alert('Copia de seguridad restaurada correctamente.');
            location.reload(); // Recargar la página para reflejar los cambios
        } catch (error) {
            console.error('Error al importar la copia de seguridad:', error);
            alert('El archivo de copia de seguridad no es válido.');
        }
    };

    reader.readAsText(file);
}

// Configuración de los botones de copia de seguridad
function setupBackupButtons() {
    document.getElementById('backup-button').addEventListener('click', exportBackup);
    document.getElementById('restore-button').addEventListener('click', () => {
        const fileInput = document.getElementById('restore-file');
        fileInput.click();
        fileInput.onchange = null; // Eliminar eventos anteriores
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) {
                importBackup(file);
            }
        };
    });
}

// Llamar a la configuración al cargar la página
document.addEventListener('DOMContentLoaded', setupBackupButtons);