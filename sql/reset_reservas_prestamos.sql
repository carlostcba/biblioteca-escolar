-- Script de Reinicio Completo de Préstamos y Reservas

-- Desactivar restricciones de clave foránea
EXEC sp_MSforeachTABLE 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

-- Eliminar datos de tablas relacionadas
DELETE FROM Prestamos;
DELETE FROM Reservas;

-- Resetear contadores de identidad
DBCC CHECKIDENT ('Prestamos', RESEED, 0);
DBCC CHECKIDENT ('Reservas', RESEED, 0);

-- Actualizar estado de ejemplares a Disponible
UPDATE Ejemplares 
SET Estado = 'Disponible', 
    FechaActualizacion = GETDATE();

-- Restaurar restricciones de clave foránea
EXEC sp_MSforeachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

-- Opcional: Reiniciar secuencias si es necesario
-- Si usas secuencias en lugar de IDENTITY
-- ALTER SEQUENCE NombreDeLaSecuencia RESTART WITH 1;

-- Mensaje de confirmación
SELECT 'Préstamos y Reservas reiniciados correctamente.' AS Resultado;