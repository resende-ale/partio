# 🧾 Partio - Divisor de Despesas

Um aplicativo web para dividir despesas entre membros de um grupo, similar ao Splitwise. Ideal para viagens em grupo, eventos e qualquer situação onde você precise dividir gastos.

## ✨ Funcionalidades

- **Gestão de Membros**: Adicione e remova membros do grupo
- **Registro de Despesas**: Registre gastos com descrição, valor e quem pagou
- **Divisão Automática**: Divida despesas igualmente ou de forma personalizada
- **Cálculo de Balanços**: Veja quanto cada pessoa deve ou recebe
- **Simplificação de Débitos**: Algoritmo inteligente para minimizar transferências
- **Histórico Completo**: Mantenha registro de todas as despesas
- **Exportação/Importação**: Salve e compartilhe dados entre dispositivos
- **Persistência Local**: Dados salvos automaticamente no navegador
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile

## 🚀 Como Usar

### 1. Adicionar Membros
- Digite o nome do membro no campo "Nome do membro"
- Clique em "Adicionar" ou pressione Enter
- Repita para todos os participantes

### 2. Registrar Despesas
- Preencha a descrição da despesa
- Insira o valor gasto
- Selecione quem pagou
- Escolha o tipo de divisão:
  - **Igualmente**: Divide o valor entre todos os membros
  - **Personalizada**: Define valores específicos para cada pessoa
- Clique em "Registrar Despesa"

### 3. Visualizar Balanços
- Os balanços são calculados automaticamente
- Valores positivos (verde) = recebe dinheiro
- Valores negativos (vermelho) = deve dinheiro
- Valores neutros = em dia

### 4. Simplificar Débitos
- Clique em "Simplificar" para otimizar as transferências
- O sistema calcula a forma mais eficiente de quitar as dívidas

### 5. Sincronizar com Google Sheets
- **Conecte sua planilha** para sincronização automática entre dispositivos
- **Acesse de qualquer lugar** - computador, celular, tablet
- **Backup automático** na nuvem do Google

### 6. Exportar/Importar Dados
- **Exportar**: Clique em "Exportar Dados" para baixar um arquivo JSON
- **Importar**: Clique em "Importar Dados" e cole os dados exportados

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com gradientes e animações
- **JavaScript Vanilla**: Lógica da aplicação sem dependências
- **LocalStorage**: Persistência de dados no navegador
- **Google Sheets API**: Sincronização em nuvem entre dispositivos
- **Font Awesome**: Ícones bonitos e intuitivos

## 📱 Responsividade

O aplicativo é totalmente responsivo e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🌐 Hospedagem no GitHub Pages

### Passo a Passo:

1. **Faça commit dos arquivos**:
   ```bash
   git add .
   git commit -m "Initial commit: Partio app"
   git push origin main
   ```

2. **Ative o GitHub Pages**:
   - Vá para Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Clique em Save

3. **Aguarde a publicação**:
   - O site estará disponível em: `https://seu-usuario.github.io/partio`

### Estrutura de Arquivos:
```
partio/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
└── README.md           # Este arquivo
```

## 💾 Persistência de Dados

- **LocalStorage**: Dados salvos automaticamente no navegador
- **Exportação**: Arquivo JSON para backup e compartilhamento
- **Importação**: Restaure dados de outros dispositivos
- **Sincronização**: Dados são sincronizados entre abas abertas

## 🔒 Privacidade e Segurança

- **Sem servidor**: Todos os dados ficam no seu dispositivo
- **Sem tracking**: Nenhuma informação é enviada para terceiros
- **Controle total**: Você decide quando e como compartilhar dados

## 🎯 Casos de Uso

- **Viagens em grupo**: Dividir custos de hospedagem, alimentação, transporte
- **Eventos**: Compartilhar despesas de festas, reuniões, workshops
- **Moradia compartilhada**: Contas de casa, compras coletivas
- **Projetos**: Custos de trabalho em equipe
- **Qualquer situação**: Onde você precise dividir gastos entre pessoas

## 🚨 Limitações do MVP

- **Sem banco de dados**: Dados ficam apenas no navegador
- **Sem autenticação**: Qualquer pessoa com acesso pode modificar dados
- **Sem backup automático**: É necessário exportar dados manualmente
- **Sem sincronização em tempo real**: Cada dispositivo tem seus próprios dados

## 🔮 Próximas Versões

- [ ] Sistema de autenticação
- [ ] Banco de dados em nuvem
- [ ] Sincronização em tempo real
- [ ] Notificações push
- [ ] App mobile nativo
- [ ] Integração com bancos
- [ ] Relatórios e gráficos
- [ ] Categorização de despesas

## 🤝 Contribuição

Este é um projeto MVP criado para demonstração. Contribuições são bem-vindas!

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.

## 🆘 Suporte

Se encontrar algum problema ou tiver sugestões:
1. Verifique se todos os arquivos estão presentes
2. Teste em diferentes navegadores
3. Limpe o cache do navegador se necessário
4. Verifique se o JavaScript está habilitado

---

**Partio** - Simplificando a divisão de despesas desde 2024! 🎉
