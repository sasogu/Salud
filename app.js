const form = document.getElementById('form');
const pesoInput = document.getElementById('peso');
const historial = document.getElementById('historial');

function cargarHistorial() {
  historial.innerHTML = '';
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  datos.forEach(registro => {
    const li = document.createElement('li');
    li.textContent = `${registro.fecha}: ${registro.peso} kg`;
    historial.appendChild(li);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const peso = parseFloat(pesoInput.value);
  const fecha = new Date().toLocaleDateString();
  const nuevoRegistro = { fecha, peso };

  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  datos.unshift(nuevoRegistro);
  localStorage.setItem('pesos', JSON.stringify(datos));

  pesoInput.value = '';
  cargarHistorial();
});

cargarHistorial();

// Exportar historial a CSV
document.getElementById('exportarCSV').addEventListener('click', () => {
  const datos = JSON.parse(localStorage.getItem('pesos')) || [];
  const csv = ["fecha,peso"];
  datos.forEach(reg => {
    csv.push(`${reg.fecha},${reg.peso}`);
  });
  const blob = new Blob([csv.join("\\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "historial_peso.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Importar CSV
document.getElementById('importarCSV').addEventListener('change', e => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (event) => {
    const contenido = event.target.result;
    const lineas = contenido.split("\\n").slice(1); // Ignorar cabecera
    const nuevosDatos = lineas.map(linea => {
      const [fecha, peso] = linea.split(",");
      return { fecha: fecha.trim(), peso: parseFloat(peso) };
    }).filter(d => d.fecha && !isNaN(d.peso));

    const datosActuales = JSON.parse(localStorage.getItem('pesos')) || [];
    const todos = [...nuevosDatos, ...datosActuales];
    localStorage.setItem('pesos', JSON.stringify(todos));
    cargarHistorial();
    alert("Importación completada.");
  };
  lector.readAsText(archivo);
});
