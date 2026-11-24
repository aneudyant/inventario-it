import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC8RhW4-LEYY0UOJWfbPPqJocNTUCy-3Uw',
  authDomain: 'inventario-it-crud.firebaseapp.com',
  projectId: 'inventario-it-crud',
  storageBucket: 'inventario-it-crud.firebasestorage.app',
  messagingSenderId: '784646925465',
  appId: '1:784646925465:web:3b4da7cb4e190f32b31c08',
  measurementId: 'G-T0DEPQ0BG3'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const equiposRef = collection(db, 'equipos_it');

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
const btnBuscar = document.getElementById('btn-buscar');
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

  formTitle.textContent = `Modificar equipo ${equipo.codigo_activo}`;
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
          <button type="button" class="btn btn-sm btn-edit" data-action="edit" data-id="${escaparHTML(eq.id)}">
            Editar
          </button>
          <button type="button" class="btn btn-sm btn-delete" data-action="delete" data-id="${escaparHTML(eq.id)}">
            Borrar
          </button>
        </td>
      </tr>
    `
    )
    .join('');
}

async function consultarEquipos() {
  const textoBuscar = filtroBuscar.value.trim().toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;

  try {
    let q;
    if (categoriaSeleccionada && categoriaSeleccionada !== 'Todas') {
      q = query(equiposRef, where('categoria', '==', categoriaSeleccionada));
    } else {
      q = query(equiposRef, orderBy('creadoEn', 'desc'));
    }

    const snapshot = await getDocs(q);
    let lista = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    if (categoriaSeleccionada && categoriaSeleccionada !== 'Todas') {
      lista.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
    }

    if (textoBuscar !== '') {
      lista = lista.filter((eq) => {
        const campos = [
          eq.codigo_activo,
          eq.nombre_equipo,
          eq.numero_serie,
          eq.asignado_a,
          eq.estado
        ];
        return campos.some((campo) => String(campo || '').toLowerCase().includes(textoBuscar));
      });
    }

    renderizarTabla(lista);
  } catch (err) {
    console.error('Error al consultar Firestore:', err);
    tablaBody.innerHTML =
      '<tr><td colspan="9" class="empty-cell">No se pudieron cargar los registros desde Firebase.</td></tr>';
  }
}

async function existeCodigoActivo(codigo, idExcluir = '') {
  const q = query(equiposRef, where('codigo_activo', '==', codigo));
  const snapshot = await getDocs(q);
  return snapshot.docs.some((docSnap) => docSnap.id !== idExcluir);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta();

  const cantidadNum = Number(inputCantidad.value);
  const payload = {
    codigo_activo: inputCodigo.value.trim(),
    nombre_equipo: inputNombre.value.trim(),
    categoria: inputCategoria.value,
    estado: inputEstado.value,
    numero_serie: inputSerie.value.trim(),
    fecha_registro: inputFecha.value || fechaHoyISO(),
    asignado_a: inputAsignado.value.trim(),
    cantidad: cantidadNum
  };

  if (!payload.codigo_activo || !payload.nombre_equipo || !payload.categoria || !payload.estado) {
    mostrarAlerta('Completa código de activo, nombre del equipo, categoría y estado.', 'error');
    return;
  }

  if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
    mostrarAlerta('La cantidad debe ser un número entero mayor o igual a 1.', 'error');
    return;
  }

  const idEdicion = inputId.value;
  const esEdicion = Boolean(idEdicion);

  btnSubmit.disabled = true;

  try {
    const duplicado = await existeCodigoActivo(payload.codigo_activo, idEdicion);
    if (duplicado) {
      throw new Error('Ya existe un equipo registrado con ese código de activo.');
    }

    if (esEdicion) {
      const docRef = doc(db, 'equipos_it', idEdicion);
      await updateDoc(docRef, payload);
      mostrarAlerta(`Equipo "${payload.codigo_activo}" actualizado correctamente.`, 'success');
    } else {
      await addDoc(equiposRef, {
        ...payload,
        creadoEn: Date.now()
      });
      mostrarAlerta(`Equipo "${payload.codigo_activo}" registrado correctamente.`, 'success');
    }

    resetearFormulario();
    await consultarEquipos();
  } catch (err) {
    mostrarAlerta(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
  }
});

btnCancelar.addEventListener('click', () => {
  ocultarAlerta();
  resetearFormulario();
});

tablaBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'edit') {
    const equipo = equiposCache.find((item) => String(item.id) === String(id));
    if (equipo) {
      cargarEnFormulario(equipo);
    }
    return;
  }

  if (action === 'delete') {
    const equipo = equiposCache.find((item) => String(item.id) === String(id));
    const etiqueta = equipo ? `${equipo.codigo_activo} (${equipo.nombre_equipo})` : id;
    const confirmar = window.confirm(`¿Seguro que deseas borrar el registro ${etiqueta}?`);
    if (!confirmar) return;

    ocultarAlerta();
    try {
      await deleteDoc(doc(db, 'equipos_it', id));
      if (inputId.value === String(id)) {
        resetearFormulario();
      }
      mostrarAlerta(`Registro ${etiqueta} eliminado.`, 'success');
      await consultarEquipos();
    } catch (err) {
      mostrarAlerta(err.message || 'No se pudo eliminar el registro.', 'error');
    }
  }
});

btnBuscar.addEventListener('click', () => {
  consultarEquipos();
});

filtroBuscar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    consultarEquipos();
  }
});

btnLimpiarFiltros.addEventListener('click', () => {
  filtroBuscar.value = '';
  filtroCategoria.value = 'Todas';
  consultarEquipos();
});

// Inicialización
inputFecha.value = fechaHoyISO();
consultarEquipos();