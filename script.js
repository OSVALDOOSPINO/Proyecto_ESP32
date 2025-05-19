function enviar() {
  const boton = document.querySelector("button");
  const resultado = document.getElementById("resultado");

  boton.disabled = true;
  boton.innerText = "Procesando...";
  resultado.className = ""; 
  resultado.innerHTML = ""; 

  const datos = {
    "00": document.getElementById("s00").value,
    "01": document.getElementById("s01").value,
    "10": document.getElementById("s10").value,
    "11": document.getElementById("s11").value
  };

  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tabla: datos })
  })
  .then(res => res.json())
  .then(data => {
    // Detectamos si hubo un error
    const esError = data.expresion === "Error";
    resultado.className = esError ? "error" : "exito";

    resultado.innerHTML = `
      <strong>Tabla:</strong><br>
      00 = ${data.tabla["00"]}<br>
      01 = ${data.tabla["01"]}<br>
      10 = ${data.tabla["10"]}<br>
      11 = ${data.tabla["11"]}<br><br>
      <strong>Compuerta:</strong> ${data.compuerta}<br>
      <strong>Expresión:</strong> ${data.expresion}<br>
      <strong>Descripción:</strong><br>${data.descripcion}
    `;
  })
  .catch(err => {
    resultado.className = "error";
    resultado.innerHTML = "Error al conectar con el ESP32.";
    console.error(err);
  })
  .finally(() => {
    boton.disabled = false;
    boton.innerText = "Generar expresión";
  });
}
