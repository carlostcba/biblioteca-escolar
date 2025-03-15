import pandas as pd
import numpy as np
import random

# Función para generar un ISBN-13 válido
def generar_isbn13():
    # Comenzar con prefijo EAN 978
    isbn = "978"
    
    # Generar 9 dígitos aleatorios (grupo, editor, título)
    for _ in range(9):
        isbn += str(random.randint(0, 9))
    
    # Calcular dígito de control para ISBN-13
    suma = 0
    for i in range(12):
        if i % 2 == 0:  # Posiciones pares (0, 2, 4...)
            suma += int(isbn[i])
        else:  # Posiciones impares (1, 3, 5...)
            suma += int(isbn[i]) * 3
    
    check_digit = (10 - (suma % 10)) % 10
    isbn += str(check_digit)
    
    # Formato con guiones: 978-x-xxx-xxxxx-x
    formatted_isbn = f"{isbn[0:3]}-{isbn[3]}-{isbn[4:7]}-{isbn[7:12]}-{isbn[12]}"
    
    return formatted_isbn

try:
    # Leer el archivo de inventario
    print("Leyendo archivo de inventario...")
    inventario = pd.read_csv("LaSalle_Florida_Completo_Consolidado.csv")
    print(f"Se han leído {len(inventario)} registros correctamente.")

    # Crear un nuevo DataFrame con las columnas requeridas
    nuevo_df = pd.DataFrame()

    # Generar ISBNs únicos
    print("Generando ISBNs...")
    isbns = []
    for _ in range(len(inventario)):
        isbns.append(generar_isbn13())

    # Asignar columnas al nuevo DataFrame
    nuevo_df['ISBN'] = isbns
    nuevo_df['Titulo'] = inventario['Título']
    nuevo_df['Autor'] = inventario['Autor']
    nuevo_df['Editorial'] = inventario['Editorial']
    nuevo_df['FechaPublicacion'] = inventario['Año']  # Año como fecha de publicación
    nuevo_df['Edicion'] = "Primera"  # Valor predeterminado
    nuevo_df['Idioma'] = "Español"  # Valor predeterminado
    nuevo_df['Paginas'] = 0  # Valor predeterminado
    nuevo_df['Descripcion'] = ""  # Valor predeterminado

    # Para la categoría, combinamos CATEGORÍA y EDAD (literatura) si está disponible
    print("Procesando categorías...")
    categorias = []
    for i in range(len(inventario)):
        cat = inventario.loc[i, 'CATEGORÍA']
        edad = inventario.loc[i, 'EDAD (literatura)']
        
        if pd.notna(edad) and str(edad).strip() != '':
            cat_combinada = f"{cat};{edad}"
        else:
            cat_combinada = cat
        
        categorias.append(cat_combinada)

    nuevo_df['Categorias'] = categorias

    # Para los ejemplares, asumimos que cada fila es un ejemplar único
    nuevo_df['Ejemplares'] = 1

    # Guardar el nuevo DataFrame en un archivo CSV
    print("Guardando archivo procesado...")
    nuevo_df.to_csv("Inventario_LSFlorida_Procesado.csv", index=False)

    print("Procesamiento completado. El archivo ha sido guardado como 'Inventario_LSFlorida_Procesado.csv'")
    
except Exception as e:
    print(f"Error durante el procesamiento: {e}")