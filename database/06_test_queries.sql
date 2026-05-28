-- =========================================================
-- SMARTGARAGE - CONSULTAS DE PRUEBA
-- Archivo: 06_test_queries.sql
-- =========================================================

-- 1. Ver resumen de ordenes
SELECT * 
FROM vw_ordenes_resumen;

-- 2. Ver diagnosticos registrados
SELECT * 
FROM vw_diagnosticos_resumen;

-- 3. Ver historial de estados de las ordenes
SELECT * 
FROM vw_historial_estados
ORDER BY id_orden, fecha_hora;

-- 4. Ver servicios aplicados por orden
SELECT * 
FROM vw_servicios_por_orden;

-- 5. Ver repuestos usados por orden
SELECT * 
FROM vw_repuestos_por_orden;

-- 6. Ver facturas generadas
SELECT * 
FROM vw_facturas_resumen;

-- 7. Ver alertas de mantenimiento pendientes
SELECT * 
FROM vw_alertas_pendientes;

-- 8. Ver inventario bajo
SELECT * 
FROM vw_inventario_bajo;

-- 9. Ver vehiculos registrados con su cliente
SELECT
    c.id_cliente,
    u.nombre AS cliente,
    u.correo,
    v.placa,
    v.marca,
    v.modelo,
    v.anio,
    v.kilometraje_actual
FROM clientes c
INNER JOIN usuarios u 
    ON c.id_usuario = u.id_usuario
INNER JOIN vehiculos v 
    ON c.id_cliente = v.id_cliente;

-- 10. Ver detalle completo de una orden
SELECT
    ot.id_orden,
    uc.nombre AS cliente,
    v.placa,
    v.marca,
    v.modelo,
    um.nombre AS mecanico,
    eo.nombre_estado AS estado_actual,
    ot.motivo_ingreso,
    ot.kilometraje_ingreso,
    ot.fecha_ingreso
FROM ordenes_trabajo ot
INNER JOIN clientes c 
    ON ot.id_cliente = c.id_cliente
INNER JOIN usuarios uc 
    ON c.id_usuario = uc.id_usuario
INNER JOIN vehiculos v 
    ON ot.id_vehiculo = v.id_vehiculo
LEFT JOIN mecanicos m 
    ON ot.id_mecanico = m.id_mecanico
LEFT JOIN usuarios um 
    ON m.id_usuario = um.id_usuario
INNER JOIN estados_orden eo 
    ON ot.id_estado_actual = eo.id_estado;