document.addEventListener("DOMContentLoaded", () => {
    const medicationForm = document.getElementById("medication-form");
    const medicationList = document.getElementById("medication-list");
    const medicationTypeSelect = document.getElementById("medication-type");
    const medicationDoseInput = document.getElementById("medication-dose");
    const medicationDateInput = document.getElementById("medication-date");
    const medicationTimeInput = document.getElementById("medication-time");
    const newMedicationTypeInput = document.getElementById('new-medication-type');
    const addTypeButton = document.getElementById('add-type-button');

    // Tipos iniciales por defecto
    const defaultTypes = ["Tensión", "Ibuprofeno", "Aspirina"];

    // Cargar tipos de medicación desde localStorage o usar los predeterminados
    function loadMedicationTypes() {
        let types = JSON.parse(localStorage.getItem('medicationTypes'));
        if (!types) {
            types = defaultTypes;
            localStorage.setItem('medicationTypes', JSON.stringify(types));
        }
        medicationTypeSelect.innerHTML = '';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            medicationTypeSelect.appendChild(option);
        });
    }

    // Añadir nuevo tipo de medicación
    function addMedicationType() {
        const newType = newMedicationTypeInput.value.trim();
        if (newType) {
            let types = JSON.parse(localStorage.getItem('medicationTypes')) || defaultTypes;
            if (!types.includes(newType)) {
                types.push(newType);
                localStorage.setItem('medicationTypes', JSON.stringify(types));
                loadMedicationTypes();
                medicationTypeSelect.value = newType;
            }
            newMedicationTypeInput.value = '';
        }
    }

    addTypeButton.addEventListener('click', addMedicationType);

    // Establecer la fecha y hora actuales por defecto
    const now = new Date();
    medicationDateInput.value = now.toISOString().split("T")[0]; // YYYY-MM-DD
    medicationTimeInput.value = now.toTimeString().split(":").slice(0, 2).join(":"); // HH:MM

    // Cargar tipos al iniciar
    loadMedicationTypes();

    // Cargar lista de medicaciones
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
            saveMedications();
        }
        if (e.target.classList.contains("delete-item")) {
            const listItem = e.target.parentElement;
            medicationList.removeChild(listItem);
            saveMedications();
        }
    });

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

    function formatDate(date) {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
    }
});