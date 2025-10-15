// Estado da aplicação
let allData = [];
let currentFilter = 'all';

// Elementos do DOM
const btnRefresh = document.getElementById('btnRefresh');
const filters = document.getElementById('filters');
const dataGrid = document.getElementById('dataGrid');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const errorMessage = document.getElementById('errorMessage');

// Ícones SVG
const icons = {
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    dollarSign: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
};

// Função para buscar dados da API
async function fetchSpreadsheetData() {
    const url = 'https://sheet2api.com/v1/PMT9ALtxTais/gerenciamento-profissional';
    
    showLoading();
    btnRefresh.classList.add('loading');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
        const data = await response.json();
        allData = data;
        updateFilters();
        renderData();
    } catch (error) {
        showError(error.message);
        console.error('Erro ao buscar dados:', error);
    } finally {
        btnRefresh.classList.remove('loading');
    }
}

// Função para calcular margem de lucro
function calculateMargin(company) {
    const bruto = parseFloat(company['Lucro Bruto'].replace(/[^\d.,]/g, '').replace(',', '.'));
    const divida = parseFloat(company['Dívida'].replace(/[^\d.,]/g, '').replace(',', '.'));
    const margin = ((bruto - divida) / bruto * 100).toFixed(1);
    return margin;
}

// Função para criar filtros
function updateFilters() {
    const locations = [...new Set(allData.map(company => company.Localização))];
    
    // Limpar filtros existentes
    filters.innerHTML = `
        <button class="filter-btn active" data-filter="all">
            Todas (<span id="count-all">${allData.length}</span>)
        </button>
    `;
    
    // Adicionar filtros por localização
    locations.forEach(location => {
        const count = allData.filter(c => c.Localização === location).length;
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = location;
        btn.innerHTML = `
            <span class="filter-icon">${icons.mapPin}</span>
            ${location}
        `;
        filters.appendChild(btn);
    });
    
    // Adicionar event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderData();
        });
    });
}

// Função para renderizar dados
function renderData() {
    const filteredData = currentFilter === 'all' 
        ? allData 
        : allData.filter(company => company.Localização === currentFilter);
    
    hideAllStates();
    
    if (filteredData.length === 0) {
        showEmpty();
        return;
    }
    
    dataGrid.style.display = 'grid';
    dataGrid.innerHTML = '';
    
    filteredData.forEach((company, index) => {
        const card = createCard(company, index);
        dataGrid.appendChild(card);
    });
}

// Função para criar card
function createCard(company, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-top">
                <div class="card-icon">${icons.building}</div>
                <div class="card-badge">${calculateMargin(company)}% margem</div>
            </div>
            <h3 class="card-title">${company.Empresa}</h3>
            <div class="card-location">
                <span class="location-icon">${icons.mapPin}</span>
                <span>${company.Localização}</span>
            </div>
        </div>
        <div class="card-body">
            <div class="card-item success">
                <div class="item-icon-wrapper">
                    <div class="item-icon">${icons.trendingUp}</div>
                </div>
                <div class="item-content">
                    <div class="item-label">Lucro Bruto</div>
                    <div class="item-value">${company['Lucro Bruto']}</div>
                </div>
            </div>
            <div class="card-item warning">
                <div class="item-icon-wrapper">
                    <div class="item-icon">${icons.alertCircle}</div>
                </div>
                <div class="item-content">
                    <div class="item-label">Dívida</div>
                    <div class="item-value">${company['Dívida']}</div>
                </div>
            </div>
            <div class="card-item info">
                <div class="item-icon-wrapper">
                    <div class="item-icon">${icons.dollarSign}</div>
                </div>
                <div class="item-content">
                    <div class="item-label">Lucro Líquido</div>
                    <div class="item-value">${company['Lucro Líquido']}</div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Funções para mostrar/ocultar estados
function showLoading() {
    hideAllStates();
    loadingState.style.display = 'flex';
}

function showError(message) {
    hideAllStates();
    errorMessage.textContent = message;
    errorState.style.display = 'flex';
}

function showEmpty() {
    hideAllStates();
    emptyState.style.display = 'flex';
}

function hideAllStates() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    dataGrid.style.display = 'none';
}

// Event Listeners
btnRefresh.addEventListener('click', fetchSpreadsheetData);

// Inicializar aplicação
fetchSpreadsheetData();
