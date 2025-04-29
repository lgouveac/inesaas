/**
 * Script principal para o Gestor de Investimentos
 * 
 * Este script gerencia funcionalidades comuns e inicialização do sistema.
 */

// Configurações globais
const app = {
    // Estado da aplicação
    state: {
        darkMode: false,
        lastUpdate: null
    },
    
    // Inicialização
    init: function() {
        // Verificar última atualização
        this.checkLastUpdate();
        
        // Configurar eventos comuns
        this.setupCommonEvents();
    },
    
    // Verificar última atualização de preços
    checkLastUpdate: function() {
        const lastUpdate = localStorage.getItem('lastPriceUpdate');
        
        if (lastUpdate) {
            const updateDate = new Date(parseInt(lastUpdate));
            const now = new Date();
            
            // Verificar se a última atualização foi há mais de 1 hora
            if (now - updateDate > 60 * 60 * 1000) {
                // Mostrar notificação de atualização necessária
                this.showUpdateNotification();
            } else {
                // Atualizar texto de última atualização
                this.updateLastUpdateText(updateDate);
            }
        } else {
            // Sem atualização anterior, mostrar notificação
            this.showUpdateNotification();
        }
    },
    
    // Mostrar notificação de atualização necessária
    showUpdateNotification: function() {
        // Verificar se estamos em uma página que precisa de atualização
        if (document.getElementById('refreshDataBtn') || document.getElementById('refreshPricesBtn')) {
            const notification = document.createElement('div');
            notification.className = 'toast align-items-center text-white bg-primary border-0 position-fixed bottom-0 end-0 m-3';
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'assertive');
            notification.setAttribute('aria-atomic', 'true');
            
            notification.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Os preços dos ativos precisam ser atualizados.
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Inicializar toast
            const toast = new bootstrap.Toast(notification, {
                autohide: false
            });
            
            toast.show();
        }
    },
    
    // Atualizar texto de última atualização
    updateLastUpdateText: function(updateDate) {
        const updateElements = document.querySelectorAll('.last-update-time');
        
        if (updateElements.length > 0) {
            const formattedDate = updateDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            updateElements.forEach(element => {
                element.textContent = formattedDate;
            });
        }
    },
    
    // Configurar eventos comuns
    setupCommonEvents: function() {
        // Botão de atualizar dados
        const refreshDataBtn = document.getElementById('refreshDataBtn');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
        
        // Botão de atualizar preços
        const refreshPricesBtn = document.getElementById('refreshPricesBtn');
        if (refreshPricesBtn) {
            refreshPricesBtn.addEventListener('click', () => {
                this.refreshPrices();
            });
        }
    },
    
    // Atualizar todos os dados
    refreshData: function() {
        // Mostrar spinner no botão
        const refreshBtn = document.getElementById('refreshDataBtn');
        const originalContent = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';
        refreshBtn.disabled = true;
        
        // Atualizar preços via Yahoo Finance
        if (typeof yahooFinance !== 'undefined') {
            yahooFinance.updateAllPrices()
                .then(assets => {
                    // Atualizar timestamp
                    const now = new Date();
                    localStorage.setItem('lastPriceUpdate', now.getTime().toString());
                    
                    // Atualizar texto de última atualização
                    this.updateLastUpdateText(now);
                    
                    // Recarregar página para mostrar dados atualizados
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Erro ao atualizar preços:', error);
                    alert('Ocorreu um erro ao atualizar os preços. Por favor, tente novamente.');
                    
                    // Restaurar botão
                    refreshBtn.innerHTML = originalContent;
                    refreshBtn.disabled = false;
                });
        } else {
            // Simular atualização
            setTimeout(() => {
                // Atualizar timestamp
                const now = new Date();
                localStorage.setItem('lastPriceUpdate', now.getTime().toString());
                
                // Recarregar página
                window.location.reload();
            }, 2000);
        }
    },
    
    // Atualizar apenas preços
    refreshPrices: function() {
        // Mostrar spinner no botão
        const refreshBtn = document.getElementById('refreshPricesBtn');
        const originalContent = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';
        refreshBtn.disabled = true;
        
        // Atualizar preços via Yahoo Finance
        if (typeof yahooFinance !== 'undefined') {
            yahooFinance.updateAllPrices()
                .then(assets => {
                    // Atualizar timestamp
                    const now = new Date();
                    localStorage.setItem('lastPriceUpdate', now.getTime().toString());
                    
                    // Recarregar página para mostrar dados atualizados
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Erro ao atualizar preços:', error);
                    alert('Ocorreu um erro ao atualizar os preços. Por favor, tente novamente.');
                    
                    // Restaurar botão
                    refreshBtn.innerHTML = originalContent;
                    refreshBtn.disabled = false;
                });
        } else {
            // Simular atualização
            setTimeout(() => {
                // Atualizar timestamp
                const now = new Date();
                localStorage.setItem('lastPriceUpdate', now.getTime().toString());
                
                // Recarregar página
                window.location.reload();
            }, 2000);
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
