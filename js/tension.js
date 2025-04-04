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
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString();
  const hora = ahora.toLocaleTimeString();
  const resultado = interpretar(sis, dia);

  agregarFila(fecha, hora, sis, dia, resultado);
  guardarDatos(); // Guardar los datos en LocalStorage

  e.target.reset();
});

function agregarFila(fecha, hora, sis, dia, resultado) {
  const tbody = document.querySelector("#tabla tbody");

  // Comprobar si ya existe una fila con misma fecha y hora
  const existe = Array.from(tbody.rows).some((fila) => {
    return fila.cells[0].textContent === fecha && fila.cells[1].textContent === hora;
  });

  if (existe) {
    console.warn(`Registro duplicado: ${fecha} ${hora}`);
    return; // no se añade
  }

  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>${fecha}</td>
    <td>${hora}</td>
    <td>${sis}</td>
    <td>${dia}</td>
    <td>${resultado}</td>
    <td class="acciones"><button onclick="eliminarFila(this)">Eliminar</button></td>
  `;
  tbody.appendChild(fila);
}

function eliminarFila(boton) {
  const fila = boton.parentNode.parentNode;
  fila.remove();
  guardarDatos(); // Guardar los datos actualizados en LocalStorage
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
    };
  });
  localStorage.setItem("tensionDatos", JSON.stringify(datos));
}

function cargarDatos() {
  const datos = JSON.parse(localStorage.getItem("tensionDatos")) || [];
  datos.forEach(({ fecha, hora, sis, dia, resultado }) => {
    agregarFila(fecha, hora, sis, dia, resultado);
  });
}

// Cargar los datos al cargar la página
document.addEventListener("DOMContentLoaded", cargarDatos);

function exportarCSV() {
  const filas = document.querySelectorAll("#tabla tbody tr");
  let csv = "Fecha,Hora,Sistólica,Diastólica,Resultado\n";

  filas.forEach((fila) => {
    const celdas = fila.querySelectorAll("td");
    const datos = Array.from(celdas).slice(0, 5).map((td) => td.textContent);
    csv += datos.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "tension_arterial.csv");
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importarCSV() {
  const input = document.getElementById("archivoCSV");
  if (!input.files.length) return alert("Selecciona un archivo CSV.");

  const archivo = input.files[0];
  const lector = new FileReader();

  lector.onload = function (e) {
    const lineas = e.target.result.split("\n").map((linea) => linea.trim()).filter((l) => l);
    for (let i = 1; i < lineas.length; i++) {
      const [fecha, hora, sis, dia, resultado] = lineas[i].split(",");
      if (fecha && hora && sis && dia && resultado) {
        agregarFila(fecha, hora, sis, dia, resultado);
      }
    }
    guardarDatos(); // Guardar los datos importados en LocalStorage
  };

  lector.readAsText(archivo);
}

function saveTensionData(date, systolic, diastolic, result) {
  const tensionData = JSON.parse(localStorage.getItem('tensionData')) || {};
  tensionData[date] = { systolic, diastolic, result };
  localStorage.setItem('tensionData', JSON.stringify(tensionData));
}
