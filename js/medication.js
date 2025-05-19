document.addEventListener("DOMContentLoaded", () => {
    const medicationForm = document.getElementById("medication-form");
    const medicationList = document.getElementById("medication-list");
    const medicationTypeSelect = document.getElementById("medication-type");
    const medicationDoseInput = document.getElementById("medication-dose");
    const medicationDateInput = document.getElementById("medication-date");
    const medicationTimeInput = document.getElementById("medication-time");

    // Establecer la fecha y hora actuales por defecto
    const now = new Date();
    medicationDateInput.value = now.toISOString().split("T")[0]; // YYYY-MM-DD
    medicationTimeInput.value = now.toTimeString().split(":").slice(0, 2).join(":"); // HH:MM

    // Lista inicial de tipos de medicación
    const initialMedicationTypes = ["Tensión", "Ibuprofeno", "Aspirina"];
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
        const dose = medicationDoseInput.value.trim();
        const time = medicationTimeInput.value;
        const date = medicationDateInput.value;

        if (type && dose && time && date) {
            const listItem = createMedicationListItem(type, dose, date, time);
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

    // Añadir nuevo tipo de medicación al select
    const addTypeButton = document.getElementById("add-type-button");
    const newTypeInput = document.getElementById("new-medication-type");
    addTypeButton.addEventListener("click", () => {
        const newType = newTypeInput.value.trim();
        if (newType) {
            const option = document.createElement("option");
            option.value = newType;
            option.textContent = newType;
            medicationTypeSelect.appendChild(option);
            newTypeInput.value = "";
        }
    });

    // Crear elemento de la lista
    function createMedicationListItem(type, dose, date, time) {
        const formattedDate = formatDate(date);
        const listItem = document.createElement("li");
        listItem.dataset.dateTime = `${date}T${time}`;
        listItem.innerHTML = `
            <span>${type} - ${dose} - ${formattedDate} - ${time}</span>
            <button class="mark-taken">Tomado</button>
            <button class="delete-item">Eliminar</button>
        `;
        return listItem;
    }

    // Guardar lista en localStorage
    function saveMedications() {
        const medications = Array.from(medicationList.children).map((item) => {
            const [type, dose] = item.querySelector("span").textContent.split(" - ");
            return {
                type,
                dose,
                date: item.dataset.dateTime.split("T")[0],
                time: item.dataset.dateTime.split("T")[1],
                taken: item.querySelector(".mark-taken").disabled,
            };
        });
        localStorage.setItem("medicationData", JSON.stringify(medications));
    }

    // Cargar lista desde localStorage
    function loadMedications() {
        const medications = JSON.parse(localStorage.getItem("medicationData")) || [];
        medications.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
        });
        medications.forEach((medication) => {
            const listItem = createMedicationListItem(medication.type, medication.dose, medication.date, medication.time);
            if (medication.taken) {
                listItem.style.textDecoration = "line-through";
                listItem.querySelector(".mark-taken").disabled = true;
                listItem.querySelector(".mark-taken").textContent = "Tomado";
            }
            medicationList.appendChild(listItem);
        });
    }

    // Formatear fecha a dd-mm-aaaa
    function formatDate(date) {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
    }
});