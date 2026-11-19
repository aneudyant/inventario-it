const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'inventario.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite en:', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS equipos_it (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_activo TEXT NOT NULL UNIQUE,
      nombre_equipo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      numero_serie TEXT,
      estado TEXT NOT NULL,
      asignado_a TEXT,
      cantidad INTEGER NOT NULL DEFAULT 1,
      fecha_registro TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla equipos_it:', err.message);
      return;
    }

    db.get('SELECT COUNT(*) AS total FROM equipos_it', (countErr, row) => {
      if (countErr) {
        console.error('Error al consultar registros iniciales:', countErr.message);
        return;
      }

      if (row && row.total === 0) {
        const insertSql = `
          INSERT INTO equipos_it (
            codigo_activo, nombre_equipo, categoria, numero_serie,
            estado, asignado_a, cantidad, fecha_registro
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertSql, [
          'IT-LAP-0001',
          'Laptop Dell Latitude 5440',
          'Laptop',
          'DL5440-99812',
          'Asignado',
          'Carlos Mendez - Soporte',
          1,
          '2026-11-19'
        ]);

        db.run(insertSql, [
          'IT-MON-0002',
          'Monitor Lenovo ThinkVision 24"',
          'Monitor',
          'LN24-44120',
          'En almacen',
          '',
          2,
          '2026-11-19'
        ]);
      }
    });
  });
});

module.exports = db;