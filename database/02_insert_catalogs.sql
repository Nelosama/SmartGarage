BEGIN;

-- =========================================================
-- ROLES
-- =========================================================
INSERT INTO roles (nombre_rol, descripcion)
SELECT 'Administrador', 'Usuario con acceso completo al sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Administrador');

INSERT INTO roles (nombre_rol, descripcion)
SELECT 'Recepcion', 'Usuario encargado de registrar clientes, vehiculos y ordenes'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol IN ('Recepcion', 'Recepcion'));

INSERT INTO roles (nombre_rol, descripcion)
SELECT 'Mecanico', 'Usuario encargado de diagnosticos y actualizacion de trabajos'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol IN ('Mecanico', 'Mecanico'));

INSERT INTO roles (nombre_rol, descripcion)
SELECT 'Cliente', 'Usuario que consulta el estado de sus vehiculos'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Cliente');

-- =========================================================
-- ESTADOS DE ORDEN
-- =========================================================
INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'Recibido', 'El vehiculo fue recibido en el taller'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'Recibido');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'En espera', 'El vehiculo esta esperando ser atendido'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'En espera');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'En diagnostico', 'El mecanico esta revisando el vehiculo'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado IN ('En diagnostico', 'En diagnostico'));

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'En reparacion', 'El vehiculo esta siendo reparado'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado IN ('En reparacion', 'En reparacion'));

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'Esperando repuestos', 'La reparacion depende de repuestos pendientes'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'Esperando repuestos');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'En prueba', 'El vehiculo esta siendo probado despues del trabajo'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'En prueba');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'Listo para entrega', 'El vehiculo ya esta listo para el cliente'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'Listo para entrega');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'Entregado', 'El vehiculo fue entregado al cliente'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'Entregado');

INSERT INTO estados_orden (nombre_estado, descripcion)
SELECT 'Cancelado', 'La orden fue cancelada'
WHERE NOT EXISTS (SELECT 1 FROM estados_orden WHERE nombre_estado = 'Cancelado');

-- =========================================================
-- SERVICIOS
-- Incluyen intervalos para mantenimiento predictivo.
-- =========================================================
INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Cambio de aceite', 'Cambio de aceite de motor y revision basica', 850.00, 45, 5000, 3, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio = 'Cambio de aceite');

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Cambio de filtro de aire', 'Reemplazo de filtro de aire del motor', 350.00, 30, 10000, 6, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio = 'Cambio de filtro de aire');

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Revision de frenos', 'Inspeccion general del sistema de frenos', 600.00, 60, 10000, NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio IN ('Revision de frenos', 'Revision de frenos'));

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Alineamiento y balanceo', 'Servicio de alineamiento y balanceo de llantas', 900.00, 60, 10000, NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio = 'Alineamiento y balanceo');

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Revision de bateria', 'Diagnostico de carga y estado de bateria', 250.00, 25, NULL, 12, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio IN ('Revision de bateria', 'Revision de bateria'));

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Diagnostico general', 'Revision general del vehiculo', 500.00, 60, NULL, NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio IN ('Diagnostico general', 'Diagnostico general'));

INSERT INTO servicios (nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado)
SELECT 'Cambio de pastillas de freno', 'Cambio de pastillas delanteras o traseras', 1200.00, 90, NULL, NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre_servicio = 'Cambio de pastillas de freno');

-- =========================================================
-- REPUESTOS
-- =========================================================
INSERT INTO repuestos (nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado)
SELECT 'Filtro de aceite', 'Bosch', 'Filtro de aceite estandar', 20, 250.00, 5, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM repuestos WHERE nombre_repuesto = 'Filtro de aceite' AND marca = 'Bosch');

INSERT INTO repuestos (nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado)
SELECT 'Aceite 10W-30', 'Castrol', 'Aceite de motor 10W-30 por cuarto', 30, 180.00, 8, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM repuestos WHERE nombre_repuesto = 'Aceite 10W-30' AND marca = 'Castrol');

INSERT INTO repuestos (nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado)
SELECT 'Filtro de aire', 'Mann Filter', 'Filtro de aire para motor', 15, 320.00, 4, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM repuestos WHERE nombre_repuesto = 'Filtro de aire' AND marca = 'Mann Filter');

INSERT INTO repuestos (nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado)
SELECT 'Pastillas de freno delanteras', 'Brembo', 'Juego de pastillas delanteras', 10, 950.00, 3, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM repuestos WHERE nombre_repuesto = 'Pastillas de freno delanteras' AND marca = 'Brembo');

INSERT INTO repuestos (nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado)
SELECT 'Bateria 12V', 'LTH', 'Bateria automotriz 12V', 6, 2800.00, 2, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM repuestos WHERE nombre_repuesto IN ('Bateria 12V', 'Bateria 12V') AND marca = 'LTH');

COMMIT;
