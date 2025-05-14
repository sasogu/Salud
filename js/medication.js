document.addEventListener("DOMContentLoaded", () => {
    const medicationForm = document.getElementById("medication-form");
    const medicationList = document.getElementById("medication-list");
  
    medicationForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const name = document.getElementById("medication-name").value;
      const time = document.getElementById("medication-time").value;
  
      if (name && time) {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <span>${name} - ${time}</span>
          <button class="mark-taken">Tomado</button>
        `;
        medicationList.appendChild(listItem);
  
        // Limpiar el formulario
        medicationForm.reset();
      }
    });
  
    medicationList.addEventListener("click", (e) => {
      if (e.target.classList.contains("mark-taken")) {
        e.target.parentElement.style.textDecoration = "line-through";
        e.target.disabled = true;
        e.target.textContent = "Tomado";
      }
    });
  });