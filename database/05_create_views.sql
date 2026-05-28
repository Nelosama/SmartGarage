-- =========================================================
-- SMARTGARAGE - VISTAS PRINCIPALES
-- Archivo: 05_create_views.sql
-- =========================================================

-- =========================================================
-- 1. Vista resumen de ordenes de trabajo
-- =========================================================
CREATE OR REPLACE VIEW vw_ordenes_resumen AS
SELECT
    ot.id_orden,
    uc.nombre AS cliente,
    uc.correo AS correo_cliente,
    uc.telefono AS telefono_cliente,
    v.placa,
    v.marca,
    v.modelo,
    v.anio,
    v.color,
    v.kilometraje_actual,
    um.nombre AS mecanico,
    m.especialidad,
    eo.nombre_estado AS estado_actual,
    ot.fecha_ingreso,
    ot.fecha_estimada_entrega,
    ot.fecha_entrega,
    ot.kilometraje_ingreso,
    ot.motivo_ingreso,
    ot.prioridad,
    ot.observaciones
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


-- =========================================================
-- 2. Vista de diagnostico por orden
-- =========================================================
CREATE OR REPLACE VIEW vw_diagnosticos_resumen AS
SELECT
    d.id_diagnostico,
    d.id_orden,
    uc.nombre AS cliente,
    v.placa,
    v.marca,
    v.modelo,
    d.falla_reportada,
    d.causa_detectada,
    d.recomendacion,
    d.observaciones,
    d.fecha_diagnostico
FROM diagnosticos d
INNER JOIN ordenes_trabajo ot 
    ON d.id_orden = ot.id_orden
INNER JOIN clientes c 
    ON ot.id_cliente = c.id_cliente
INNER JOIN usuarios uc 
    ON c.id_usuario = uc.id_usuario
INNER JOIN vehiculos v 
    ON ot.id_vehiculo = v.id_vehiculo;


-- =========================================================
-- 3. Vista historial de estados
-- =========================================================
CREATE OR REPLACE VIEW vw_historial_estados AS
SELECT
    heo.id_historial_estado,
    heo.id_orden,
    uc.nombre AS cliente,
    v.placa,
    v.marca,
    v.modelo,
    eo.nombre_estado,
    u.nombre AS actualizado_por,
    heo.fecha_hora,
    heo.comentario
FROM historial_estados_orden heo
INNER JOIN ordenes_trabajo ot 
    ON heo.id_orden = ot.id_orden
INNER JOIN clientes c 
    ON ot.id_cliente = c.id_cliente
INNER JOIN usuarios uc 
    ON c.id_usuario = uc.id_usuario
INNER JOIN vehiculos v 
    ON ot.id_vehiculo = v.id_vehiculo
INNER JOIN estados_orden eo 
    ON heo.id_estado = eo.id_estado
LEFT JOIN usuarios u 
    ON heo.id_usuario = u.id_usuario;


-- =========================================================
-- 4. Vista servicios por orden
-- =========================================================
CREATE OR REPLACE VIEW vw_servicios_por_orden AS
SELECT
    os.id_orden_servicio,
    os.id_orden,
    s.nombre_servicio,
    s.descripcion,
    os.cantidad,
    os.precio_unitario,
    os.subtotal,
    os.observaciones
FROM orden_servicios os
INNER JOIN servicios s 
    ON os.id_servicio = s.id_servicio;


-- =========================================================
-- 5. Vista repuestos por orden
-- =========================================================
CREATE OR REPLACE VIEW vw_repuestos_por_orden AS
SELECT
    ore.id_orden_repuesto,
    ore.id_orden,
    r.nombre_repuesto,
    r.marca,
    ore.cantidad,
    ore.precio_unitario,
    ore.subtotal
FROM orden_repuestos ore
INNER JOIN repuestos r 
    ON ore.id_repuesto = r.id_repuesto;


-- =========================================================
-- 6. Vista resumen de facturas
-- =========================================================
CREATE OR REPLACE VIEW vw_facturas_resumen AS
SELECT
    f.id_factura,
    f.numero_factura,
    f.id_orden,
    uc.nombre AS cliente,
    v.placa,
    v.marca,
    v.modelo,
    f.fecha_emision,
    f.subtotal_servicios,
    f.subtotal_repuestos,
    f.impuesto,
    f.descuento,
    f.total,
    f.estado_pago,
    f.metodo_pago
FROM facturas f
INNER JOIN ordenes_trabajo ot 
    ON f.id_orden = ot.id_orden
INNER JOIN clientes c 
    ON ot.id_cliente = c.id_cliente
INNER JOIN usuarios uc 
    ON c.id_usuario = uc.id_usuario
INNER JOIN vehiculos v 
    ON ot.id_vehiculo = v.id_vehiculo;


-- =========================================================
-- 7. Vista alertas de mantenimiento pendientes
-- =========================================================
CREATE OR REPLACE VIEW vw_alertas_pendientes AS
SELECT
    am.id_alerta,
    uc.nombre AS cliente,
    uc.correo AS correo_cliente,
    v.placa,
    v.marca,
    v.modelo,
    s.nombre_servicio,
    am.kilometraje_referencia,
    am.kilometraje_objetivo,
    am.fecha_objetivo,
    am.mensaje,
    am.estado,
    am.fecha_generada
FROM alertas_mantenimiento am
INNER JOIN vehiculos v 
    ON am.id_vehiculo = v.id_vehiculo
INNER JOIN clientes c 
    ON v.id_cliente = c.id_cliente
INNER JOIN usuarios uc 
    ON c.id_usuario = uc.id_usuario
INNER JOIN servicios s 
    ON am.id_servicio = s.id_servicio
WHERE am.estado = 'Pendiente';


-- =========================================================
-- 8. Vista inventario bajo
-- =========================================================
CREATE OR REPLACE VIEW vw_inventario_bajo AS
SELECT
    id_repuesto,
    nombre_repuesto,
    marca,
    stock,
    stock_minimo,
    precio_unitario,
    estado
FROM repuestos
WHERE stock <= stock_minimo
  AND estado = 'Activo';