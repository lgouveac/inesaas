/**
 * Script para processamento de arquivos CSV e Excel no Gestor de Investimentos
 * 
 * Este script gerencia o upload, processamento e importação de dados de investimentos.
 */

// Configurações globais
const fileProcessor = {
    // Estado da aplicação
    state: {
        files: [],
        currentFile: null,
        sheets: [],
        currentSheet: null,
        previewData: null,
        mappedData: [],
        columnMapping: {
            code: '',
            name: '',
            quantity: '',
            price: '',
            broker: ''
        },
        importAllSheets: false,
        processedSheets: [],
        validationErrors: []
    },
    
    // Inicialização
    init: function() {
        console.log("Inicializando processador de arquivos...");
        // Carregar bibliotecas necessárias
        this.loadDependencies();
        // Configurar eventos
        this.setupEventListeners();
    },

    // Carregar bibliotecas necessárias
    loadDependencies: function() {
        // Verificar se as bibliotecas estão disponíveis
        if (typeof Papa === 'undefined') {
            console.log("Carregando PapaParse para processamento CSV...");
            const papaParse = document.createElement('script');
            papaParse.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
            papaParse.onload = () => console.log("PapaParse carregado com sucesso");
            papaParse.onerror = (e) => console.error("Erro ao carregar PapaParse:", e);
            document.head.appendChild(papaParse);
        }
        
        if (typeof XLSX === 'undefined') {
            console.log("Carregando SheetJS para processamento Excel...");
            const sheetJS = document.createElement('script');
            sheetJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            sheetJS.onload = () => console.log("SheetJS carregado com sucesso");
            sheetJS.onerror = (e) => console.error("Erro ao carregar SheetJS:", e);
            document.head.appendChild(sheetJS);
        }
    },
    
    // Configurar listeners de eventos
    setupEventListeners: function() {
        console.log("Configurando eventos...");
        // Input de arquivo
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            console.log("Configurando evento de upload de arquivo");
            fileInput.addEventListener('change', (e) => {
                console.log("Arquivo selecionado:", e.target.files);
                this.handleFileUpload(e);
            });
        } else {
            console.warn("Elemento fileInput não encontrado");
        }
        
        // Seletor de aba
        const sheetSelector = document.getElementById('sheetSelector');
        if (sheetSelector) {
            sheetSelector.addEventListener('change', (e) => {
                this.selectSheet(e.target.value);
            });
        }
        
        // Checkbox para importar todas as abas
        const importAllSheetsCheckbox = document.getElementById('importAllSheets');
        if (importAllSheetsCheckbox) {
            importAllSheetsCheckbox.addEventListener('change', (e) => {
                this.state.importAllSheets = e.target.checked;
                
                // Desabilitar seletor de aba se importar todas estiver marcado
                if (sheetSelector) {
                    sheetSelector.disabled = e.target.checked;
                }
                
                // Se marcado, mostrar mensagem de aviso
                const allSheetsWarning = document.getElementById('allSheetsWarning');
                if (allSheetsWarning) {
                    allSheetsWarning.classList.toggle('d-none', !e.target.checked);
                }
                
                // Se marcado, mostrar prévia de todas as abas
                if (e.target.checked) {
                    this.showAllSheetsPreview();
                } else {
                    this.showPreview(); // Mostrar apenas a aba atual
                }
            });
        }
        
        // Botão de importar
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Botão de voltar
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.resetState();
                this.showUploadForm();
            });
        }
        
        // Botão de adicionar manualmente
        const addManuallyBtn = document.getElementById('addManuallyBtn');
        if (addManuallyBtn) {
            addManuallyBtn.addEventListener('click', () => {
                this.showManualForm();
            });
        }
        
        // Botão de salvar ativo manual
        const saveManualAssetBtn = document.getElementById('saveManualAssetBtn');
        if (saveManualAssetBtn) {
            saveManualAssetBtn.addEventListener('click', () => {
                this.saveManualAsset();
            });
        }
        
        // Botão de cancelar adição manual
        const cancelManualBtn = document.getElementById('cancelManualBtn');
        if (cancelManualBtn) {
            cancelManualBtn.addEventListener('click', () => {
                this.showUploadForm();
            });
        }
        
        // Seletores de mapeamento de colunas
        const columnSelectors = document.querySelectorAll('[data-mapping]');
        if (columnSelectors.length > 0) {
            columnSelectors.forEach(selector => {
                selector.addEventListener('change', (e) => {
                    const field = e.target.getAttribute('data-mapping');
                    this.state.columnMapping[field] = e.target.value;
                    
                    // Atualizar prévia com base no novo mapeamento
                    if (this.state.importAllSheets) {
                        this.showAllSheetsPreview();
                    } else {
                        this.updatePreview();
                    }
                });
            });
        }
        
        // Botão de limpar carteira
        const clearPortfolioBtn = document.getElementById('clearPortfolioBtn');
        if (clearPortfolioBtn) {
            clearPortfolioBtn.addEventListener('click', () => {
                this.confirmClearPortfolio();
            });
        }
        
        // Botão de confirmar limpeza
        const confirmClearBtn = document.getElementById('confirmClearBtn');
        if (confirmClearBtn) {
            confirmClearBtn.addEventListener('click', () => {
                this.clearPortfolio();
            });
        }
        
        // Botão de verificar todas as abas
        const validateAllSheetsBtn = document.getElementById('validateAllSheetsBtn');
        if (validateAllSheetsBtn) {
            validateAllSheetsBtn.addEventListener('click', () => {
                this.validateAllSheets();
            });
        }
    },
    
    // Manipular upload de arquivo
    handleFileUpload: function(event) {
        console.log("Processando upload de arquivo...");
        const files = event.target.files;
        
        if (files.length === 0) {
            console.warn("Nenhum arquivo selecionado");
            return;
        }
        
        // Armazenar arquivos
        this.state.files = Array.from(files);
        this.state.currentFile = this.state.files[0];
        
        console.log("Arquivo selecionado:", this.state.currentFile.name);
        
        // Mostrar spinner
        const uploadSpinner = document.getElementById('uploadSpinner');
        if (uploadSpinner) {
            uploadSpinner.classList.remove('d-none');
        }
        
        // Limpar erros anteriores
        this.state.validationErrors = [];
        
        // Verificar se as bibliotecas estão carregadas
        if (typeof Papa === 'undefined' || typeof XLSX === 'undefined') {
            console.log("Aguardando carregamento das bibliotecas...");
            setTimeout(() => {
                this.processFile(this.state.currentFile);
            }, 1000);
        } else {
            // Processar arquivo
            this.processFile(this.state.currentFile);
        }
    },
    
    // Processar arquivo
    processFile: function(file) {
        console.log("Processando arquivo:", file.name);
        // Verificar tipo de arquivo
        const fileType = this.getFileType(file);
        console.log("Tipo de arquivo detectado:", fileType);
        
        if (fileType === 'csv') {
            this.processCSV(file);
        } else if (fileType === 'excel') {
            this.processExcel(file);
        } else {
            this.showError('Tipo de arquivo não suportado. Por favor, envie um arquivo CSV ou Excel (.xls, .xlsx).');
        }
    },
    
    // Processar arquivo CSV
    processCSV: function(file) {
        console.log("Processando arquivo CSV:", file.name);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                console.log("Conteúdo CSV carregado, tamanho:", content.length);
                
                // Verificar se Papa está disponível
                if (typeof Papa === 'undefined') {
                    console.error("Biblioteca Papa Parse não está disponível");
                    this.showError('Erro: Biblioteca de processamento CSV não está disponível. Por favor, recarregue a página.');
                    return;
                }
                
                // Usar Papa Parse para processar CSV
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        console.log("CSV processado com sucesso:", results.data.length, "linhas");
                        
                        // Verificar se há dados
                        if (results.data.length === 0) {
                            this.showError('O arquivo CSV não contém dados.');
                            return;
                        }
                        
                        // Verificar se há colunas
                        if (Object.keys(results.data[0]).length === 0) {
                            this.showError('O arquivo CSV não contém colunas válidas.');
                            return;
                        }
                        
                        // Armazenar dados
                        this.state.sheets = [{
                            name: 'Principal',
                            data: results.data,
                            columns: Object.keys(results.data[0]),
                            valid: true,
                            errors: []
                        }];
                        
                        this.state.currentSheet = this.state.sheets[0];
                        this.state.processedSheets = [this.state.sheets[0].name];
                        
                        // Mostrar seletor de abas
                        this.showSheetSelector();
                        
                        // Mostrar prévia
                        this.showPreview();
                    },
                    error: (error) => {
                        console.error("Erro ao processar CSV:", error);
                        this.showError('Erro ao processar arquivo CSV: ' + error.message);
                    }
                });
            } catch (error) {
                console.error("Erro ao ler arquivo CSV:", error);
                this.showError('Erro ao ler arquivo CSV: ' + error.message);
            }
        };
        
        reader.onerror = (error) => {
            console.error("Erro na leitura do arquivo:", error);
            this.showError('Erro ao ler arquivo CSV.');
        };
        
        reader.readAsText(file);
    },
    
    // Processar arquivo Excel
    processExcel: function(file) {
        console.log("Processando arquivo Excel:", file.name);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                console.log("Conteúdo Excel carregado, tamanho:", data.length);
                
                // Verificar se XLSX está disponível
                if (typeof XLSX === 'undefined') {
                    console.error("Biblioteca SheetJS não está disponível");
                    this.showError('Erro: Biblioteca de processamento Excel não está disponível. Por favor, recarregue a página.');
                    return;
                }
                
                const workbook = XLSX.read(data, { type: 'array' });
                console.log("Excel processado com sucesso, abas:", workbook.SheetNames);
                
                // Obter nomes das abas
                const sheetNames = workbook.SheetNames;
                
                if (sheetNames.length === 0) {
                    this.showError('O arquivo Excel não contém abas.');
                    return;
                }
                
                // Processar cada aba
                this.state.sheets = sheetNames.map(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    console.log(`Aba ${sheetName}: ${sheetData.length} linhas`);
                    
                    // Verificar se há dados
                    const valid = sheetData.length > 0;
                    const errors = [];
                    
                    if (sheetData.length === 0) {
                        errors.push(`A aba "${sheetName}" não contém dados.`);
                    }
                    
                    return {
                        name: sheetName,
                        data: sheetData,
                        columns: sheetData.length > 0 ? Object.keys(sheetData[0]) : [],
                        valid: valid,
                        errors: errors
                    };
                });
                
                // Filtrar abas válidas
                const validSheets = this.state.sheets.filter(sheet => sheet.valid);
                
                if (validSheets.length === 0) {
                    this.showError('Nenhuma aba válida encontrada no arquivo Excel.');
                    return;
                }
                
                // Selecionar primeira aba válida
                this.state.currentSheet = validSheets[0];
                this.state.processedSheets = [this.state.currentSheet.name];
                
                // Mostrar seletor de abas
                this.showSheetSelector();
                
                // Mostrar prévia
                this.showPreview();
            } catch (error) {
                console.error("Erro ao processar Excel:", error);
                this.showError('Erro ao processar arquivo Excel: ' + error.message);
            }
        };
        
        reader.onerror = (error) => {
            console.error("Erro na leitura do arquivo:", error);
            this.showError('Erro ao ler arquivo Excel.');
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    // Mostrar seletor de abas
    showSheetSelector: function() {
        console.log("Mostrando seletor de abas");
        // Esconder spinner
        const uploadSpinner = document.getElementById('uploadSpinner');
        if (uploadSpinner) {
            uploadSpinner.classList.add('d-none');
        }
        
        // Mostrar seção de seleção de aba
        const sheetSection = document.getElementById('sheetSection');
        if (sheetSection) {
     
(Content truncated due to size limit. Use line ranges to read in chunks)