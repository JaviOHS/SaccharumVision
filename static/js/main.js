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

// Event listeners principales
function initializeEventListeners() {
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
    
    // Actualizar UI
    uploadArea.innerHTML = `
        <div class="text-6xl mb-6 text-teal-600"><i class="fas fa-check-circle"></i></div>
        <h3 class="font-bold text-2xl mb-4 text-slate-800">Archivo Seleccionado</h3>
        <div class="result-card p-6 bg-white max-w-md mx-auto">
            <p class="font-semibold text-lg text-slate-800">${file.name}</p>
            <p class="text-teal-600 font-medium">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
    `;
    
    // Mostrar botón de análisis y reiniciar
    analyzeBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    hideError();
    hideResultsWithAnimation();
}

function analyzeImage() {
    if (!selectedFile) {
        showError('Por favor seleccione una imagen primero.');
        return;
    }

    // Mostrar loading
    showLoading();
    analyzeBtn.disabled = true;

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
        analyzeBtn.disabled = false;

        if (data.error) {
            showError(data.error);
        } else {
            showResults(data);
        }
    })
    .catch(error => {
        hideLoading();
        analyzeBtn.disabled = false;
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

    // Mostrar todas las probabilidades
    const allPredictionsDiv = document.getElementById('allPredictions');
    allPredictionsDiv.innerHTML = '';

    // Ordenar por probabilidad
    const sortedPredictions = Object.entries(data.todas_probabilidades)
        .sort((a, b) => b[1] - a[1]);

    sortedPredictions.forEach(([disease, probability]) => {
        const color = getColorForProbability(probability);
        const predictionItem = document.createElement('div');
        predictionItem.className = 'flex items-center mb-3 p-4 bg-white rounded-lg shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md hover:border-teal-200';
        predictionItem.innerHTML = `
            <div class="font-semibold min-w-[100px] text-slate-800 text-sm">${disease}</div>
            <div class="flex-1 mx-4">
                <div class="progress-bar-scientific h-3">
                    <div class="progress-fill-scientific transition-all duration-1000" style="width: ${probability}%; ${color}"></div>
                </div>
            </div>
            <div class="font-bold min-w-[60px] text-right text-sm ${probability >= 70 ? 'text-teal-700' : probability >= 50 ? 'text-orange-600' : 'text-slate-500'}">${probability}%</div>
        `;
        allPredictionsDiv.appendChild(predictionItem);
    });

    // Mostrar resultados con animación
    showResultsWithAnimation();
    
    // Ocultar botón de análisis y reiniciar, mostrar botón de nuevo análisis
    analyzeBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    newAnalysisBtn.classList.remove('hidden');
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

function resetForm() {
    selectedFile = null;
    fileInput.value = '';
    
    // Manejar botones
    analyzeBtn.classList.add('hidden');
    analyzeBtn.disabled = false;
    resetBtn.classList.add('hidden');
    newAnalysisBtn.classList.add('hidden');
    
    // Resetear el ícono del diagnóstico al estado por defecto
    const iconElement = document.querySelector('.diagnosis-icon');
    if (iconElement) {
        iconElement.classList.remove('healthy', 'warning');
        const iconInner = iconElement.querySelector('i');
        if (iconInner) {
            iconInner.className = 'fas fa-leaf';
        }
    }
    
    uploadArea.innerHTML = `
        <div class="text-6xl mb-6 text-teal-600 relative z-10">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3 class="font-bold text-2xl mb-4 text-slate-800">Cargar Imagen para Análisis</h3>
        <p class="text-slate-600 mb-6 text-lg">Arrastra y suelta tu imagen aquí o selecciona un archivo</p>
        <button type="button" id="uploadBtn" class="btn-scientific">
            <i class="fas fa-image mr-2"></i>Seleccionar Archivo
        </button>
        <div class="mt-6 text-sm text-slate-500">
            <p><i class="fas fa-info-circle mr-1"></i> Formatos: JPG, PNG, BMP, TIFF | Máximo: 16MB</p>
        </div>
    `;
    
    // Re-asignar evento al nuevo botón
    document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());
    
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
