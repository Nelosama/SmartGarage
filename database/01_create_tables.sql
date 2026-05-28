BEGIN;

-- =========================================================
-- 1. ROLES
-- =========================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- =========================================================
-- 2. USUARIOS
-- =========================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(25),
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('Activo', 'Inactivo'))
);

-- =========================================================
-- 3. CLIENTES
-- =========================================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    identidad VARCHAR(30) UNIQUE,
    direccion TEXT,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_clientes_usuarios
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================
-- 4. MECANICOS
-- =========================================================
CREATE TABLE IF NOT EXISTS mecanicos (
    id_mecanico SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    especialidad VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'Disponible',

    CONSTRAINT fk_mecanicos_usuarios
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_mecanicos_estado
        CHECK (estado IN ('Disponible', 'Ocupado', 'Inactivo'))
);

-- =========================================================
-- 5. VEHICULOS
-- =========================================================
CREATE TABLE IF NOT EXISTS vehiculos (
    id_vehiculo SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    anio INT,
    color VARCHAR(40),
    vin VARCHAR(50),
    tipo_combustible VARCHAR(30),
    kilometraje_actual INT NOT NULL DEFAULT 0,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_vehiculos_clientes
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_vehiculos_kilometraje
        CHECK (kilometraje_actual >= 0),

    CONSTRAINT chk_vehiculos_anio
        CHECK (anio IS NULL OR anio >= 1900),

    CONSTRAINT uq_vehiculos_id_cliente
        UNIQUE (id_vehiculo, id_cliente)
);

-- =========================================================
-- 6. ESTADOS DE ORDEN
-- =========================================================
CREATE TABLE IF NOT EXISTS estados_orden (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- =========================================================
-- 7. SERVICIOS
-- Aqui tambien dejamos los campos para mantenimiento predictivo.
-- intervalo_km: cada cuantos kilometros se recomienda repetir.
-- intervalo_meses: cada cuantos meses se recomienda repetir.
-- =========================================================
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio SERIAL PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio_base NUMERIC(10,2) NOT NULL DEFAULT 0,
    duracion_estimada_min INT,
    intervalo_km INT,
    intervalo_meses INT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',

    CONSTRAINT chk_servicios_precio
        CHECK (precio_base >= 0),

    CONSTRAINT chk_servicios_duracion
        CHECK (duracion_estimada_min IS NULL OR duracion_estimada_min > 0),

    CONSTRAINT chk_servicios_intervalo_km
        CHECK (intervalo_km IS NULL OR intervalo_km > 0),

    CONSTRAINT chk_servicios_intervalo_meses
        CHECK (intervalo_meses IS NULL OR intervalo_meses > 0),

    CONSTRAINT chk_servicios_estado
        CHECK (estado IN ('Activo', 'Inactivo'))
);

-- =========================================================
-- 8. REPUESTOS
-- =========================================================
CREATE TABLE IF NOT EXISTS repuestos (
    id_repuesto SERIAL PRIMARY KEY,
    nombre_repuesto VARCHAR(100) NOT NULL,
    marca VARCHAR(80),
    descripcion TEXT,
    stock INT NOT NULL DEFAULT 0,
    precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',

    CONSTRAINT chk_repuestos_stock
        CHECK (stock >= 0),

    CONSTRAINT chk_repuestos_precio
        CHECK (precio_unitario >= 0),

    CONSTRAINT chk_repuestos_stock_minimo
        CHECK (stock_minimo >= 0),

    CONSTRAINT chk_repuestos_estado
        CHECK (estado IN ('Activo', 'Inactivo'))
);

-- =========================================================
-- 9. ORDENES DE TRABAJO
-- Tabla central del sistema.
-- =========================================================
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id_orden SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_vehiculo INT NOT NULL,
    id_mecanico INT,
    id_estado_actual INT NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada_entrega TIMESTAMP,
    fecha_entrega TIMESTAMP,
    kilometraje_ingreso INT NOT NULL,
    motivo_ingreso TEXT NOT NULL,
    prioridad VARCHAR(20) NOT NULL DEFAULT 'Media',
    observaciones TEXT,

    CONSTRAINT fk_ordenes_clientes
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ordenes_vehiculos_cliente
        FOREIGN KEY (id_vehiculo, id_cliente)
        REFERENCES vehiculos(id_vehiculo, id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ordenes_mecanicos
        FOREIGN KEY (id_mecanico)
        REFERENCES mecanicos(id_mecanico)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_ordenes_estado_actual
        FOREIGN KEY (id_estado_actual)
        REFERENCES estados_orden(id_estado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_ordenes_kilometraje
        CHECK (kilometraje_ingreso >= 0),

    CONSTRAINT chk_ordenes_prioridad
        CHECK (prioridad IN ('Baja', 'Media', 'Alta'))
);

-- =========================================================
-- 10. DIAGNOSTICOS
-- Un diagnostico principal por orden.
-- =========================================================
CREATE TABLE IF NOT EXISTS diagnosticos (
    id_diagnostico SERIAL PRIMARY KEY,
    id_orden INT NOT NULL UNIQUE,
    falla_reportada TEXT NOT NULL,
    causa_detectada TEXT,
    recomendacion TEXT,
    observaciones TEXT,
    fecha_diagnostico TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_diagnosticos_ordenes
        FOREIGN KEY (id_orden)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================
-- 11. HISTORIAL DE ESTADOS DE ORDEN
-- Trazabilidad del vehiculo.
-- =========================================================
CREATE TABLE IF NOT EXISTS historial_estados_orden (
    id_historial_estado SERIAL PRIMARY KEY,
    id_orden INT NOT NULL,
    id_estado INT NOT NULL,
    id_usuario INT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT,

    CONSTRAINT fk_historial_ordenes
        FOREIGN KEY (id_orden)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_estados
        FOREIGN KEY (id_estado)
        REFERENCES estados_orden(id_estado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_usuarios
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================================================
-- 12. ORDEN_SERVICIOS
-- Relacion muchos a muchos entre ordenes y servicios.
-- =========================================================
CREATE TABLE IF NOT EXISTS orden_servicios (
    id_orden_servicio SERIAL PRIMARY KEY,
    id_orden INT NOT NULL,
    id_servicio INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    observaciones TEXT,

    CONSTRAINT fk_orden_servicios_ordenes
        FOREIGN KEY (id_orden)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_orden_servicios_servicios
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_orden_servicios_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_orden_servicios_precio
        CHECK (precio_unitario >= 0),

    CONSTRAINT uq_orden_servicio
        UNIQUE (id_orden, id_servicio)
);

-- =========================================================
-- 13. ORDEN_REPUESTOS
-- Relacion muchos a muchos entre ordenes y repuestos.
-- =========================================================
CREATE TABLE IF NOT EXISTS orden_repuestos (
    id_orden_repuesto SERIAL PRIMARY KEY,
    id_orden INT NOT NULL,
    id_repuesto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

    CONSTRAINT fk_orden_repuestos_ordenes
        FOREIGN KEY (id_orden)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_orden_repuestos_repuestos
        FOREIGN KEY (id_repuesto)
        REFERENCES repuestos(id_repuesto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_orden_repuestos_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_orden_repuestos_precio
        CHECK (precio_unitario >= 0),

    CONSTRAINT uq_orden_repuesto
        UNIQUE (id_orden, id_repuesto)
);

-- =========================================================
-- 14. FACTURAS
-- Factura basica por orden.
-- =========================================================
CREATE TABLE IF NOT EXISTS facturas (
    id_factura SERIAL PRIMARY KEY,
    id_orden INT NOT NULL UNIQUE,
    numero_factura VARCHAR(30) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal_servicios NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal_repuestos NUMERIC(10,2) NOT NULL DEFAULT 0,
    impuesto NUMERIC(10,2) NOT NULL DEFAULT 0,
    descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    metodo_pago VARCHAR(30),

    CONSTRAINT fk_facturas_ordenes
        FOREIGN KEY (id_orden)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_facturas_montos
        CHECK (
            subtotal_servicios >= 0
            AND subtotal_repuestos >= 0
            AND impuesto >= 0
            AND descuento >= 0
            AND total >= 0
        ),

    CONSTRAINT chk_facturas_estado_pago
        CHECK (estado_pago IN ('Pendiente', 'Pagado', 'Anulado')),

    CONSTRAINT chk_facturas_metodo_pago
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia')
        )
);

-- =========================================================
-- 15. ALERTAS DE MANTENIMIENTO
-- Mantenimiento predictivo simple.
-- =========================================================
CREATE TABLE IF NOT EXISTS alertas_mantenimiento (
    id_alerta SERIAL PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    id_servicio INT NOT NULL,
    id_orden_origen INT,
    fecha_generada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kilometraje_referencia INT,
    kilometraje_objetivo INT,
    fecha_objetivo DATE,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT fk_alertas_vehiculos
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculos(id_vehiculo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_alertas_servicios
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_alertas_orden_origen
        FOREIGN KEY (id_orden_origen)
        REFERENCES ordenes_trabajo(id_orden)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_alertas_kilometraje_referencia
        CHECK (kilometraje_referencia IS NULL OR kilometraje_referencia >= 0),

    CONSTRAINT chk_alertas_kilometraje_objetivo
        CHECK (kilometraje_objetivo IS NULL OR kilometraje_objetivo >= 0),

    CONSTRAINT chk_alertas_estado
        CHECK (estado IN ('Pendiente', 'Completada', 'Cancelada'))
);

-- =========================================================
-- INDICES RECOMENDADOS
-- Mejoran busquedas comunes.
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_rol
    ON usuarios(id_rol);

CREATE INDEX IF NOT EXISTS idx_clientes_usuario
    ON clientes(id_usuario);

CREATE INDEX IF NOT EXISTS idx_mecanicos_usuario
    ON mecanicos(id_usuario);

CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente
    ON vehiculos(id_cliente);

CREATE INDEX IF NOT EXISTS idx_ordenes_cliente
    ON ordenes_trabajo(id_cliente);

CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo
    ON ordenes_trabajo(id_vehiculo);

CREATE INDEX IF NOT EXISTS idx_ordenes_mecanico
    ON ordenes_trabajo(id_mecanico);

CREATE INDEX IF NOT EXISTS idx_ordenes_estado
    ON ordenes_trabajo(id_estado_actual);

CREATE INDEX IF NOT EXISTS idx_historial_orden
    ON historial_estados_orden(id_orden);

CREATE INDEX IF NOT EXISTS idx_alertas_vehiculo
    ON alertas_mantenimiento(id_vehiculo);

COMMIT;