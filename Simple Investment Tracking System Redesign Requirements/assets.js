/**
 * Script para gerenciamento de ativos no Gestor de Investimentos
 * 
 * Este script gerencia a listagem, edição e exclusão de ativos.
 */

// Configurações globais
const assetsManager = {
    // Estado da aplicação
    state: {
        assets: [],
        filteredAssets: [],
        selectedAsset: null,
        filters: {
            search: '',
            category: 'all'
        },
        sortBy: 'code',
        sortDirection: 'asc'
    },
    
    // Inicialização
    init: function() {
        console.log("Inicializando gerenciador de ativos...");
        // Carregar dados
        this.loadData();
        // Configurar eventos
        this.setupEventListeners();
        // Renderizar tabela
        this.renderTable();
    },
    
    // Carregar dados do localStorage
    loadData: function() {
        try {
            console.log("Carregando dados do localStorage");
            const investmentData = localStorage.getItem('investmentData');
            
            if (investmentData) {
                this.state.assets = JSON.parse(investmentData);
                console.log(`${this.state.assets.length} ativos carregados`);
            } else {
                this.state.assets = [];
                console.log("Nenhum ativo encontrado");
            }
            
            // Aplicar filtros iniciais
            this.applyFilters();
            
            // Atualizar contagem
            this.updateAssetCount();
            
            // Atualizar timestamp
            this.updateLastUpdateTime();
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            this.showError("Erro ao carregar dados: " + error.message);
        }
    },
    
    // Configurar listeners de eventos
    setupEventListeners: function() {
        console.log("Configurando eventos");
        
        // Filtro de pesquisa
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }
        
        // Filtro de categoria
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.state.filters.category = e.target.value;
                this.applyFilters();
            });
        }
        
        // Botão de atualizar preços
        const updatePricesBtn = document.getElementById('updatePricesBtn');
        if (updatePricesBtn) {
            updatePricesBtn.addEventListener('click', () => {
                this.updatePrices();
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
        
        // Botões de ordenação
        const sortButtons = document.querySelectorAll('[data-sort]');
        if (sortButtons.length > 0) {
            sortButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const sortField = e.target.getAttribute('data-sort');
                    this.sortAssets(sortField);
                });
            });
        }
        
        // Botões de edição
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-asset-btn')) {
                const assetIndex = e.target.getAttribute('data-index');
                this.editAsset(assetIndex);
            }
        });
        
        // Botões de exclusão
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-asset-btn')) {
                const assetIndex = e.target.getAttribute('data-index');
                this.confirmDeleteAsset(assetIndex);
            }
        });
        
        // Botão de salvar edição
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.saveEditedAsset();
            });
        }
        
        // Botão de confirmar exclusão
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteAsset();
            });
        }
    },
    
    // Aplicar filtros
    applyFilters: function() {
        console.log("Aplicando filtros:", this.state.filters);
        
        // Filtrar ativos
        this.state.filteredAssets = this.state.assets.filter(asset => {
            // Filtro de pesquisa
            const searchMatch = this.state.filters.search === '' || 
                (asset['Código de Negociação'] && asset['Código de Negociação'].toLowerCase().includes(this.state.filters.search)) ||
                (asset['Nome'] && asset['Nome'].toLowerCase().includes(this.state.filters.search)) ||
                (asset['Corretora'] && asset['Corretora'].toLowerCase().includes(this.state.filters.search));
            
            // Filtro de categoria
            const categoryMatch = this.state.filters.category === 'all' || 
                (asset['Categoria'] && asset['Categoria'] === this.state.filters.category);
            
            return searchMatch && categoryMatch;
        });
        
        // Ordenar ativos
        this.sortAssets(this.state.sortBy, false);
        
        // Renderizar tabela
        this.renderTable();
        
        // Atualizar contagem
        this.updateAssetCount();
    },
    
    // Ordenar ativos
    sortAssets: function(field, toggleDirection = true) {
        console.log("Ordenando por:", field);
        
        // Se o campo for o mesmo, inverter direção
        if (field === this.state.sortBy && toggleDirection) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortBy = field;
            if (toggleDirection) {
                this.state.sortDirection = 'asc';
            }
        }
        
        // Ordenar ativos
        this.state.filteredAssets.sort((a, b) => {
            let valueA, valueB;
            
            // Obter valores para comparação
            switch (field) {
                case 'code':
                    valueA = a['Código de Negociação'] || '';
                    valueB = b['Código de Negociação'] || '';
                    break;
                case 'name':
                    valueA = a['Nome'] || '';
                    valueB = b['Nome'] || '';
                    break;
                case 'quantity':
                    valueA = parseFloat(a['Quantidade']) || 0;
                    valueB = parseFloat(b['Quantidade']) || 0;
                    break;
                case 'price':
                    valueA = parseFloat(a['Preço Atual']) || 0;
                    valueB = parseFloat(b['Preço Atual']) || 0;
                    break;
                case 'value':
                    valueA = parseFloat(a['Valor Atualizado']) || 0;
                    valueB = parseFloat(b['Valor Atualizado']) || 0;
                    break;
                case 'broker':
                    valueA = a['Corretora'] || '';
                    valueB = b['Corretora'] || '';
                    break;
                default:
                    valueA = a['Código de Negociação'] || '';
                    valueB = b['Código de Negociação'] || '';
            }
            
            // Comparar valores
            if (typeof valueA === 'string') {
                if (this.state.sortDirection === 'asc') {
                    return valueA.localeCompare(valueB);
                } else {
                    return valueB.localeCompare(valueA);
                }
            } else {
                if (this.state.sortDirection === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            }
        });
        
        // Atualizar ícones de ordenação
        this.updateSortIcons();
        
        // Renderizar tabela
        this.renderTable();
    },
    
    // Atualizar ícones de ordenação
    updateSortIcons: function() {
        const sortButtons = document.querySelectorAll('[data-sort]');
        
        if (sortButtons.length > 0) {
            sortButtons.forEach(button => {
                // Remover ícones existentes
                button.querySelector('i').className = 'bi bi-arrow-down-up text-muted ms-1';
                
                // Adicionar ícone para o campo atual
                if (button.getAttribute('data-sort') === this.state.sortBy) {
                    if (this.state.sortDirection === 'asc') {
                        button.querySelector('i').className = 'bi bi-sort-alpha-down ms-1';
                    } else {
                        button.querySelector('i').className = 'bi bi-sort-alpha-up ms-1';
                    }
                }
            });
        }
    },
    
    // Renderizar tabela de ativos
    renderTable: function() {
        console.log("Renderizando tabela de ativos");
        const tableBody = document.getElementById('assetsTableBody');
        
        if (!tableBody) {
            console.warn("Elemento assetsTableBody não encontrado");
            return;
        }
        
        // Limpar tabela
        tableBody.innerHTML = '';
        
        // Verificar se há ativos
        if (this.state.filteredAssets.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                        <p class="mb-1">Nenhum ativo encontrado.</p>
                        <p class="text-muted small">Importe seus ativos ou adicione manualmente.</p>
                        <a href="importar.html" class="btn btn-sm btn-primary mt-2">
                            <i class="bi bi-upload me-1"></i> Importar Ativos
                        </a>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // Adicionar linhas
        this.state.filteredAssets.forEach((asset, index) => {
            const row = document.createElement('tr');
            
            // Código
            const codeCell = document.createElement('td');
            codeCell.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="fw-medium">${asset['Código de Negociação'] || '-'}</span>
                </div>
            `;
            row.appendChild(codeCell);
            
            // Nome
            const nameCell = document.createElement('td');
            nameCell.textContent = asset['Nome'] || '-';
            row.appendChild(nameCell);
            
            // Quantidade
            const quantityCell = document.createElement('td');
            quantityCell.textContent = asset['Quantidade'] ? asset['Quantidade'].toLocaleString('pt-BR') : '-';
            row.appendChild(quantityCell);
            
            // Preço
            const priceCell = document.createElement('td');
            priceCell.textContent = asset['Preço Atual'] ? 
                `R$ ${asset['Preço Atual'].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '-';
            row.appendChild(priceCell);
            
            // Valor
            const valueCell = document.createElement('td');
            valueCell.textContent = asset['Valor Atualizado'] ? 
                `R$ ${asset['Valor Atualizado'].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '-';
            row.appendChild(valueCell);
            
            // Corretora
            const brokerCell = document.createElement('td');
            brokerCell.textContent = asset['Corretora'] || '-';
            row.appendChild(brokerCell);
            
            // Ações
            const actionsCell = document.createElement('td');
            actionsCell.className = 'text-end';
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-outline-primary edit-asset-btn" data-index="${index}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1 delete-asset-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
    },
    
    // Atualizar contagem de ativos
    updateAssetCount: function() {
        const assetCount = document.getElementById('assetCount');
        
        if (assetCount) {
            assetCount.textContent = `${this.state.filteredAssets.length} de ${this.state.assets.length} ativos`;
        }
    },
    
    // Atualizar timestamp de última atualização
    updateLastUpdateTime: function() {
        const lastUpdateTime = document.querySelector('.last-update-time');
        
        if (lastUpdateTime) {
            const lastUpdate = localStorage.getItem('lastDataUpdate');
            
            if (lastUpdate) {
                const date = new Date(parseInt(lastUpdate));
                lastUpdateTime.textContent = date.toLocaleString('pt-BR');
            } else {
                lastUpdateTime.textContent = '--/--/---- --:--';
            }
        }
    },
    
    // Atualizar preços
    updatePrices: function() {
        console.log("Atualizando preços...");
        
        // Mostrar spinner
        const updateSpinner = document.getElementById('updateSpinner');
        if (updateSpinner) {
            updateSpinner.classList.remove('d-none');
        }
        
        // Desabilitar botão
        const updatePricesBtn = document.getElementById('updatePricesBtn');
        if (updatePricesBtn) {
            updatePricesBtn.disabled = true;
        }
        
        // Verificar se yahooFinance está disponível
        if (typeof yahooFinance !== 'undefined') {
            // Atualizar preços
            yahooFinance.updateAllPrices()
                .then(updatedAssets => {
                    console.log("Preços atualizados com sucesso");
                    
                    // Atualizar dados
                    this.state.assets = updatedAssets;
                    
                    // Aplicar filtros
                    this.applyFilters();
                    
                    // Atualizar timestamp
                    this.updateLastUpdateTime();
                    
                    // Mostrar mensagem de sucesso
                    this.showSuccess("Preços atualizados com sucesso!");
                    
                    // Esconder spinner
                    if (updateSpinner) {
                        updateSpinner.classList.add('d-none');
                    }
                    
                    // Habilitar botão
                    if (updatePricesBtn) {
                        updatePricesBtn.disabled = false;
                    }
                })
     
(Content truncated due to size limit. Use line ranges to read in chunks)