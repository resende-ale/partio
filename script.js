// Estrutura de dados principal
let appData = {
    members: [],
    expenses: [],
    customSplits: {},
    payments: []
};

// Configuração do Google Sheets
let sheetsConfig = {
    spreadsheetId: null,
    apiKey: null,
    isConnected: false,
    lastSync: null
};

// Configurações
const DEFAULT_PART_VALUE = 1; // Valor padrão para cada parte

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateUI();
    setupEventListeners();
});

// Configuração dos event listeners
function setupEventListeners() {
    // Mudança no tipo de divisão
    document.getElementById('expense-split-type').addEventListener('change', function() {
        const customSplit = document.getElementById('custom-split');
        if (this.value === 'custom') {
            customSplit.style.display = 'block';
            updateCustomSplitInputs();
        } else {
            customSplit.style.display = 'none';
        }
    });

    // Mudança no método de divisão (parts/amounts)
    document.querySelectorAll('input[name="split-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateSplitInputs();
        });
    });

    // Enter para adicionar membro
    document.getElementById('member-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addMember();
        }
    });

    // Enter para adicionar despesa
    document.getElementById('expense-description').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExpense();
        }
    });

    // Enter para salvar chave PIX
    document.getElementById('pix-key-value').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            savePixKey();
        }
    });

    // Enter para registrar pagamento
    document.getElementById('payment-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            registerPayment();
        }
    });

    // Fechar modal PIX ao clicar fora
    document.getElementById('pix-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePixModal();
        }
    });
}

// Funções de gerenciamento de dados
function saveData() {
    localStorage.setItem('partioData', JSON.stringify(appData));
    
    // Sincronizar automaticamente com Google Sheets se estiver conectado
    if (sheetsConfig.isConnected) {
        // Usar setTimeout para evitar múltiplas sincronizações simultâneas
        setTimeout(() => {
            syncToSheets().catch(error => {
                console.error('Erro na sincronização automática:', error);
            });
        }, 1000);
    }
}

function loadData() {
    const saved = localStorage.getItem('partioData');
    if (saved) {
        try {
            appData = JSON.parse(saved);
            // Garantir que o campo payments existe para compatibilidade
            if (!appData.payments) {
                appData.payments = [];
            }
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            appData = { members: [], expenses: [], customSplits: {}, payments: [] };
        }
    }
    
    // Carregar configuração do Google Sheets
    loadSheetsConfig();
}

// Funções de membros
function addMember() {
    const nameInput = document.getElementById('member-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Por favor, insira um nome válido.');
        return;
    }
    
    if (appData.members.some(member => member.name.toLowerCase() === name.toLowerCase())) {
        alert('Já existe um membro com este nome.');
        return;
    }
    
    const member = {
        id: Date.now().toString(),
        name: name,
        pixKey: '',
        pixKeyType: 'cpf' // cpf, email, telefone, aleatoria
    };
    
    appData.members.push(member);
    saveData();
    updateUI();
    
    nameInput.value = '';
    nameInput.focus();
}

function removeMember(memberId) {
    if (confirm('Tem certeza que deseja remover este membro? Todas as despesas relacionadas serão perdidas.')) {
        appData.members = appData.members.filter(m => m.id !== memberId);
        appData.expenses = appData.expenses.filter(e => e.payerId !== memberId);
        saveData();
        updateUI();
    }
}



function updatePixKey(memberId, pixKey, pixKeyType) {
    const member = appData.members.find(m => m.id === memberId);
    if (member) {
        member.pixKey = pixKey;
        member.pixKeyType = pixKeyType;
        saveData();
        updateUI();
    }
}

// Variáveis globais para o modal PIX
let currentPixMemberId = null;
let currentPixType = null;

function editPixKey(memberId) {
    currentPixMemberId = memberId;
    currentPixType = null;
    
    // Mostrar modal com seleção de tipo
    document.getElementById('pix-modal').style.display = 'flex';
    document.getElementById('pix-type-selection').style.display = 'block';
    document.getElementById('pix-key-input').style.display = 'none';
    
    // Limpar campo de entrada
    document.getElementById('pix-key-value').value = '';
}

function selectPixType(pixType) {
    currentPixType = pixType;
    
    // Esconder seleção de tipo e mostrar input da chave
    document.getElementById('pix-type-selection').style.display = 'none';
    document.getElementById('pix-key-input').style.display = 'block';
    
    // Atualizar placeholder baseado no tipo
    const input = document.getElementById('pix-key-value');
    const member = appData.members.find(m => m.id === currentPixMemberId);
    
    switch(pixType) {
        case 'cpf':
            input.placeholder = 'Digite o CPF (ex: 123.456.789-00)';
            break;
        case 'email':
            input.placeholder = 'Digite o e-mail (ex: usuario@email.com)';
            break;
        case 'telefone':
            input.placeholder = 'Digite o telefone (ex: +55 11 99999-9999)';
            break;
        case 'aleatoria':
            input.placeholder = 'Digite a chave aleatória';
            break;
    }
    
    // Focar no input
    input.focus();
}

function backToPixTypeSelection() {
    document.getElementById('pix-type-selection').style.display = 'block';
    document.getElementById('pix-key-input').style.display = 'none';
    document.getElementById('pix-key-value').value = '';
}

function savePixKey() {
    const pixKey = document.getElementById('pix-key-value').value.trim();
    
    if (!pixKey) {
        alert('Por favor, digite a chave PIX.');
        return;
    }
    
    if (!currentPixMemberId || !currentPixType) {
        alert('Erro: dados do membro não encontrados.');
        return;
    }
    
    // Validar formato baseado no tipo
    if (!validatePixKey(pixKey, currentPixType)) {
        return;
    }
    
    // Salvar chave PIX
    updatePixKey(currentPixMemberId, pixKey, currentPixType);
    
    // Fechar modal
    closePixModal();
    
    // Mostrar confirmação
    const member = appData.members.find(m => m.id === currentPixMemberId);
    alert(`Chave PIX ${currentPixType.toUpperCase()} para ${member.name} foi salva com sucesso!`);
}

function validatePixKey(pixKey, pixType) {
    switch(pixType) {
        case 'cpf':
            // Validação básica de CPF (11 dígitos)
            const cpfClean = pixKey.replace(/\D/g, '');
            if (cpfClean.length !== 11) {
                alert('CPF deve ter 11 dígitos.');
                return false;
            }
            break;
            
        case 'email':
            // Validação básica de e-mail
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(pixKey)) {
                alert('Por favor, insira um e-mail válido.');
                return false;
            }
            break;
            
        case 'telefone':
            // Validação básica de telefone (pelo menos 10 dígitos)
            const phoneClean = pixKey.replace(/\D/g, '');
            if (phoneClean.length < 10) {
                alert('Telefone deve ter pelo menos 10 dígitos.');
                return false;
            }
            break;
            
        case 'aleatoria':
            // Chave aleatória deve ter pelo menos 8 caracteres
            if (pixKey.length < 8) {
                alert('Chave aleatória deve ter pelo menos 8 caracteres.');
                return false;
            }
            break;
    }
    
    return true;
}

function closePixModal() {
    document.getElementById('pix-modal').style.display = 'none';
    currentPixMemberId = null;
    currentPixType = null;
}

// Funções de despesas
function addExpense() {
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const payerId = document.getElementById('expense-payer').value;
    const splitType = document.getElementById('expense-split-type').value;
    
    if (!description || !amount || !payerId) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    if (amount <= 0) {
        alert('O valor deve ser maior que zero.');
        return;
    }
    
    let splitDetails = {};
    
    if (splitType === 'custom') {
        const splitMethod = document.querySelector('input[name="split-method"]:checked').value;
        const customInputs = document.querySelectorAll('#custom-split-inputs input[type="number"]');
        let totalSplit = 0;
        
        // Verificar se há membros selecionados
        const selectedMembers = getSelectedMembers();
        if (selectedMembers.length === 0) {
            alert('Selecione pelo menos um membro para participar da despesa.');
            return;
        }
        
        if (splitMethod === 'parts') {
            // Divisão por partes
            let totalParts = 0;
            const partsPerMember = {};
            
            customInputs.forEach(input => {
                const memberId = input.dataset.memberId;
                const parts = parseInt(input.value) || 0;
                partsPerMember[memberId] = parts;
                totalParts += parts;
            });
            
            if (totalParts === 0) {
                alert('A soma das partes deve ser maior que zero.');
                return;
            }
            
            // Calcular valores baseados nas partes
            const valuePerPart = amount / totalParts;
            customInputs.forEach(input => {
                const memberId = input.dataset.memberId;
                const parts = partsPerMember[memberId];
                splitDetails[memberId] = parts * valuePerPart;
            });
            
        } else {
            // Divisão por valores diretos
            customInputs.forEach(input => {
                const memberId = input.dataset.memberId;
                const value = parseFloat(input.value) || 0;
                splitDetails[memberId] = value;
                totalSplit += value;
            });
            
            if (Math.abs(totalSplit - amount) > 0.01) {
                alert(`A soma das divisões (R$ ${totalSplit.toFixed(2)}) deve ser igual ao valor total (R$ ${amount.toFixed(2)}).`);
                return;
            }
        }
    }
    
    const expense = {
        id: Date.now().toString(),
        description: description,
        amount: amount,
        payerId: payerId,
        splitType: splitType,
        splitDetails: splitDetails,
        date: new Date().toISOString()
    };
    
    appData.expenses.push(expense);
    saveData();
    updateUI();
    
    // Limpar formulário
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-payer').value = '';
    document.getElementById('expense-split-type').value = 'equal';
    document.getElementById('custom-split').style.display = 'none';
}

function removeExpense(expenseId) {
    if (confirm('Tem certeza que deseja remover esta despesa?')) {
        appData.expenses = appData.expenses.filter(e => e.id !== expenseId);
        saveData();
        updateUI();
    }
}

// Funções de divisão personalizada
function updateCustomSplitInputs() {
    updateMembersCheckboxes();
    updateSplitInputs();
}

function updateMembersCheckboxes() {
    const container = document.getElementById('members-checkboxes');
    container.innerHTML = '';
    
    if (appData.members.length === 0) {
        container.innerHTML = '<p>Adicione membros primeiro para configurar a divisão.</p>';
        return;
    }
    
    appData.members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'member-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `member-${member.id}`;
        checkbox.dataset.memberId = member.id;
        checkbox.checked = true; // Por padrão, todos participam
        
        const label = document.createElement('label');
        label.htmlFor = `member-${member.id}`;
        label.textContent = member.name;
        
        // Adicionar event listener para atualizar os inputs quando mudar a seleção
        checkbox.addEventListener('change', updateSplitInputs);
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

function updateSplitInputs() {
    const container = document.getElementById('custom-split-inputs');
    const summary = document.getElementById('split-summary');
    container.innerHTML = '';
    
    // Obter membros selecionados
    const selectedMembers = getSelectedMembers();
    
    if (selectedMembers.length === 0) {
        container.innerHTML = '<p>Selecione pelo menos um membro para participar da despesa.</p>';
        summary.style.display = 'none';
        return;
    }
    
    const splitMethod = document.querySelector('input[name="split-method"]:checked').value;
    
    selectedMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-input';
        
        const label = document.createElement('label');
        label.textContent = member.name + ':';
        label.style.minWidth = '80px';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = splitMethod === 'parts' ? '1' : '0.01';
        input.min = '0';
        input.placeholder = splitMethod === 'parts' ? 'Partes' : 'R$ 0,00';
        input.dataset.memberId = member.id;
        input.dataset.splitMethod = splitMethod;
        
        // Adicionar event listener para atualizar o resumo
        input.addEventListener('input', updateSplitSummary);
        
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
    
    updateSplitSummary();
}

function getSelectedMembers() {
    const checkboxes = document.querySelectorAll('#members-checkboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => {
        const memberId = checkbox.dataset.memberId;
        return appData.members.find(m => m.id === memberId);
    }).filter(Boolean);
}

function updateSplitSummary() {
    const summary = document.getElementById('split-summary');
    const totalPartsSpan = document.getElementById('total-parts');
    const valuePerPartSpan = document.getElementById('value-per-part');
    
    const splitMethod = document.querySelector('input[name="split-method"]:checked').value;
    const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    
    if (splitMethod === 'parts') {
        const inputs = document.querySelectorAll('#custom-split-inputs input[data-split-method="parts"]');
        let totalParts = 0;
        
        inputs.forEach(input => {
            totalParts += parseInt(input.value) || 0;
        });
        
        totalPartsSpan.textContent = totalParts;
        
        if (totalParts > 0 && expenseAmount > 0) {
            const valuePerPart = expenseAmount / totalParts;
            valuePerPartSpan.textContent = `R$ ${valuePerPart.toFixed(2)}`;
            summary.style.display = 'block';
        } else {
            summary.style.display = 'none';
        }
    } else {
        summary.style.display = 'none';
    }
}

// Funções de cálculo
function calculateBalances() {
    const balances = {};
    
    // Inicializar balanços
    appData.members.forEach(member => {
        balances[member.id] = 0;
    });
    
    // Calcular balanços baseados nas despesas
    appData.expenses.forEach(expense => {
        const payer = appData.members.find(m => m.id === expense.payerId);
        if (!payer) return;
        
        // Adicionar o valor pago
        balances[expense.payerId] += expense.amount;
        
        // Subtrair a parte que cada pessoa deve
        if (expense.splitType === 'equal') {
            const perPerson = expense.amount / appData.members.length;
            appData.members.forEach(member => {
                balances[member.id] -= perPerson;
            });
        } else if (expense.splitType === 'custom') {
            Object.keys(expense.splitDetails).forEach(memberId => {
                balances[memberId] -= expense.splitDetails[memberId];
            });
        }
    });
    
    // Aplicar pagamentos aos saldos
    appData.payments.forEach(payment => {
        // Quando alguém paga, isso REDUZ a dívida
        // Se Rafa deve R$ 100 para Alexandre e paga R$ 100, a dívida deve ser ZERO
        balances[payment.fromId] += payment.amount; // Rafa paga, então seu saldo melhora (menos negativo)
        balances[payment.toId] -= payment.amount;   // Alexandre recebe, então seu saldo piora (menos positivo)
    });
    
    return balances;
}

function simplifyDebts() {
    const balances = calculateBalances();
    const simplified = [];
    
    // Criar arrays de credores e devedores
    const creditors = [];
    const debtors = [];
    
    Object.keys(balances).forEach(memberId => {
        const balance = balances[memberId];
        if (balance > 0.01) {
            creditors.push({ memberId, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ memberId, amount: Math.abs(balance) });
        }
    });
    
    // Ordenar por valor (maior para menor)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Simplificar débitos
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        
        const amount = Math.min(creditor.amount, debtor.amount);
        
        if (amount > 0.01) {
            simplified.push({
                from: debtor.memberId,
                to: creditor.memberId,
                amount: amount
            });
            
            creditor.amount -= amount;
            debtor.amount -= amount;
            
            if (creditor.amount < 0.01) creditorIndex++;
            if (debtor.amount < 0.01) debtorIndex++;
        }
    }
    
    displaySimplifiedDebts(simplified);
}

function displaySimplifiedDebts(simplified) {
    const container = document.getElementById('simplified-debts');
    
    if (simplified.length === 0) {
        container.innerHTML = '<p>Não há débitos para simplificar!</p>';
        return;
    }
    
    let html = '<h4>Débitos simplificados:</h4>';
    
    simplified.forEach(debt => {
        const fromMember = appData.members.find(m => m.id === debt.from);
        const toMember = appData.members.find(m => m.id === debt.to);
        
        html += `
            <div class="debt-item">
                <div>
                    <strong>${fromMember.name}</strong> deve pagar 
                    <strong>${toMember.name}</strong>
                </div>
                <div class="debt-amount">R$ ${debt.amount.toFixed(2)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Funções de atualização da UI
function updateUI() {
    updateMembersList();
    updateExpensePayerSelect();
    updatePaymentSelects();
    updateBalances();
    updateExpensesHistory();
    updatePaymentsHistory();
    updateCustomSplitInputs();
}

function updateMembersList() {
    const container = document.getElementById('members-list');
    
    if (appData.members.length === 0) {
        container.innerHTML = '<p>Nenhum membro adicionado ainda.</p>';
        return;
    }
    
    let html = '';
    appData.members.forEach(member => {
        const hasPixKey = member.pixKey && member.pixKey.trim() !== '';
        const pixKeyDisplay = hasPixKey ? 
            `<div class="pix-key-info">
                <i class="fas fa-qrcode"></i> ${member.pixKeyType.toUpperCase()}: ${member.pixKey}
             </div>` : 
            '<div class="pix-key-info no-pix"><i class="fas fa-plus-circle"></i> Adicionar chave PIX</div>';
        
        html += `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    ${pixKeyDisplay}
                </div>
                <div class="member-actions">
                    <button onclick="editPixKey('${member.id}')" class="btn btn-outline btn-small">
                        <i class="fas fa-qrcode"></i> PIX
                    </button>
                    <button onclick="removeMember('${member.id}')" class="btn btn-danger btn-small">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateExpensePayerSelect() {
    const select = document.getElementById('expense-payer');
    select.innerHTML = '<option value="">Quem pagou?</option>';
    
    appData.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

function updatePaymentSelects() {
    const fromSelect = document.getElementById('payment-from');
    const toSelect = document.getElementById('payment-to');
    
    // Limpar selects
    fromSelect.innerHTML = '<option value="">Selecione quem paga</option>';
    toSelect.innerHTML = '<option value="">Selecione quem recebe</option>';
    
    // Preencher com membros
    appData.members.forEach(member => {
        const fromOption = document.createElement('option');
        fromOption.value = member.id;
        fromOption.textContent = member.name;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = member.id;
        toOption.textContent = member.name;
        toSelect.appendChild(toOption);
    });
}



function updateBalances() {
    const balances = calculateBalances();
    const container = document.getElementById('balances-list');
    
    if (appData.members.length === 0) {
        container.innerHTML = '<p>Adicione membros para ver os balanços.</p>';
        return;
    }
    
    let html = '';
    appData.members.forEach(member => {
        const balance = balances[member.id] || 0;
        let balanceClass = 'neutral';
        let balanceText = 'R$ 0,00';
        
        if (balance > 0.01) {
            balanceClass = 'positive';
            balanceText = `+R$ ${balance.toFixed(2)}`;
        } else if (balance < -0.01) {
            balanceClass = 'negative';
            balanceText = `-R$ ${Math.abs(balance).toFixed(2)}`;
        }
        
        html += `
            <div class="balance-item ${balanceClass}">
                <div>
                    <strong>${member.name}</strong>
                    <div class="balance-details">
                        ${balance > 0.01 ? 'Recebe' : balance < -0.01 ? 'Deve' : 'Em dia'}
                    </div>
                </div>
                <div class="balance-amount ${balanceClass}">${balanceText}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateExpensesHistory() {
    const container = document.getElementById('expenses-history');
    
    if (appData.expenses.length === 0) {
        container.innerHTML = '<p>Nenhuma despesa registrada ainda.</p>';
        return;
    }
    
    let html = '';
    appData.expenses.forEach(expense => {
        const payer = appData.members.find(m => m.id === expense.payerId);
        const date = new Date(expense.date).toLocaleDateString('pt-BR');
        
        let splitText = '';
        if (expense.splitType === 'equal') {
            splitText = `Dividido igualmente entre ${appData.members.length} pessoas`;
        } else {
            const customMembers = Object.keys(expense.splitDetails).map(id => {
                const member = appData.members.find(m => m.id === id);
                return member ? member.name : 'Desconhecido';
            });
            splitText = `Dividido entre: ${customMembers.join(', ')}`;
        }
        
        html += `
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-amount">R$ ${expense.amount.toFixed(2)}</div>
                </div>
                <div class="expense-details">
                    Pago por: <strong>${payer ? payer.name : 'Desconhecido'}</strong> | 
                    Data: ${date}
                </div>
                <div class="expense-split">
                    ${splitText}
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="removeExpense('${expense.id}')" class="btn btn-danger btn-small">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updatePaymentsHistory() {
    const container = document.getElementById('payments-list');
    
    if (appData.payments.length === 0) {
        container.innerHTML = '<p>Nenhum pagamento registrado ainda.</p>';
        return;
    }
    
    let html = '';
    appData.payments.forEach(payment => {
        const fromMember = appData.members.find(m => m.id === payment.fromId);
        const toMember = appData.members.find(m => m.id === payment.toId);
        const date = new Date(payment.date).toLocaleDateString('pt-BR');
        
        html += `
            <div class="payment-item">
                <div class="payment-header">
                    <div class="payment-details">
                        <strong>${fromMember ? fromMember.name : 'Desconhecido'}</strong> pagou para 
                        <strong>${toMember ? toMember.name : 'Desconhecido'}</strong>
                    </div>
                    <div class="payment-amount">R$ ${payment.amount.toFixed(2)}</div>
                </div>
                <div class="payment-description">${payment.description}</div>
                <div class="payment-date">Data: ${date}</div>
                <div style="margin-top: 10px;">
                    <button onclick="removePayment('${payment.id}')" class="btn btn-danger btn-small">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Funções de exportação/importação
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `partio-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData() {
    document.getElementById('import-modal').style.display = 'flex';
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('import-textarea').value = '';
}

function confirmImport() {
    const textarea = document.getElementById('import-textarea');
    const data = textarea.value.trim();
    
    if (!data) {
        alert('Por favor, insira os dados para importar.');
        return;
    }
    
    try {
        const importedData = JSON.parse(data);
        
        if (!importedData.members || !importedData.expenses) {
            throw new Error('Formato de dados inválido');
        }
        
        appData = importedData;
        saveData();
        updateUI();
        closeImportModal();
        
        alert('Dados importados com sucesso!');
    } catch (e) {
        alert('Erro ao importar dados. Verifique se o formato está correto.');
        console.error('Erro de importação:', e);
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.members || !importedData.expenses) {
                throw new Error('Formato de dados inválido');
            }
            
            appData = importedData;
            saveData();
            updateUI();
            
            alert('Dados importados com sucesso!');
        } catch (e) {
            alert('Erro ao importar arquivo. Verifique se o formato está correto.');
            console.error('Erro de importação:', e);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpar input
}

function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        appData = { members: [], expenses: [], customSplits: {}, payments: [] };
        saveData();
        updateUI();
        alert('Todos os dados foram limpos.');
    }
}

// Funções utilitárias
// Função para registrar pagamento
function registerPayment() {
    const fromSelect = document.getElementById('payment-from');
    const toSelect = document.getElementById('payment-to');
    const amountInput = document.getElementById('payment-amount');
    const descriptionInput = document.getElementById('payment-description');
    
    const fromId = fromSelect.value;
    const toId = toSelect.value;
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    
    // Validações
    if (!fromId || !toId) {
        alert('Por favor, selecione quem está pagando e quem está recebendo.');
        return;
    }
    
    if (fromId === toId) {
        alert('Uma pessoa não pode pagar para si mesma.');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Por favor, insira um valor válido para o pagamento.');
        return;
    }
    
    // Criar o pagamento
    const payment = {
        id: Date.now().toString(),
        fromId: fromId,
        toId: toId,
        amount: amount,
        description: description || 'Pagamento',
        date: new Date().toISOString()
    };
    
    // Adicionar à lista de pagamentos
    appData.payments.push(payment);
    
    // Salvar dados
    saveData();
    
    // Limpar formulário
    fromSelect.value = '';
    toSelect.value = '';
    amountInput.value = '';
    descriptionInput.value = '';
    
    // Atualizar UI
    updateUI();
    
    alert(`Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!`);
}

// Função para remover pagamento
function removePayment(paymentId) {
    if (confirm('Tem certeza que deseja remover este pagamento?')) {
        appData.payments = appData.payments.filter(p => p.id !== paymentId);
        saveData();
        updateUI();
        alert('Pagamento removido com sucesso!');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

// ===== FUNÇÕES DE SINCRONIZAÇÃO COM GOOGLE SHEETS =====

// Função para conectar com Google Sheets
async function connectToGoogleSheets() {
    const spreadsheetId = document.getElementById('spreadsheet-id').value.trim();
    
    if (!spreadsheetId) {
        alert('Por favor, insira o ID da planilha do Google Sheets.');
        return;
    }
    
    try {
        // Verificar se a planilha existe e é acessível
        const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${getGoogleApiKey()}`;
        const response = await fetch(testUrl);
        
        if (!response.ok) {
            throw new Error('Não foi possível acessar a planilha. Verifique o ID e as permissões.');
        }
        
        // Salvar configuração
        sheetsConfig.spreadsheetId = spreadsheetId;
        sheetsConfig.isConnected = true;
        sheetsConfig.lastSync = new Date();
        
        // Salvar no localStorage
        localStorage.setItem('partio-sheets-config', JSON.stringify(sheetsConfig));
        
        // Atualizar interface
        updateSyncInterface();
        
        // Fazer primeira sincronização
        await syncToSheets();
        
        alert('Conectado com sucesso! Os dados serão sincronizados automaticamente.');
        
    } catch (error) {
        console.error('Erro ao conectar:', error);
        alert('Erro ao conectar: ' + error.message);
    }
}

// Função para sincronizar dados para o Google Sheets
async function syncToSheets() {
    if (!sheetsConfig.isConnected || !sheetsConfig.spreadsheetId) {
        alert('Conecte-se primeiro a uma planilha do Google Sheets.');
        return;
    }
    
    try {
        // Preparar dados para envio
        const dataToSync = {
            members: appData.members,
            expenses: appData.expenses,
            customSplits: appData.customSplits,
            payments: appData.payments,
            lastSync: new Date().toISOString()
        };
        
        // Converter para formato de planilha
        const sheetsData = convertToSheetsFormat(dataToSync);
        
        // Enviar para Google Sheets
        await updateGoogleSheets(sheetsData);
        
        // Atualizar configuração
        sheetsConfig.lastSync = new Date();
        localStorage.setItem('partio-sheets-config', JSON.stringify(sheetsConfig));
        
        // Atualizar interface
        updateSyncInterface();
        
        alert('Dados sincronizados com sucesso!');
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        alert('Erro na sincronização: ' + error.message);
    }
}

// Função para desconectar do Google Sheets
function disconnectFromSheets() {
    if (confirm('Tem certeza que deseja desconectar do Google Sheets?')) {
        sheetsConfig.isConnected = false;
        sheetsConfig.spreadsheetId = null;
        sheetsConfig.lastSync = null;
        
        localStorage.removeItem('partio-sheets-config');
        updateSyncInterface();
        
        alert('Desconectado do Google Sheets. Os dados continuarão salvos localmente.');
    }
}

// Função para carregar dados do Google Sheets
async function loadFromSheets() {
    if (!sheetsConfig.isConnected || !sheetsConfig.spreadsheetId) {
        return;
    }
    
    try {
        const data = await fetchGoogleSheetsData();
        if (data) {
            // Mesclar dados locais com dados da planilha
            mergeData(data);
            updateUI();
            alert('Dados carregados do Google Sheets com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para converter dados para formato de planilha
function convertToSheetsFormat(data) {
    const sheets = {};
    
    // Planilha de membros
    sheets.members = [
        ['ID', 'Nome', 'PIX Key Type', 'PIX Key', 'Data Criação'],
        ...data.members.map(member => [
            member.id,
            member.name,
            member.pixKeyType || '',
            member.pixKey || '',
            member.createdAt || new Date().toISOString()
        ])
    ];
    
    // Planilha de despesas
    sheets.expenses = [
        ['ID', 'Descrição', 'Valor', 'Pagador ID', 'Tipo Divisão', 'Detalhes Divisão', 'Data'],
        ...data.expenses.map(expense => [
            expense.id,
            expense.description,
            expense.amount,
            expense.payerId,
            expense.splitType,
            JSON.stringify(expense.splitDetails || {}),
            expense.date || new Date().toISOString()
        ])
    ];
    
    // Planilha de pagamentos
    sheets.payments = [
        ['ID', 'De', 'Para', 'Valor', 'Descrição', 'Data'],
        ...data.payments.map(payment => [
            payment.id,
            payment.fromId,
            payment.toId,
            payment.amount,
            payment.description || '',
            payment.date || new Date().toISOString()
        ])
    ];
    
    return sheets;
}

// Função para atualizar Google Sheets
async function updateGoogleSheets(sheetsData) {
    const apiKey = getGoogleApiKey();
    const spreadsheetId = sheetsConfig.spreadsheetId;
    
    // Atualizar cada planilha
    for (const [sheetName, data] of Object.entries(sheetsData)) {
        const range = `${sheetName}!A1`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: data
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao atualizar planilha ${sheetName}: ${response.statusText}`);
        }
    }
}

// Função para buscar dados do Google Sheets
async function fetchGoogleSheetsData() {
    const apiKey = getGoogleApiKey();
    const spreadsheetId = sheetsConfig.spreadsheetId;
    
    const sheets = ['members', 'expenses', 'payments'];
    const data = {};
    
    for (const sheetName of sheets) {
        const range = `${sheetName}!A:Z`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            data[sheetName] = parseSheetsData(sheetName, result.values || []);
        }
    }
    
    return data;
}

// Função para fazer parse dos dados da planilha
function parseSheetsData(sheetName, rows) {
    if (rows.length < 2) return []; // Precisa ter cabeçalho + pelo menos uma linha
    
    const headers = rows[0];
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue; // Pular linhas vazias
        
        const item = {};
        headers.forEach((header, index) => {
            if (row[index] !== undefined) {
                item[header.toLowerCase().replace(/\s+/g, '')] = row[index];
            }
        });
        
        data.push(item);
    }
    
    return data;
}

// Função para mesclar dados
function mergeData(sheetsData) {
    // Mesclar membros
    if (sheetsData.members) {
        appData.members = sheetsData.members.map(member => ({
            id: member.id,
            name: member.nome,
            pixKeyType: member.pixkeytype,
            pixKey: member.pixkey,
            createdAt: member.datacriação
        }));
    }
    
    // Mesclar despesas
    if (sheetsData.expenses) {
        appData.expenses = sheetsData.expenses.map(expense => ({
            id: expense.id,
            description: expense.descrição,
            amount: parseFloat(expense.valor),
            payerId: expense.pagadorid,
            splitType: expense.tipodivisão,
            splitDetails: expense.detalhesdivisão ? JSON.parse(expense.detalhesdivisão) : {},
            date: expense.data
        }));
    }
    
    // Mesclar pagamentos
    if (sheetsData.payments) {
        appData.payments = sheetsData.payments.map(payment => ({
            id: payment.id,
            fromId: payment.de,
            toId: payment.para,
            amount: parseFloat(payment.valor),
            description: payment.descrição,
            date: payment.data
        }));
    }
    
    // Salvar dados mesclados
    saveData();
}

// Função para obter API Key do Google
function getGoogleApiKey() {
    // IMPORTANTE: Substitua pela sua API Key do Google Cloud Console
    // 1. Acesse: https://console.cloud.google.com
    // 2. Crie um projeto e ative a Google Sheets API
    // 3. Crie uma API Key em "Credenciais"
    // 4. Cole a chave aqui
    
    // Para desenvolvimento, você pode usar uma API key pública
    // Em produção, considere usar autenticação OAuth2
    return 'SUA_API_KEY_AQUI'; // ⚠️ SUBSTITUA PELA SUA API KEY!
}

// Função para atualizar interface de sincronização
function updateSyncInterface() {
    const syncBtn = document.getElementById('sync-btn');
    const loadBtn = document.getElementById('load-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const syncStatus = document.getElementById('sync-status');
    const statusText = document.getElementById('status-text');
    const lastSyncTime = document.getElementById('last-sync-time');
    
    if (sheetsConfig.isConnected) {
        syncBtn.style.display = 'inline-block';
        loadBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'inline-block';
        syncStatus.style.display = 'block';
        
        statusText.textContent = 'Conectado';
        if (sheetsConfig.lastSync) {
            lastSyncTime.textContent = new Date(sheetsConfig.lastSync).toLocaleString('pt-BR');
        }
    } else {
        syncBtn.style.display = 'none';
        loadBtn.style.display = 'none';
        disconnectBtn.style.display = 'none';
        syncStatus.style.display = 'none';
    }
}

// Função para carregar configuração do Google Sheets
function loadSheetsConfig() {
    const saved = localStorage.getItem('partio-sheets-config');
    if (saved) {
        try {
            sheetsConfig = JSON.parse(saved);
            updateSyncInterface();
        } catch (e) {
            console.error('Erro ao carregar configuração do Google Sheets:', e);
        }
    }
}

// Atualizar UI quando a janela ganha foco (para sincronizar dados entre abas)
window.addEventListener('focus', function() {
    loadData();
    updateUI();
});

// Salvar dados automaticamente quando a janela perde foco
window.addEventListener('blur', function() {
    saveData();
});
