// ————— Configuración inicial —————
let variableCount = 2;
const minVars = 2, maxVars = 6;
let varNames = ['A','B'];

const tableContainer = document.getElementById('table-container');
const addVarBtn     = document.getElementById('add-var');
const removeVarBtn  = document.getElementById('remove-var');
const genBtn        = document.getElementById('generate');
const outputDiv     = document.getElementById('output');
const gatesDiv      = document.getElementById('gates-info');

const GATE_PATTERNS = {
  AND:  { bits: ['0','0','0','1'], expr: 'S = A·B' },
  OR:   { bits: ['0','1','1','1'], expr: 'S = A + B' },
  XOR:  { bits: ['0','1','1','0'], expr: 'S = A·¬B + ¬A·B' },
  NAND: { bits: ['1','1','1','0'], expr: 'S = ¬(A·B)' },
  NOR:  { bits: ['1','0','0','0'], expr: 'S = ¬(A + B)' },
  XNOR: { bits: ['1','0','0','1'], expr: 'S = A·B + ¬A·¬B' },
};

const GATE_DESCS = {
  AND:  'Si todas las entradas son 1, la salida será 1.',
  OR:   'Si al menos una entrada es 1, la salida es 1.',
  XOR:  'Salida 1 si el número de 1s es impar.',
  NAND: 'Negación de AND.',
  NOR:  'Negación de OR.',
  XNOR: 'Negación de XOR (número de 1s par).'
};

addVarBtn.onclick = () => {
  if (variableCount < maxVars) {
    varNames.push('');
    variableCount++;
    renderAll();
  } else {
    alert('Máximo de 6 variables');
  }
};
removeVarBtn.onclick = () => {
  if (variableCount > minVars) {
    varNames.pop();
    variableCount--;
    renderAll();
  } else {
    alert('Mínimo de 2 variables');
  }
};

function renderAll() {
  renderTable();
  renderLogicGates();
}

function renderTable() {
  outputDiv.textContent = '';
  tableContainer.innerHTML = '';
  clearError();

  const rows = Math.pow(2, variableCount);
  const tbl  = document.createElement('table');
  const header = document.createElement('tr');

  for (let i = 0; i < variableCount; i++) {
    const th = document.createElement('th');
    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.value       = varNames[i];
    inp.placeholder = 'Var';
    inp.maxLength   = 1;
    inp.oninput     = () => {
      if (/^[A-Za-z0-9]?$/.test(inp.value)) {
        varNames[i] = inp.value.toUpperCase();
        renderAll();
      } else {
        inp.value = '';
      }
    };
    th.appendChild(inp);
    header.appendChild(th);
  }

  const thOut = document.createElement('th');
  thOut.textContent = 'Salida';
  header.appendChild(thOut);
  tbl.appendChild(header);

  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < variableCount; c++) {
      const td  = document.createElement('td');
      const inp = document.createElement('input');
      inp.type      = 'text';
      inp.maxLength = 1;
      inp.dataset.col = c;
      inp.value     = r.toString(2).padStart(variableCount,'0')[c];
      inp.oninput   = () => validate01(inp);
      td.appendChild(inp);
      tr.appendChild(td);
    }
    const tdOut = document.createElement('td');
    const inpOut = document.createElement('input');
    inpOut.type      = 'text';
    inpOut.maxLength = 1;
    inpOut.oninput   = () => validate01(inpOut);
    tdOut.appendChild(inpOut);
    tr.appendChild(tdOut);

    tbl.appendChild(tr);
  }
  tableContainer.appendChild(tbl);
}

function validate01(inp) {
  if (!/^[01]$/.test(inp.value)) {
    inp.value = '';
    showError('Solo 0 o 1');
  } else clearError();
}

genBtn.onclick = () => {
  clearError();
  const rows = Array.from(tableContainer.querySelectorAll('table tr')).slice(1);
  if (variableCount === 2) {
    const outs = rows.map(tr => tr.querySelectorAll('input')[2].value || '0');
    for (const [gate, info] of Object.entries(GATE_PATTERNS)) {
      if (info.bits.join('') === outs.join('')) {
        outputDiv.textContent = info.expr;
        return;
      }
    }
  }

  const terms = [];
  rows.forEach(tr => {
    const inputs = Array.from(tr.querySelectorAll('input'));
    const vals   = inputs.map(inp => inp.value || '0');
    const out    = vals.pop();
    if (out === '1') {
      const term = vals.map((b,i) =>
        b === '1'
          ? varNames[i] || ('?'+(i+1))
          : '¬'+(varNames[i] || ('?'+(i+1)))
      ).join('·');
      terms.push(term);
    }
  });
  outputDiv.textContent = terms.length
    ? terms.join(' + ')
    : 'No hay filas con salida = 1.';
};

function renderLogicGates() {
  gatesDiv.innerHTML = '';
  for (const gate of Object.keys(GATE_PATTERNS)) {
    let expr;
    switch (gate) {
      case 'AND':  expr = `S = ${varNames.join('·')}`; break;
      case 'OR':   expr = `S = ${varNames.join(' + ')}`; break;
      case 'XOR':  expr = `S = ${varNames.join(' ⊕ ')}`; break;
      case 'NAND': expr = `S = ¬(${varNames.join('·')})`; break;
      case 'NOR':  expr = `S = ¬(${varNames.join(' + ')})`; break;
      case 'XNOR': expr = `S = ¬(${varNames.join(' ⊕ ')})`; break;
    }
    const card = document.createElement('div');
    card.className = 'gate-card';
    card.innerHTML = `
      <h4>${gate}</h4>
      <p><strong>Expresión:</strong> ${expr}</p>
      <p>${GATE_DESCS[gate]}</p>
    `;
    gatesDiv.appendChild(card);
  }
}

function showError(msg) {
  let e = document.getElementById('error');
  if (!e) {
    e = document.createElement('div');
    e.id = 'error';
    tableContainer.parentNode.insertBefore(e, outputDiv);
  }
  e.textContent = msg;
}
function clearError() {
  const e = document.getElementById('error');
  if (e) e.remove();
}


renderAll();