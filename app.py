"""
🍃 SaccharumVision - Web Application
===================================

Aplicación web Flask para realizar predicciones de enfermedades
en hojas de caña de azúcar usando el modelo entrenado.

Esta aplicación utiliza:
- Lazy loading del modelo para optimizar el tiempo de inicio
- Arquitectura modular con separación de responsabilidades
- Manejo thread-safe del modelo con patrón Singleton
"""

import os
from flask import Flask, render_template, request, jsonify
from datetime import datetime

# Importar módulos propios
from config.config import config
from utils.utils import (
    validate_image_file, 
    generate_unique_filename, 
    cleanup_file,
    create_response_dict
)
from utils.model_manager import (
    predict_disease,
    get_model_status,
    is_model_ready
)

def create_app(config_name='default'):
    """
    Factory function para crear la aplicación Flask
    
    Args:
        config_name (str): Nombre de la configuración a usar
        
    Returns:
        Flask: Instancia de la aplicación configurada
    """
    app = Flask(__name__)
    
    # Cargar configuración
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Crear directorio de uploads si no existe
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app

# Crear aplicación
app = create_app(os.getenv('FLASK_CONFIG') or 'default')

# ============================
# RUTAS DE LA APLICACIÓN
# ============================
@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Maneja la subida y análisis de archivos con lazy loading del modelo
    """
    # Validar archivo recibido
    file = request.files.get('file')
    is_valid, error_msg = validate_image_file(file)
    
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Verificar que el modelo esté disponible (lazy loading)
    if not is_model_ready():
        return jsonify({'error': 'Modelo no está disponible. Intente nuevamente en unos segundos.'}), 503
    
    filepath = None
    try:
        # Generar nombre único y guardar archivo
        unique_filename = generate_unique_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Realizar predicción (lazy loading automático)
        result = predict_disease(filepath)
        
        if result is None:
            return jsonify({'error': 'Error al procesar la imagen'}), 500
        
        # Crear respuesta formateada
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        response = create_response_dict(result, file.filename, timestamp)
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error en upload: {e}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500
        
    finally:
        # Siempre limpiar el archivo temporal
        if filepath:
            cleanup_file(filepath)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar el estado de la aplicación con lazy loading
    """
    model_status = get_model_status()
    
    status = {
        'status': 'healthy' if model_status['ready'] else 'unhealthy',
        'model_loaded': model_status['model_loaded'],
        'classes_loaded': model_status['classes_loaded'],
        'classes': model_status['classes'],
        'img_size': model_status['img_size'],
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(status)

@app.errorhandler(413)
def too_large(e):
    """Maneja archivos demasiado grandes"""
    return jsonify({'error': 'Archivo demasiado grande. Máximo 16MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    """Maneja páginas no encontradas"""
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    """Maneja errores internos del servidor"""
    return jsonify({'error': 'Error interno del servidor'}), 500

# ============================
# FUNCIÓN PRINCIPAL
# ============================

if __name__ == '__main__':
    print("🍃 SaccharumVision - Aplicación Web")
    print("==================================")
    print("🚀 Iniciando servidor Flask con lazy loading...")
    print("📱 Accede a la aplicación en: http://localhost:5000")
    print("🔍 Estado de la aplicación: http://localhost:5000/health")
    print("⭐ Para detener el servidor: Ctrl+C")
    print("ℹ️  El modelo se cargará automáticamente en la primera predicción")
    
    # Iniciar servidor (el modelo se carga con lazy loading)
    app.run(
        debug=app.config.get('DEBUG', True),
        host=app.config.get('HOST', '0.0.0.0'),
        port=app.config.get('PORT', 5000)
    )
