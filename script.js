// Estrutura de dados principal
let appData = {
    members: [],
    expenses: [],
    customSplits: {},
    payments: []
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
        balances[payment.fromId] -= payment.amount;
        balances[payment.toId] += payment.amount;
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

// Atualizar UI quando a janela ganha foco (para sincronizar dados entre abas)
window.addEventListener('focus', function() {
    loadData();
    updateUI();
});

// Salvar dados automaticamente quando a janela perde foco
window.addEventListener('blur', function() {
    saveData();
});
