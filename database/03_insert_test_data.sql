BEGIN;

-- =========================================================
-- USUARIOS DE PRUEBA
-- Se usan los nombres reales del catalogo: Recepcion, Mecanico, etc.
-- =========================================================

INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado)
VALUES (
    (SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador' LIMIT 1),
    'Admin SmartGarage',
    'admin@smartgarage.com',
    'hash_demo_admin',
    '9999-0001',
    'Activo'
)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado)
VALUES (
    (SELECT id_rol FROM roles WHERE nombre_rol IN ('Recepcion', 'Recepcion') ORDER BY id_rol LIMIT 1),
    'Ana Recepcion',
    'recepcion@smartgarage.com',
    'hash_demo_recepcion',
    '9999-0002',
    'Activo'
)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado)
VALUES (
    (SELECT id_rol FROM roles WHERE nombre_rol IN ('Mecanico', 'Mecanico') ORDER BY id_rol LIMIT 1),
    'Luis Ramirez',
    'luis@smartgarage.com',
    'hash_demo_mecanico',
    '9999-0003',
    'Activo'
)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado)
VALUES (
    (SELECT id_rol FROM roles WHERE nombre_rol = 'Cliente' LIMIT 1),
    'Carlos Martinez',
    'carlos@email.com',
    'hash_demo_cliente',
    '9999-0004',
    'Activo'
)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado)
VALUES (
    (SELECT id_rol FROM roles WHERE nombre_rol = 'Cliente' LIMIT 1),
    'Maria Lopez',
    'maria@email.com',
    'hash_demo_cliente',
    '9999-0005',
    'Activo'
)
ON CONFLICT (correo) DO NOTHING;

-- =========================================================
-- CLIENTES
-- =========================================================

INSERT INTO clientes (id_usuario, identidad, direccion)
SELECT id_usuario, '0801-1999-00000', 'San Pedro Sula, Honduras'
FROM usuarios
WHERE correo = 'carlos@email.com'
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO clientes (id_usuario, identidad, direccion)
SELECT id_usuario, '0501-2000-11111', 'La Lima, Cortes'
FROM usuarios
WHERE correo = 'maria@email.com'
ON CONFLICT (id_usuario) DO NOTHING;

-- =========================================================
-- MECANICOS
-- =========================================================

INSERT INTO mecanicos (id_usuario, especialidad, estado)
SELECT id_usuario, 'Frenos y suspension', 'Disponible'
FROM usuarios
WHERE correo = 'luis@smartgarage.com'
ON CONFLICT (id_usuario) DO NOTHING;

-- =========================================================
-- VEHICULOS
-- =========================================================

INSERT INTO vehiculos
(id_cliente, placa, marca, modelo, anio, color, vin, tipo_combustible, kilometraje_actual)
SELECT c.id_cliente, 'HAA1234', 'Toyota', 'Corolla', 2014, 'Gris', 'VINDEMO123456789', 'Gasolina', 85000
FROM clientes c
INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
WHERE u.correo = 'carlos@email.com'
ON CONFLICT (placa) DO NOTHING;

INSERT INTO vehiculos
(id_cliente, placa, marca, modelo, anio, color, vin, tipo_combustible, kilometraje_actual)
SELECT c.id_cliente, 'HBB5678', 'Ford', 'Escape', 2013, 'Negro', 'VINDEMO987654321', 'Gasolina', 120000
FROM clientes c
INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
WHERE u.correo = 'maria@email.com'
ON CONFLICT (placa) DO NOTHING;

-- =========================================================
-- ORDEN DE TRABAJO 1
-- =========================================================

INSERT INTO ordenes_trabajo
(
    id_cliente,
    id_vehiculo,
    id_mecanico,
    id_estado_actual,
    fecha_estimada_entrega,
    kilometraje_ingreso,
    motivo_ingreso,
    prioridad,
    observaciones
)
SELECT
    c.id_cliente,
    v.id_vehiculo,
    m.id_mecanico,
    e.id_estado,
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    85000,
    'Cliente reporta ruido al frenar.',
    'Media',
    'Vehiculo recibido para diagnostico inicial.'
FROM clientes c
INNER JOIN usuarios uc ON c.id_usuario = uc.id_usuario
INNER JOIN vehiculos v ON v.id_cliente = c.id_cliente
INNER JOIN mecanicos m ON TRUE
INNER JOIN usuarios um ON m.id_usuario = um.id_usuario
INNER JOIN estados_orden e ON e.nombre_estado = 'Recibido'
WHERE uc.correo = 'carlos@email.com'
  AND um.correo = 'luis@smartgarage.com'
  AND v.placa = 'HAA1234'
  AND NOT EXISTS (
      SELECT 1
      FROM ordenes_trabajo ot
      WHERE ot.id_vehiculo = v.id_vehiculo
        AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
  );

-- =========================================================
-- DIAGNOSTICO DE ORDEN 1
-- =========================================================

INSERT INTO diagnosticos
(id_orden, falla_reportada, causa_detectada, recomendacion, observaciones)
SELECT
    ot.id_orden,
    'Ruido al frenar.',
    'Pastillas delanteras desgastadas.',
    'Realizar cambio de pastillas delanteras y revision del sistema de frenos.',
    'Se recomienda revisar discos durante el servicio.'
FROM ordenes_trabajo ot
INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
ON CONFLICT (id_orden) DO NOTHING;

-- =========================================================
-- HISTORIAL DE ESTADOS
-- =========================================================

INSERT INTO historial_estados_orden
(id_orden, id_estado, id_usuario, comentario)
SELECT
    ot.id_orden,
    e.id_estado,
    u.id_usuario,
    'Vehiculo recibido por recepcion.'
FROM ordenes_trabajo ot
INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN estados_orden e ON e.nombre_estado = 'Recibido'
INNER JOIN usuarios u ON u.correo = 'recepcion@smartgarage.com'
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
  AND NOT EXISTS (
      SELECT 1
      FROM historial_estados_orden h
      WHERE h.id_orden = ot.id_orden
        AND h.id_estado = e.id_estado
        AND h.comentario = 'Vehiculo recibido por recepcion.'
  );

INSERT INTO historial_estados_orden
(id_orden, id_estado, id_usuario, comentario)
SELECT
    ot.id_orden,
    e.id_estado,
    u.id_usuario,
    'El mecanico inicio el diagnostico del vehiculo.'
FROM ordenes_trabajo ot
INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN estados_orden e ON e.nombre_estado IN ('En diagnostico', 'En diagnostico')
INNER JOIN usuarios u ON u.correo = 'luis@smartgarage.com'
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
  AND NOT EXISTS (
      SELECT 1
      FROM historial_estados_orden h
      WHERE h.id_orden = ot.id_orden
        AND h.id_estado = e.id_estado
        AND h.comentario = 'El mecanico inicio el diagnostico del vehiculo.'
  );

-- =========================================================
-- SERVICIOS APLICADOS
-- =========================================================

INSERT INTO orden_servicios
(id_orden, id_servicio, cantidad, precio_unitario, observaciones)
SELECT
    ot.id_orden,
    s.id_servicio,
    1,
    s.precio_base,
    'Revision completa de frenos delanteros.'
FROM ordenes_trabajo ot
INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN servicios s ON s.nombre_servicio IN ('Revision de frenos', 'Revision de frenos')
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
ON CONFLICT (id_orden, id_servicio) DO NOTHING;

-- =========================================================
-- REPUESTOS USADOS
-- =========================================================

INSERT INTO orden_repuestos
(id_orden, id_repuesto, cantidad, precio_unitario)
SELECT
    ot.id_orden,
    r.id_repuesto,
    1,
    r.precio_unitario
FROM ordenes_trabajo ot
INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN repuestos r ON r.nombre_repuesto = 'Pastillas de freno delanteras'
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
ON CONFLICT (id_orden, id_repuesto) DO NOTHING;

-- =========================================================
-- FACTURA
-- Calculada con los subtotales reales de orden_servicios y orden_repuestos.
-- =========================================================

WITH orden AS (
    SELECT ot.id_orden
    FROM ordenes_trabajo ot
    INNER JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
    WHERE v.placa = 'HAA1234'
      AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
    LIMIT 1
),
totales AS (
    SELECT
        o.id_orden,
        COALESCE((SELECT SUM(os.subtotal) FROM orden_servicios os WHERE os.id_orden = o.id_orden), 0) AS subtotal_servicios,
        COALESCE((SELECT SUM(ore.subtotal) FROM orden_repuestos ore WHERE ore.id_orden = o.id_orden), 0) AS subtotal_repuestos
    FROM orden o
)
INSERT INTO facturas
(
    id_orden,
    numero_factura,
    subtotal_servicios,
    subtotal_repuestos,
    impuesto,
    descuento,
    total,
    estado_pago,
    metodo_pago
)
SELECT
    id_orden,
    'FAC-' || LPAD(id_orden::TEXT, 4, '0'),
    subtotal_servicios,
    subtotal_repuestos,
    ROUND((subtotal_servicios + subtotal_repuestos) * 0.15, 2),
    0.00,
    ROUND((subtotal_servicios + subtotal_repuestos) * 1.15, 2),
    'Pendiente',
    NULL
FROM totales
ON CONFLICT (id_orden) DO NOTHING;

-- =========================================================
-- ALERTA DE MANTENIMIENTO
-- =========================================================

INSERT INTO alertas_mantenimiento
(
    id_vehiculo,
    id_servicio,
    id_orden_origen,
    kilometraje_referencia,
    kilometraje_objetivo,
    fecha_objetivo,
    mensaje,
    estado
)
SELECT
    v.id_vehiculo,
    s.id_servicio,
    ot.id_orden,
    85000,
    90000,
    (CURRENT_DATE + INTERVAL '3 months')::DATE,
    'Se recomienda realizar cambio de aceite al llegar a los 90000 km o dentro de 3 meses.',
    'Pendiente'
FROM vehiculos v
INNER JOIN ordenes_trabajo ot ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN servicios s ON s.nombre_servicio = 'Cambio de aceite'
WHERE v.placa = 'HAA1234'
  AND ot.motivo_ingreso = 'Cliente reporta ruido al frenar.'
  AND NOT EXISTS (
      SELECT 1
      FROM alertas_mantenimiento am
      WHERE am.id_vehiculo = v.id_vehiculo
        AND am.id_servicio = s.id_servicio
        AND am.id_orden_origen = ot.id_orden
  );

COMMIT;
