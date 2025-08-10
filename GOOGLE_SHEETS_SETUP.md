# 🔗 Configuração da Integração com Google Sheets

## 📋 Pré-requisitos

1. **Conta Google** (gratuita)
2. **Google Sheets** (incluído na conta Google)
3. **API Key** do Google (gratuita)

## 🚀 Passo a Passo

### 1. Criar a Planilha

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma **nova planilha**
3. **Renomeie** para "Partio - Controle de Despesas"
4. **Compartilhe** a planilha (clique em "Compartilhar" no canto superior direito)
5. Configure como **"Qualquer pessoa com o link pode visualizar"**

### 2. Obter o ID da Planilha

1. **Copie a URL** da planilha
2. O ID está entre `/d/` e `/edit`
3. **Exemplo:**
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   ```
   **ID:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 3. Configurar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. **Crie um novo projeto** ou selecione um existente
3. **Ative a Google Sheets API:**
   - Menu → "APIs e Serviços" → "Biblioteca"
   - Pesquise por "Google Sheets API"
   - Clique em "Ativar"

### 4. Criar API Key

1. **APIs e Serviços** → "Credenciais"
2. Clique em **"Criar Credenciais"** → "Chave de API"
3. **Copie a API Key** gerada
4. **Restrinja a API Key** (recomendado):
   - Clique na API Key criada
   - Em "Restrições de API" → "Restringir chave"
   - Selecione "Google Sheets API"

### 5. Configurar a Aplicação

1. **Abra a aplicação Partio**
2. Vá para a seção **"Sincronização com Google Sheets"**
3. **Cole o ID da planilha** no campo correspondente
4. **Clique em "Conectar Planilha"**

## 📊 Estrutura da Planilha

A aplicação criará automaticamente **3 abas:**

### 🔵 Aba "members"
- ID | Nome | PIX Key Type | PIX Key | Data Criação

### 🟢 Aba "expenses"  
- ID | Descrição | Valor | Pagador ID | Tipo Divisão | Detalhes Divisão | Data

### 🟡 Aba "payments"
- ID | De | Para | Valor | Descrição | Data

## ⚠️ Importante

- **Não delete** as abas criadas
- **Não altere** os cabeçalhos das colunas
- **Mantenha** a estrutura original
- **Backup automático** do Google

## 🔄 Sincronização

- **Automática:** A cada alteração nos dados
- **Manual:** Botão "Sincronizar Agora"
- **Tempo real:** Entre todos os dispositivos conectados

## 🆘 Solução de Problemas

### Erro "Não foi possível acessar a planilha"
- Verifique se o **ID está correto**
- Confirme se a planilha está **compartilhada**
- Verifique se a **API Key está ativa**

### Erro "Erro ao atualizar planilha"
- Verifique as **permissões** da planilha
- Confirme se a **API Key tem acesso**
- Tente **reconectar** a planilha

## 💡 Dicas

- **Use a mesma planilha** em todos os dispositivos
- **Mantenha a API Key segura**
- **Faça backup** regular dos dados
- **Teste a sincronização** antes de usar em produção

---

**🎉 Pronto! Agora seus dados ficarão sincronizados automaticamente entre computador, celular e tablet!**
