-- Conteo general de registros por tabla
SELECT 'roles' AS tabla, COUNT(*) AS registros FROM roles
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'mecanicos', COUNT(*) FROM mecanicos
UNION ALL
SELECT 'vehiculos', COUNT(*) FROM vehiculos
UNION ALL
SELECT 'estados_orden', COUNT(*) FROM estados_orden
UNION ALL
SELECT 'servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'repuestos', COUNT(*) FROM repuestos
UNION ALL
SELECT 'ordenes_trabajo', COUNT(*) FROM ordenes_trabajo
UNION ALL
SELECT 'diagnosticos', COUNT(*) FROM diagnosticos
UNION ALL
SELECT 'historial_estados_orden', COUNT(*) FROM historial_estados_orden
UNION ALL
SELECT 'orden_servicios', COUNT(*) FROM orden_servicios
UNION ALL
SELECT 'orden_repuestos', COUNT(*) FROM orden_repuestos
UNION ALL
SELECT 'facturas', COUNT(*) FROM facturas
UNION ALL
SELECT 'alertas_mantenimiento', COUNT(*) FROM alertas_mantenimiento
ORDER BY tabla;

-- Revisión específica de coincidencias críticas
SELECT nombre_rol FROM roles ORDER BY id_rol;
SELECT nombre_estado FROM estados_orden ORDER BY id_estado;
SELECT nombre_servicio FROM servicios ORDER BY id_servicio;

-- Resumen de orden de prueba
SELECT
    ot.id_orden,
    uc.nombre AS cliente,
    v.placa,
    v.marca,
    v.modelo,
    um.nombre AS mecanico,
    eo.nombre_estado AS estado_actual,
    ot.motivo_ingreso,
    ot.kilometraje_ingreso
FROM ordenes_trabajo ot
JOIN clientes c ON ot.id_cliente = c.id_cliente
JOIN usuarios uc ON c.id_usuario = uc.id_usuario
JOIN vehiculos v ON ot.id_vehiculo = v.id_vehiculo
LEFT JOIN mecanicos m ON ot.id_mecanico = m.id_mecanico
LEFT JOIN usuarios um ON m.id_usuario = um.id_usuario
JOIN estados_orden eo ON ot.id_estado_actual = eo.id_estado;

-- Factura de prueba
SELECT * FROM facturas;

-- Alertas pendientes
SELECT * FROM alertas_mantenimiento;
