import type { Dictionary } from "../dictionary-type";

export const pt: Dictionary = {
  // Shared across multiple pages
  "common.login": "Entrar",
  "common.register": "Registo",
  "common.dashboard": "Painel",
  "common.logout": "Sair",
  "common.loading": "A carregar…",
  "common.error": "Algo correu mal. Tente novamente.",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.close": "Fechar",
  "common.copy": "Copiar",
  "common.copied": "Copiado",
  "common.back": "Voltar",
  "common.continue": "Continuar",
  "common.submit": "Enviar",
  "common.search": "Pesquisar",
  "common.noData": "Sem dados disponíveis.",
  "common.viewAll": "Ver tudo",
  "common.optional": "Opcional",

  // Navbar
  "nav.trading": "Negociação",
  "nav.markets": "Mercados",
  "nav.wallet": "Carteira",
  "nav.about": "Sobre nós",
  "nav.analytics": "Análises",
  "nav.bonuses": "Bónus",
  "nav.account": "Conta",
  "nav.deposit": "Depósito",
  "nav.withdrawal": "Retirada",
  "nav.history": "Histórico",
  "nav.verification": "Verificação",
  "nav.settings": "Definições",
  "nav.support": "Suporte",
  "nav.accountMenu": "Menu da conta",
  "nav.siteMenu": "Menu",
  "nav.toggleMenu": "Abrir/fechar menu",
  "nav.language": "Idioma",
  "nav.logoutSuccess": "Sessão terminada",
  "nav.logoutError": "Falha ao terminar sessão. Tente novamente.",
  "nav.searchAria": "Pesquisar criptomoedas",
  "nav.searchPlaceholder": "Pesquisar criptomoedas",
  "nav.searchNoResults": "Nenhuma criptomoeda encontrada.",

  // Account
  "account.makeDeposit": "Fazer um depósito",
  "account.accountInfo": "Informação da conta",
  "account.login": "Login",
  "account.email": "E-mail",
  "account.accountType": "Tipo de conta",
  "account.leverage": "Alavancagem",
  "account.recentTransactions": "Transações recentes",
  "account.viewAll": "Ver tudo",
  "account.noTransactions": "Ainda sem transações.",
  "account.transactionType.deposit": "Depósito",
  "account.transactionType.withdrawal": "Retirada",
  "account.transactionType.bonus": "Bónus",
  "account.transactionType.trade": "Negociação",
  "account.transactionType.referralBonus": "Bónus de indicação",
  "account.transactionType.firstDepositBonus": "Bónus de primeiro depósito",
  "account.summary.weeklyProfitLoss": "Lucro / Prejuízo (7 dias)",
  "account.twoFactorAuth": "Autenticação de dois fatores",
  "account.twoFactorEnabled": "Ativado",
  "account.twoFactorDisabled": "Desativado",
  "account.referralCode": "Código de indicação",
  "account.referralCodeCopied": "Código de indicação copiado",

  // Settings
  "settings.title": "Definições",
  "settings.profile": "Perfil",
  "settings.firstName": "Nome",
  "settings.lastName": "Apelido",
  "settings.email": "E-mail",
  "settings.saveChanges": "Guardar alterações",
  "settings.toastProfileUpdated": "Perfil atualizado",
  "settings.passwordSecurity": "Palavra-passe e segurança",
  "settings.currentPassword": "Palavra-passe atual",
  "settings.newPassword": "Nova palavra-passe",
  "settings.twoFactorAuth": "Autenticação de dois fatores (2FA)",
  "settings.twoFactorAuthDesc": "Adicione uma camada extra de segurança à sua conta",
  "settings.updatePassword": "Atualizar palavra-passe",
  "settings.toastPasswordUpdated": "Palavra-passe atualizada",
  "settings.notifications": "Notificações",
  "settings.emailNotifications": "Notificações por e-mail",
  "settings.emailNotificationsDesc":
    "Receba atualizações sobre depósitos, retiradas e negociações",
  "settings.pushNotifications": "Notificações push",
  "settings.pushNotificationsDesc": "Receba notificações em tempo real neste dispositivo",
  "settings.marketAlerts": "Alertas de mercado",
  "settings.marketAlertsDesc": "Avisar-me sobre movimentos de preço significativos",
  "settings.languageTheme": "Idioma e tema",
  "settings.language": "Idioma",
  "settings.theme": "Tema",
  "settings.themeDark": "Escuro",
  "settings.themeLight": "Claro",

  "settings.emailCurrentLabel": "E-mail atual",
  "settings.emailChangeButton": "Alterar e-mail",
  "settings.emailNewLabel": "Novo e-mail",
  "settings.emailCurrentPasswordLabel": "Palavra-passe atual",
  "settings.emailSendConfirmation": "Enviar e-mail de confirmação",
  "settings.emailCancelChange": "Cancelar",
  "settings.emailPendingNotice":
    "Foi enviado um link de confirmação para {email}. Clique nele para concluir a alteração do seu e-mail.",
  "settings.toastEmailChangeRequested": "E-mail de confirmação enviado",
  "settings.toastEmailChangeConfirmed": "O seu endereço de e-mail foi atualizado",
  "settings.toastEmailChangeExpired": "Esse link de confirmação expirou",
  "settings.toastEmailChangeInvalid": "Esse link de confirmação é inválido",
  "settings.toastSaveFailed": "Falha ao guardar as alterações",

  "settings.confirmNewPassword": "Confirmar nova palavra-passe",
  "settings.toastPasswordChangeFailed": "Falha ao alterar a palavra-passe",
  "settings.passwordMismatch": "As palavras-passe não coincidem",

  "settings.twoFactorEnabledLabel": "2FA ativado",
  "settings.twoFactorDisabledLabel": "2FA desativado",
  "settings.twoFactorEnableButton": "Ativar 2FA",
  "settings.twoFactorDisableButton": "Desativar 2FA",
  "settings.twoFactorSetupTitle": "Configurar autenticação de dois fatores",
  "settings.twoFactorSetupInstructions":
    "Digitalize este código QR com o Google Authenticator, Microsoft Authenticator, Authy ou outra app TOTP compatível.",
  "settings.twoFactorManualEntry": "Ou introduza este código manualmente:",
  "settings.twoFactorCodeLabel": "Código de 6 dígitos",
  "settings.twoFactorConfirmButton": "Confirmar e ativar",
  "settings.twoFactorCancelButton": "Cancelar",
  "settings.twoFactorDisableTitle": "Desativar autenticação de dois fatores",
  "settings.twoFactorDisableInstructions":
    "Introduza um código atual da sua app de autenticação para confirmar.",
  "settings.toastTwoFactorEnabled": "2FA ativado com sucesso",
  "settings.toastTwoFactorDisabled": "2FA desativado com sucesso",
  "settings.toastInvalidCode": "Código de verificação inválido",
  "settings.toastTwoFactorSetupFailed": "Falha ao iniciar a configuração do 2FA",

  // Deposit
  "deposit.pageTitle": "Depósito",
  "deposit.infoTitle": "Informação importante",
  "deposit.infoMinAmount": "O valor mínimo de depósito é 250 USDT.",
  "deposit.infoCorrectDetails":
    "Certifique-se de que todos os dados de pagamento estão corretos.",
  "deposit.infoNetworkCorrect": "Certifique-se de que a rede está correta.",
  "deposit.infoNoFee": "Não cobramos taxa por depósitos.",
  "deposit.selectPaymentMethod": "Selecione o método de pagamento",
  "deposit.selectNetwork": "Selecione a rede",
  "deposit.selectNetworkPlaceholder": "Selecione a rede",
  "deposit.selectNetworkError": "Selecione uma rede",
  "deposit.depositAddressLabel": "Endereço de depósito",
  "deposit.addressLabel": "Endereço",
  "deposit.copyButton": "Copiar",
  "deposit.addressCopied": "Endereço copiado",
  "deposit.amountLabel": "Valor",
  "deposit.proofModalTitle": "Confirmação de pagamento",
  "deposit.proofModalText":
    "Anexe uma captura de ecrã da sua transferência para podermos confirmar o seu depósito.",
  "deposit.proofModalHint":
    "A captura de ecrã deve mostrar o valor e o estado da transferência.",
  "deposit.proofFileLabel": "Captura de ecrã do pagamento",
  "deposit.proofUploadButton": "Carregar captura de ecrã",
  "deposit.proofUploadedLabel": "Captura de ecrã carregada",
  "deposit.proofRemoveAria": "Remover captura de ecrã",
  "deposit.proofRequiredError": "Anexe uma captura de ecrã da sua transferência.",
  "deposit.proofSubmitButton": "Enviar para revisão",
  "deposit.detailsLabel": "Detalhes do depósito",
  "deposit.youWillGet": "Vai receber",
  "deposit.submitButton": "Fazer um depósito",
  "deposit.minAmountError": "O valor mínimo de depósito é 250 USDT",
  "deposit.pendingSubmittedTitle": "O pagamento está a ser processado.",
  "deposit.pendingSubmittedDescription": "A aguardar confirmação.",
  "deposit.failedFallback": "Falha no depósito",
  "deposit.paymentMethodCard": "Visa / Mastercard",
  "deposit.paymentMethodBankTransfer": "Transferência bancária",
  "deposit.paymentMethodBitcoin": "Bitcoin",
  "deposit.paymentMethodTether": "Tether (USDT)",
  "deposit.paymentMethodDaysEstimate": "2-5 dias úteis",
  "deposit.paymentMethodHoursEstimate": "Dentro de 24 horas",

  // Withdrawal
  "withdrawal.pageTitle": "Retirada",
  "withdrawal.verificationRequiredTitle": "Verificação necessária",
  "withdrawal.verificationRequiredDesc":
    "Para levantar fundos, conclua primeiro a verificação da conta.",
  "withdrawal.goToVerification": "Ir para verificação",
  "withdrawal.infoTitle": "Informação importante",
  "withdrawal.infoProcessingTime": "As retiradas são processadas em 1 a 3 dias úteis.",
  "withdrawal.infoNetworkCorrect":
    "Certifique-se de que todos os dados de pagamento e a rede estão corretos.",
  "withdrawal.infoClosePositions":
    "Certifique-se de que todas as posições de negociação estão fechadas antes de fazer uma retirada.",
  "withdrawal.infoNoFee": "Não há taxa de retirada.",
  "withdrawal.selectPaymentMethod": "Selecione o método de pagamento",
  "withdrawal.detailsLabel": "Detalhes da retirada",
  "withdrawal.availableLabel": "Disponível:",
  "withdrawal.youWillGet": "Vai receber",
  "withdrawal.submitButton": "Solicitar retirada",
  "withdrawal.minAmountError": "O valor mínimo de retirada é 50 USDT",
  "withdrawal.selectNetworkError": "Selecione uma rede",
  "withdrawal.addressLabel": "Endereço da carteira",
  "withdrawal.addressPlaceholder": "Introduza o endereço da carteira",
  "withdrawal.addressRequiredError": "Introduza o endereço da carteira",
  "withdrawal.serverInsufficientBalanceError": "Saldo disponível insuficiente",
  "withdrawal.requestPrefix": "Pedido de retirada de",
  "withdrawal.requestSuffix": "enviado",
  "withdrawal.failedFallback": "Falha na retirada",

  // History
  "history.pageTitle": "Histórico",
  "history.filterAll": "Todas as transações",
  "history.filterDeposits": "Depósitos",
  "history.filterWithdrawals": "Retiradas",
  "history.filterBonuses": "Bónus",
  "history.filterAdjustments": "Ajustes",
  "history.typeDeposit": "Depósito",
  "history.typeWithdrawal": "Retirada",
  "history.typeBonus": "Bónus",
  "history.typeTrade": "Negociação",
  "history.typeAdjustment": "Ajuste de saldo",
  "history.typeReferralBonus": "Bónus de indicação",
  "history.typeFirstDepositBonus": "Bónus de primeiro depósito",
  "history.columnId": "ID",
  "history.columnType": "Tipo",
  "history.columnAmount": "Valor",
  "history.columnStatus": "Estado",
  "history.columnDate": "Data",
  "history.emptyState": "Nenhuma transação encontrada.",
  "history.statusCompleted": "Concluído",
  "history.statusPending": "Pendente",
  "history.statusFailed": "Falhou",

  // Verification
  "verification.pageTitle": "Verificação da conta",
  "verification.pageDescription":
    "Para cumprir as regulamentações internacionais, verifique a sua conta enviando os documentos abaixo.",
  "verification.uploadDocumentsHeading": "Carregar documentos",
  "verification.infoTitle": "Documentos necessários",
  "verification.infoIdentityDoc":
    "Documento de identidade (passaporte, cartão de cidadão ou carta de condução).",
  "verification.infoProofOfAddress":
    "Comprovativo de morada (fatura de serviços, extrato bancário ou similar).",
  "verification.infoValidDocs":
    "Todos os documentos devem ser válidos e estar claramente visíveis.",
  "verification.infoPrivacyPolicy":
    "Processamos os seus dados de acordo com a nossa Política de Privacidade.",
  "verification.identityDocumentLabel": "Documento de identidade",
  "verification.proofOfAddressLabel": "Comprovativo de morada",
  "verification.missingDocsError": "Carregue os dois documentos obrigatórios",
  "verification.submitSuccess": "Documentos enviados para revisão",
  "verification.submitFailedFallback": "Falha no envio",
  "verification.submitButton": "Enviar documentos",
  "verification.chooseFile": "Escolher ficheiro",
  "verification.missingInfoError": "Preencha todos os campos de informação pessoal",
  "verification.countryLabel": "País",
  "verification.countryPlaceholder": "ex.: Portugal",
  "verification.dateOfBirthLabel": "Data de nascimento",
  "verification.addressLabel": "Morada",
  "verification.addressPlaceholder": "Rua, cidade, código postal",
  "verification.personalInfoHeading": "Informação pessoal",
  "verification.documentsHeading": "Documentos",
  "verification.fullNameLabel": "Nome completo",
  "verification.statusVerified": "Verificado",
  "verification.statusPending": "Em análise",
  "verification.statusRejected": "Rejeitado",
  "verification.statusUnverified": "Não verificado",
  "verification.rejectionReasonLabel": "Motivo da rejeição",
  "verification.pendingMessage":
    "Os seus documentos estão em análise. Iremos notificá-lo assim que houver uma decisão.",
  "verification.rejectedMessage":
    "A sua verificação foi rejeitada. Reveja o motivo abaixo, corrija e reenvie os seus dados.",
  "account.verification": "Verificação",

  // Wallet
  "wallet.page.title": "Carteira",
  "wallet.page.subtitle": "Faça a gestão dos seus ativos num só lugar",
  "wallet.summary.availableBalance": "Saldo disponível",
  "wallet.summary.lockedInOrders": "Em ordens",
  "wallet.summary.assetsValue": "Valor dos ativos",
  "wallet.summary.deposit": "Depositar",
  "wallet.summary.withdraw": "Levantar",
  "wallet.summary.history": "Histórico",
  "wallet.tabs.myAssets": "Os meus ativos",
  "wallet.tabs.openOrders": "Ordens abertas",
  "wallet.tabs.history": "Histórico",
  "wallet.assets.headers.asset": "Ativo",
  "wallet.assets.headers.amount": "Quantidade",
  "wallet.assets.headers.priceCostBasis": "Preço / Custo médio",
  "wallet.assets.headers.chart": "Gráfico",
  "wallet.assets.headers.unrealizedPnl": "PnL não realizado",
  "wallet.assets.loading": "A carregar ativos…",
  "wallet.assets.empty": "Ainda não tem ativos. Compre em Spot para começar.",
  "wallet.assets.costLabel": "Custo:",
  "wallet.assets.openOnTradingAria": "Abrir em Negociação",
  "wallet.orders.headers.pair": "Par",
  "wallet.orders.loading": "A carregar ordens…",
  "wallet.orders.empty": "Nenhuma ordem aberta.",
  "wallet.orders.statusOpen": "Aberta",
  "wallet.orders.cancelAria": "Cancelar ordem",
  "wallet.orders.cancelSuccess": "Ordem cancelada",
  "wallet.orders.cancelError": "Falha ao cancelar a ordem",
  "wallet.history.headers.cryptoPair": "Cripto / Par",
  "wallet.history.headers.total": "Total",
  "wallet.history.headers.dateTime": "Data / Hora",
  "wallet.history.loading": "A carregar histórico…",
  "wallet.history.empty": "Sem histórico de negociação.",
  "wallet.history.statusFilled": "Executada",
  "wallet.table.type": "Tipo",
  "wallet.table.side": "Lado",
  "wallet.table.price": "Preço",
  "wallet.table.quantity": "Quantidade",
  "wallet.table.status": "Estado",
  "wallet.table.typeMarket": "Mercado",
  "wallet.table.typeLimit": "Limitada",
  "wallet.table.sideBuy": "Compra",
  "wallet.table.sideSell": "Venda",

  // Trading
  "trading.page.loadingTerminal": "A carregar terminal de negociação…",
  "trading.watchlist.addFavorite": "Adicionar aos favoritos",
  "trading.watchlist.removeFavorite": "Remover dos favoritos",
  "trading.watchlist.selectPair": "Selecionar par",
  "trading.chart.loading": "A carregar gráfico…",
  "trading.orderPanel.title": "Negociação Spot",
  "trading.orderPanel.buy": "Comprar",
  "trading.orderPanel.sell": "Vender",
  "trading.orderPanel.market": "Mercado",
  "trading.orderPanel.limit": "Limitada",
  "trading.orderPanel.priceLabel": "Preço",
  "trading.orderPanel.amountLabel": "Valor",
  "trading.orderPanel.quantityLabel": "Quantidade",
  "trading.orderPanel.available": "Disponível:",
  "trading.orderPanel.total": "Total",
  "trading.orderPanel.sliderBuyAria": "Valor de compra como percentagem do disponível",
  "trading.orderPanel.sliderSellAria": "Valor de venda como percentagem do disponível",
  "trading.orderPanel.errors.invalidAmount": "Introduza um valor válido",
  "trading.orderPanel.errors.amountExceedsAvailable": "O valor excede o disponível",
  "trading.orderPanel.errors.insufficientUsdt": "USDT insuficiente",
  "trading.orderPanel.errors.priceRequired": "Introduza um preço",
  "trading.orderPanel.errors.orderFailed": "Falha na ordem",
  "trading.orderPanel.success.bought": "Comprado",
  "trading.orderPanel.success.sold": "Vendido",
  "trading.orderPanel.success.limitBuyPlaced": "Ordem limitada de compra colocada",
  "trading.orderPanel.success.limitSellPlaced": "Ordem limitada de venda colocada",
  "trading.orders.columnPair": "Par",
  "trading.orders.columnType": "Tipo",
  "trading.orders.columnSide": "Lado",
  "trading.orders.columnPrice": "Preço",
  "trading.orders.columnQuantity": "Quantidade",
  "trading.orders.columnStatus": "Estado",
  "trading.orders.loading": "A carregar ordens…",
  "trading.orders.emptyOpen": "Nenhuma ordem aberta.",
  "trading.orders.emptyHistory": "Ainda sem histórico de ordens.",
  "trading.orders.statusOpen": "Aberta",
  "trading.orders.statusFilled": "Executada",
  "trading.orders.statusCancelled": "Cancelada",
  "trading.orders.filledSuffix": "executado",
  "trading.orders.cancelAria": "Cancelar ordem",
  "trading.orders.cancelSuccess": "Ordem cancelada",
  "trading.orders.cancelError": "Falha ao cancelar a ordem",
  "trading.orders.cancelConfirmTitle": "Cancelar ordem?",
  "trading.orders.cancelConfirmBodyPrefix": "Tem a certeza de que quer cancelar a ordem",
  "trading.orders.cancelConfirmBodySuffix": "?",
  "trading.orders.cancelConfirmBack": "Voltar",
  "trading.orders.cancelConfirmConfirm": "Cancelar ordem",
  "trading.orders.openTab": "Ordens abertas",
  "trading.orders.historyTab": "Histórico de ordens",

  // Marketing — Home
  "marketing.home.hero.badge": "+20% no seu primeiro depósito",
  "marketing.home.hero.titleLine1": "O seu primeiro depósito —",
  "marketing.home.hero.titlePrefix": "",
  "marketing.home.hero.titleHighlight": "20% maior",
  "marketing.home.hero.subtitle":
    "Financie a sua conta pela primeira vez e receba um bónus. Negoceie criptomoedas e outros ativos numa plataforma fiável e fácil de usar.",
  "marketing.home.hero.primaryCta": "Obter bónus de +20%",
  "marketing.home.hero.viewMarkets": "Ver mercados",

  "marketing.home.phone.balanceLabel": "O seu saldo",
  "marketing.home.phone.depositLabel": "Primeiro depósito",
  "marketing.home.phone.bonusLabel": "Bónus +20%",
  "marketing.home.phone.totalLabel": "Total",

  "marketing.home.stats.bonus.value": "+20%",
  "marketing.home.stats.bonus.label": "Bónus no seu primeiro depósito",
  "marketing.home.stats.assets.value": "100+",
  "marketing.home.stats.assets.label": "Ativos disponíveis",
  "marketing.home.stats.uptime.value": "24/7",
  "marketing.home.stats.uptime.label": "Acesso à plataforma, 24 horas por dia",
  "marketing.home.stats.referral.value": "até 100 USDT",
  "marketing.home.stats.referral.label": "Por amigo convidado",
  "marketing.home.stats.referral.sublabel": "(programa de indicação)",

  "marketing.home.referral.titleLine1": "Convide amigos —",
  "marketing.home.referral.titleLine2Prefix": "receba ",
  "marketing.home.referral.titleHighlight": "até 100 USDT",
  "marketing.home.referral.description":
    "O seu amigo recebe +20% no primeiro depósito, e você recebe 10% do valor do depósito dele (até 100 USDT).",
  "marketing.home.referral.depositLabel": "depósitos",
  "marketing.home.referral.receiveLabel": "você recebe",
  "marketing.home.referral.deposit1Value": "250 USDT",
  "marketing.home.referral.receive1Value": "25 USDT",
  "marketing.home.referral.deposit2Value": "1.000 USDT",
  "marketing.home.referral.receive2Value": "100 USDT",

  "marketing.home.benefits.security.title": "Segurança dos fundos",
  "marketing.home.benefits.security.description": "Carteiras frias e proteção 2FA",
  "marketing.home.benefits.instant.title": "Operações instantâneas",
  "marketing.home.benefits.instant.description": "Depósitos e retiradas rápidos",
  "marketing.home.benefits.fees.title": "Taxas baixas",
  "marketing.home.benefits.fees.description": "Condições favoráveis para traders",
  "marketing.home.benefits.support.title": "Suporte 24/7",
  "marketing.home.benefits.support.description": "Estamos sempre disponíveis para ajudar",

  // Marketing — About
  "marketing.about.hero.titleLine1": "Estamos a construir um espaço",
  "marketing.about.hero.titleLine2": "onde as criptomoedas se tornam",
  "marketing.about.hero.titleHighlight": "mais simples.",
  "marketing.about.hero.subtitle":
    "A GTX é uma plataforma moderna de negociação de criptomoedas criada para quem valoriza rapidez, uma interface clara e controlo sobre os seus ativos digitais.",
  "marketing.about.hero.primaryCta": "Começar a negociar",

  "marketing.about.stats.assets.value": "100+",
  "marketing.about.stats.assets.label": "Ativos cripto",
  "marketing.about.stats.uptime.value": "24/7",
  "marketing.about.stats.uptime.label": "Acesso à plataforma",
  "marketing.about.stats.currency.value": "USDT",
  "marketing.about.stats.currency.label": "Moeda principal",
  "marketing.about.stats.fee.value": "0%",
  "marketing.about.stats.fee.label": "Taxa de depósito e retirada",

  "marketing.about.mission.label": "A NOSSA IDEIA",
  "marketing.about.mission.headingLine1": "Negociar criptomoedas",
  "marketing.about.mission.headingLine2": "não devia ser complicado.",
  "marketing.about.mission.paragraph1":
    "Construímos a GTX à volta de uma ideia simples: deve sempre compreender o que se passa com os seus ativos, ver a informação de que precisa e ter acesso rápido às ferramentas que realmente importam.",
  "marketing.about.mission.paragraph2":
    "Desde financiar a sua conta até comprar, vender e gerir criptomoedas — procuramos tornar cada passo claro e simples.",

  "marketing.about.why.title": "Porquê a GTX?",
  "marketing.about.why.subtitle":
    "Tudo o que precisa para trabalhar com ativos digitais — num só lugar.",
  "marketing.about.why.speed.title": "Rapidez",
  "marketing.about.why.speed.description":
    "Acesso rápido aos mercados, operações e ferramentas essenciais, sem passos desnecessários.",
  "marketing.about.why.simplicity.title": "Simplicidade",
  "marketing.about.why.simplicity.description":
    "Uma interface clara e fácil de usar, independentemente da sua experiência.",
  "marketing.about.why.control.title": "Controlo",
  "marketing.about.why.control.description":
    "Saldo, ativos, ordens e histórico de operações sempre disponíveis numa única conta.",
  "marketing.about.why.available.title": "24/7",
  "marketing.about.why.available.description":
    "O mercado cripto nunca para — a GTX está disponível a qualquer hora.",

  "marketing.about.platform.headingLine1": "Tudo sob controlo.",
  "marketing.about.platform.headingLine2": "Num só espaço.",
  "marketing.about.platform.description":
    "Acompanhe o seu saldo, gira os seus ativos e passe para a negociação sem ter de usar dezenas de ferramentas diferentes.",
  "marketing.about.platform.availableBalance": "Saldo disponível",
  "marketing.about.platform.inOrders": "Em ordens",
  "marketing.about.platform.assetsValue": "Valor dos ativos",
  "marketing.about.platform.pnl": "Lucro / Prejuízo",

  "marketing.about.security.label": "SEGURANÇA",
  "marketing.about.security.headingLine1": "Os seus ativos.",
  "marketing.about.security.headingLine2": "O seu controlo.",
  "marketing.about.security.description":
    "Damos muita atenção à proteção das contas e operações dos utilizadores.",
  "marketing.about.security.accountProtection.title": "Proteção da conta",
  "marketing.about.security.accountProtection.description":
    "Camadas extra de proteção para o acesso ao seu perfil.",
  "marketing.about.security.twoFactor.title": "2FA",
  "marketing.about.security.twoFactor.description":
    "Autenticação de dois fatores para maior segurança da conta.",
  "marketing.about.security.activityControl.title": "Controlo de atividade",
  "marketing.about.security.activityControl.description":
    "O histórico das suas ações e operações está sempre disponível na sua conta.",

  "marketing.about.values.title": "O que valorizamos",
  "marketing.about.values.simplicity.title": "Simplicidade",
  "marketing.about.values.simplicity.description":
    "Ferramentas complexas devem continuar claras para o utilizador.",
  "marketing.about.values.speed.title": "Rapidez",
  "marketing.about.values.speed.description":
    "Menos passos desnecessários — mais tempo para o que realmente importa.",
  "marketing.about.values.transparency.title": "Transparência",
  "marketing.about.values.transparency.description":
    "Os utilizadores devem ver sempre com clareza os seus ativos, saldo e operações.",

  "marketing.about.finalCta.label": "PRONTO PARA COMEÇAR?",
  "marketing.about.finalCta.headingLine1": "O seu próximo passo",
  "marketing.about.finalCta.headingLine2": "começa com a GTX.",
  "marketing.about.finalCta.description":
    "Crie uma conta e tenha acesso ao mercado cripto num único espaço prático.",
  "marketing.about.finalCta.primaryGuest": "Criar conta",

  // Privacy
  "privacy.seo.title": "Centro de Privacidade | GTX",
  "privacy.seo.description":
    "Saiba como a GTX trata os dados pessoais e que direitos tem sobre a sua informação.",

  "privacy.hero.label": "CENTRO DE PRIVACIDADE",
  "privacy.hero.headingLine1": "Privacidade",
  "privacy.hero.headingLine2": "na GTX",
  "privacy.hero.subtitle":
    "Criámos esta página para explicar claramente como a GTX trata os dados dos utilizadores, os princípios que aplicamos e as opções que tem sobre a sua própria informação.",
  "privacy.hero.tagline": "Os seus dados. O seu controlo.",
  "privacy.hero.lastUpdated": "Última atualização: 31 de agosto de 2026",

  "privacy.principles.title": "Princípios de privacidade da GTX",
  "privacy.principles.transparency.title": "Transparência",
  "privacy.principles.transparency.description":
    "Procuramos explicar claramente que dados podem ser processados e para que são usados.",
  "privacy.principles.minimization.title": "Minimização de dados",
  "privacy.principles.minimization.description":
    "Procuramos usar apenas os dados necessários para o funcionamento das funcionalidades relevantes da plataforma.",
  "privacy.principles.accountability.title": "Responsabilização",
  "privacy.principles.accountability.description":
    "O acesso à informação é limitado às funções relevantes e usado apenas para fins definidos.",
  "privacy.principles.userRights.title": "Direitos do utilizador",
  "privacy.principles.userRights.description":
    "Pode contactar-nos sobre o acesso, correção ou outras ações relativas aos seus dados, nos termos da lei aplicável.",
  "privacy.principles.dataProtection.title": "Proteção de dados",
  "privacy.principles.dataProtection.description":
    "Aplicamos medidas técnicas e organizacionais para proteger contas e informação contra acesso não autorizado.",

  "privacy.usage.title": "Como a GTX usa os seus dados",

  "privacy.usage.personalData.title": "O que são dados pessoais?",
  "privacy.usage.personalData.paragraph1":
    "Dados pessoais são informações que podem ser direta ou indiretamente associadas a um utilizador específico.",
  "privacy.usage.personalData.paragraph2":
    "Na GTX, isto pode incluir dados fornecidos ao criar uma conta, concluir a verificação, usar as funcionalidades de depósito e retirada, e outras informações necessárias ao funcionamento das funcionalidades relevantes da plataforma.",
  "privacy.usage.personalData.examplesIntro": "Por exemplo, isto pode incluir:",
  "privacy.usage.personalData.example1": "Nome e endereço de e-mail",
  "privacy.usage.personalData.example2":
    "Dados fornecidos durante a verificação de identidade",
  "privacy.usage.personalData.example3":
    "Informação sobre operações de depósito e retirada",
  "privacy.usage.personalData.example4":
    "Informação técnica de sessão e do dispositivo (por exemplo, endereço IP)",

  "privacy.usage.howWeUse.title": "Como é que a GTX usa os dados?",
  "privacy.usage.howWeUse.intro": "Usamos os dados dos utilizadores para:",
  "privacy.usage.howWeUse.item1": "Criar e manter a sua conta",
  "privacy.usage.howWeUse.item2": "Autenticá-lo",
  "privacy.usage.howWeUse.item3": "Verificar a sua identidade",
  "privacy.usage.howWeUse.item4": "Processar depósitos",
  "privacy.usage.howWeUse.item5": "Processar retiradas",
  "privacy.usage.howWeUse.item6": "Realizar funções de negociação",
  "privacy.usage.howWeUse.item7": "Prestar apoio ao utilizador",
  "privacy.usage.howWeUse.item8": "Proteger a plataforma",
  "privacy.usage.howWeUse.item9": "Prevenir abusos",
  "privacy.usage.howWeUse.item10": "Assegurar o funcionamento técnico do serviço",

  "privacy.usage.retention.title": "Por quanto tempo os dados podem ser guardados?",
  "privacy.usage.retention.description":
    "A informação pode ser guardada durante o tempo necessário para o funcionamento da funcionalidade relevante, para manter a sua conta, para cumprir requisitos legais, para garantir a segurança ou para resolver litígios.",

  "privacy.usage.thirdParties.title": "A GTX partilha dados com terceiros?",
  "privacy.usage.thirdParties.description":
    "Em alguns casos, a GTX pode usar serviços técnicos de terceiros para apoiar funcionalidades específicas da plataforma, por exemplo, o envio de e-mails de conta e de segurança. Os dados pessoais são partilhados apenas quando necessário para a funcionalidade relevante ou quando exigido pelas regras aplicáveis.",

  "privacy.usage.cookies.title": "Como é que a GTX usa cookies?",
  "privacy.usage.cookies.intro":
    "Podem ser usados cookies tecnicamente necessários para:",
  "privacy.usage.cookies.item1": "Iniciar sessão na sua conta",
  "privacy.usage.cookies.item2": "Manter a sua sessão",
  "privacy.usage.cookies.item3":
    "Manter as funcionalidades da plataforma a funcionar com segurança",
  "privacy.usage.cookies.item4": "Recordar a sua preferência de idioma",

  "privacy.rights.title": "Os seus direitos sobre os dados pessoais",
  "privacy.rights.intro": "Consoante a lei aplicável, pode ter os seguintes direitos:",
  "privacy.rights.access.question": "Direito de acesso",
  "privacy.rights.access.answer":
    "Pode contactar-nos para saber que dados pessoais a GTX processa sobre si.",
  "privacy.rights.rectification.question": "Direito de retificação",
  "privacy.rights.rectification.answer":
    "Pode pedir-nos para corrigir informação incorreta ou incompleta na sua conta.",
  "privacy.rights.erasure.question": "Direito ao apagamento",
  "privacy.rights.erasure.answer":
    "Pode pedir-nos para eliminar os seus dados pessoais, sempre que possível ao abrigo da lei aplicável e de outros requisitos.",
  "privacy.rights.restriction.question": "Direito à limitação do tratamento",
  "privacy.rights.restriction.answer":
    "Pode pedir-nos para restringir o tratamento adicional dos seus dados em certos casos.",
  "privacy.rights.objection.question": "Direito de oposição",
  "privacy.rights.objection.answer":
    "Pode opor-se a determinados tipos de tratamento dos seus dados pessoais, quando a lei aplicável o preveja.",
  "privacy.rights.withdrawConsent.question": "Direito de retirar o consentimento",
  "privacy.rights.withdrawConsent.answer":
    "Quando o tratamento se baseia no consentimento, pode retirá-lo a qualquer momento.",
  "privacy.rights.portability.question": "Direito à portabilidade dos dados",
  "privacy.rights.portability.answer":
    "Em certos casos, pode pedir-nos que lhe forneçamos os seus dados num formato estruturado.",

  "privacy.faq.title": "Perguntas frequentes",
  "privacy.faq.q1.question": "Como obtenho informação sobre os meus dados?",
  "privacy.faq.q1.answer":
    "Pode contactar o suporte da GTX com um pedido sobre os seus dados pessoais.",
  "privacy.faq.q2.question": "Como corrijo os dados da minha conta?",
  "privacy.faq.q2.answer":
    "A maioria dos dados essenciais pode ser atualizada diretamente na sua conta. Para o resto, contacte o suporte.",
  "privacy.faq.q3.question": "Como peço a eliminação dos meus dados?",
  "privacy.faq.q3.answer": "Contacte o suporte da GTX com o seu pedido.",
  "privacy.faq.q4.question": "Como altero os dados submetidos na verificação?",
  "privacy.faq.q4.answer":
    "Contacte o suporte da GTX para alterar os dados de verificação.",
  "privacy.faq.q5.question": "Onde posso saber mais sobre cookies?",
  "privacy.faq.q5.answer":
    'Consulte a secção "Como a GTX usa cookies" nesta página para mais detalhes.',
  "privacy.faq.q6.question": "Como faço uma pergunta sobre privacidade?",
  "privacy.faq.q6.answer":
    "Contacte o suporte da GTX com qualquer questão sobre privacidade.",

  "privacy.support.title": "Precisa de ajuda?",
  "privacy.support.description":
    "Se tiver dúvidas sobre privacidade ou como os seus dados são usados, contacte o suporte da GTX.",
  "privacy.support.primaryCta": "Contactar suporte",
  "privacy.support.secondaryCta": "Ir para a conta",

  // News (minimal — just the small "Market news" block on /analytics;
  // no listing page, no article detail, no filters)
  "news.time.justNow": "Agora mesmo",
  "news.time.minutesAgo": "min atrás",
  "news.time.hoursAgo": "h atrás",
  "news.time.yesterday": "Ontem",

  // Analytics
  "analytics.seo.title": "Análise do Mercado Cripto | GTX",
  "analytics.seo.description":
    "Preços de criptomoedas em tempo real, variações em 24h, atividade de mercado e notícias cripto na GTX.",
  "analytics.title": "Análises",
  "analytics.subtitle": "Dados e dinâmica do mercado cripto em tempo real",
  "analytics.marketOverview.title": "Visão geral do mercado",
  "analytics.marketOverview.gainersCarousel": "Maiores subidas",
  "analytics.marketOverview.losersCarousel": "Maiores descidas",
  "analytics.dynamics.title": "Dinâmica do mercado",
  "analytics.dynamics.searchPlaceholder": "Pesquisar moeda...",
  "analytics.dynamics.period24h": "24h",
  "analytics.dynamics.error": "Não foi possível carregar os dados do gráfico",
  "analytics.activity.title": "Maior atividade",
  "analytics.volume24hLabel": "Volume 24h",
  "analytics.table.title": "Mercado",
  "analytics.table.searchPlaceholder": "Pesquisar moeda...",
  "analytics.table.filterAll": "Todos",
  "analytics.table.filterGainers": "Em alta",
  "analytics.table.filterLosers": "Em baixa",
  "analytics.table.columnCoin": "Moeda",
  "analytics.table.columnPrice": "Preço",
  "analytics.table.column24h": "24h",
  "analytics.table.columnVolume": "Volume 24h",
  "analytics.table.showMore": "Mostrar mais",
  "analytics.news.title": "Notícias do mercado",

  // Marketing — Contacts / Support
  "marketing.contacts.hero.title": "Suporte",
  "marketing.contacts.hero.subtitle": "Estamos aqui se precisar de ajuda",

  "marketing.contacts.cards.chat.title": "Chat ao vivo",
  "marketing.contacts.cards.chat.description": "Fale connosco diretamente no site",
  "marketing.contacts.cards.chat.button": "Abrir chat",

  "marketing.contacts.cards.telegram.title": "Telegram",
  "marketing.contacts.cards.telegram.description": "Contacte o suporte no Telegram",
  "marketing.contacts.cards.telegram.button": "Enviar mensagem no Telegram",
  "marketing.contacts.cards.telegram.unavailable": "Ainda não disponível",

  "marketing.contacts.faq.title": "Perguntas frequentes",
  "marketing.contacts.faq.deposits.q": "Como funcionam os depósitos e retiradas?",
  "marketing.contacts.faq.deposits.a":
    "Envie um pedido de depósito ou retirada na sua Carteira — um administrador revê e aprova, e os fundos aparecem no seu saldo logo a seguir.",
  "marketing.contacts.faq.verification.q": "Porque preciso de verificar a minha conta?",
  "marketing.contacts.faq.verification.a":
    "A verificação confirma a sua identidade para podermos ativar todas as funcionalidades da conta. Envie os seus dados e documentos na página de Verificação — a maioria das revisões é rápida.",
  "marketing.contacts.faq.trading.q": "Como funciona a negociação na GTX?",
  "marketing.contacts.faq.trading.a":
    "Coloque ordens a mercado ou limitadas em Negociação Spot a preços em tempo real. As ordens abertas e o histórico de ordens estão sempre visíveis na página de Negociação.",
  "marketing.contacts.faq.bonuses.q":
    "Como funcionam os bónus e o programa de indicação?",
  "marketing.contacts.faq.bonuses.a":
    "O seu primeiro depósito aprovado gera um bónus automaticamente. Partilhe o seu código de indicação e receberá uma recompensa quando a pessoa convidada fizer o seu primeiro depósito.",
  "marketing.contacts.faq.security.q": "Como está a minha conta protegida?",
  "marketing.contacts.faq.security.a":
    "Ative a autenticação de dois fatores nas Definições para uma camada extra de proteção, e nunca partilhe a sua palavra-passe ou códigos 2FA com ninguém.",

  "marketing.contacts.email.note": "Ou envie-nos um e-mail para",

  // Support chat widget (/contacts)
  "supportChat.fab.ariaLabel": "Chat de suporte",
  "supportChat.header.title": "Suporte GTX",
  "supportChat.guest.title": "Inicie sessão para conversar",
  "supportChat.guest.body":
    "O chat de suporte está disponível para contas com sessão iniciada.",
  "supportChat.category.prompt": "Sobre o que é?",
  "supportChat.category.deposit": "Depósito",
  "supportChat.category.withdrawal": "Retirada",
  "supportChat.category.trading": "Negociação",
  "supportChat.category.verification": "Verificação",
  "supportChat.category.bonuses": "Bónus",
  "supportChat.category.security": "Segurança",
  "supportChat.category.other": "Outro",
  "supportChat.messages.you": "Você",
  "supportChat.messages.team": "Suporte GTX",
  "supportChat.messages.empty": "Envie uma mensagem e responderemos em breve.",
  "supportChat.messages.closedBanner":
    "Esta conversa está encerrada. Envie uma mensagem se ainda precisar de ajuda.",
  "supportChat.input.placeholder": "Escreva uma mensagem…",
  "supportChat.input.send": "Enviar",
  "supportChat.errors.createFailed":
    "Não foi possível iniciar a conversa. Tente novamente.",
  "supportChat.errors.sendFailed": "Mensagem não enviada. Tente novamente.",

  // /bonuses
  "marketing.bonuses.hero.heading": "Obtenha mais com a GTX",
  "marketing.bonuses.hero.subtitle":
    "Aproveite o bónus do primeiro depósito e convide amigos para ganhar recompensas adicionais.",
  "marketing.bonuses.firstDeposit.badge": "+20%",
  "marketing.bonuses.firstDeposit.title": "Mais valor no seu primeiro depósito",
  "marketing.bonuses.firstDeposit.description":
    "Receba +20% sobre o valor do seu primeiro depósito bem-sucedido.",
  "marketing.bonuses.firstDeposit.examplesLabel": "Exemplos",
  "marketing.bonuses.firstDeposit.example1From": "250 USDT",
  "marketing.bonuses.firstDeposit.example1To": "+50 USDT",
  "marketing.bonuses.firstDeposit.example2From": "500 USDT",
  "marketing.bonuses.firstDeposit.example2To": "+100 USDT",
  "marketing.bonuses.firstDeposit.example3From": "1000 USDT",
  "marketing.bonuses.firstDeposit.example3To": "+200 USDT",
  "marketing.bonuses.firstDeposit.rule1": "Bónus único",
  "marketing.bonuses.firstDeposit.rule2":
    "Apenas conta o seu primeiro depósito confirmado",
  "marketing.bonuses.firstDeposit.rule3": "Não é aplicado a depósitos posteriores",
  "marketing.bonuses.referral.badge": "10%",
  "marketing.bonuses.referral.title": "Convide amigos, ganhe recompensas",
  "marketing.bonuses.referral.description":
    "Convide amigos para a GTX e ganhe 10% do valor do primeiro depósito bem-sucedido deles.",
  "marketing.bonuses.referral.maxNote": "Até 100 USDT por cada utilizador convidado",
  "marketing.bonuses.referral.registrationNote":
    "O registo por si só não gera qualquer recompensa — o utilizador convidado tem de efetuar o seu primeiro depósito bem-sucedido.",
  "marketing.bonuses.referral.rule2":
    "Creditado após o primeiro depósito bem-sucedido dele",
  "marketing.bonuses.referral.examplesLabel": "Exemplos de recompensas",
  "marketing.bonuses.referral.example1From": "250 USDT",
  "marketing.bonuses.referral.example1To": "25 USDT",
  "marketing.bonuses.referral.example2From": "500 USDT",
  "marketing.bonuses.referral.example2To": "50 USDT",
  "marketing.bonuses.referral.example3From": "1000 USDT",
  "marketing.bonuses.referral.example3To": "100 USDT",
  "marketing.bonuses.referral.example4From": "2000 USDT",
  "marketing.bonuses.referral.example4To": "100 USDT",
  "marketing.bonuses.referral.maxLabel": "máximo",
  "marketing.bonuses.personal.title": "O seu código de referência",
  "marketing.bonuses.personal.explanation":
    "Partilhe este código com um amigo. Ele deve indicá-lo durante o registo.",
  "marketing.bonuses.personal.copyButton": "Copiar código",
  "marketing.bonuses.personal.copiedFeedback": "Copiado",
  "marketing.bonuses.guestCta.title": "Inicie sessão para ver o seu código de referência",
  "marketing.bonuses.guestCta.description":
    "Crie uma conta ou inicie sessão para convidar amigos e acompanhar os seus bónus.",
  "marketing.bonuses.guestCta.registerButton": "Criar conta",
  "marketing.bonuses.guestCta.loginButton": "Iniciar sessão",
  "marketing.bonuses.stats.invited": "Amigos convidados",
  "marketing.bonuses.stats.activated": "Ativaram o bónus",
  "marketing.bonuses.stats.earned": "Bónus de referência recebidos",
  "marketing.bonuses.howItWorks.title": "Como funciona o programa de referência",
  "marketing.bonuses.howItWorks.step1Title": "Partilhe o código",
  "marketing.bonuses.howItWorks.step1Description":
    "Envie o seu código de referência a um amigo.",
  "marketing.bonuses.howItWorks.step2Title": "O seu amigo regista-se",
  "marketing.bonuses.howItWorks.step2Description":
    "Durante o registo, ele introduz o seu código.",
  "marketing.bonuses.howItWorks.step3Title": "O seu amigo deposita",
  "marketing.bonuses.howItWorks.step3Description":
    "Após o primeiro depósito bem-sucedido dele, recebe 10% do valor, até um máximo de 100 USDT.",
  "marketing.bonuses.faq.title": "Perguntas frequentes",
  "marketing.bonuses.faq.q1": "Quando recebo o bónus de +20%?",
  "marketing.bonuses.faq.a1": "Após a confirmação do seu primeiro depósito bem-sucedido.",
  "marketing.bonuses.faq.q2": "Recebo +20% no meu segundo depósito?",
  "marketing.bonuses.faq.a2":
    "Não. O bónus é atribuído apenas uma vez — no primeiro depósito bem-sucedido.",
  "marketing.bonuses.faq.q3": "Quando é creditado o bónus de referência?",
  "marketing.bonuses.faq.a3":
    "Depois de o utilizador que convidou efetuar o seu primeiro depósito bem-sucedido.",
  "marketing.bonuses.faq.q4": "Recebo um bónus só por registar um amigo?",
  "marketing.bonuses.faq.a4":
    "Não. O registo por si só não é suficiente. O utilizador convidado tem de efetuar o primeiro depósito bem-sucedido.",
  "marketing.bonuses.faq.q5": "Quanto posso ganhar por cada amigo?",
  "marketing.bonuses.faq.a5":
    "10% do valor do primeiro depósito bem-sucedido dele, até um máximo de 100 USDT.",
  "marketing.bonuses.faq.q6":
    "E se o primeiro pedido de depósito do meu amigo for rejeitado?",
  "marketing.bonuses.faq.a6":
    "Um depósito rejeitado não ativa o bónus de referência. Conta o primeiro depósito que foi confirmado com sucesso.",
  "marketing.bonuses.faq.q7": "Recebo 10% de todos os depósitos futuros do meu amigo?",
  "marketing.bonuses.faq.a7":
    "Não. O bónus de referência é creditado apenas uma vez — a partir do primeiro depósito bem-sucedido do utilizador convidado.",
  "marketing.bonuses.faq.q8":
    "O bónus de primeiro depósito e o bónus de referência podem ser ativados ao mesmo tempo?",
  "marketing.bonuses.faq.a8":
    "Sim. O utilizador convidado pode receber o seu próprio bónus de +20%, enquanto quem o convidou recebe o seu bónus de referência.",
  "marketing.footer.platform": "Plataforma",
  "marketing.footer.company": "Empresa",
  "marketing.footer.legal": "Legal",
  "marketing.footer.privacyPolicy": "Política de Privacidade",
  "marketing.footer.termsOfService": "Termos de Serviço",
  "marketing.footer.description":
    "A GTX é uma plataforma educativa de negociação simulada. Todos os saldos são virtuais e todas as negociações são simuladas — nenhum fundo real está em risco.",
  "marketing.footer.copyright":
    "GTX. Simulador de negociação virtual apenas para fins educativos.",
  "marketing.footer.rightsReserved": "Todos os direitos reservados",

  // Auth
  "auth.emailLabel": "E-mail",
  "auth.passwordLabel": "Palavra-passe",
  "auth.login.title": "Bem-vindo de volta",
  "auth.login.noAccountPrompt": "Ainda não tem conta?",
  "auth.login.loginFailed": "Falha ao iniciar sessão",
  "auth.login.welcomeToast": "Bem-vindo de volta!",
  "auth.login.twoFactorTitle": "Verificação de dois fatores",
  "auth.login.twoFactorPrompt":
    "Introduza o código de 6 dígitos da sua app de autenticação.",
  "auth.login.codeLabel": "Código de verificação",
  "auth.login.verifyButton": "Verificar",
  "auth.login.backToLogin": "Voltar ao início de sessão",
  "auth.login.invalidCode": "Código de verificação inválido",
  "auth.register.title": "Criar uma conta",
  "auth.register.haveAccountPrompt": "Já tem uma conta?",
  "auth.register.firstNameLabel": "Nome",
  "auth.register.lastNameLabel": "Apelido",
  "auth.register.registrationFailed": "Falha no registo",
  "auth.register.successToast": "Conta criada — bem-vindo à GTX!",
  "auth.register.agreeToTermsPrefix": "Concordo com a",
  "auth.register.privacyPolicy": "Política de Privacidade",
  "auth.register.submitButton": "Registar",
  "auth.register.referralCodeLabel": "Código de indicação",
  "auth.register.referralCodePlaceholder": "Introduza o código de indicação",
  "auth.register.invalidReferralCode": "Código de indicação inválido",
  "auth.login.forgotPasswordLink": "Esqueceu-se da palavra-passe?",
  "auth.forgotPassword.title": "Repor a sua palavra-passe",
  "auth.forgotPassword.description":
    "Introduza o seu e-mail e enviaremos um link para repor a sua palavra-passe.",
  "auth.forgotPassword.submitButton": "Enviar link de reposição",
  "auth.forgotPassword.successMessage":
    "Se existir uma conta com esse e-mail, enviámos um link de reposição de palavra-passe.",
  "auth.forgotPassword.backToLogin": "Voltar ao início de sessão",
  "auth.forgotPassword.failedFallback": "Algo correu mal. Tente novamente.",
  "auth.resetPassword.title": "Definir uma nova palavra-passe",
  "auth.resetPassword.newPasswordLabel": "Nova palavra-passe",
  "auth.resetPassword.confirmPasswordLabel": "Confirmar palavra-passe",
  "auth.resetPassword.submitButton": "Repor palavra-passe",
  "auth.resetPassword.successMessage":
    "A sua palavra-passe foi reposta. Já pode iniciar sessão com a nova palavra-passe.",
  "auth.resetPassword.goToLogin": "Ir para o início de sessão",
  "auth.resetPassword.invalidTokenMessage":
    "Este link de reposição é inválido ou expirou.",
  "auth.resetPassword.requestNewLink": "Pedir um novo link",
  "auth.resetPassword.failedFallback": "Algo correu mal. Tente novamente.",
  "auth.resetPassword.missingTokenMessage": "A este link falta um código de reposição.",

  // Markets
  "markets.title": "Mercados",
  "markets.subtitle": "Preços em tempo real e pares de negociação",
  "markets.tabs.all": "Todas as Criptomoedas",
  "markets.tabs.favorites": "Favoritos",
  "markets.tabs.popular": "Populares",
  "markets.tabs.gainers": "Maiores Subidas",
  "markets.tabs.losers": "Maiores Descidas",
  "markets.tabs.volume": "Maior Volume",
  "markets.tabs.movers": "Maiores Variações",
  "markets.emptyFavorites": "Ainda não tem criptomoedas favoritas",
  "markets.columns.rank": "N.º",
  "markets.columns.name": "Moeda",
  "markets.columns.price": "Preço",
  "markets.columns.change24h": "Variação 24h",
  "markets.columns.volume24h": "Volume 24h",
  "markets.columns.chart": "Gráfico",
  "markets.favorites.add": "Adicionar aos favoritos",
  "markets.favorites.remove": "Remover dos favoritos",
  "markets.pagination.pageLabel": "Página",
  "markets.pagination.of": "de",
  "markets.pagination.assets": "ativos",
  "markets.pagination.prev": "Anterior",
  "markets.pagination.next": "Seguinte",

  // Transactional email (lib/email/templates.ts) — server-rendered using
  // the recipient's saved UserSettings.language, not the request locale.
  "email.passwordChanged.subject":
    "Alerta de segurança: a sua palavra-passe foi alterada",
  "email.passwordChanged.heading": "A sua palavra-passe foi alterada",
  "email.passwordChanged.body":
    "A palavra-passe da sua conta GTX foi alterada em {date}.",
  "email.passwordChanged.notYouNotice":
    "Se não fez esta alteração, contacte o suporte imediatamente.",
  "email.emailChangeConfirm.subject": "Confirme o seu novo endereço de e-mail GTX",
  "email.emailChangeConfirm.heading": "Confirme o seu novo endereço de e-mail",
  "email.emailChangeConfirm.body":
    "Recebemos um pedido para alterar o endereço de e-mail da sua conta GTX para este. Clique no link abaixo para confirmar.",
  "email.emailChangeConfirm.button": "Confirmar novo e-mail",
  "email.emailChangeConfirm.expiryNotice":
    "Este link expira em 1 hora. Se não pediu esta alteração, pode ignorar este e-mail com segurança.",
  "email.passwordResetRequest.subject": "Repor a sua palavra-passe GTX",
  "email.passwordResetRequest.heading": "Repor a sua palavra-passe",
  "email.passwordResetRequest.body":
    "Recebemos um pedido para repor a palavra-passe da sua conta GTX. Clique no botão abaixo para escolher uma nova palavra-passe.",
  "email.passwordResetRequest.button": "Repor palavra-passe",
  "email.passwordResetRequest.expiryNotice": "Este link expira em 30 minutos.",
  "email.passwordResetRequest.notYouNotice":
    "Se não pediu isto, pode ignorar este e-mail com segurança — a sua palavra-passe não será alterada.",
  "email.emailChanged.subject": "O e-mail da sua conta GTX foi alterado",
  "email.emailChanged.heading": "O e-mail da sua conta foi alterado",
  "email.emailChanged.body":
    "O e-mail da sua conta GTX foi alterado para {newEmail} em {date}.",
  "email.emailChanged.notYouNotice":
    "Se não fez esta alteração, contacte o suporte imediatamente.",

  "email.balanceAdjusted.subject": "O seu saldo GTX foi atualizado",
  "email.balanceAdjusted.headingCredit": "Saldo creditado",
  "email.balanceAdjusted.headingDebit": "Saldo ajustado",
  "email.balanceAdjusted.bodyCredit":
    "O seu saldo de {asset} foi creditado em {amount} {asset}.",
  "email.balanceAdjusted.bodyDebit":
    "O seu saldo de {asset} foi debitado em {amount} {asset}.",
  "email.balanceAdjusted.footer":
    "Se tiver dúvidas sobre esta alteração, contacte o suporte.",
};
