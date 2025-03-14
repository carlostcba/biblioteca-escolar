import pandas as pd
import sys
import os

def consolidar_inventario(ruta_archivo, ruta_salida=None):
    """
    Procesa un archivo Excel de inventario de biblioteca para consolidar libros con el mismo título,
    actualiza la columna de ejemplares con el conteo total.
    
    Args:
        ruta_archivo (str): Ruta al archivo Excel de inventario
        ruta_salida (str, opcional): Ruta para guardar el archivo consolidado. Si no se proporciona,
                                     se guardará en el mismo directorio con el sufijo '_consolidado'
    
    Returns:
        dict: Estadísticas del proceso
    """
    try:
        # Generar ruta de salida si no se proporcionó
        if ruta_salida is None:
            nombre_base, extension = os.path.splitext(ruta_archivo)
            ruta_salida = f"{nombre_base}_consolidado{extension}"
        
        print(f"Procesando archivo: {ruta_archivo}")
        print("Leyendo datos...")
        
        # Leer el archivo Excel
        df = pd.read_excel(ruta_archivo)
        
        # Verificar que existan las columnas necesarias
        if 'Título' not in df.columns:
            print("Error: El archivo no contiene una columna 'Título'")
            return None
        
        if 'EJEMPLAR' not in df.columns:
            print("Error: El archivo no contiene una columna 'EJEMPLAR'")
            return None
        
        # Guardar el número original de registros
        registros_originales = len(df)
        print(f"Total de registros originales: {registros_originales}")
        
        # Limpiar y normalizar títulos
        df['Título'] = df['Título'].astype(str).str.strip()
        
        # Filtrar registros sin título
        df = df[df['Título'] != 'nan'].copy()
        df = df[df['Título'] != ''].copy()
        
        print("Agrupando por título y contando ejemplares...")
        
        # Contar ejemplares por título
        conteo_ejemplares = df.groupby('Título').size().reset_index(name='NumEjemplares')
        
        # Crear DataFrame consolidado con una fila por título
        df_consolidado = df.drop_duplicates(subset=['Título']).copy()
        
        # Fusionar con el conteo de ejemplares
        df_consolidado = pd.merge(df_consolidado, conteo_ejemplares, on='Título', how='left')
        
        # Actualizar la columna EJEMPLAR con el número de ejemplares
        df_consolidado['EJEMPLAR'] = df_consolidado['NumEjemplares']
        
        # Eliminar la columna temporal de conteo
        df_consolidado = df_consolidado.drop('NumEjemplares', axis=1)
        
        # Ordenar por título para facilitar la localización
        df_consolidado = df_consolidado.sort_values('Título')
        
        # Calcular estadísticas
        titulos_unicos = len(df_consolidado)
        df_multiples = df_consolidado[df_consolidado['EJEMPLAR'] > 1]
        titulos_multiples = len(df_multiples)
        
        print(f"Títulos únicos encontrados: {titulos_unicos}")
        print(f"Títulos con múltiples ejemplares: {titulos_multiples}")
        
        # Mostrar algunos ejemplos de títulos con múltiples ejemplares
        if titulos_multiples > 0:
            print("\nEjemplos de títulos con múltiples ejemplares:")
            ejemplos = df_multiples.sort_values('EJEMPLAR', ascending=False).head(10)
            for _, row in ejemplos.iterrows():
                print(f"  \"{row['Título']}\" - {int(row['EJEMPLAR'])} ejemplares")
        
        # Guardar archivo consolidado
        print(f"\nGuardando archivo consolidado: {ruta_salida}")
        df_consolidado.to_excel(ruta_salida, index=False)
        
        print("¡Proceso completado con éxito!")
        
        return {
            "registros_originales": registros_originales,
            "titulos_unicos": titulos_unicos,
            "titulos_multiples": titulos_multiples,
            "ruta_salida": ruta_salida
        }
        
    except Exception as e:
        print(f"Error al procesar el archivo: {str(e)}")
        return None

if __name__ == "__main__":
    # Si se ejecuta como script, tomar el archivo de los argumentos
    if len(sys.argv) > 1:
        archivo_entrada = sys.argv[1]
        archivo_salida = sys.argv[2] if len(sys.argv) > 2 else None
        consolidar_inventario(archivo_entrada, archivo_salida)
    else:
        print("Uso: python consolidar_inventario.py ruta_archivo_entrada [ruta_archivo_salida]")
        
        # Ejemplo de uso interactivo
        print("\nEjemplo interactivo:")
        ruta = input("Ingrese la ruta del archivo Excel de inventario: ")
        if ruta:
            consolidar_inventario(ruta)
