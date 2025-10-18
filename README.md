# 🍃 SaccharumVision

Aplicación web Flask para el análisis inteligente de enfermedades en hojas de caña de azúcar usando inteligencia artificial.

## 📋 Características

- **Interfaz Web Moderna**: Diseño responsivo y fácil de usar
- **Análisis con IA**: Predicción de enfermedades usando modelo TensorFlow
- **Resultados Detallados**: Probabilidades para todas las clases de enfermedades
- **Validación de Archivos**: Verificación de formato y tamaño
- **Responsive Design**: Compatible con dispositivos móviles

## 🔬 Enfermedades Detectadas

- **Healthy** (Saludable)
- **Mosaic** (Mosaico)
- **RedRot** (Pudrición Roja)
- **Rust** (Roya)
- **Yellow** (Amarillamiento)

## 🛠️ Instalación

### Prerrequisitos

- Python 3.8 o superior
- pip (administrador de paquetes de Python)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd SaccharumVision
   ```

2. **Crear entorno virtual (recomendado)**
   ```bash
   python -m venv .venv
   
   # Activar en Windows:
   .venv\Scripts\activate
   
   # Activar en Linux/Mac:
   source .venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Entrenar y obtener el modelo**
   
   **Importante:** Los archivos del modelo no están incluidos en el repositorio debido a su tamaño.
   
   Para obtener el modelo entrenado:
   
   1. **Entrenar el modelo** usando el siguiente notebook de Google Colab:
      
      [📓 Abrir Notebook en Google Colab](https://drive.google.com/file/d/1m7BITiF2BjOoddwkzuBfV9WMHYP6kSHx/view?usp=sharing)
   
   2. **Ejecutar todas las celdas** del notebook para entrenar el modelo
   
   3. **Descargar los archivos generados** y colocarlos en la carpeta `models/`:
      - `models/saccharum_vision_latest.keras`
      - `models/saccharum_classes_latest.json`
   
   **Nota:** Estos archivos son necesarios para el funcionamiento de la aplicación.

## 🚀 Uso

### Iniciar la Aplicación

```bash
python app.py
```

La aplicación estará disponible en: http://localhost:5000

**Nota:** El modelo se carga automáticamente en la primera predicción (lazy loading) para optimizar el tiempo de inicio.

### Endpoints Disponibles

- **`/`** - Página principal con interfaz de usuario
- **`/upload`** - POST para subir y analizar imágenes

### Usar la Aplicación

1. **Abrir la aplicación** en tu navegador
2. **Subir una imagen** de una hoja de caña de azúcar:
   - Arrastra y suelta la imagen en el área designada
   - O haz clic en "Seleccionar Archivo"
3. **Hacer clic en "Analizar Imagen"**
4. **Ver los resultados** con la predicción y probabilidades

## 📁 Estructura del Proyecto

## ⚙️ Configuración

### Parámetros Principales (en `app.py`)

```python
IMG_SIZE = (256, 256)                    # Tamaño de imagen para el modelo
MODEL_PATH = 'models/saccharum_vision_latest.keras'
CLASSES_PATH = 'models/saccharum_classes_latest.json'
UPLOAD_FOLDER = 'uploads'                # Directorio temporal
MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # Tamaño máximo: 16MB
```

### Formatos de Imagen Soportados

- JPG/JPEG
- PNG
- BMP
- TIFF

## 🔧 Solución de Problemas

### Error: Modelo no encontrado

```
❌ ERROR: Modelo no encontrado: models/saccharum_vision_latest.keras
```

**Solución**: Verifica que el archivo del modelo esté en la carpeta `models/`

### Error: No se puede conectar con el servidor

**Solución**: 
1. Verifica que el servidor esté ejecutándose
2. Revisa que no haya errores en la consola
3. Asegúrate de que el puerto 5000 esté disponible

### Error: Archivo demasiado grande

**Solución**: Reduce el tamaño de la imagen a menos de 16MB

### Error de dependencias

**Solución**: 
```bash
pip install --upgrade -r requirements.txt
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. 
