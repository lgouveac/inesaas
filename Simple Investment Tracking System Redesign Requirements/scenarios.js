/**
 * Script para gerenciamento de cenários econômicos no Gestor de Investimentos
 * 
 * Este script gerencia a simulação de diferentes cenários econômicos e seu impacto nos investimentos.
 */

// Configurações globais
const scenarios = {
    // Estado da aplicação
    state: {
        assets: [],
        currentScenario: 'base',
        scenarios: {
            base: {
                name: 'Cenário Base',
                description: 'Cenário atual sem alterações',
                parameters: {
                    dolar: 0,
                    juros_br: 0,
                    juros_eua: 0,
                    inflacao_br: 0,
                    inflacao_eua: 0
                }
            },
            otimista: {
                name: 'Cenário Otimista',
                description: 'Redução de juros e inflação controlada',
                parameters: {
                    dolar: -5,
                    juros_br: -1,
                    juros_eua: -0.5,
                    inflacao_br: -0.5,
                    inflacao_eua: -0.25
                }
            },
            pessimista: {
                name: 'Cenário Pessimista',
                description: 'Aumento de juros e pressão inflacionária',
                parameters: {
                    dolar: 10,
                    juros_br: 1.5,
                    juros_eua: 0.75,
                    inflacao_br: 1,
                    inflacao_eua: 0.5
                }
            },
            personalizado: {
                name: 'Cenário Personalizado',
                description: 'Parâmetros definidos pelo usuário',
                parameters: {
                    dolar: 0,
                    juros_br: 0,
                    juros_eua: 0,
                    inflacao_br: 0,
                    inflacao_eua: 0
                }
            }
        },
        impactRules: {
            acoes_br: {
                dolar: -0.3,
                juros_br: -1.5,
                juros_eua: -0.5,
                inflacao_br: -0.8,
                inflacao_eua: -0.2
            },
            acoes_eua: {
                dolar: 1.0,
                juros_br: 0.1,
                juros_eua: -1.2,
                inflacao_br: 0.0,
                inflacao_eua: -0.7
            },
            fii: {
                dolar: -0.1,
                juros_br: -1.2,
                juros_eua: -0.1,
                inflacao_br: -0.5,
                inflacao_eua: 0.0
            },
            rf_pre: {
                dolar: 0.0,
                juros_br: -3.0,
                juros_eua: -0.2,
                inflacao_br: -0.5,
                inflacao_eua: 0.0
            },
            rf_pos: {
                dolar: 0.0,
                juros_br: 0.5,
                juros_eua: 0.1,
                inflacao_br: 0.0,
                inflacao_eua: 0.0
            },
            rf_ipca: {
                dolar: 0.0,
                juros_br: -0.5,
                juros_eua: -0.1,
                inflacao_br: 1.0,
                inflacao_eua: 0.0
            },
            cripto: {
                dolar: 0.8,
                juros_br: -0.2,
                juros_eua: -0.8,
                inflacao_br: 0.2,
                inflacao_eua: 0.5
            },
            outros: {
                dolar: 0.1,
                juros_br: -0.3,
                juros_eua: -0.3,
                inflacao_br: -0.3,
                inflacao_eua: -0.1
            }
        }
    },
    
    // Inicialização
    init: function() {
        // Carregar ativos
        this.loadAssets();
        
        // Inicializar interface
        this.initInterface();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Simular cenário base
        this.simulateScenario('base');
    },
    
    // Carregar ativos do localStorage
    loadAssets: function() {
        try {
            // Obter dados do localStorage
            const investmentData = localStorage.getItem('investmentData');
            
            if (investmentData) {
                const data = JSON.parse(investmentData);
                
                // Processar dados para formato adequado
                this.state.assets = data.map(item => {
                    return {
                        code: item['Código de Negociação'] || item['Código'] || '',
                        name: item['Produto'] || item['Nome'] || '',
                        quantity: parseFloat(item['Quantidade'] || 0),
                        avgPrice: parseFloat(item['Preço'] || item['Preço de Fechamento'] || 0),
                        currentPrice: parseFloat(item['Preço Atual'] || item['Valor Atualizado'] / item['Quantidade'] || 0),
                        category: this.determineCategory(item['Código de Negociação'] || item['Código'] || ''),
                        broker: item['Instituição'] || item['Corretora'] || '',
                        source: item._source || { file: 'manual', sheet: 'manual', importDate: new Date().toISOString() }
                    };
                }).filter(item => item.code); // Filtrar itens sem código
            } else {
                // Sem dados, mostrar mensagem
                this.showNoDataMessage();
            }
        } catch (error) {
            console.error('Erro ao carregar ativos:', error);
            this.showNoDataMessage();
        }
    },
    
    // Inicializar interface
    initInterface: function() {
        // Preencher seletores de cenário
        const scenarioSelector = document.getElementById('scenarioSelector');
        if (scenarioSelector) {
            scenarioSelector.innerHTML = '';
            
            // Adicionar opções para cada cenário
            Object.keys(this.state.scenarios).forEach(scenarioKey => {
                const scenario = this.state.scenarios[scenarioKey];
                const option = document.createElement('option');
                option.value = scenarioKey;
                option.textContent = scenario.name;
                scenarioSelector.appendChild(option);
            });
        }
        
        // Preencher campos de parâmetros
        this.updateParameterFields('base');
    },
    
    // Configurar eventos
    setupEventListeners: function() {
        // Seletor de cenário
        const scenarioSelector = document.getElementById('scenarioSelector');
        if (scenarioSelector) {
            scenarioSelector.addEventListener('change', (e) => {
                const scenarioKey = e.target.value;
                this.updateParameterFields(scenarioKey);
                this.simulateScenario(scenarioKey);
            });
        }
        
        // Botão de simular
        const simulateBtn = document.getElementById('simulateBtn');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                this.updateCustomScenario();
                this.simulateScenario('personalizado');
                
                // Atualizar seletor para mostrar cenário personalizado
                const scenarioSelector = document.getElementById('scenarioSelector');
                if (scenarioSelector) {
                    scenarioSelector.value = 'personalizado';
                }
            });
        }
        
        // Botão de resetar
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetCustomScenario();
                this.updateParameterFields('personalizado');
            });
        }
    },
    
    // Atualizar campos de parâmetros
    updateParameterFields: function(scenarioKey) {
        const scenario = this.state.scenarios[scenarioKey];
        
        if (!scenario) return;
        
        // Atualizar descrição
        const scenarioDescription = document.getElementById('scenarioDescription');
        if (scenarioDescription) {
            scenarioDescription.textContent = scenario.description;
        }
        
        // Atualizar campos de parâmetros
        const parameters = scenario.parameters;
        
        // Dólar
        const dolarInput = document.getElementById('dolarInput');
        const dolarValue = document.getElementById('dolarValue');
        if (dolarInput && dolarValue) {
            dolarInput.value = parameters.dolar;
            dolarValue.textContent = `${parameters.dolar >= 0 ? '+' : ''}${parameters.dolar}%`;
        }
        
        // Juros Brasil
        const jurosBrInput = document.getElementById('jurosBrInput');
        const jurosBrValue = document.getElementById('jurosBrValue');
        if (jurosBrInput && jurosBrValue) {
            jurosBrInput.value = parameters.juros_br;
            jurosBrValue.textContent = `${parameters.juros_br >= 0 ? '+' : ''}${parameters.juros_br}%`;
        }
        
        // Juros EUA
        const jurosEuaInput = document.getElementById('jurosEuaInput');
        const jurosEuaValue = document.getElementById('jurosEuaValue');
        if (jurosEuaInput && jurosEuaValue) {
            jurosEuaInput.value = parameters.juros_eua;
            jurosEuaValue.textContent = `${parameters.juros_eua >= 0 ? '+' : ''}${parameters.juros_eua}%`;
        }
        
        // Inflação Brasil
        const inflacaoBrInput = document.getElementById('inflacaoBrInput');
        const inflacaoBrValue = document.getElementById('inflacaoBrValue');
        if (inflacaoBrInput && inflacaoBrValue) {
            inflacaoBrInput.value = parameters.inflacao_br;
            inflacaoBrValue.textContent = `${parameters.inflacao_br >= 0 ? '+' : ''}${parameters.inflacao_br}%`;
        }
        
        // Inflação EUA
        const inflacaoEuaInput = document.getElementById('inflacaoEuaInput');
        const inflacaoEuaValue = document.getElementById('inflacaoEuaValue');
        if (inflacaoEuaInput && inflacaoEuaValue) {
            inflacaoEuaInput.value = parameters.inflacao_eua;
            inflacaoEuaValue.textContent = `${parameters.inflacao_eua >= 0 ? '+' : ''}${parameters.inflacao_eua}%`;
        }
        
        // Configurar inputs para cenário personalizado
        const isCustom = scenarioKey === 'personalizado';
        
        const parameterInputs = document.querySelectorAll('.parameter-input');
        parameterInputs.forEach(input => {
            input.disabled = !isCustom;
        });
        
        const simulateBtn = document.getElementById('simulateBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (simulateBtn) {
            simulateBtn.disabled = !isCustom;
        }
        
        if (resetBtn) {
            resetBtn.disabled = !isCustom;
        }
    },
    
    // Atualizar cenário personalizado com valores dos inputs
    updateCustomScenario: function() {
        const dolarInput = document.getElementById('dolarInput');
        const jurosBrInput = document.getElementById('jurosBrInput');
        const jurosEuaInput = document.getElementById('jurosEuaInput');
        const inflacaoBrInput = document.getElementById('inflacaoBrInput');
        const inflacaoEuaInput = document.getElementById('inflacaoEuaInput');
        
        // Atualizar parâmetros
        const parameters = this.state.scenarios.personalizado.parameters;
        
        if (dolarInput) parameters.dolar = parseFloat(dolarInput.value) || 0;
        if (jurosBrInput) parameters.juros_br = parseFloat(jurosBrInput.value) || 0;
        if (jurosEuaInput) parameters.juros_eua = parseFloat(jurosEuaInput.value) || 0;
        if (inflacaoBrInput) parameters.inflacao_br = parseFloat(inflacaoBrInput.value) || 0;
        if (inflacaoEuaInput) parameters.inflacao_eua = parseFloat(inflacaoEuaInput.value) || 0;
        
        // Atualizar valores exibidos
        const dolarValue = document.getElementById('dolarValue');
        const jurosBrValue = document.getElementById('jurosBrValue');
        const jurosEuaValue = document.getElementById('jurosEuaValue');
        const inflacaoBrValue = document.getElementById('inflacaoBrValue');
        const inflacaoEuaValue = document.getElementById('inflacaoEuaValue');
        
        if (dolarValue) dolarValue.textContent = `${parameters.dolar >= 0 ? '+' : ''}${parameters.dolar}%`;
        if (jurosBrValue) jurosBrValue.textContent = `${parameters.juros_br >= 0 ? '+' : ''}${parameters.juros_br}%`;
        if (jurosEuaValue) jurosEuaValue.textContent = `${parameters.juros_eua >= 0 ? '+' : ''}${parameters.juros_eua}%`;
        if (inflacaoBrValue) inflacaoBrValue.textContent = `${parameters.inflacao_br >= 0 ? '+' : ''}${parameters.inflacao_br}%`;
        if (inflacaoEuaValue) inflacaoEuaValue.textContent = `${parameters.inflacao_eua >= 0 ? '+' : ''}${parameters.inflacao_eua}%`;
    },
    
    // Resetar cenário personalizado
    resetCustomScenario: function() {
        // Resetar parâmetros
        this.state.scenarios.personalizado.parameters = {
            dolar: 0,
            juros_br: 0,
            juros_eua: 0,
            inflacao_br: 0,
            inflacao_eua: 0
        };
    },
    
    // Simular cenário
    simulateScenario: function(scenarioKey) {
        const scenario = this.state.scenarios[scenarioKey];
        
        if (!scenario) return;
        
        // Atualizar cenário atual
        this.state.currentScenario = scenarioKey;
        
        // Calcular impacto nos ativos
        const impactedAssets = this.calculateImpact(scenario.parameters);
        
        // Atualizar tabela de impacto
        this.updateImpactTable(impactedAssets);
        
        // Atualizar gráfico de impacto por categoria
        this.updateImpactChart(impactedAssets);
        
        // Atualizar recomendações
        this.updateRecommendations(impactedAssets, scenario.parameters);
    },
    
    // Calcular impacto nos ativos
    calculateImpact: function(parameters) {
        return this.state.assets.map(asset => {
            // Obter regras de impacto para a categoria do ativo
            const rules = this.state.impactRules[asset.category] || this.state.impactRules.outros;
            
            // Calcular impacto total
            let totalImpact = 0;
            
            // Dólar
            totalImpact += parameters.dolar * rules.dolar;
            
            // Juros Brasil
            totalImpact += parameters.juros_br * rules.juros_br;
            
            // Juros EUA
            totalImpact += parameters.juros_eua * rules.juros_eua;
            
            // Inflação Brasil
            totalImpact += parameters.inflacao_br * rules.inflacao_br;
            
            // Inflação EUA
            totalImpact += parameters.inflacao_eua * rules.inflacao_eua;
            
            // Calcular novo preço
            const newPrice = asset.currentPrice * (1 + totalImpact / 100);
            
            return {
                ...asset,
                impactPct: totalImpact,
                newPrice: newPrice,
                oldValue: asset.currentPrice * asset.quantity,
                newValue: newPrice * asset.quantity
            };
        });
    },
    
    // Atualizar tabela de impacto
    updateImpactTable: function(impactedAssets) {
        const tbody = document.querySelector('#impactTable tbody');
        
        if (!tbody) return;
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        // Verificar se há ativos
        if (impactedAssets.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'text-center';
            cell.textContent = 'Nenhum ativo encontrado.';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }
        
        // Ordenar por impacto (maior para menor)
        const sortedAssets = [...impactedAssets].sort((a, b) => Math.abs(b
(Content truncated due to size limit. Use line ranges to read in chunks)