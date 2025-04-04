-- Script de Reinicio Completo de Préstamos y Reservas con Logging

-- Crear tabla temporal para logging
CREATE TABLE #ResetLog (
    Operacion NVARCHAR(255),
    Cantidad INT,
    Timestamp DATETIME DEFAULT GETDATE()
);

-- Iniciar transacción
BEGIN TRANSACTION;

-- Logging de estado inicial
INSERT INTO #ResetLog (Operacion, Cantidad)
SELECT 'Préstamos Iniciales', COUNT(*) FROM Prestamos;

INSERT INTO #ResetLog (Operacion, Cantidad)
SELECT 'Reservas Iniciales', COUNT(*) FROM Reservas;

-- Desactivar restricciones de clave foránea
EXEC sp_MSforeachTABLE 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

-- Eliminar datos de tablas relacionadas
DELETE FROM Prestamos;
INSERT INTO #ResetLog (Operacion, Cantidad) 
VALUES ('Préstamos Eliminados', @@ROWCOUNT);

DELETE FROM Reservas;
INSERT INTO #ResetLog (Operacion, Cantidad) 
VALUES ('Reservas Eliminadas', @@ROWCOUNT);

-- Resetear contadores de identidad
DBCC CHECKIDENT ('Prestamos', RESEED, 0);
DBCC CHECKIDENT ('Reservas', RESEED, 0);

-- Actualizar estado de ejemplares a Disponible
UPDATE Ejemplares 
SET Estado = 'Disponible', 
    FechaActualizacion = GETDATE();
INSERT INTO #ResetLog (Operacion, Cantidad) 
VALUES ('Ejemplares Actualizados', @@ROWCOUNT);

-- Restaurar restricciones de clave foránea
EXEC sp_MSforeachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

-- Mostrar log de operaciones
SELECT * FROM #ResetLog;

-- Verificación final
INSERT INTO #ResetLog (Operacion, Cantidad)
SELECT 'Préstamos Finales', COUNT(*) FROM Prestamos;

INSERT INTO #ResetLog (Operacion, Cantidad)
SELECT 'Reservas Finales', COUNT(*) FROM Reservas;

-- Confirmar transacción
COMMIT TRANSACTION;

-- Mostrar log completo
SELECT * FROM #ResetLog ORDER BY Timestamp;

-- Limpiar tabla temporal
DROP TABLE #ResetLog;