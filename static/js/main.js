// 🍃 SaccharumVision - JavaScript Functions

// Elementos del DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

let selectedFile = null;
let originalUploadContent = null;

// Funciones helper para manejo de UI
const UIManager = {
    showButtons: (...buttons) => {
        buttons.forEach(btn => btn?.classList.remove('hidden'));
    },
    
    hideButtons: (...buttons) => {
        buttons.forEach(btn => btn?.classList.add('hidden'));
    },
    
    setButtonState: (button, disabled = false) => {
        if (button) button.disabled = disabled;
    },
    
    showFileSelected: (file) => {
        const template = document.getElementById('fileSelectedTemplate');
        const clone = template.cloneNode(true);
        clone.id = '';
        clone.classList.remove('hidden');
        
        // Actualizar el contenido con los datos del archivo
        const fileName = clone.querySelector('.file-name');
        const fileSize = clone.querySelector('.file-size');
        
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        
        uploadArea.innerHTML = '';
        uploadArea.appendChild(clone);
    },
    
    createPredictionItem: (disease, probability) => {
        const template = document.getElementById('predictionItemTemplate');
        const clone = template.cloneNode(true);
        clone.id = '';
        clone.classList.remove('hidden');
        
        // Actualizar contenido con los datos de predicción
        const diseaseElement = clone.querySelector('.disease-name');
        const progressBar = clone.querySelector('.probability-bar');
        const percentageElement = clone.querySelector('.probability-value');
        
        if (diseaseElement) diseaseElement.textContent = disease;
        if (progressBar) {
            const color = getColorForProbability(probability);
            progressBar.style.width = `${probability}%`;
            progressBar.style.background = color.replace('background: ', '');
        }
        if (percentageElement) {
            percentageElement.textContent = `${probability}%`;
            // Limpiar clases de color existentes y agregar la nueva
            percentageElement.className = percentageElement.className.replace(/text-(teal|orange|slate)-\d+/g, '');
            const colorClass = probability >= 70 ? 'text-teal-700' : probability >= 50 ? 'text-orange-600' : 'text-slate-500';
            percentageElement.classList.add(colorClass);
        }
        
        return clone;
    }
};

// Event listeners principales
function initializeEventListeners() {
    // Guardar el contenido original del área de upload
    originalUploadContent = uploadArea.innerHTML;
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    analyzeBtn.addEventListener('click', analyzeImage);
    resetBtn.addEventListener('click', resetForm);
    newAnalysisBtn.addEventListener('click', resetForm);

    // Drag and drop eventos
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
        showError('Tipo de archivo no válido. Use JPG, PNG, BMP o TIFF.');
        return;
    }

    // Validar tamaño (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('Archivo demasiado grande. Máximo 16MB.');
        return;
    }

    selectedFile = file;
    
    // Actualizar UI usando UIManager
    UIManager.showFileSelected(file);
    UIManager.showButtons(analyzeBtn, resetBtn);
    hideError();
    hideResultsWithAnimation();
}

function analyzeImage() {
    if (!selectedFile) {
        showError('Por favor seleccione una imagen primero.');
        return;
    }

    // Mostrar loading y deshabilitar botón
    showLoading();
    UIManager.setButtonState(analyzeBtn, true);

    // Crear FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Enviar solicitud
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        UIManager.setButtonState(analyzeBtn, false);

        if (data.error) {
            showError(data.error);
        } else {
            showResults(data);
        }
    })
    .catch(error => {
        hideLoading();
        UIManager.setButtonState(analyzeBtn, false);
        showError('Error de conexión. Verifique que el servidor esté funcionando.');
        console.error('Error:', error);
    });
}

function showResults(data) {
    hideError();
    
    // Mostrar información principal
    document.getElementById('mainDisease').textContent = data.prediccion_principal;
    document.getElementById('mainConfidence').textContent = `Confianza: ${data.confianza}%`;
    document.getElementById('analysisTime').textContent = `Análisis realizado: ${data.timestamp}`;

    // Actualizar el ícono según el diagnóstico
    updateDiagnosisIcon(data.prediccion_principal);

    // Mostrar todas las probabilidades usando UIManager
    const allPredictionsDiv = document.getElementById('allPredictions');
    allPredictionsDiv.innerHTML = '';

    // Ordenar por probabilidad y crear elementos
    const sortedPredictions = Object.entries(data.todas_probabilidades)
        .sort((a, b) => b[1] - a[1]);

    sortedPredictions.forEach(([disease, probability]) => {
        const predictionItem = UIManager.createPredictionItem(disease, probability);
        allPredictionsDiv.appendChild(predictionItem);
    });

    // Mostrar resultados con animación
    showResultsWithAnimation();
    
    // Manejar botones usando UIManager
    UIManager.hideButtons(analyzeBtn, resetBtn);
    UIManager.showButtons(newAnalysisBtn);
}

function updateDiagnosisIcon(diagnosis) {
    const iconElement = document.querySelector('.diagnosis-icon');
    const iconInner = iconElement.querySelector('i');
    
    // Limpiar clases anteriores
    iconElement.classList.remove('healthy', 'warning');
    
    // Determinar si es saludable o enfermedad
    const isHealthy = diagnosis.toLowerCase().includes('sano') || 
                     diagnosis.toLowerCase().includes('saludable') || 
                     diagnosis.toLowerCase().includes('healthy') ||
                     diagnosis.toLowerCase().includes('normal');
    
    if (isHealthy) {
        // Mantener ícono de hoja con estilo saludable
        iconElement.classList.add('healthy');
        iconInner.className = 'fas fa-leaf';
    } else {
        // Cambiar a ícono de advertencia con estilo warning
        iconElement.classList.add('warning');
        iconInner.className = 'fas fa-exclamation-triangle';
    }
}

function getColorForProbability(probability) {
    if (probability >= 70) return 'background: linear-gradient(135deg, #0d9488, #065f46)';
    if (probability >= 50) return 'background: linear-gradient(135deg, #f59e0b, #d97706)';
    if (probability >= 30) return 'background: linear-gradient(135deg, #ef4444, #dc2626)';
    return 'background: linear-gradient(135deg, #94a3b8, #64748b)';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function showLoading() {
    loading.classList.remove('hidden');
    hideError();
    hideResultsWithAnimation();
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showResultsWithAnimation() {
    results.classList.remove('hidden');
    results.classList.remove('hide');
    results.classList.add('show');
}

function hideResultsWithAnimation() {
    if (!results.classList.contains('hidden')) {
        results.classList.remove('show');
        results.classList.add('hide');
        
        // Ocultar después de la animación
        setTimeout(() => {
            results.classList.add('hidden');
            results.classList.remove('hide');
        }, 400); // Duración de la animación fadeOutDown
    } else {
        // No hacer nada si ya está oculto
    }
}

function restoreOriginalUploadArea() {
    if (originalUploadContent) {
        uploadArea.innerHTML = originalUploadContent;
        // Re-asignar evento al botón de upload
        const newUploadBtn = document.getElementById('uploadBtn');
        if (newUploadBtn) {
            newUploadBtn.addEventListener('click', () => fileInput.click());
        }
    }
}

function resetForm() {
    selectedFile = null;
    fileInput.value = '';
    
    // Manejar botones usando UIManager
    UIManager.hideButtons(analyzeBtn, resetBtn, newAnalysisBtn);
    UIManager.setButtonState(analyzeBtn, false);
    
    // Resetear el ícono del diagnóstico al estado por defecto
    const iconElement = document.querySelector('.diagnosis-icon');
    if (iconElement) {
        iconElement.classList.remove('healthy', 'warning');
        const iconInner = iconElement.querySelector('i');
        if (iconInner) {
            iconInner.className = 'fas fa-leaf';
        }
    }
    
    // Restaurar el contenido original del área de upload
    restoreOriginalUploadArea();
    
    hideError();
    hideResultsWithAnimation();
    hideLoading();
}

function checkServerHealth() {
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'healthy') {
                showError('El servidor no está completamente inicializado. Espere un momento y recargue la página.');
            }
        })
        .catch(error => {
            showError('No se puede conectar con el servidor. Verifique que esté funcionando.');
        });
}

// Inicializar la aplicación cuando se carga la página
window.addEventListener('load', () => {
    initializeEventListeners();
    checkServerHealth();
});
