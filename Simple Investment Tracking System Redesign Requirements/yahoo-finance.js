/**
 * Script para integração com a API do Yahoo Finance no Gestor de Investimentos
 * 
 * Este script gerencia a obtenção de dados de preços e informações de ativos.
 */

// Configurações globais
const yahooFinance = {
    // Estado da aplicação
    state: {
        cache: {},
        lastUpdate: null
    },
    
    // Inicialização
    init: function() {
        // Carregar cache do localStorage
        this.loadCache();
    },
    
    // Carregar cache do localStorage
    loadCache: function() {
        try {
            const cacheData = localStorage.getItem('yahooFinanceCache');
            
            if (cacheData) {
                this.state.cache = JSON.parse(cacheData);
            }
            
            const lastUpdate = localStorage.getItem('lastPriceUpdate');
            
            if (lastUpdate) {
                this.state.lastUpdate = parseInt(lastUpdate);
            }
        } catch (error) {
            console.error('Erro ao carregar cache:', error);
            this.state.cache = {};
            this.state.lastUpdate = null;
        }
    },
    
    // Salvar cache no localStorage
    saveCache: function() {
        try {
            localStorage.setItem('yahooFinanceCache', JSON.stringify(this.state.cache));
            localStorage.setItem('lastPriceUpdate', Date.now().toString());
        } catch (error) {
            console.error('Erro ao salvar cache:', error);
        }
    },
    
    // Obter dados de um ativo
    getAssetData: async function(symbol, region = 'BR') {
        try {
            // Verificar cache
            const cacheKey = `${symbol}_${region}`;
            
            if (this.state.cache[cacheKey] && this.isCacheValid(cacheKey)) {
                return this.state.cache[cacheKey];
            }
            
            // Obter dados da API
            const data = await this.fetchAssetData(symbol, region);
            
            // Salvar no cache
            this.state.cache[cacheKey] = {
                ...data,
                timestamp: Date.now()
            };
            
            // Salvar cache
            this.saveCache();
            
            return data;
        } catch (error) {
            console.error(`Erro ao obter dados do ativo ${symbol}:`, error);
            throw error;
        }
    },
    
    // Verificar se o cache é válido (menos de 24 horas)
    isCacheValid: function(cacheKey) {
        const cacheEntry = this.state.cache[cacheKey];
        
        if (!cacheEntry || !cacheEntry.timestamp) {
            return false;
        }
        
        const now = Date.now();
        const cacheAge = now - cacheEntry.timestamp;
        
        // Cache válido por 24 horas (86400000 ms)
        return cacheAge < 86400000;
    },
    
    // Buscar dados do ativo na API
    fetchAssetData: async function(symbol, region) {
        // Aqui seria implementada a chamada real à API do Yahoo Finance
        // Como estamos usando a API fornecida pelo sistema, vamos implementar isso
        // usando a API YahooFinance/get_stock_chart
        
        try {
            // Implementação usando a API do sistema
            const response = await this.fetchFromYahooAPI(symbol, region);
            
            // Processar resposta
            return this.processApiResponse(response, symbol);
        } catch (error) {
            console.error(`Erro ao buscar dados do ativo ${symbol}:`, error);
            
            // Retornar dados vazios em caso de erro
            return {
                symbol: symbol,
                price: 0,
                change: 0,
                changePct: 0,
                currency: region === 'BR' ? 'BRL' : 'USD',
                timestamp: Date.now()
            };
        }
    },
    
    // Buscar dados da API do Yahoo Finance
    fetchFromYahooAPI: async function(symbol, region) {
        // Esta função seria implementada usando a API real
        // Por enquanto, vamos simular uma resposta
        
        // Aqui usaríamos a API YahooFinance/get_stock_chart
        // Exemplo de código Python:
        // import sys
        // sys.path.append('/opt/.manus/.sandbox-runtime')
        // from data_api import ApiClient
        // client = ApiClient()
        // data = client.call_api('YahooFinance/get_stock_chart', query={'symbol': symbol, 'region': region})
        
        // Como não podemos executar Python diretamente, vamos simular uma resposta
        return {
            symbol: symbol,
            price: 0,
            change: 0,
            changePct: 0,
            currency: region === 'BR' ? 'BRL' : 'USD'
        };
    },
    
    // Processar resposta da API
    processApiResponse: function(response, symbol) {
        // Processar resposta da API
        // Em uma implementação real, extrairíamos os dados da resposta
        
        return {
            symbol: symbol,
            price: response.price || 0,
            change: response.change || 0,
            changePct: response.changePct || 0,
            currency: response.currency || 'BRL',
            timestamp: Date.now()
        };
    },
    
    // Atualizar preços de todos os ativos
    updateAllPrices: async function() {
        try {
            // Obter ativos do localStorage
            const investmentData = localStorage.getItem('investmentData');
            
            if (!investmentData) {
                return [];
            }
            
            const assets = JSON.parse(investmentData);
            
            // Atualizar preço de cada ativo
            const updatedAssets = [];
            
            for (const asset of assets) {
                const symbol = asset['Código de Negociação'] || asset['Código'] || '';
                
                if (!symbol) {
                    updatedAssets.push(asset);
                    continue;
                }
                
                try {
                    // Determinar região
                    const region = this.determineRegion(symbol);
                    
                    // Obter dados atualizados
                    const assetData = await this.getAssetData(symbol, region);
                    
                    // Atualizar preço
                    if (assetData && assetData.price) {
                        asset['Preço Atual'] = assetData.price;
                        asset['Valor Atualizado'] = assetData.price * asset['Quantidade'];
                    }
                    
                    updatedAssets.push(asset);
                } catch (error) {
                    console.error(`Erro ao atualizar preço do ativo ${symbol}:`, error);
                    updatedAssets.push(asset);
                }
            }
            
            // Salvar ativos atualizados
            localStorage.setItem('investmentData', JSON.stringify(updatedAssets));
            
            // Atualizar timestamp
            localStorage.setItem('lastPriceUpdate', Date.now().toString());
            
            return updatedAssets;
        } catch (error) {
            console.error('Erro ao atualizar preços:', error);
            throw error;
        }
    },
    
    // Determinar região com base no símbolo
    determineRegion: function(symbol) {
        // Símbolos brasileiros geralmente têm 5 ou 6 caracteres
        // e terminam com números (ex: PETR4, BBAS3, ITUB4)
        if (/^[A-Z]{4}\d{1,2}$/.test(symbol)) {
            return 'BR';
        }
        
        // Símbolos de criptomoedas
        if (['BTC', 'ETH', 'XRP', 'LTC'].includes(symbol)) {
            return 'US';
        }
        
        // Padrão para símbolos americanos
        return 'US';
    },
    
    // Obter dados de benchmark
    getBenchmarkData: async function(benchmarks) {
        try {
            const result = {};
            
            for (const benchmark of benchmarks) {
                try {
                    // Mapear benchmark para símbolo
                    const symbol = this.mapBenchmarkToSymbol(benchmark);
                    
                    if (!symbol) {
                        continue;
                    }
                    
                    // Determinar região
                    const region = this.determineRegion(symbol);
                    
                    // Obter dados
                    const data = await this.getAssetData(symbol, region);
                    
                    result[benchmark] = data;
                } catch (error) {
                    console.error(`Erro ao obter dados do benchmark ${benchmark}:`, error);
                    result[benchmark] = null;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao obter dados de benchmarks:', error);
            throw error;
        }
    },
    
    // Mapear nome de benchmark para símbolo
    mapBenchmarkToSymbol: function(benchmark) {
        const mapping = {
            'ibovespa': '^BVSP',
            'ifix': 'IFIX.SA',
            'cdi': 'CDI.SA',
            'nasdaq': '^IXIC',
            'sp500': '^GSPC',
            'bitcoin': 'BTC-USD',
            'ethereum': 'ETH-USD'
        };
        
        return mapping[benchmark.toLowerCase()] || null;
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    yahooFinance.init();
});
