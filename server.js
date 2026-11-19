const path = require('path');
const express = require('express');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. CONSULTAR registros 
app.get('/api/equipos', (req, res) => {
  const { buscar = '', categoria = '' } = req.query;
  const condiciones = [];
  const parametros = [];

  if (buscar.trim() !== '') {
    const termino = `%${buscar.trim()}%`;
    condiciones.push(`(
      codigo_activo LIKE ? OR
      nombre_equipo LIKE ? OR
      numero_serie LIKE ? OR
      asignado_a LIKE ?
    )`);
    parametros.push(termino, termino, termino, termino);
  }

  if (categoria.trim() !== '' && categoria !== 'Todas') {
    condiciones.push('categoria = ?');
    parametros.push(categoria.trim());
  }

  let sql = 'SELECT * FROM equipos_it';
  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }
  sql += ' ORDER BY id DESC';

  db.all(sql, parametros, (err, rows) => {
    if (err) {
      console.error('Error al consultar equipos:', err.message);
      return res.status(500).json({ error: 'Error al consultar los equipos' });
    }
    res.json(rows);
  });
});

// 2. INSERTAR nuevo registro
app.post('/api/equipos', (req, res) => {
  const {
    codigo_activo,
    nombre_equipo,
    categoria,
    numero_serie = '',
    estado,
    asignado_a = '',
    cantidad = 1,
    fecha_registro
  } = req.body;

  if (!codigo_activo || !nombre_equipo || !categoria || !estado) {
    return res.status(400).json({
      error: 'Código de activo, nombre del equipo, categoría y estado son obligatorios.'
    });
  }

  const cantidadNum = Number(cantidad);
  if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
    return res.status(400).json({
      error: 'La cantidad debe ser un número entero mayor o igual a 1.'
    });
  }

  const fechaFinal =
    fecha_registro && fecha_registro.trim() !== ''
      ? fecha_registro.trim()
      : new Date().toISOString().slice(0, 10);

  const sql = `
    INSERT INTO equipos_it (
      codigo_activo, nombre_equipo, categoria, numero_serie,
      estado, asignado_a, cantidad, fecha_registro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    codigo_activo.trim(),
    nombre_equipo.trim(),
    categoria.trim(),
    numero_serie.trim(),
    estado.trim(),
    asignado_a.trim(),
    cantidadNum,
    fechaFinal
  ];

  db.run(sql, params, function (err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: 'Ya existe un equipo registrado con ese código de activo.'
        });
      }
      console.error('Error al insertar equipo:', err.message);
      return res.status(500).json({ error: 'Error al guardar el equipo' });
    }

    db.get('SELECT * FROM equipos_it WHERE id = ?', [this.lastID], (getErr, row) => {
      if (getErr) {
        return res.status(201).json({ id: this.lastID, mensaje: 'Equipo creado' });
      }
      res.status(201).json(row);
    });
  });
});

// 3. MODIFICAR registro 
app.put('/api/equipos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de equipo inválido.' });
  }

  const {
    codigo_activo,
    nombre_equipo,
    categoria,
    numero_serie = '',
    estado,
    asignado_a = '',
    cantidad = 1,
    fecha_registro
  } = req.body;

  if (!codigo_activo || !nombre_equipo || !categoria || !estado) {
    return res.status(400).json({
      error: 'Código de activo, nombre del equipo, categoría y estado son obligatorios.'
    });
  }

  const cantidadNum = Number(cantidad);
  if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
    return res.status(400).json({
      error: 'La cantidad debe ser un número entero mayor o igual a 1.'
    });
  }

  const sql = `
    UPDATE equipos_it
    SET codigo_activo = ?,
        nombre_equipo = ?,
        categoria = ?,
        numero_serie = ?,
        estado = ?,
        asignado_a = ?,
        cantidad = ?,
        fecha_registro = ?
    WHERE id = ?
  `;

  const params = [
    codigo_activo.trim(),
    nombre_equipo.trim(),
    categoria.trim(),
    numero_serie.trim(),
    estado.trim(),
    asignado_a.trim(),
    cantidadNum,
    fecha_registro && fecha_registro.trim() !== ''
      ? fecha_registro.trim()
      : new Date().toISOString().slice(0, 10),
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: 'Ese código de activo ya pertenece a otro equipo.'
        });
      }
      console.error('Error al actualizar equipo:', err.message);
      return res.status(500).json({ error: 'Error al actualizar el equipo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    db.get('SELECT * FROM equipos_it WHERE id = ?', [id], (getErr, row) => {
      if (getErr) {
        return res.json({ id, mensaje: 'Equipo actualizado' });
      }
      res.json(row);
    });
  });
});

// 4. BORRAR registro
app.delete('/api/equipos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de equipo inválido.' });
  }

  db.run('DELETE FROM equipos_it WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error al eliminar equipo:', err.message);
      return res.status(500).json({ error: 'Error al eliminar el equipo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    res.json({ mensaje: 'Equipo eliminado correctamente', id });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});