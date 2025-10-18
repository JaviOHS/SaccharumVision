"""
🍃 SaccharumVision - Utilidades
==============================

Funciones auxiliares para procesamiento de imágenes,
validación de archivos y otras utilidades.
"""

import os
import json
import numpy as np
import tensorflow as tf
from PIL import Image
from werkzeug.utils import secure_filename
import uuid
from config.config import ALLOWED_EXTENSIONS

# Diccionario de traducciones de inglés a español
DISEASE_TRANSLATIONS = {
    'Healthy': 'Saludable',
    'Mosaic': 'Mosaico',
    'RedRot': 'Pudrición Roja',
    'Rust': 'Roya',
    'Yellow': 'Amarillamiento'
}

def translate_disease_name(english_name):
    """
    Traduce el nombre de una enfermedad del inglés al español
    
    Args:
        english_name (str): Nombre en inglés
        
    Returns:
        str: Nombre en español
    """
    return DISEASE_TRANSLATIONS.get(english_name, english_name)

def allowed_file(filename):
    """
    Verifica si el archivo tiene una extensión permitida
    
    Args:
        filename (str): Nombre del archivo a verificar
        
    Returns:
        bool: True si la extensión es válida, False en caso contrario
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    """
    Genera un nombre único y seguro para el archivo
    
    Args:
        original_filename (str): Nombre original del archivo
        
    Returns:
        str: Nombre único del archivo
    """
    filename = secure_filename(original_filename)
    unique_filename = str(uuid.uuid4()) + '_' + filename
    return unique_filename

def preprocess_image(image_path, img_size):
    """
    Preprocesa una imagen para el modelo de ML
    
    Args:
        image_path (str): Ruta de la imagen
        img_size (tuple): Tamaño esperado (width, height)
        
    Returns:
        tf.Tensor or None: Tensor preprocessado o None si hay error
    """
    try:
        # Usar PIL para cargar la imagen
        with Image.open(image_path) as pil_image:
            # Convertir a RGB si es necesario
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Redimensionar usando resampling de alta calidad
            pil_image = pil_image.resize(img_size, Image.Resampling.LANCZOS)
            
            # Convertir a numpy array
            image_array = np.array(pil_image, dtype=np.float32)
            
            # Normalizar a [0, 1]
            image_array = image_array / 255.0
            
            # Añadir dimensión de batch
            image_array = np.expand_dims(image_array, axis=0)
            
            # Convertir a tensor de TensorFlow
            image = tf.constant(image_array)
            
            return image
            
    except Exception as e:
        print(f"❌ Error procesando imagen: {e}")
        return None

def validate_image_file(file):
    """
    Valida que el archivo sea una imagen válida
    
    Args:
        file: Archivo de Flask request
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    # Verificar que existe un archivo
    if not file or file.filename == '':
        return False, 'No se seleccionó ningún archivo'
    
    # Verificar extensión
    if not allowed_file(file.filename):
        return False, f'Tipo de archivo no permitido. Use: {", ".join(ALLOWED_EXTENSIONS)}'
    
    return True, ''

def cleanup_file(filepath):
    """
    Elimina un archivo de forma segura
    
    Args:
        filepath (str): Ruta del archivo a eliminar
        
    Returns:
        bool: True si se eliminó correctamente, False en caso contrario
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        print(f"⚠️ Error eliminando archivo {filepath}: {e}")
        return False

def format_predictions(predictions, classes):
    """
    Formatea las predicciones del modelo en un formato legible
    
    Args:
        predictions: Tensor de predicciones del modelo
        classes (list): Lista de nombres de clases
        
    Returns:
        dict: Diccionario con predicciones formateadas
    """
    try:
        # Aplicar softmax para obtener probabilidades
        probabilities = tf.nn.softmax(predictions[0])
        
        # Crear resultado con porcentajes (traducidos al español)
        results = {}
        for i, class_name in enumerate(classes):
            percentage = float(probabilities[i] * 100)
            spanish_name = translate_disease_name(class_name)
            results[spanish_name] = percentage
        
        # Encontrar clase principal
        predicted_idx = tf.argmax(probabilities)
        predicted_class_english = classes[predicted_idx]
        predicted_class_spanish = translate_disease_name(predicted_class_english)
        confidence = float(probabilities[predicted_idx] * 100)
        
        return {
            'prediccion_principal': predicted_class_spanish,
            'confianza': confidence,
            'todas_probabilidades': results
        }
        
    except Exception as e:
        print(f"❌ Error formateando predicciones: {e}")
        return None

def load_classes_from_file(classes_path, default_classes):
    """
    Carga las clases desde un archivo JSON
    
    Args:
        classes_path (str): Ruta del archivo de clases
        default_classes (list): Clases por defecto si el archivo no existe
        
    Returns:
        list: Lista de clases cargadas
    """
    try:
        if os.path.exists(classes_path):
            with open(classes_path, 'r', encoding='utf-8') as f:
                classes = json.load(f)
            print(f"✅ Clases cargadas desde archivo: {classes_path}")
            return classes
        else:
            print(f"⚠️ Archivo de clases no encontrado, usando clases por defecto")
            return default_classes.copy()
            
    except Exception as e:
        print(f"❌ Error cargando clases desde {classes_path}: {e}")
        print(f"⚠️ Usando clases por defecto")
        return default_classes.copy()

def get_model_input_shape(model):
    """
    Obtiene el tamaño de entrada esperado por el modelo
    
    Args:
        model: Modelo de TensorFlow/Keras
        
    Returns:
        tuple: Tamaño de imagen (width, height) que espera el modelo
    """
    try:
        input_shape = model.input_shape
        if len(input_shape) >= 3:
            detected_size = (input_shape[1], input_shape[2])
            print(f"🔍 Tamaño detectado del modelo: {detected_size}")
            return detected_size
        else:
            default_size = (256, 256)
            print(f"⚠️ No se pudo detectar el tamaño, usando por defecto: {default_size}")
            return default_size
            
    except Exception as e:
        print(f"❌ Error detectando tamaño del modelo: {e}")
        return (256, 256)

def create_response_dict(result, filename, timestamp):
    """
    Crea el diccionario de respuesta para la API
    
    Args:
        result (dict): Resultado de la predicción
        filename (str): Nombre del archivo original
        timestamp (str): Timestamp del análisis
        
    Returns:
        dict: Diccionario de respuesta formateado
    """
    if not result:
        return None
        
    return {
        'success': True,
        'filename': filename,
        'prediccion_principal': result['prediccion_principal'],
        'confianza': round(result['confianza'], 1),
        'todas_probabilidades': {
            k: round(v, 1) for k, v in result['todas_probabilidades'].items()
        },
        'timestamp': timestamp
    }

def validate_model_files(model_path, classes_path):
    """
    Valida que existan los archivos necesarios del modelo
    
    Args:
        model_path (str): Ruta del modelo
        classes_path (str): Ruta del archivo de clases
        
    Returns:
        tuple: (is_valid: bool, errors: list)
    """
    errors = []
    
    # Verificar modelo
    if not os.path.exists(model_path):
        errors.append(f"Modelo no encontrado: {model_path}")
        
        # Buscar modelos alternativos
        model_dir = os.path.dirname(model_path)
        if os.path.exists(model_dir):
            model_files = [f for f in os.listdir(model_dir) if f.endswith('.keras')]
            if model_files:
                errors.append(f"Modelos disponibles: {model_files}")
    
    # Verificar directorio de clases (no es crítico)
    if not os.path.exists(classes_path):
        errors.append(f"Archivo de clases no encontrado: {classes_path} (se usarán clases por defecto)")
    
    # Solo es crítico si no existe el modelo
    is_valid = os.path.exists(model_path)
    
    return is_valid, errors
