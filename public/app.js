const API_URL = '/api/equipos';

const form = document.getElementById('equipo-form');
const formTitle = document.getElementById('form-title');
const formHint = document.getElementById('form-hint');
const btnSubmit = document.getElementById('btn-submit');
const btnCancelar = document.getElementById('btn-cancelar');
const alertBox = document.getElementById('alert-box');

const inputId = document.getElementById('equipo-id');
const inputCodigo = document.getElementById('codigo_activo');
const inputNombre = document.getElementById('nombre_equipo');
const inputCategoria = document.getElementById('categoria');
const inputEstado = document.getElementById('estado');
const inputSerie = document.getElementById('numero_serie');
const inputFecha = document.getElementById('fecha_registro');
const inputAsignado = document.getElementById('asignado_a');
const inputCantidad = document.getElementById('cantidad');

const tablaBody = document.getElementById('tabla-equipos-body');
const contadorRegistros = document.getElementById('contador-registros');
const filtroBuscar = document.getElementById('filtro-buscar');
const filtroCategoria = document.getElementById('filtro-categoria');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

let equiposCache = [];

function mostrarAlerta(mensaje, tipo = 'success') {
  alertBox.textContent = mensaje;
  alertBox.className = `alert ${tipo}`;
}

function ocultarAlerta() {
  alertBox.className = 'alert hidden';
  alertBox.textContent = '';
}

function fechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function resetearFormulario() {
  form.reset();
  inputId.value = '';
  inputCantidad.value = 1;
  inputFecha.value = fechaHoyISO();
  formTitle.textContent = 'Registrar nuevo equipo';
  formHint.textContent = 'Completa los campos obligatorios (*) y guarda el registro.';
  btnSubmit.textContent = 'Guardar equipo';
  btnCancelar.classList.add('hidden');
}

function cargarEnFormulario(equipo) {
  ocultarAlerta();
  inputId.value = equipo.id;
  inputCodigo.value = equipo.codigo_activo;
  inputNombre.value = equipo.nombre_equipo;
  inputCategoria.value = equipo.categoria;
  inputEstado.value = equipo.estado;
  inputSerie.value = equipo.numero_serie || '';
  inputFecha.value = equipo.fecha_registro || fechaHoyISO();
  inputAsignado.value = equipo.asignado_a || '';
  inputCantidad.value = equipo.cantidad || 1;

  formTitle.textContent = `Modificar equipo #${equipo.id}`;
  formHint.textContent = 'Edita los datos necesarios y pulsa "Actualizar equipo".';
  btnSubmit.textContent = 'Actualizar equipo';
  btnCancelar.classList.remove('hidden');
  inputCodigo.focus();
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function renderizarTabla(equipos) {
  equiposCache = equipos;
  contadorRegistros.textContent =
    equipos.length === 1 ? '1 registro encontrado' : `${equipos.length} registros encontrados`;

  if (!equipos.length) {
    tablaBody.innerHTML =
      '<tr><td colspan="9" class="empty-cell">No hay equipos que coincidan con el filtro.</td></tr>';
    return;
  }

  tablaBody.innerHTML = equipos
    .map(
      (eq) => `
      <tr>
        <td><strong>${escaparHTML(eq.codigo_activo)}</strong></td>
        <td>${escaparHTML(eq.nombre_equipo)}</td>
        <td>${escaparHTML(eq.categoria)}</td>
        <td>${escaparHTML(eq.numero_serie || '-')}</td>
        <td><span class="badge">${escaparHTML(eq.estado)}</span></td>
        <td>${escaparHTML(eq.asignado_a || '-')}</td>
        <td>${escaparHTML(eq.cantidad)}</td>
        <td>${escaparHTML(eq.fecha_registro)}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn-sm btn-edit" data-action="edit" data-id="${eq.id}">
            Editar
          </button>
          <button type="button" class="btn btn-sm btn-delete" data-action="delete" data-id="${eq.id}">
            Borrar
          </button>
        </td>
      </tr>
    `
    )
    .join('');
}

async function consultarEquipos() {
  const params = new URLSearchParams();
  if (filtroBuscar.value.trim() !== '') {
    params.set('buscar', filtroBuscar.value.trim());
  }
  if (filtroCategoria.value !== 'Todas') {
    params.set('categoria', filtroCategoria.value);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'No se pudieron consultar los registros.');
    }
    renderizarTabla(data);
  } catch (err) {
    tablaBody.innerHTML = `<tr><td colspan="9" class="empty-cell">${escaparHTML(err.message)}</td></tr>`;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta();

  const payload = {
    codigo_activo: inputCodigo.value.trim(),
    nombre_equipo: inputNombre.value.trim(),
    categoria: inputCategoria.value,
    estado: inputEstado.value,
    numero_serie: inputSerie.value.trim(),
    fecha_registro: inputFecha.value,
    asignado_a: inputAsignado.value.trim(),
    cantidad: Number(inputCantidad.value)
  };

  if (!payload.codigo_activo || !payload.nombre_equipo || !payload.categoria || !payload.estado) {
    mostrarAlerta('Completa código de activo, nombre del equipo, categoría y estado.', 'error');
    return;
  }

  const idEdicion = inputId.value;
  const esEdicion = Boolean(idEdicion);
  const url = esEdicion ? `${API_URL}/${idEdicion}` : API_URL;
  const metodo = esEdicion ? 'PUT' : 'POST';

  btnSubmit.disabled = true;

  try {
    const resp = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || 'Ocurrió un error al guardar el registro.');
    }

    mostrarAlerta(
      esEdicion
        ? `Equipo "${data.codigo_activo}" actualizado correctamente.`
        : `Equipo "${data.codigo_activo}" registrado correctamente.`,
      'success'
    );
    resetearFormulario();
    await consultarEquipos();
  } catch (err) {
    mostrarAlerta(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
  }
});

tablaBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'edit') {
    const equipo = equiposCache.find((item) => item.id === id);
    if (equipo) {
      cargarEnFormulario(equipo);
    }
    return;
  }

  if (action === 'delete') {
    const equipo = equiposCache.find((item) => item.id === id);
    const etiqueta = equipo ? `${equipo.codigo_activo} (${equipo.nombre_equipo})` : `#${id}`;
    const confirmar = window.confirm(`¿Seguro que deseas borrar el registro ${etiqueta}?`);
    if (!confirmar) return;

    ocultarAlerta();
    try {
      const resp = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo eliminar el registro.');
      }
      if (inputId.value === String(id)) {
        resetearFormulario();
      }
      mostrarAlerta(`Registro ${etiqueta} eliminado.`, 'success');
      await consultarEquipos();
    } catch (err) {
      mostrarAlerta(err.message, 'error');
    }
  }
});

btnCancelar.addEventListener('click', () => {
  ocultarAlerta();
  resetearFormulario();
});

filtroBuscar.addEventListener('input', () => {
  consultarEquipos();
});

filtroCategoria.addEventListener('change', () => {
  consultarEquipos();
});

btnLimpiarFiltros.addEventListener('click', () => {
  filtroBuscar.value = '';
  filtroCategoria.value = 'Todas';
  consultarEquipos();
});

inputFecha.value = fechaHoyISO();
consultarEquipos();