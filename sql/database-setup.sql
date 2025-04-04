-- Crear base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BibliotecaEscolar')
BEGIN
    CREATE DATABASE BibliotecaEscolar;
END
GO

USE BibliotecaEscolar;
GO

-- Tablas principales para catálogo

-- Autores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Autores')
BEGIN
    CREATE TABLE Autores (
        AutorID INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Apellido NVARCHAR(100) NOT NULL,
        Biografia NVARCHAR(MAX) NULL,
        FechaNacimiento DATE NULL,
        Nacionalidad NVARCHAR(50) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaActualizacion DATETIME DEFAULT GETDATE()
    );
END

-- Editoriales
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Editoriales')
BEGIN
    CREATE TABLE Editoriales (
        EditorialID INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Direccion NVARCHAR(MAX) NULL,
        Telefono NVARCHAR(20) NULL,
        Email NVARCHAR(100) NULL,
        SitioWeb NVARCHAR(255) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaActualizacion DATETIME DEFAULT GETDATE()
    );
END

-- Categorías
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categorias')
BEGIN
    CREATE TABLE Categorias (
        CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(MAX) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaActualizacion DATETIME DEFAULT GETDATE()
    );
END

-- Libros
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Libros')
BEGIN
    CREATE TABLE Libros (
        LibroID INT IDENTITY(1,1) PRIMARY KEY,
        ISBN NVARCHAR(20) NULL UNIQUE,
        Titulo NVARCHAR(255) NOT NULL,
        AutorID INT NOT NULL,
        EditorialID INT NOT NULL,
        FechaPublicacion DATE NULL,
        Edicion NVARCHAR(50) NULL,
        Idioma NVARCHAR(50) DEFAULT 'Español',
        Paginas INT NULL,
        Descripcion NVARCHAR(MAX) NULL,
        TablaContenido NVARCHAR(MAX) NULL,
        ImagenPortada NVARCHAR(255) NULL,
        Formato NVARCHAR(20) DEFAULT 'Impreso' CHECK (Formato IN ('Impreso', 'Digital', 'Audiobook', 'Otro')),
        TipoMaterial NVARCHAR(20) DEFAULT 'Libro' CHECK (TipoMaterial IN ('Libro', 'Revista', 'Tesis', 'Manual', 'Otro')),
        ClasificacionDewey NVARCHAR(30) NULL,
        ClasificacionLCC NVARCHAR(30) NULL,
        VisibleEnCatalogo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaActualizacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (AutorID) REFERENCES Autores(AutorID),
        FOREIGN KEY (EditorialID) REFERENCES Editoriales(EditorialID)
    );
END

-- Relación Libro-Categoría
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LibroCategorias')
BEGIN
    CREATE TABLE LibroCategorias (
        LibroID INT NOT NULL,
        CategoriaID INT NOT NULL,
        PRIMARY KEY (LibroID, CategoriaID),
        FOREIGN KEY (LibroID) REFERENCES Libros(LibroID) ON DELETE CASCADE,
        FOREIGN KEY (CategoriaID) REFERENCES Categorias(CategoriaID) ON DELETE CASCADE
    );
END

-- Ejemplares (Items físicos de los libros)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ejemplares')
BEGIN
    CREATE TABLE Ejemplares (
        EjemplarID INT IDENTITY(1,1) PRIMARY KEY,
        LibroID INT NOT NULL,
        CodigoBarras NVARCHAR(50) NOT NULL UNIQUE,
        Signatura NVARCHAR(100) NULL,
        NumeroCopia INT NOT NULL DEFAULT 1,
        Estado NVARCHAR(20) NOT NULL DEFAULT 'Disponible' CHECK (Estado IN ('Disponible', 'Prestado', 'Reservado', 'EnTransito', 'EnCuarentena', 'EnReparacion', 'Extraviado', 'Retirado')),
        Notas NVARCHAR(MAX) NULL,
        FechaAdquisicion DATE NULL,
        Condicion NVARCHAR(20) DEFAULT 'Bueno' CHECK (Condicion IN ('Nuevo', 'Bueno', 'Regular', 'Deteriorado', 'MuyDeteriorado')),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaActualizacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (LibroID) REFERENCES Libros(LibroID)
    );
END

-- Índices para mejorar el rendimiento
CREATE INDEX IX_Libros_Titulo ON Libros(Titulo);
CREATE INDEX IX_Libros_ISBN ON Libros(ISBN);
CREATE INDEX IX_Autores_NombreCompleto ON Autores(Apellido, Nombre);
CREATE INDEX IX_Ejemplares_Estado ON Ejemplares(Estado);
CREATE INDEX IX_Ejemplares_CodigoBarras ON Ejemplares(CodigoBarras);
GO

-- Procedimiento para verificar disponibilidad de un libro
CREATE OR ALTER PROCEDURE VerificarDisponibilidadLibro
    @LibroID INT
AS
BEGIN
    SELECT 
        l.Titulo,
        COUNT(e.EjemplarID) AS EjemplaresTotal,
        SUM(CASE WHEN e.Estado = 'Disponible' THEN 1 ELSE 0 END) AS EjemplaresDisponibles
    FROM Libros l
    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
    WHERE l.LibroID = @LibroID
    GROUP BY l.Titulo;
END;
GO