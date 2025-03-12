-- Comenzar una transacción para poder revertir cambios si algo falla
BEGIN TRANSACTION;

-- Desactivar temporalmente las restricciones de clave foránea
ALTER TABLE LibroCategorias NOCHECK CONSTRAINT ALL;
ALTER TABLE Ejemplares NOCHECK CONSTRAINT ALL;
ALTER TABLE Libros NOCHECK CONSTRAINT ALL;
ALTER TABLE Categorias NOCHECK CONSTRAINT ALL;
ALTER TABLE Editoriales NOCHECK CONSTRAINT ALL;
ALTER TABLE Autores NOCHECK CONSTRAINT ALL;

-- Primero eliminar los datos de las tablas relacionadas
DELETE FROM LibroCategorias;
DELETE FROM Ejemplares;

-- Ahora eliminar los datos de las tablas principales
DELETE FROM Libros;
DELETE FROM Categorias;
DELETE FROM Editoriales;
DELETE FROM Autores;

-- Restablecer los contadores de identidad
DBCC CHECKIDENT ('Autores', RESEED, 0);
DBCC CHECKIDENT ('Editoriales', RESEED, 0);
DBCC CHECKIDENT ('Categorias', RESEED, 0);
DBCC CHECKIDENT ('Libros', RESEED, 0);
DBCC CHECKIDENT ('Ejemplares', RESEED, 0);

-- Activar nuevamente las restricciones de clave foránea
ALTER TABLE LibroCategorias WITH CHECK CHECK CONSTRAINT ALL;
ALTER TABLE Ejemplares WITH CHECK CHECK CONSTRAINT ALL;
ALTER TABLE Libros WITH CHECK CHECK CONSTRAINT ALL;
ALTER TABLE Categorias WITH CHECK CHECK CONSTRAINT ALL;
ALTER TABLE Editoriales WITH CHECK CHECK CONSTRAINT ALL;
ALTER TABLE Autores WITH CHECK CHECK CONSTRAINT ALL;

-- Si todo ha ido bien, confirmar la transacción
COMMIT TRANSACTION;