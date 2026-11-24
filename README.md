 Inventario del Departamento de IT

Aplicación web CRUD para registrar, consultar, editar, filtrar y eliminar equipos, periféricos y activos tecnológicos del Departamento de IT, alojada de forma estática en GitHub Page y conectada directamente a Cloud Firestor.

   Características principales

- Operaciones CRUD completas: Crear, listar, actualizar y eliminar registros en la colección equipos_it de Cloud Firestore.
- Validación y prevención de duplicados: Verifica campos obligatorios, cantidad mínima (>= 1) y evita duplicar el codigo_activo.
- Búsqueda y filtros: Permite filtrar por categoría y realizar búsquedas por código, nombre, serie, estado o persona/área asignada mediante el botón Buscar o presionando Enter, además de limpiar filtros con Limpiar.
- Interfaz estática: Funciona directamente en el navegador mediante módulos (<script type= module src=app.js></script>).

   Estructura del proyecto

├── public/
│   ├── index.html     # Interfaz del formulario, filtros y tabla de equipos
│   ├── styles.css     # Estilos visuales de la aplicación
│   └── app.js         # Conexión a Firebase Firestore y lógica CRUD en el navegador
├── .gitignore
├── package.json
├── package-lock.json
└── README.md