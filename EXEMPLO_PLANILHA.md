# 📊 Exemplo de Planilha do Google Sheets

## 🚀 Criação Manual (Alternativa)

Se preferir criar a planilha manualmente antes de conectar:

### 1. Criar as Abas

Crie **3 abas** na sua planilha:

- `members` (Membros)
- `expenses` (Despesas)  
- `payments` (Pagamentos)

### 2. Aba "members"

| ID | Nome | PIX Key Type | PIX Key | Data Criação |
|----|------|--------------|---------|--------------|
| 1 | Rafa | CPF | 123.456.789-00 | 2024-01-15T10:00:00.000Z |
| 2 | Alexandre | EMAIL | alexandre@email.com | 2024-01-15T10:05:00.000Z |

### 3. Aba "expenses"

| ID | Descrição | Valor | Pagador ID | Tipo Divisão | Detalhes Divisão | Data |
|----|------------|-------|-------------|---------------|------------------|------|
| 1 | Pizza | 100.00 | 1 | equal | {} | 2024-01-15T12:00:00.000Z |
| 2 | Uber | 25.50 | 2 | custom | {"1":50,"2":25.5} | 2024-01-15T14:00:00.000Z |

### 4. Aba "payments"

| ID | De | Para | Valor | Descrição | Data |
|----|----|----|-------|------------|------|
| 1 | 1 | 2 | 50.00 | Pagamento da pizza | 2024-01-15T16:00:00.000Z |

## ⚠️ Importante

- **Mantenha os nomes das abas** exatamente como mostrado
- **Não altere os cabeçalhos** das colunas
- **Use o formato de data** ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
- **IDs devem ser únicos** e sequenciais

## 🔗 Conectar a Aplicação

1. **Copie o ID** da planilha da URL
2. **Cole no campo** "ID da Planilha" na aplicação
3. **Clique em "Conectar Planilha"**
4. **Teste a sincronização**

---

**💡 Dica:** É mais fácil deixar a aplicação criar a planilha automaticamente!
