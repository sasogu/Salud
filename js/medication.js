document.addEventListener("DOMContentLoaded", () => {
    const medicationForm = document.getElementById("medication-form");
    const medicationList = document.getElementById("medication-list");
    const medicationTypeSelect = document.getElementById("medication-type");
    const medicationDateInput = document.getElementById("medication-date");
    const medicationTimeInput = document.getElementById("medication-time");

    // Establecer la fecha y hora actuales por defecto
    const now = new Date();
    medicationDateInput.value = now.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    medicationTimeInput.value = now.toTimeString().split(":").slice(0, 2).join(":"); // Formato HH:MM

    // Lista inicial de tipos de medicación
    const initialMedicationTypes = ["Paracetamol", "Ibuprofeno", "Aspirina"];
    initialMedicationTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        medicationTypeSelect.appendChild(option);
    });

    // Cargar datos desde localStorage
    loadMedications();

    medicationForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const type = medicationTypeSelect.value;
        const time = medicationTimeInput.value;
        const date = medicationDateInput.value;

        if (type && time && date) {
            const listItem = createMedicationListItem(type, date, time);
            medicationList.appendChild(listItem);

            // Guardar en localStorage
            saveMedications();

            // Limpiar el formulario
            medicationForm.reset();

            // Restablecer la fecha y hora por defecto
            medicationDateInput.value = now.toISOString().split("T")[0];
            medicationTimeInput.value = now.toTimeString().split(":").slice(0, 2).join(":");
        }
    });

    medicationList.addEventListener("click", (e) => {
        if (e.target.classList.contains("mark-taken")) {
            e.target.parentElement.style.textDecoration = "line-through";
            e.target.disabled = true;
            e.target.textContent = "Tomado";

            // Guardar cambios en localStorage
            saveMedications();
        }

        if (e.target.classList.contains("delete-item")) {
            const listItem = e.target.parentElement;
            medicationList.removeChild(listItem);

            // Guardar cambios en localStorage
            saveMedications();
        }
    });

    // Función para añadir un nuevo tipo de medicación al seleccionable
    const addTypeButton = document.getElementById("add-type-button");
    const newTypeInput = document.getElementById("new-medication-type");

    addTypeButton.addEventListener("click", () => {
        const newType = newTypeInput.value.trim();
        if (newType) {
            const option = document.createElement("option");
            option.value = newType;
            option.textContent = newType;
            medicationTypeSelect.appendChild(option);
            newTypeInput.value = ""; // Limpiar el campo de entrada
        }
    });

    // Función para crear un elemento de la lista
    function createMedicationListItem(type, date, time) {
        const formattedDate = formatDate(date); // Formatear la fecha
        const listItem = document.createElement("li");
        listItem.dataset.dateTime = `${date}T${time}`; // Guardar fecha y hora como atributo de datos
        listItem.innerHTML = `
            <span>${type} - ${formattedDate} - ${time}</span>
            <button class="mark-taken">Tomado</button>
            <button class="delete-item">Eliminar</button>
        `;
        return listItem;
    }

    // Función para guardar la lista en localStorage
    function saveMedications() {
        const medications = Array.from(medicationList.children).map((item) => {
            return {
                type: item.querySelector("span").textContent.split(" - ")[0],
                date: item.dataset.dateTime.split("T")[0],
                time: item.dataset.dateTime.split("T")[1],
                taken: item.querySelector(".mark-taken").disabled,
            };
        });
        localStorage.setItem("medicationData", JSON.stringify(medications));
    }

    // Función para cargar la lista desde localStorage
    function loadMedications() {
        const medications = JSON.parse(localStorage.getItem("medicationData")) || [];

        // Ordenar las medicaciones por fecha y hora (más reciente primero)
        medications.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA; // Ordenar de más reciente a más antigua
        });

        medications.forEach((medication) => {
            const listItem = createMedicationListItem(medication.type, medication.date, medication.time);
            if (medication.taken) {
                listItem.style.textDecoration = "line-through";
                listItem.querySelector(".mark-taken").disabled = true;
                listItem.querySelector(".mark-taken").textContent = "Tomado";
            }
            medicationList.appendChild(listItem);
        });
    }

    // Función para formatear la fecha en formato dd-mm-aaaa
    function formatDate(date) {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
    }
});