-- Consulta directa para convertir reservas completadas a préstamos evitando duplicados
BEGIN TRANSACTION;

-- Variables
DECLARE @BibliotecarioID INT = 1; -- ID del bibliotecario que procesa el préstamo 
DECLARE @DiasPrestamo INT = 14;   -- Duración del préstamo en días

-- Crear una tabla temporal con las reservas a procesar
DECLARE @ReservasAProcesar TABLE (
    ReservaID INT,
    EjemplarID INT,
    UsuarioID INT
);

-- Insertar en la tabla temporal las reservas en estado "completada" 
-- que NO contienen "Convertida a préstamo" en sus notas
INSERT INTO @ReservasAProcesar (ReservaID, EjemplarID, UsuarioID)
SELECT ReservaID, EjemplarID, UsuarioID
FROM Reservas
WHERE Estado = 'completada'
  AND (Notas IS NULL OR Notas NOT LIKE '%Convertida a préstamo%')
  AND NOT EXISTS (
      -- Verificar que no exista ya un préstamo para esta reserva
      SELECT 1 
      FROM Prestamos p
      WHERE p.EjemplarID = Reservas.EjemplarID
        AND p.UsuarioID = Reservas.UsuarioID
        AND p.Notas LIKE '%reserva #' + CAST(Reservas.ReservaID AS NVARCHAR(10)) + '%'
  );

-- Insertar los nuevos préstamos
INSERT INTO Prestamos (
    EjemplarID, 
    UsuarioID, 
    FechaPrestamo, 
    FechaDevolucion, 
    Estado,
    Renovaciones,
    BibliotecarioID,
    Notas,
    FechaCreacion,
    FechaActualizacion
)
SELECT 
    r.EjemplarID,
    r.UsuarioID,
    GETDATE(),
    DATEADD(DAY, @DiasPrestamo, GETDATE()),
    'activo',
    0,
    @BibliotecarioID,
    'Creado a partir de reserva #' + CAST(r.ReservaID AS NVARCHAR(10)),
    GETDATE(),
    GETDATE()
FROM @ReservasAProcesar r;

-- Actualizar el estado de los ejemplares a "Prestado"
UPDATE e
SET e.Estado = 'Prestado',
    e.FechaActualizacion = GETDATE()
FROM Ejemplares e
JOIN @ReservasAProcesar r ON e.EjemplarID = r.EjemplarID
WHERE e.Estado != 'Prestado'; -- Solo actualizar si no está ya prestado

-- Actualizar las notas de las reservas para indicar que se convirtieron a préstamos
UPDATE r
SET r.FechaActualizacion = GETDATE(),
    r.Notas = ISNULL(r.Notas, '') + 
             CASE WHEN r.Notas IS NULL OR LEN(r.Notas) = 0 THEN '' ELSE ' | ' END +
             'Convertida a préstamo'
FROM Reservas r
JOIN @ReservasAProcesar p ON r.ReservaID = p.ReservaID;

-- Mostrar resultados
SELECT 
    r.ReservaID,
    'Convertida a préstamo' AS Accion
FROM @ReservasAProcesar r;

COMMIT TRANSACTION;