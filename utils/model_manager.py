"""
🍃 SaccharumVision - Gestor del Modelo
=====================================

Manejo del modelo con lazy loading y gestión de predicciones.
"""

import tensorflow as tf
from threading import Lock
from config.config import MODEL_PATH, CLASSES_PATH, DEFAULT_CLASSES
from utils.utils import (
    load_classes_from_file, 
    get_model_input_shape,
    validate_model_files,
    preprocess_image,
    format_predictions
)

class ModelManager:
    """
    Gestor singleton del modelo con lazy loading
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        """Implementación del patrón Singleton thread-safe"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Inicializa el gestor del modelo"""
        if not hasattr(self, 'initialized'):
            self._model = None
            self._classes = None
            self._img_size = None
            self._loading_lock = Lock()
            self.initialized = True
    
    @property
    def model(self):
        """Getter lazy para el modelo"""
        if self._model is None:
            self._load_model()
        return self._model
    
    @property
    def classes(self):
        """Getter lazy para las clases"""
        if self._classes is None:
            self._load_classes()
        return self._classes
    
    @property
    def img_size(self):
        """Getter lazy para el tamaño de imagen"""
        if self._img_size is None:
            # Necesitamos el modelo para detectar el tamaño
            if self.model is not None:
                self._img_size = get_model_input_shape(self._model)
            else:
                self._img_size = (256, 256)  # Fallback
        return self._img_size
    
    def _load_model(self):
        """
        Carga el modelo de forma thread-safe
        """
        with self._loading_lock:
            if self._model is None:
                try:
                    print("🔄 Cargando modelo...")
                    
                    # Validar archivos antes de cargar
                    is_valid, errors = validate_model_files(MODEL_PATH, CLASSES_PATH)
                    
                    if not is_valid:
                        print("❌ Validación de archivos falló:")
                        for error in errors:
                            print(f"   - {error}")
                        return
                    
                    # Cargar modelo
                    self._model = tf.keras.models.load_model(MODEL_PATH)
                    print(f"✅ Modelo cargado exitosamente: {MODEL_PATH}")
                    
                    # Detectar y establecer tamaño de imagen
                    self._img_size = get_model_input_shape(self._model)
                    
                except Exception as e:
                    print(f"❌ Error cargando modelo: {e}")
                    self._model = None
    
    def _load_classes(self):
        """
        Carga las clases del modelo
        """
        if self._classes is None:
            self._classes = load_classes_from_file(CLASSES_PATH, DEFAULT_CLASSES)
    
    def is_ready(self):
        """
        Verifica si el modelo está listo para usar
        
        Returns:
            bool: True si el modelo y clases están cargados
        """
        return (self.model is not None and 
                self.classes is not None and 
                self.img_size is not None)
    
    def get_status(self):
        """
        Obtiene el estado actual del gestor
        
        Returns:
            dict: Estado del modelo y clases
        """
        return {
            'model_loaded': self._model is not None,
            'classes_loaded': self._classes is not None,
            'img_size': self._img_size,
            'classes': self._classes if self._classes else [],
            'ready': self.is_ready()
        }
    
    def predict(self, image_path):
        """
        Realiza una predicción sobre una imagen
        
        Args:
            image_path (str): Ruta de la imagen a analizar
            
        Returns:
            dict or None: Resultado de la predicción o None si hay error
        """
        # Verificar que el modelo esté listo
        if not self.is_ready():
            print("❌ Modelo no está listo para realizar predicciones")
            return None
        
        try:
            # Preprocesar imagen
            image = preprocess_image(image_path, self.img_size)
            if image is None:
                print("❌ Error en el preprocesamiento de la imagen")
                return None
            
            # Realizar predicción
            print(f"🔍 Realizando predicción...")
            predictions = self._model.predict(image, verbose=0)
            
            # Formatear resultados
            result = format_predictions(predictions, self._classes)
            
            if result:
                print(f"✅ Predicción completada: {result['prediccion_principal']} ({result['confianza']:.1f}%)")
                result['ruta_imagen'] = image_path
            
            return result
            
        except Exception as e:
            print(f"❌ Error en predicción: {e}")
            return None
    
    def reload_model(self):
        """
        Recarga el modelo forzadamente
        """
        print("🔄 Recargando modelo...")
        with self._loading_lock:
            self._model = None
            self._classes = None
            self._img_size = None
        
        # Cargar de nuevo
        return self.is_ready()
    
    def clear_cache(self):
        """
        Limpia la caché del modelo (útil para liberar memoria)
        """
        print("🧹 Limpiando caché del modelo...")
        with self._loading_lock:
            if self._model is not None:
                del self._model
            self._model = None
            self._classes = None
            self._img_size = None

# Instancia global del gestor
model_manager = ModelManager()

# Funciones de conveniencia
def get_model_manager():
    """
    Obtiene la instancia del gestor del modelo
    
    Returns:
        ModelManager: Instancia singleton del gestor
    """
    return model_manager

def predict_disease(image_path):
    """
    Función de conveniencia para realizar predicciones
    
    Args:
        image_path (str): Ruta de la imagen
        
    Returns:
        dict or None: Resultado de la predicción
    """
    return model_manager.predict(image_path)

def is_model_ready():
    """
    Verifica si el modelo está listo
    
    Returns:
        bool: True si está listo
    """
    return model_manager.is_ready()

def get_model_status():
    """
    Obtiene el estado del modelo
    
    Returns:
        dict: Estado del modelo
    """
    return model_manager.get_status()

def init_model():
    """
    Inicializa el modelo (fuerza la carga)
    
    Returns:
        bool: True si se inicializó correctamente
    """
    print("🚀 Inicializando modelo...")
    status = model_manager.is_ready()
    if status:
        print("✅ Modelo inicializado correctamente")
    else:
        print("❌ Error inicializando modelo")
    return status
