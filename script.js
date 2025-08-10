// Estrutura de dados principal
let appData = {
    members: [],
    expenses: [],
    customSplits: {}
};

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
}

// Funções de gerenciamento de dados
function saveData() {
    localStorage.setItem('partioData', JSON.stringify(appData));
}

function loadData() {
    const saved = localStorage.getItem('partioData');
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            appData = { members: [], expenses: [], customSplits: {} };
        }
    }
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
        name: name
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
        const customInputs = document.querySelectorAll('#custom-split-inputs input[type="number"]');
        let totalSplit = 0;
        
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
    const container = document.getElementById('custom-split-inputs');
    container.innerHTML = '';
    
    appData.members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-input';
        
        const label = document.createElement('label');
        label.textContent = member.name + ':';
        label.style.minWidth = '80px';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.min = '0';
        input.placeholder = 'R$ 0,00';
        input.dataset.memberId = member.id;
        
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
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
    updateSummary();
    updateBalances();
    updateExpensesHistory();
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
        html += `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                </div>
                <div class="member-actions">
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

function updateSummary() {
    const totalAmount = appData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const memberCount = appData.members.length;
    const perPerson = memberCount > 0 ? totalAmount / memberCount : 0;
    
    document.getElementById('total-amount').textContent = `R$ ${totalAmount.toFixed(2)}`;
    document.getElementById('per-person').textContent = `R$ ${perPerson.toFixed(2)}`;
    document.getElementById('member-count').textContent = memberCount;
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
        appData = { members: [], expenses: [], customSplits: {} };
        saveData();
        updateUI();
        alert('Todos os dados foram limpos.');
    }
}

// Funções utilitárias
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
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
