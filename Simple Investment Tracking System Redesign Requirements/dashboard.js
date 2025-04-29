/**
 * Script para exibição do dashboard no Gestor de Investimentos
 * 
 * Este script gerencia a visualização e análise da carteira de investimentos.
 */

// Configurações globais
const dashboard = {
    // Estado da aplicação
    state: {
        assets: [],
        totalValue: 0,
        categories: {},
        brokers: {},
        benchmarks: {},
        charts: {}
    },
    
    // Inicialização
    init: function() {
        console.log("Inicializando dashboard...");
        // Carregar dados
        this.loadData();
        // Configurar eventos
        this.setupEventListeners();
        // Renderizar dashboard
        this.renderDashboard();
    },
    
    // Carregar dados do localStorage
    loadData: function() {
        try {
            console.log("Carregando dados do localStorage");
            const investmentData = localStorage.getItem('investmentData');
            
            if (investmentData) {
                this.state.assets = JSON.parse(investmentData);
                console.log(`${this.state.assets.length} ativos carregados`);
                
                // Calcular valor total
                this.calculateTotalValue();
                
                // Agrupar por categoria
                this.groupByCategory();
                
                // Agrupar por corretora
                this.groupByBroker();
                
                // Carregar benchmarks
                this.loadBenchmarks();
                
                // Atualizar timestamp
                this.updateLastUpdateTime();
            } else {
                this.state.assets = [];
                console.log("Nenhum ativo encontrado");
                
                // Mostrar mensagem de carteira vazia
                this.showEmptyPortfolio();
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            this.showError("Erro ao carregar dados: " + error.message);
        }
    },
    
    // Configurar listeners de eventos
    setupEventListeners: function() {
        console.log("Configurando eventos");
        
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
    },
    
    // Calcular valor total da carteira
    calculateTotalValue: function() {
        console.log("Calculando valor total da carteira");
        this.state.totalValue = this.state.assets.reduce((total, asset) => {
            const value = asset['Valor Atualizado'] || asset['Quantidade'] * asset['Preço Atual'] || 0;
            return total + value;
        }, 0);
        
        console.log("Valor total da carteira:", this.state.totalValue);
    },
    
    // Agrupar ativos por categoria
    groupByCategory: function() {
        console.log("Agrupando ativos por categoria");
        this.state.categories = {};
        
        // Categorias padrão
        const defaultCategories = {
            'acoes_br': { name: 'Ações Brasil', value: 0, color: '#4e73df' },
            'acoes_eua': { name: 'Ações EUA', value: 0, color: '#1cc88a' },
            'fii': { name: 'Fundos Imobiliários', value: 0, color: '#36b9cc' },
            'rf_pre': { name: 'Renda Fixa Pré', value: 0, color: '#f6c23e' },
            'rf_pos': { name: 'Renda Fixa Pós', value: 0, color: '#e74a3b' },
            'rf_ipca': { name: 'Renda Fixa IPCA+', value: 0, color: '#fd7e14' },
            'cripto': { name: 'Criptomoedas', value: 0, color: '#6f42c1' },
            'outros': { name: 'Outros', value: 0, color: '#858796' }
        };
        
        // Inicializar categorias
        this.state.categories = JSON.parse(JSON.stringify(defaultCategories));
        
        // Agrupar ativos
        this.state.assets.forEach(asset => {
            const value = asset['Valor Atualizado'] || asset['Quantidade'] * asset['Preço Atual'] || 0;
            const category = asset['Categoria'] || this.detectCategory(asset);
            
            if (this.state.categories[category]) {
                this.state.categories[category].value += value;
            } else {
                this.state.categories['outros'].value += value;
            }
        });
        
        // Remover categorias vazias
        Object.keys(this.state.categories).forEach(key => {
            if (this.state.categories[key].value === 0) {
                delete this.state.categories[key];
            }
        });
        
        console.log("Categorias:", this.state.categories);
    },
    
    // Detectar categoria do ativo
    detectCategory: function(asset) {
        const code = asset['Código de Negociação'] || '';
        
        // Fundos Imobiliários
        if (code.endsWith('11') && code.length === 6) {
            return 'fii';
        }
        
        // Ações Brasil
        if (code.length === 5 || code.length === 6) {
            return 'acoes_br';
        }
        
        // Ações EUA
        if (code.indexOf('.') === -1 && code.toUpperCase() === code) {
            return 'acoes_eua';
        }
        
        // Criptomoedas
        if (code.endsWith('USD') || code.endsWith('BTC') || code.endsWith('ETH')) {
            return 'cripto';
        }
        
        return 'outros';
    },
    
    // Agrupar ativos por corretora
    groupByBroker: function() {
        console.log("Agrupando ativos por corretora");
        this.state.brokers = {};
        
        // Cores para corretoras
        const colors = [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#fd7e14', '#6f42c1', '#20c997', '#6610f2', '#6c757d'
        ];
        
        // Agrupar ativos
        this.state.assets.forEach(asset => {
            const value = asset['Valor Atualizado'] || asset['Quantidade'] * asset['Preço Atual'] || 0;
            const broker = asset['Corretora'] || asset['Instituição'] || 'Não informada';
            
            if (this.state.brokers[broker]) {
                this.state.brokers[broker].value += value;
            } else {
                const colorIndex = Object.keys(this.state.brokers).length % colors.length;
                this.state.brokers[broker] = {
                    name: broker,
                    value: value,
                    color: colors[colorIndex]
                };
            }
        });
        
        console.log("Corretoras:", this.state.brokers);
    },
    
    // Carregar benchmarks
    loadBenchmarks: function() {
        console.log("Carregando benchmarks");
        
        // Benchmarks padrão
        this.state.benchmarks = {
            'CDI': { name: 'CDI', value: 10.65, color: '#4e73df' },
            'IBOV': { name: 'Ibovespa', value: 15.03, color: '#1cc88a' },
            'IFIX': { name: 'IFIX', value: 8.47, color: '#36b9cc' },
            'S&P500': { name: 'S&P 500', value: 24.80, color: '#f6c23e' },
            'NASDAQ': { name: 'NASDAQ', value: 30.22, color: '#e74a3b' },
            'BITCOIN': { name: 'Bitcoin', value: 62.44, color: '#6f42c1' }
        };
        
        // Verificar se há dados de benchmarks no cache
        const benchmarkCache = localStorage.getItem('benchmarkCache');
        const lastBenchmarkUpdate = localStorage.getItem('lastBenchmarkUpdate');
        
        if (benchmarkCache && lastBenchmarkUpdate) {
            const cacheAge = Date.now() - parseInt(lastBenchmarkUpdate);
            
            // Usar cache se tiver menos de 24 horas
            if (cacheAge < 24 * 60 * 60 * 1000) {
                try {
                    const cachedBenchmarks = JSON.parse(benchmarkCache);
                    this.state.benchmarks = cachedBenchmarks;
                    console.log("Benchmarks carregados do cache");
                    return;
                } catch (error) {
                    console.error("Erro ao carregar benchmarks do cache:", error);
                }
            }
        }
        
        // Se não houver cache válido, tentar atualizar
        this.updateBenchmarks();
    },
    
    // Atualizar benchmarks
    updateBenchmarks: function() {
        console.log("Atualizando benchmarks...");
        
        // Verificar se yahooFinance está disponível
        if (typeof yahooFinance !== 'undefined') {
            // Símbolos dos benchmarks
            const symbols = {
                'CDI': '^CDI',
                'IBOV': '^BVSP',
                'IFIX': 'IFIX.SA',
                'S&P500': '^GSPC',
                'NASDAQ': '^IXIC',
                'BITCOIN': 'BTC-USD'
            };
            
            // Atualizar cada benchmark
            const promises = Object.keys(symbols).map(key => {
                return yahooFinance.getStockData(symbols[key])
                    .then(data => {
                        if (data && data.regularMarketChangePercent) {
                            this.state.benchmarks[key].value = data.regularMarketChangePercent;
                        }
                        return data;
                    })
                    .catch(error => {
                        console.error(`Erro ao atualizar benchmark ${key}:`, error);
                        return null;
                    });
            });
            
            // Aguardar todas as atualizações
            Promise.all(promises)
                .then(results => {
                    console.log("Benchmarks atualizados");
                    
                    // Salvar no cache
                    localStorage.setItem('benchmarkCache', JSON.stringify(this.state.benchmarks));
                    localStorage.setItem('lastBenchmarkUpdate', Date.now().toString());
                    
                    // Atualizar gráficos
                    this.renderBenchmarkChart();
                })
                .catch(error => {
                    console.error("Erro ao atualizar benchmarks:", error);
                });
        } else {
            console.warn("Módulo yahooFinance não disponível para atualizar benchmarks");
        }
    },
    
    // Renderizar dashboard
    renderDashboard: function() {
        console.log("Renderizando dashboard");
        
        // Verificar se há ativos
        if (this.state.assets.length === 0) {
            this.showEmptyPortfolio();
            return;
        }
        
        // Renderizar valor total
        this.renderTotalValue();
        
        // Renderizar principais ativos
        this.renderTopAssets();
        
        // Renderizar gráfico de categorias
        this.renderCategoryChart();
        
        // Renderizar gráfico de corretoras
        this.renderBrokerChart();
        
        // Renderizar gráfico de benchmarks
        this.renderBenchmarkChart();
    },
    
    // Mostrar carteira vazia
    showEmptyPortfolio: function() {
        console.log("Mostrando carteira vazia");
        
        // Esconder seções de dashboard
        const dashboardSections = document.querySelectorAll('.dashboard-section');
        dashboardSections.forEach(section => {
            section.classList.add('d-none');
        });
        
        // Mostrar mensagem de carteira vazia
        const emptyPortfolio = document.getElementById('emptyPortfolio');
        if (emptyPortfolio) {
            emptyPortfolio.classList.remove('d-none');
        }
    },
    
    // Renderizar valor total
    renderTotalValue: function() {
        console.log("Renderizando valor total");
        
        // Mostrar seções de dashboard
        const dashboardSections = document.querySelectorAll('.dashboard-section');
        dashboardSections.forEach(section => {
            section.classList.remove('d-none');
        });
        
        // Esconder mensagem de carteira vazia
        const emptyPortfolio = document.getElementById('emptyPortfolio');
        if (emptyPortfolio) {
            emptyPortfolio.classList.add('d-none');
        }
        
        // Atualizar valor total
        const totalValueElement = document.getElementById('totalValue');
        if (totalValueElement) {
            totalValueElement.textContent = this.formatCurrency(this.state.totalValue);
        }
        
        // Atualizar contagem de ativos
        const assetCountElement = document.getElementById('assetCount');
        if (assetCountElement) {
            assetCountElement.textContent = this.state.assets.length;
        }
        
        // Atualizar contagem de categorias
        const categoryCountElement = document.getElementById('categoryCount');
        if (categoryCountElement) {
            categoryCountElement.textContent = Object.keys(this.state.categories).length;
        }
        
        // Atualizar contagem de corretoras
        const brokerCountElement = document.getElementById('brokerCount');
        if (brokerCountElement) {
            brokerCountElement.textContent = Object.keys(this.state.brokers).length;
        }
    },
    
    // Renderizar principais ativos
    renderTopAssets: function() {
        console.log("Renderizando principais ativos");
        
        // Ordenar ativos por valor
        const sortedAssets = [...this.state.assets].sort((a, b) => {
            const valueA = a['Valor Atualizado'] || a['Quantidade'] * a['Preço Atual'] || 0;
            const valueB = b['Valor Atualizado'] || b['Quantidade'] * b['Preço Atual'] || 0;
            return valueB - valueA;
        });
        
        // Limitar a 5 ativos
        const topAssets = sortedAssets.slice(0, 5);
        
        // Obter tabela
        const topAssetsTable = document.getElementById('topAssetsTable');
        if (!topAssetsTable) {
            console.warn("Tabela de principais ativos não encontrada");
            return;
        }
        
        // Limpar tabela
        const tbody = topAssetsTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            // Adicionar linhas
            topAssets.forEach(asset => {
                const value = asset['Valor Atualizado'] || asset['Quantidade'] * asset['Preço Atual'] || 0;
                const percentage = (value / this.state.totalValue) * 100;
                
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
                nameCell.textContent = asset['Nome'] || asset['Produto'] || '-';
                row.appendChild(nameCell);
                
                // Valor
                const valueCell = document.createElement('td');
                valueCell.textContent = this.formatCurrency(value);
                row.appendChild(valueCell);
                
                // Porcentagem
                const percentageCell = document.createElement('td');
                percentageCell.innerHTML = `
                    <div class="d-flex align-items-center">
       
(Content truncated due to size limit. Use line ranges to read in chunks)