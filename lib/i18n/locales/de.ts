import type { Dictionary } from "../dictionary-type";

export const de: Dictionary = {
  // Shared across multiple pages
  "common.login": "Anmelden",
  "common.register": "Registrierung",
  "common.dashboard": "Dashboard",
  "common.logout": "Abmelden",
  "common.loading": "Wird geladen…",
  "common.error": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  "common.save": "Speichern",
  "common.cancel": "Abbrechen",
  "common.confirm": "Bestätigen",
  "common.close": "Schließen",
  "common.copy": "Kopieren",
  "common.copied": "Kopiert",
  "common.back": "Zurück",
  "common.continue": "Weiter",
  "common.submit": "Absenden",
  "common.search": "Suche",
  "common.noData": "Keine Daten verfügbar.",
  "common.viewAll": "Alle anzeigen",
  "common.optional": "Optional",

  // Navbar
  "nav.trading": "Handel",
  "nav.markets": "Märkte",
  "nav.wallet": "Wallet",
  "nav.about": "Über uns",
  "nav.analytics": "Analysen",
  "nav.bonuses": "Boni",
  "nav.account": "Konto",
  "nav.deposit": "Einzahlung",
  "nav.withdrawal": "Auszahlung",
  "nav.history": "Verlauf",
  "nav.verification": "Verifizierung",
  "nav.settings": "Einstellungen",
  "nav.support": "Support",
  "nav.accountMenu": "Kontomenü",
  "nav.toggleMenu": "Menü ein-/ausblenden",
  "nav.language": "Sprache",
  "nav.logoutSuccess": "Sie wurden abgemeldet",
  "nav.logoutError": "Abmelden fehlgeschlagen. Bitte versuchen Sie es erneut.",
  "nav.searchAria": "Kryptowährungen suchen",
  "nav.searchPlaceholder": "Kryptowährungen suchen",
  "nav.searchNoResults": "Keine Kryptowährungen gefunden.",

  // Account
  "account.makeDeposit": "Einzahlung vornehmen",
  "account.accountInfo": "Kontoinformationen",
  "account.login": "Login",
  "account.email": "E-Mail",
  "account.accountType": "Kontotyp",
  "account.leverage": "Hebel",
  "account.recentTransactions": "Letzte Transaktionen",
  "account.viewAll": "Alle anzeigen",
  "account.noTransactions": "Noch keine Transaktionen.",
  "account.transactionType.deposit": "Einzahlung",
  "account.transactionType.withdrawal": "Auszahlung",
  "account.transactionType.bonus": "Bonus",
  "account.transactionType.trade": "Trade",
  "account.transactionType.referralBonus": "Empfehlungsbonus",
  "account.transactionType.firstDepositBonus": "Ersteinzahlungsbonus",
  "account.summary.weeklyProfitLoss": "Gewinn / Verlust (7 Tage)",
  "account.twoFactorAuth": "Zwei-Faktor-Authentifizierung",
  "account.twoFactorEnabled": "Aktiviert",
  "account.twoFactorDisabled": "Deaktiviert",
  "account.referralCode": "Empfehlungscode",
  "account.referralCodeCopied": "Empfehlungscode kopiert",

  // Settings
  "settings.title": "Einstellungen",
  "settings.profile": "Profil",
  "settings.firstName": "Vorname",
  "settings.lastName": "Nachname",
  "settings.email": "E-Mail",
  "settings.saveChanges": "Änderungen speichern",
  "settings.toastProfileUpdated": "Profil aktualisiert",
  "settings.passwordSecurity": "Passwort & Sicherheit",
  "settings.currentPassword": "Aktuelles Passwort",
  "settings.newPassword": "Neues Passwort",
  "settings.twoFactorAuth": "Zwei-Faktor-Authentifizierung (2FA)",
  "settings.twoFactorAuthDesc": "Zusätzlichen Schutz für Ihr Konto einrichten",
  "settings.updatePassword": "Passwort aktualisieren",
  "settings.toastPasswordUpdated": "Passwort aktualisiert",
  "settings.notifications": "Benachrichtigungen",
  "settings.emailNotifications": "E-Mail-Benachrichtigungen",
  "settings.emailNotificationsDesc":
    "Updates zu Einzahlungen, Auszahlungen und Trades erhalten",
  "settings.pushNotifications": "Push-Benachrichtigungen",
  "settings.pushNotificationsDesc":
    "Echtzeit-Benachrichtigungen auf diesem Gerät erhalten",
  "settings.marketAlerts": "Marktbenachrichtigungen",
  "settings.marketAlertsDesc": "Bei größeren Kursbewegungen benachrichtigt werden",
  "settings.languageTheme": "Sprache & Design",
  "settings.language": "Sprache",
  "settings.theme": "Design",
  "settings.themeDark": "Dunkel",
  "settings.themeLight": "Hell",

  "settings.emailCurrentLabel": "Aktuelle E-Mail-Adresse",
  "settings.emailChangeButton": "E-Mail-Adresse ändern",
  "settings.emailNewLabel": "Neue E-Mail-Adresse",
  "settings.emailCurrentPasswordLabel": "Aktuelles Passwort",
  "settings.emailSendConfirmation": "Bestätigungs-E-Mail senden",
  "settings.emailCancelChange": "Abbrechen",
  "settings.emailPendingNotice":
    "Ein Bestätigungslink wurde an {email} gesendet. Klicken Sie darauf, um die Änderung Ihrer E-Mail-Adresse abzuschließen.",
  "settings.toastEmailChangeRequested": "Bestätigungs-E-Mail gesendet",
  "settings.toastEmailChangeConfirmed": "Ihre E-Mail-Adresse wurde aktualisiert",
  "settings.toastEmailChangeExpired": "Dieser Bestätigungslink ist abgelaufen",
  "settings.toastEmailChangeInvalid": "Dieser Bestätigungslink ist ungültig",
  "settings.toastSaveFailed": "Änderungen konnten nicht gespeichert werden",

  "settings.confirmNewPassword": "Neues Passwort bestätigen",
  "settings.toastPasswordChangeFailed": "Passwort konnte nicht geändert werden",
  "settings.passwordMismatch": "Passwörter stimmen nicht überein",

  "settings.twoFactorEnabledLabel": "2FA aktiviert",
  "settings.twoFactorDisabledLabel": "2FA deaktiviert",
  "settings.twoFactorEnableButton": "2FA aktivieren",
  "settings.twoFactorDisableButton": "2FA deaktivieren",
  "settings.twoFactorSetupTitle": "Zwei-Faktor-Authentifizierung einrichten",
  "settings.twoFactorSetupInstructions":
    "Scannen Sie diesen QR-Code mit Google Authenticator, Microsoft Authenticator, Authy oder einer anderen kompatiblen TOTP-App.",
  "settings.twoFactorManualEntry": "Oder geben Sie diesen Code manuell ein:",
  "settings.twoFactorCodeLabel": "6-stelliger Code",
  "settings.twoFactorConfirmButton": "Bestätigen & aktivieren",
  "settings.twoFactorCancelButton": "Abbrechen",
  "settings.twoFactorDisableTitle": "Zwei-Faktor-Authentifizierung deaktivieren",
  "settings.twoFactorDisableInstructions":
    "Geben Sie zur Bestätigung einen aktuellen Code aus Ihrer Authenticator-App ein.",
  "settings.toastTwoFactorEnabled": "2FA erfolgreich aktiviert",
  "settings.toastTwoFactorDisabled": "2FA erfolgreich deaktiviert",
  "settings.toastInvalidCode": "Ungültiger Bestätigungscode",
  "settings.toastTwoFactorSetupFailed": "2FA-Einrichtung konnte nicht gestartet werden",

  // Deposit
  "deposit.pageTitle": "Einzahlung",
  "deposit.infoTitle": "Wichtige Informationen",
  "deposit.infoMinAmount": "Der Mindesteinzahlungsbetrag beträgt 250 USDT.",
  "deposit.infoCorrectDetails":
    "Stellen Sie sicher, dass alle Zahlungsdaten korrekt sind.",
  "deposit.infoNetworkCorrect": "Stellen Sie sicher, dass das Netzwerk korrekt ist.",
  "deposit.infoNoFee": "Für Einzahlungen berechnen wir keine Gebühr.",
  "deposit.selectPaymentMethod": "Zahlungsmethode auswählen",
  "deposit.selectNetwork": "Netzwerk auswählen",
  "deposit.selectNetworkPlaceholder": "Netzwerk auswählen",
  "deposit.selectNetworkError": "Bitte wählen Sie ein Netzwerk aus",
  "deposit.depositAddressLabel": "Einzahlungsadresse",
  "deposit.addressLabel": "Adresse",
  "deposit.copyButton": "Kopieren",
  "deposit.addressCopied": "Adresse kopiert",
  "deposit.amountLabel": "Betrag",
  "deposit.proofModalTitle": "Zahlungsbestätigung",
  "deposit.proofModalText":
    "Fügen Sie einen Screenshot Ihrer Überweisung bei, damit wir Ihre Einzahlung bestätigen können.",
  "deposit.proofModalHint":
    "Der Screenshot sollte den Betrag und den Überweisungsstatus zeigen.",
  "deposit.proofFileLabel": "Zahlungs-Screenshot",
  "deposit.proofUploadButton": "Screenshot hochladen",
  "deposit.proofUploadedLabel": "Screenshot hochgeladen",
  "deposit.proofRemoveAria": "Screenshot entfernen",
  "deposit.proofRequiredError": "Fügen Sie einen Screenshot Ihrer Überweisung bei.",
  "deposit.proofSubmitButton": "Zur Prüfung einreichen",
  "deposit.detailsLabel": "Einzahlungsdetails",
  "deposit.youWillGet": "Sie erhalten",
  "deposit.submitButton": "Einzahlung vornehmen",
  "deposit.minAmountError": "Der Mindesteinzahlungsbetrag beträgt 250 USDT",
  "deposit.pendingSubmittedTitle": "Die Zahlung wird bearbeitet.",
  "deposit.pendingSubmittedDescription": "Bestätigung ausstehend.",
  "deposit.failedFallback": "Einzahlung fehlgeschlagen",
  "deposit.paymentMethodCard": "Visa / Mastercard",
  "deposit.paymentMethodBankTransfer": "Banküberweisung",
  "deposit.paymentMethodBitcoin": "Bitcoin",
  "deposit.paymentMethodTether": "Tether (USDT)",
  "deposit.paymentMethodDaysEstimate": "2-5 Werktage",
  "deposit.paymentMethodHoursEstimate": "Innerhalb von 24 Stunden",

  // Withdrawal
  "withdrawal.pageTitle": "Auszahlung",
  "withdrawal.verificationRequiredTitle": "Verifizierung erforderlich",
  "withdrawal.verificationRequiredDesc":
    "Um Gelder auszuzahlen, schließen Sie zunächst die Kontoverifizierung ab.",
  "withdrawal.goToVerification": "Zur Verifizierung",
  "withdrawal.infoTitle": "Wichtige Informationen",
  "withdrawal.infoProcessingTime":
    "Auszahlungen werden innerhalb von 1-3 Werktagen bearbeitet.",
  "withdrawal.infoNetworkCorrect":
    "Stellen Sie sicher, dass alle Zahlungsdaten und das Netzwerk korrekt sind.",
  "withdrawal.infoClosePositions":
    "Stellen Sie sicher, dass alle Handelspositionen geschlossen sind, bevor Sie eine Auszahlung vornehmen.",
  "withdrawal.infoNoFee": "Für Auszahlungen fällt keine Gebühr an.",
  "withdrawal.selectPaymentMethod": "Zahlungsmethode auswählen",
  "withdrawal.detailsLabel": "Auszahlungsdetails",
  "withdrawal.availableLabel": "Verfügbar:",
  "withdrawal.youWillGet": "Sie erhalten",
  "withdrawal.submitButton": "Auszahlung anfordern",
  "withdrawal.minAmountError": "Der Mindestauszahlungsbetrag beträgt 50 USDT",
  "withdrawal.selectNetworkError": "Netzwerk auswählen",
  "withdrawal.addressLabel": "Wallet-Adresse",
  "withdrawal.addressPlaceholder": "Wallet-Adresse eingeben",
  "withdrawal.addressRequiredError": "Wallet-Adresse eingeben",
  "withdrawal.serverInsufficientBalanceError": "Verfügbares Guthaben nicht ausreichend",
  "withdrawal.requestPrefix": "Auszahlungsantrag über",
  "withdrawal.requestSuffix": "wurde übermittelt",
  "withdrawal.failedFallback": "Auszahlung fehlgeschlagen",

  // History
  "history.pageTitle": "Verlauf",
  "history.filterAll": "Alle Transaktionen",
  "history.filterDeposits": "Einzahlungen",
  "history.filterWithdrawals": "Auszahlungen",
  "history.filterBonuses": "Boni",
  "history.filterAdjustments": "Anpassungen",
  "history.typeDeposit": "Einzahlung",
  "history.typeWithdrawal": "Auszahlung",
  "history.typeBonus": "Bonus",
  "history.typeTrade": "Trade",
  "history.typeAdjustment": "Guthabenanpassung",
  "history.typeReferralBonus": "Empfehlungsbonus",
  "history.typeFirstDepositBonus": "Ersteinzahlungsbonus",
  "history.columnId": "ID",
  "history.columnType": "Typ",
  "history.columnAmount": "Betrag",
  "history.columnStatus": "Status",
  "history.columnDate": "Datum",
  "history.emptyState": "Keine Transaktionen gefunden.",
  "history.statusCompleted": "Abgeschlossen",
  "history.statusPending": "Ausstehend",
  "history.statusFailed": "Fehlgeschlagen",

  // Verification
  "verification.pageTitle": "Kontoverifizierung",
  "verification.pageDescription":
    "Um internationale Vorschriften einzuhalten, verifizieren Sie Ihr Konto bitte durch Hochladen der unten stehenden Dokumente.",
  "verification.uploadDocumentsHeading": "Dokumente hochladen",
  "verification.infoTitle": "Erforderliche Dokumente",
  "verification.infoIdentityDoc":
    "Ausweisdokument (Reisepass, Personalausweis oder Führerschein).",
  "verification.infoProofOfAddress":
    "Adressnachweis (Nebenkostenabrechnung, Kontoauszug o. Ä.).",
  "verification.infoValidDocs": "Alle Dokumente müssen gültig und gut lesbar sein.",
  "verification.infoPrivacyPolicy":
    "Wir verarbeiten Ihre Daten gemäß unserer Datenschutzrichtlinie.",
  "verification.identityDocumentLabel": "Ausweisdokument",
  "verification.proofOfAddressLabel": "Adressnachweis",
  "verification.missingDocsError": "Bitte laden Sie beide erforderlichen Dokumente hoch",
  "verification.submitSuccess": "Dokumente zur Prüfung eingereicht",
  "verification.submitFailedFallback": "Einreichung fehlgeschlagen",
  "verification.submitButton": "Dokumente einreichen",
  "verification.chooseFile": "Datei auswählen",
  "verification.missingInfoError": "Bitte füllen Sie alle persönlichen Angaben aus",
  "verification.countryLabel": "Land",
  "verification.countryPlaceholder": "z. B. Deutschland",
  "verification.dateOfBirthLabel": "Geburtsdatum",
  "verification.addressLabel": "Adresse",
  "verification.addressPlaceholder": "Straße, Stadt, Postleitzahl",
  "verification.personalInfoHeading": "Persönliche Angaben",
  "verification.documentsHeading": "Dokumente",
  "verification.fullNameLabel": "Vollständiger Name",
  "verification.statusVerified": "Verifiziert",
  "verification.statusPending": "In Prüfung",
  "verification.statusRejected": "Abgelehnt",
  "verification.statusUnverified": "Nicht verifiziert",
  "verification.rejectionReasonLabel": "Ablehnungsgrund",
  "verification.pendingMessage":
    "Ihre Dokumente werden geprüft. Wir benachrichtigen Sie, sobald eine Entscheidung vorliegt.",
  "verification.rejectedMessage":
    "Ihre Verifizierung wurde abgelehnt. Bitte prüfen Sie den Grund unten und korrigieren und übermitteln Sie Ihre Angaben erneut.",
  "account.verification": "Verifizierung",

  // Wallet
  "wallet.page.title": "Wallet",
  "wallet.page.subtitle": "Verwalten Sie Ihre Vermögenswerte an einem Ort",
  "wallet.summary.availableBalance": "Verfügbares Guthaben",
  "wallet.summary.lockedInOrders": "In Orders gebunden",
  "wallet.summary.assetsValue": "Wert der Assets",
  "wallet.summary.deposit": "Einzahlen",
  "wallet.summary.withdraw": "Auszahlen",
  "wallet.summary.history": "Verlauf",
  "wallet.tabs.myAssets": "Meine Assets",
  "wallet.tabs.openOrders": "Offene Orders",
  "wallet.tabs.history": "Verlauf",
  "wallet.assets.headers.asset": "Asset",
  "wallet.assets.headers.amount": "Menge",
  "wallet.assets.headers.priceCostBasis": "Preis / Einstandspreis",
  "wallet.assets.headers.chart": "Chart",
  "wallet.assets.headers.unrealizedPnl": "Unrealisierter Gewinn/Verlust",
  "wallet.assets.loading": "Assets werden geladen…",
  "wallet.assets.empty":
    "Sie besitzen noch keine Assets. Kaufen Sie im Spot-Handel, um zu starten.",
  "wallet.assets.costLabel": "Kosten:",
  "wallet.assets.openOnTradingAria": "Im Handel öffnen",
  "wallet.orders.headers.pair": "Paar",
  "wallet.orders.loading": "Orders werden geladen…",
  "wallet.orders.empty": "Keine offenen Orders.",
  "wallet.orders.statusOpen": "Offen",
  "wallet.orders.cancelAria": "Order stornieren",
  "wallet.orders.cancelSuccess": "Order storniert",
  "wallet.orders.cancelError": "Order konnte nicht storniert werden",
  "wallet.history.headers.cryptoPair": "Krypto / Paar",
  "wallet.history.headers.total": "Gesamt",
  "wallet.history.headers.dateTime": "Datum / Uhrzeit",
  "wallet.history.loading": "Verlauf wird geladen…",
  "wallet.history.empty": "Kein Handelsverlauf.",
  "wallet.history.statusFilled": "Ausgeführt",
  "wallet.table.type": "Typ",
  "wallet.table.side": "Richtung",
  "wallet.table.price": "Preis",
  "wallet.table.quantity": "Menge",
  "wallet.table.status": "Status",
  "wallet.table.typeMarket": "Market",
  "wallet.table.typeLimit": "Limit",
  "wallet.table.sideBuy": "Kauf",
  "wallet.table.sideSell": "Verkauf",

  // Trading
  "trading.page.loadingTerminal": "Handelsterminal wird geladen…",
  "trading.watchlist.addFavorite": "Zu Favoriten hinzufügen",
  "trading.watchlist.removeFavorite": "Aus Favoriten entfernen",
  "trading.chart.loading": "Chart wird geladen…",
  "trading.orderPanel.title": "Spot-Handel",
  "trading.orderPanel.buy": "Kaufen",
  "trading.orderPanel.sell": "Verkaufen",
  "trading.orderPanel.market": "Market",
  "trading.orderPanel.limit": "Limit",
  "trading.orderPanel.priceLabel": "Preis",
  "trading.orderPanel.amountLabel": "Betrag",
  "trading.orderPanel.quantityLabel": "Menge",
  "trading.orderPanel.available": "Verfügbar:",
  "trading.orderPanel.total": "Gesamt",
  "trading.orderPanel.sliderBuyAria":
    "Kaufbetrag als Prozentsatz des verfügbaren Guthabens",
  "trading.orderPanel.sliderSellAria":
    "Verkaufsmenge als Prozentsatz des verfügbaren Bestands",
  "trading.orderPanel.errors.invalidAmount": "Geben Sie einen gültigen Betrag ein",
  "trading.orderPanel.errors.amountExceedsAvailable":
    "Betrag übersteigt das verfügbare Guthaben",
  "trading.orderPanel.errors.insufficientUsdt": "USDT-Guthaben nicht ausreichend",
  "trading.orderPanel.errors.priceRequired": "Geben Sie einen Preis ein",
  "trading.orderPanel.errors.orderFailed": "Order fehlgeschlagen",
  "trading.orderPanel.success.bought": "Gekauft",
  "trading.orderPanel.success.sold": "Verkauft",
  "trading.orderPanel.success.limitBuyPlaced": "Limit-Kauforder platziert",
  "trading.orderPanel.success.limitSellPlaced": "Limit-Verkaufsorder platziert",
  "trading.orders.columnPair": "Paar",
  "trading.orders.columnType": "Typ",
  "trading.orders.columnSide": "Richtung",
  "trading.orders.columnPrice": "Preis",
  "trading.orders.columnQuantity": "Menge",
  "trading.orders.columnStatus": "Status",
  "trading.orders.loading": "Orders werden geladen…",
  "trading.orders.emptyOpen": "Keine offenen Orders.",
  "trading.orders.emptyHistory": "Noch kein Orderverlauf.",
  "trading.orders.statusOpen": "Offen",
  "trading.orders.statusFilled": "Ausgeführt",
  "trading.orders.statusCancelled": "Storniert",
  "trading.orders.filledSuffix": "ausgeführt",
  "trading.orders.cancelAria": "Order stornieren",
  "trading.orders.cancelSuccess": "Order storniert",
  "trading.orders.cancelError": "Order konnte nicht storniert werden",
  "trading.orders.cancelConfirmTitle": "Order stornieren?",
  "trading.orders.cancelConfirmBodyPrefix":
    "Sind Sie sicher, dass Sie die folgende Order stornieren möchten:",
  "trading.orders.cancelConfirmBodySuffix": "Order?",
  "trading.orders.cancelConfirmBack": "Zurück",
  "trading.orders.cancelConfirmConfirm": "Order stornieren",
  "trading.orders.openTab": "Offene Orders",
  "trading.orders.historyTab": "Orderverlauf",

  // Marketing — Home
  "marketing.home.hero.badge": "+20 % auf Ihre erste Einzahlung",
  "marketing.home.hero.titleLine1": "Ihre erste Einzahlung —",
  "marketing.home.hero.titlePrefix": "",
  "marketing.home.hero.titleHighlight": "20 % mehr",
  "marketing.home.hero.subtitle":
    "Zahlen Sie erstmals auf Ihr Konto ein und erhalten Sie einen Bonus. Handeln Sie Krypto und andere Assets auf einer zuverlässigen, einfach zu bedienenden Plattform.",
  "marketing.home.hero.primaryCta": "+20 % Bonus sichern",
  "marketing.home.hero.viewMarkets": "Märkte ansehen",

  "marketing.home.phone.balanceLabel": "Ihr Guthaben",
  "marketing.home.phone.depositLabel": "Erste Einzahlung",
  "marketing.home.phone.bonusLabel": "Bonus +20 %",
  "marketing.home.phone.totalLabel": "Gesamt",

  "marketing.home.stats.bonus.value": "+20 %",
  "marketing.home.stats.bonus.label": "Bonus auf Ihre erste Einzahlung",
  "marketing.home.stats.assets.value": "100+",
  "marketing.home.stats.assets.label": "Verfügbare Assets",
  "marketing.home.stats.uptime.value": "24/7",
  "marketing.home.stats.uptime.label": "Plattformzugang, rund um die Uhr",
  "marketing.home.stats.referral.value": "bis zu 100 USDT",
  "marketing.home.stats.referral.label": "Pro eingeladenem Freund",
  "marketing.home.stats.referral.sublabel": "(Empfehlungsprogramm)",

  "marketing.home.referral.titleLine1": "Freunde einladen —",
  "marketing.home.referral.titleLine2Prefix": "erhalten ",
  "marketing.home.referral.titleHighlight": "bis zu 100 USDT",
  "marketing.home.referral.description":
    "Ihr Freund erhält +20 % auf seine erste Einzahlung, und Sie erhalten 10 % seines Einzahlungsbetrags (bis zu 100 USDT).",
  "marketing.home.referral.depositLabel": "zahlt ein",
  "marketing.home.referral.receiveLabel": "Sie erhalten",
  "marketing.home.referral.deposit1Value": "250 USDT",
  "marketing.home.referral.receive1Value": "25 USDT",
  "marketing.home.referral.deposit2Value": "1.000 USDT",
  "marketing.home.referral.receive2Value": "100 USDT",

  "marketing.home.benefits.security.title": "Sicherheit der Gelder",
  "marketing.home.benefits.security.description": "Cold Wallets und 2FA-Schutz",
  "marketing.home.benefits.instant.title": "Sofortige Transaktionen",
  "marketing.home.benefits.instant.description": "Schnelle Ein- und Auszahlungen",
  "marketing.home.benefits.fees.title": "Niedrige Gebühren",
  "marketing.home.benefits.fees.description": "Attraktive Konditionen für Trader",
  "marketing.home.benefits.support.title": "Support rund um die Uhr",
  "marketing.home.benefits.support.description": "Wir sind immer für Sie da",

  // Marketing — About
  "marketing.about.hero.titleLine1": "Wir schaffen einen Ort,",
  "marketing.about.hero.titleLine2": "an dem Krypto",
  "marketing.about.hero.titleHighlight": "einfacher wird.",
  "marketing.about.hero.subtitle":
    "GTX ist eine moderne Krypto-Handelsplattform für alle, die Wert auf Geschwindigkeit, ein klares Interface und die Kontrolle über ihre digitalen Assets legen.",
  "marketing.about.hero.primaryCta": "Jetzt handeln",

  "marketing.about.stats.assets.value": "100+",
  "marketing.about.stats.assets.label": "Krypto-Assets",
  "marketing.about.stats.uptime.value": "24/7",
  "marketing.about.stats.uptime.label": "Plattformzugang",
  "marketing.about.stats.currency.value": "USDT",
  "marketing.about.stats.currency.label": "Hauptwährung",
  "marketing.about.stats.fee.value": "0 %",
  "marketing.about.stats.fee.label": "Gebühr für Ein- und Auszahlungen",

  "marketing.about.mission.label": "UNSERE IDEE",
  "marketing.about.mission.headingLine1": "Krypto handeln",
  "marketing.about.mission.headingLine2": "sollte nicht kompliziert sein.",
  "marketing.about.mission.paragraph1":
    "GTX basiert auf einer einfachen Idee: Sie sollten immer verstehen, was mit Ihren Assets geschieht, die relevanten Informationen sehen und schnellen Zugriff auf die wichtigen Tools haben.",
  "marketing.about.mission.paragraph2":
    "Von der Einzahlung bis zum Kauf, Verkauf und der Verwaltung von Krypto — wir möchten jeden Schritt klar und einfach gestalten.",

  "marketing.about.why.title": "Warum GTX?",
  "marketing.about.why.subtitle":
    "Alles, was Sie für den Umgang mit digitalen Assets brauchen — an einem Ort.",
  "marketing.about.why.speed.title": "Geschwindigkeit",
  "marketing.about.why.speed.description":
    "Schneller Zugriff auf Märkte, Transaktionen und wichtige Tools ohne unnötige Schritte.",
  "marketing.about.why.simplicity.title": "Einfachheit",
  "marketing.about.why.simplicity.description":
    "Ein klares Interface, das sich unabhängig von Ihrer Erfahrung leicht bedienen lässt.",
  "marketing.about.why.control.title": "Kontrolle",
  "marketing.about.why.control.description":
    "Guthaben, Assets, Orders und der Transaktionsverlauf sind jederzeit in einem Konto verfügbar.",
  "marketing.about.why.available.title": "24/7",
  "marketing.about.why.available.description":
    "Der Kryptomarkt schläft nie — GTX ist rund um die Uhr verfügbar.",

  "marketing.about.platform.headingLine1": "Alles im Blick.",
  "marketing.about.platform.headingLine2": "An einem Ort.",
  "marketing.about.platform.description":
    "Behalten Sie Ihr Guthaben im Blick, verwalten Sie Assets und wechseln Sie zum Handel, ohne zwischen Dutzenden verschiedenen Tools zu wechseln.",
  "marketing.about.platform.availableBalance": "Verfügbares Guthaben",
  "marketing.about.platform.inOrders": "In Orders gebunden",
  "marketing.about.platform.assetsValue": "Wert der Assets",
  "marketing.about.platform.pnl": "Gewinn / Verlust",

  "marketing.about.security.label": "SICHERHEIT",
  "marketing.about.security.headingLine1": "Ihre Assets.",
  "marketing.about.security.headingLine2": "Ihre Kontrolle.",
  "marketing.about.security.description":
    "Wir legen großen Wert auf den Schutz von Nutzerkonten und Transaktionen.",
  "marketing.about.security.accountProtection.title": "Kontoschutz",
  "marketing.about.security.accountProtection.description":
    "Zusätzliche Sicherheitsebenen für den Zugriff auf Ihr Profil.",
  "marketing.about.security.twoFactor.title": "2FA",
  "marketing.about.security.twoFactor.description":
    "Zwei-Faktor-Authentifizierung für zusätzliche Kontosicherheit.",
  "marketing.about.security.activityControl.title": "Aktivitätskontrolle",
  "marketing.about.security.activityControl.description":
    "Ihr Aktions- und Transaktionsverlauf ist direkt in Ihrem Konto einsehbar.",

  "marketing.about.values.title": "Was uns wichtig ist",
  "marketing.about.values.simplicity.title": "Einfachheit",
  "marketing.about.values.simplicity.description":
    "Auch komplexe Tools sollten für den Nutzer verständlich bleiben.",
  "marketing.about.values.speed.title": "Geschwindigkeit",
  "marketing.about.values.speed.description":
    "Weniger unnötige Schritte — mehr Zeit für das, was wirklich zählt.",
  "marketing.about.values.transparency.title": "Transparenz",
  "marketing.about.values.transparency.description":
    "Nutzer sollten ihre Assets, ihr Guthaben und ihre Transaktionen jederzeit klar sehen können.",

  "marketing.about.finalCta.label": "BEREIT LOSZULEGEN?",
  "marketing.about.finalCta.headingLine1": "Ihr nächster Schritt",
  "marketing.about.finalCta.headingLine2": "beginnt mit GTX.",
  "marketing.about.finalCta.description":
    "Erstellen Sie ein Konto und erhalten Sie Zugang zum Kryptomarkt an einem Ort.",
  "marketing.about.finalCta.primaryGuest": "Konto erstellen",

  // Privacy
  "privacy.seo.title": "Datenschutzcenter | GTX",
  "privacy.seo.description":
    "Erfahren Sie, wie GTX personenbezogene Daten verarbeitet und welche Rechte Sie in Bezug auf Ihre Informationen haben.",

  "privacy.hero.label": "DATENSCHUTZCENTER",
  "privacy.hero.headingLine1": "Datenschutz",
  "privacy.hero.headingLine2": "bei GTX",
  "privacy.hero.subtitle":
    "Diese Seite erklärt klar, wie GTX Nutzerdaten verarbeitet, welche Grundsätze wir anwenden und welche Möglichkeiten Sie in Bezug auf Ihre eigenen Informationen haben.",
  "privacy.hero.tagline": "Ihre Daten. Ihre Kontrolle.",
  "privacy.hero.lastUpdated": "Zuletzt aktualisiert: 31. August 2026",

  "privacy.principles.title": "Datenschutzgrundsätze von GTX",
  "privacy.principles.transparency.title": "Transparenz",
  "privacy.principles.transparency.description":
    "Wir möchten klar erklären, welche Daten verarbeitet werden können und wofür sie verwendet werden.",
  "privacy.principles.minimization.title": "Datenminimierung",
  "privacy.principles.minimization.description":
    "Wir verwenden nur die Daten, die für die Funktion der jeweiligen Plattformfunktionen notwendig sind.",
  "privacy.principles.accountability.title": "Verantwortlichkeit",
  "privacy.principles.accountability.description":
    "Der Zugriff auf Informationen ist auf relevante Rollen beschränkt und wird nur zu festgelegten Zwecken genutzt.",
  "privacy.principles.userRights.title": "Nutzerrechte",
  "privacy.principles.userRights.description":
    "Sie können sich bezüglich Zugriff, Berichtigung oder anderer Maßnahmen zu Ihren Daten im Rahmen des geltenden Rechts an uns wenden.",
  "privacy.principles.dataProtection.title": "Datenschutz",
  "privacy.principles.dataProtection.description":
    "Wir setzen technische und organisatorische Maßnahmen ein, um Konten und Informationen vor unbefugtem Zugriff zu schützen.",

  "privacy.usage.title": "Wie GTX Ihre Daten verwendet",

  "privacy.usage.personalData.title": "Was sind personenbezogene Daten?",
  "privacy.usage.personalData.paragraph1":
    "Personenbezogene Daten sind Informationen, die sich direkt oder indirekt einem bestimmten Nutzer zuordnen lassen.",
  "privacy.usage.personalData.paragraph2":
    "Bei GTX können dazu Daten gehören, die Sie bei der Kontoeröffnung, der Verifizierung, bei Ein- und Auszahlungen sowie sonstige für die Plattformfunktionen notwendige Informationen angeben.",
  "privacy.usage.personalData.examplesIntro": "Dazu können beispielsweise gehören:",
  "privacy.usage.personalData.example1": "Name und E-Mail-Adresse",
  "privacy.usage.personalData.example2":
    "Im Rahmen der Identitätsverifizierung bereitgestellte Daten",
  "privacy.usage.personalData.example3": "Informationen zu Ein- und Auszahlungen",
  "privacy.usage.personalData.example4":
    "Technische Sitzungs- und Geräteinformationen (z. B. IP-Adresse)",

  "privacy.usage.howWeUse.title": "Wie verwendet GTX Daten?",
  "privacy.usage.howWeUse.intro": "Wir verwenden Nutzerdaten, um:",
  "privacy.usage.howWeUse.item1": "Ihr Konto einzurichten und zu verwalten",
  "privacy.usage.howWeUse.item2": "Sie zu authentifizieren",
  "privacy.usage.howWeUse.item3": "Ihre Identität zu verifizieren",
  "privacy.usage.howWeUse.item4": "Einzahlungen zu bearbeiten",
  "privacy.usage.howWeUse.item5": "Auszahlungen zu bearbeiten",
  "privacy.usage.howWeUse.item6": "Handelsfunktionen bereitzustellen",
  "privacy.usage.howWeUse.item7": "Nutzer-Support zu leisten",
  "privacy.usage.howWeUse.item8": "Die Plattform zu schützen",
  "privacy.usage.howWeUse.item9": "Missbrauch vorzubeugen",
  "privacy.usage.howWeUse.item10":
    "Den technischen Betrieb des Dienstes zu gewährleisten",

  "privacy.usage.retention.title": "Wie lange können Daten gespeichert werden?",
  "privacy.usage.retention.description":
    "Informationen können so lange gespeichert werden, wie es für die Funktion des jeweiligen Features, die Verwaltung Ihres Kontos, die Einhaltung gesetzlicher Vorgaben, die Gewährleistung der Sicherheit oder die Klärung von Streitfällen erforderlich ist.",

  "privacy.usage.thirdParties.title": "Teilt GTX Daten mit Dritten?",
  "privacy.usage.thirdParties.description":
    "In bestimmten Fällen kann GTX technische Dienstleistungen Dritter nutzen, um bestimmte Plattformfunktionen zu unterstützen, etwa den Versand von Konto- und Sicherheits-E-Mails. Personenbezogene Daten werden nur weitergegeben, wenn dies für die jeweilige Funktion erforderlich ist oder geltende Vorschriften dies verlangen.",

  "privacy.usage.cookies.title": "Wie verwendet GTX Cookies?",
  "privacy.usage.cookies.intro":
    "Technisch notwendige Cookies können verwendet werden, um:",
  "privacy.usage.cookies.item1": "Sich bei Ihrem Konto anzumelden",
  "privacy.usage.cookies.item2": "Ihre Sitzung aufrechtzuerhalten",
  "privacy.usage.cookies.item3": "Plattformfunktionen sicher am Laufen zu halten",
  "privacy.usage.cookies.item4": "Sich Ihre Spracheinstellung zu merken",

  "privacy.rights.title": "Ihre Rechte in Bezug auf personenbezogene Daten",
  "privacy.rights.intro":
    "Je nach geltendem Recht können Ihnen folgende Rechte zustehen:",
  "privacy.rights.access.question": "Recht auf Auskunft",
  "privacy.rights.access.answer":
    "Sie können bei uns anfragen, welche personenbezogenen Daten GTX über Sie verarbeitet.",
  "privacy.rights.rectification.question": "Recht auf Berichtigung",
  "privacy.rights.rectification.answer":
    "Sie können uns bitten, ungenaue oder unvollständige Informationen in Ihrem Konto zu korrigieren.",
  "privacy.rights.erasure.question": "Recht auf Löschung",
  "privacy.rights.erasure.answer":
    "Sie können uns bitten, Ihre personenbezogenen Daten zu löschen, sofern dies nach geltendem Recht und sonstigen Vorgaben möglich ist.",
  "privacy.rights.restriction.question": "Recht auf Einschränkung der Verarbeitung",
  "privacy.rights.restriction.answer":
    "Sie können uns bitten, die weitere Verarbeitung Ihrer Daten in bestimmten Fällen einzuschränken.",
  "privacy.rights.objection.question": "Widerspruchsrecht",
  "privacy.rights.objection.answer":
    "Sie können bestimmten Arten der Verarbeitung Ihrer personenbezogenen Daten widersprechen, sofern das geltende Recht dies vorsieht.",
  "privacy.rights.withdrawConsent.question": "Recht auf Widerruf der Einwilligung",
  "privacy.rights.withdrawConsent.answer":
    "Beruht die Verarbeitung auf einer Einwilligung, können Sie diese jederzeit widerrufen.",
  "privacy.rights.portability.question": "Recht auf Datenübertragbarkeit",
  "privacy.rights.portability.answer":
    "In bestimmten Fällen können Sie uns bitten, Ihre Daten in einem strukturierten Format bereitzustellen.",

  "privacy.faq.title": "Häufig gestellte Fragen",
  "privacy.faq.q1.question": "Wie erhalte ich Informationen zu meinen Daten?",
  "privacy.faq.q1.answer":
    "Sie können sich mit einer entsprechenden Anfrage an den GTX-Support wenden.",
  "privacy.faq.q2.question": "Wie korrigiere ich meine Kontodaten?",
  "privacy.faq.q2.answer":
    "Die meisten grundlegenden Angaben können Sie direkt in Ihrem Konto aktualisieren. Für alles Weitere kontaktieren Sie den Support.",
  "privacy.faq.q3.question": "Wie beantrage ich die Löschung meiner Daten?",
  "privacy.faq.q3.answer": "Kontaktieren Sie den GTX-Support mit Ihrer Anfrage.",
  "privacy.faq.q4.question":
    "Wie ändere ich Daten, die ich bei der Verifizierung angegeben habe?",
  "privacy.faq.q4.answer":
    "Kontaktieren Sie den GTX-Support, um Ihre Verifizierungsdaten zu ändern.",
  "privacy.faq.q5.question": "Wo erfahre ich mehr über Cookies?",
  "privacy.faq.q5.answer":
    'Details finden Sie im Abschnitt „Wie GTX Cookies verwendet" auf dieser Seite.',
  "privacy.faq.q6.question": "Wie stelle ich eine datenschutzbezogene Frage?",
  "privacy.faq.q6.answer":
    "Kontaktieren Sie den GTX-Support mit allen Fragen rund um den Datenschutz.",

  "privacy.support.title": "Brauchen Sie Hilfe?",
  "privacy.support.description":
    "Bei Fragen zum Datenschutz oder zur Nutzung Ihrer Daten wenden Sie sich an den GTX-Support.",
  "privacy.support.primaryCta": "Support kontaktieren",
  "privacy.support.secondaryCta": "Zum Konto",

  // News (minimal — just the small "Market news" block on /analytics;
  // no listing page, no article detail, no filters)
  "news.time.justNow": "Gerade eben",
  "news.time.minutesAgo": "Min. her",
  "news.time.hoursAgo": "Std. her",
  "news.time.yesterday": "Gestern",

  // Analytics
  "analytics.seo.title": "Krypto-Marktanalysen | GTX",
  "analytics.seo.description":
    "Live-Kryptokurse, 24-Stunden-Kursbewegungen, Marktaktivität und Krypto-News auf GTX.",
  "analytics.title": "Analysen",
  "analytics.subtitle": "Krypto-Marktdaten und -dynamik in Echtzeit",
  "analytics.marketOverview.title": "Marktüberblick",
  "analytics.marketOverview.gainersCarousel": "Top-Gewinner",
  "analytics.marketOverview.losersCarousel": "Top-Verlierer",
  "analytics.dynamics.title": "Marktdynamik",
  "analytics.dynamics.searchPlaceholder": "Coin suchen...",
  "analytics.dynamics.period24h": "24 Std.",
  "analytics.dynamics.error": "Chart-Daten konnten nicht geladen werden",
  "analytics.activity.title": "Höchste Aktivität",
  "analytics.volume24hLabel": "24-Std.-Volumen",
  "analytics.table.title": "Markt",
  "analytics.table.searchPlaceholder": "Coin suchen...",
  "analytics.table.filterAll": "Alle",
  "analytics.table.filterGainers": "Gewinner",
  "analytics.table.filterLosers": "Verlierer",
  "analytics.table.columnCoin": "Coin",
  "analytics.table.columnPrice": "Preis",
  "analytics.table.column24h": "24 Std.",
  "analytics.table.columnVolume": "24-Std.-Volumen",
  "analytics.table.showMore": "Mehr anzeigen",
  "analytics.news.title": "Markt-News",

  // Marketing — Contacts / Support
  "marketing.contacts.hero.title": "Support",
  "marketing.contacts.hero.subtitle": "Wir sind für Sie da, wenn Sie Hilfe brauchen",

  "marketing.contacts.cards.chat.title": "Live-Chat",
  "marketing.contacts.cards.chat.description": "Schreiben Sie uns direkt auf der Website",
  "marketing.contacts.cards.chat.button": "Chat öffnen",

  "marketing.contacts.cards.telegram.title": "Telegram",
  "marketing.contacts.cards.telegram.description": "Support über Telegram kontaktieren",
  "marketing.contacts.cards.telegram.button": "Auf Telegram schreiben",
  "marketing.contacts.cards.telegram.unavailable": "Noch nicht verfügbar",

  "marketing.contacts.faq.title": "Häufig gestellte Fragen",
  "marketing.contacts.faq.deposits.q": "Wie funktionieren Ein- und Auszahlungen?",
  "marketing.contacts.faq.deposits.a":
    "Stellen Sie eine Ein- oder Auszahlungsanfrage über Ihre Wallet — ein Administrator prüft und genehmigt sie, und die Gelder erscheinen danach umgehend in Ihrem Guthaben.",
  "marketing.contacts.faq.verification.q": "Warum muss ich mein Konto verifizieren?",
  "marketing.contacts.faq.verification.a":
    "Die Verifizierung bestätigt Ihre Identität, damit wir den vollen Funktionsumfang Ihres Kontos freischalten können. Reichen Sie Ihre Angaben und Dokumente auf der Seite Verifizierung ein — die Prüfung ist meist schnell erledigt.",
  "marketing.contacts.faq.trading.q": "Wie funktioniert der Handel auf GTX?",
  "marketing.contacts.faq.trading.a":
    "Platzieren Sie Market- oder Limit-Orders im Spot-Handel zu aktuellen Kursen. Offene Orders und der Orderverlauf sind jederzeit auf der Handelsseite einsehbar.",
  "marketing.contacts.faq.bonuses.q":
    "Wie funktionieren Boni und das Empfehlungsprogramm?",
  "marketing.contacts.faq.bonuses.a":
    "Für Ihre erste genehmigte Einzahlung erhalten Sie automatisch einen Bonus. Teilen Sie Ihren Empfehlungscode, und Sie erhalten eine Belohnung, sobald die eingeladene Person ihre erste Einzahlung tätigt.",
  "marketing.contacts.faq.security.q": "Wie ist mein Konto geschützt?",
  "marketing.contacts.faq.security.a":
    "Aktivieren Sie die Zwei-Faktor-Authentifizierung in den Einstellungen für zusätzlichen Schutz und geben Sie Ihr Passwort oder Ihre 2FA-Codes niemals an Dritte weiter.",

  "marketing.contacts.email.note": "Oder schreiben Sie uns eine E-Mail an",

  // Support chat widget (/contacts)
  "supportChat.fab.ariaLabel": "Support-Chat",
  "supportChat.header.title": "GTX-Support",
  "supportChat.guest.title": "Zum Chatten anmelden",
  "supportChat.guest.body": "Der Support-Chat steht angemeldeten Konten zur Verfügung.",
  "supportChat.category.prompt": "Worum geht es?",
  "supportChat.category.deposit": "Einzahlung",
  "supportChat.category.withdrawal": "Auszahlung",
  "supportChat.category.trading": "Handel",
  "supportChat.category.verification": "Verifizierung",
  "supportChat.category.bonuses": "Boni",
  "supportChat.category.security": "Sicherheit",
  "supportChat.category.other": "Sonstiges",
  "supportChat.messages.you": "Sie",
  "supportChat.messages.team": "GTX-Support",
  "supportChat.messages.empty":
    "Senden Sie eine Nachricht, und wir melden uns umgehend bei Ihnen.",
  "supportChat.messages.closedBanner":
    "Dieses Gespräch ist geschlossen. Schreiben Sie uns, falls Sie weiterhin Hilfe benötigen.",
  "supportChat.input.placeholder": "Nachricht eingeben…",
  "supportChat.input.send": "Senden",
  "supportChat.errors.createFailed":
    "Das Gespräch konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
  "supportChat.errors.sendFailed":
    "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",

  // /bonuses
  "marketing.bonuses.hero.heading": "Holen Sie mehr mit GTX heraus",
  "marketing.bonuses.hero.subtitle":
    "Sichern Sie sich den Bonus für Ihre erste Einzahlung und laden Sie Freunde ein, um zusätzliche Prämien zu erhalten.",
  "marketing.bonuses.firstDeposit.badge": "+20 %",
  "marketing.bonuses.firstDeposit.title": "Mehr Wert bei Ihrer ersten Einzahlung",
  "marketing.bonuses.firstDeposit.description":
    "Erhalten Sie +20 % zusätzlich auf den Betrag Ihrer ersten erfolgreichen Einzahlung.",
  "marketing.bonuses.firstDeposit.examplesLabel": "Beispiele",
  "marketing.bonuses.firstDeposit.example1From": "250 USDT",
  "marketing.bonuses.firstDeposit.example1To": "+50 USDT",
  "marketing.bonuses.firstDeposit.example2From": "500 USDT",
  "marketing.bonuses.firstDeposit.example2To": "+100 USDT",
  "marketing.bonuses.firstDeposit.example3From": "1000 USDT",
  "marketing.bonuses.firstDeposit.example3To": "+200 USDT",
  "marketing.bonuses.firstDeposit.rule1": "Einmaliger Bonus",
  "marketing.bonuses.firstDeposit.rule2": "Nur Ihre erste bestätigte Einzahlung zählt",
  "marketing.bonuses.firstDeposit.rule3": "Gilt nicht für spätere Einzahlungen",
  "marketing.bonuses.referral.badge": "10 %",
  "marketing.bonuses.referral.title": "Freunde einladen, Prämien erhalten",
  "marketing.bonuses.referral.description":
    "Laden Sie Freunde zu GTX ein und erhalten Sie 10 % des Betrags ihrer ersten erfolgreichen Einzahlung.",
  "marketing.bonuses.referral.maxNote": "Bis zu 100 USDT pro eingeladenem Nutzer",
  "marketing.bonuses.referral.registrationNote":
    "Die Registrierung allein erzeugt noch keine Prämie — der eingeladene Nutzer muss seine erste erfolgreiche Einzahlung tätigen.",
  "marketing.bonuses.referral.rule2":
    "Wird nach seiner ersten erfolgreichen Einzahlung gutgeschrieben",
  "marketing.bonuses.referral.examplesLabel": "Prämienbeispiele",
  "marketing.bonuses.referral.example1From": "250 USDT",
  "marketing.bonuses.referral.example1To": "25 USDT",
  "marketing.bonuses.referral.example2From": "500 USDT",
  "marketing.bonuses.referral.example2To": "50 USDT",
  "marketing.bonuses.referral.example3From": "1000 USDT",
  "marketing.bonuses.referral.example3To": "100 USDT",
  "marketing.bonuses.referral.example4From": "2000 USDT",
  "marketing.bonuses.referral.example4To": "100 USDT",
  "marketing.bonuses.referral.maxLabel": "maximal",
  "marketing.bonuses.personal.title": "Ihr Empfehlungscode",
  "marketing.bonuses.personal.explanation":
    "Teilen Sie diesen Code mit einem Freund. Er muss ihn bei der Registrierung angeben.",
  "marketing.bonuses.personal.copyButton": "Code kopieren",
  "marketing.bonuses.personal.copiedFeedback": "Kopiert",
  "marketing.bonuses.guestCta.title":
    "Melden Sie sich an, um Ihren Empfehlungscode zu sehen",
  "marketing.bonuses.guestCta.description":
    "Erstellen Sie ein Konto oder melden Sie sich an, um Freunde einzuladen und Ihre Boni zu verfolgen.",
  "marketing.bonuses.guestCta.registerButton": "Konto erstellen",
  "marketing.bonuses.guestCta.loginButton": "Anmelden",
  "marketing.bonuses.stats.invited": "Eingeladene Freunde",
  "marketing.bonuses.stats.activated": "Bonus aktiviert",
  "marketing.bonuses.stats.earned": "Erhaltene Empfehlungsboni",
  "marketing.bonuses.howItWorks.title": "So funktioniert das Empfehlungsprogramm",
  "marketing.bonuses.howItWorks.step1Title": "Code teilen",
  "marketing.bonuses.howItWorks.step1Description":
    "Senden Sie Ihren Empfehlungscode an einen Freund.",
  "marketing.bonuses.howItWorks.step2Title": "Ihr Freund registriert sich",
  "marketing.bonuses.howItWorks.step2Description":
    "Bei der Registrierung gibt er Ihren Code ein.",
  "marketing.bonuses.howItWorks.step3Title": "Ihr Freund zahlt ein",
  "marketing.bonuses.howItWorks.step3Description":
    "Nach seiner ersten erfolgreichen Einzahlung erhalten Sie 10 % des Betrags, maximal 100 USDT.",
  "marketing.bonuses.faq.title": "Häufig gestellte Fragen",
  "marketing.bonuses.faq.q1": "Wann erhalte ich den +20 %-Bonus?",
  "marketing.bonuses.faq.a1": "Nach Bestätigung Ihrer ersten erfolgreichen Einzahlung.",
  "marketing.bonuses.faq.q2": "Erhalte ich +20 % auf meine zweite Einzahlung?",
  "marketing.bonuses.faq.a2":
    "Nein. Der Bonus wird nur einmal gutgeschrieben — bei der ersten erfolgreichen Einzahlung.",
  "marketing.bonuses.faq.q3": "Wann wird der Empfehlungsbonus gutgeschrieben?",
  "marketing.bonuses.faq.a3":
    "Nachdem der von Ihnen eingeladene Nutzer seine erste erfolgreiche Einzahlung getätigt hat.",
  "marketing.bonuses.faq.q4":
    "Erhalte ich einen Bonus allein für die Registrierung eines Freundes?",
  "marketing.bonuses.faq.a4":
    "Nein. Die Registrierung allein reicht nicht aus. Der eingeladene Nutzer muss die erste erfolgreiche Einzahlung tätigen.",
  "marketing.bonuses.faq.q5": "Wie viel kann ich pro Freund verdienen?",
  "marketing.bonuses.faq.a5":
    "10 % des Betrags seiner ersten erfolgreichen Einzahlung, maximal 100 USDT.",
  "marketing.bonuses.faq.q6":
    "Was, wenn die erste Einzahlungsanfrage meines Freundes abgelehnt wurde?",
  "marketing.bonuses.faq.a6":
    "Eine abgelehnte Einzahlung aktiviert den Empfehlungsbonus nicht. Es zählt die erste erfolgreich bestätigte Einzahlung.",
  "marketing.bonuses.faq.q7":
    "Erhalte ich 10 % von allen zukünftigen Einzahlungen meines Freundes?",
  "marketing.bonuses.faq.a7":
    "Nein. Der Empfehlungsbonus wird nur einmal gutgeschrieben — für die erste erfolgreiche Einzahlung des eingeladenen Nutzers.",
  "marketing.bonuses.faq.q8":
    "Können der Bonus für die erste Einzahlung und der Empfehlungsbonus gleichzeitig ausgelöst werden?",
  "marketing.bonuses.faq.a8":
    "Ja. Der eingeladene Nutzer kann seinen eigenen +20 %-Bonus erhalten, während der Nutzer, der ihn eingeladen hat, seinen Empfehlungsbonus erhält.",
  "marketing.footer.platform": "Plattform",
  "marketing.footer.company": "Unternehmen",
  "marketing.footer.legal": "Rechtliches",
  "marketing.footer.privacyPolicy": "Datenschutzrichtlinie",
  "marketing.footer.termsOfService": "Nutzungsbedingungen",
  "marketing.footer.description":
    "GTX ist eine Bildungsplattform für Paper-Trading. Alle Guthaben sind virtuell, und alle Trades sind simuliert — es besteht zu keinem Zeitpunkt ein Risiko für echte Gelder.",
  "marketing.footer.copyright":
    "GTX. Virtueller Handelssimulator ausschließlich zu Bildungszwecken.",
  "marketing.footer.rightsReserved": "Alle Rechte vorbehalten",

  // Auth
  "auth.emailLabel": "E-Mail",
  "auth.passwordLabel": "Passwort",
  "auth.login.title": "Willkommen zurück",
  "auth.login.noAccountPrompt": "Noch kein Konto?",
  "auth.login.loginFailed": "Anmeldung fehlgeschlagen",
  "auth.login.welcomeToast": "Willkommen zurück!",
  "auth.login.twoFactorTitle": "Zwei-Faktor-Verifizierung",
  "auth.login.twoFactorPrompt":
    "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.",
  "auth.login.codeLabel": "Bestätigungscode",
  "auth.login.verifyButton": "Bestätigen",
  "auth.login.backToLogin": "Zurück zur Anmeldung",
  "auth.login.invalidCode": "Ungültiger Bestätigungscode",
  "auth.register.title": "Konto erstellen",
  "auth.register.haveAccountPrompt": "Sie haben bereits ein Konto?",
  "auth.register.firstNameLabel": "Vorname",
  "auth.register.lastNameLabel": "Nachname",
  "auth.register.registrationFailed": "Registrierung fehlgeschlagen",
  "auth.register.successToast": "Konto erstellt — willkommen bei GTX!",
  "auth.register.agreeToTermsPrefix": "Ich stimme der",
  "auth.register.privacyPolicy": "Datenschutzrichtlinie",
  "auth.register.submitButton": "Registrieren",
  "auth.register.referralCodeLabel": "Empfehlungscode",
  "auth.register.referralCodePlaceholder": "Empfehlungscode eingeben",
  "auth.register.invalidReferralCode": "Ungültiger Empfehlungscode",
  "auth.login.forgotPasswordLink": "Passwort vergessen?",
  "auth.forgotPassword.title": "Passwort zurücksetzen",
  "auth.forgotPassword.description":
    "Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.",
  "auth.forgotPassword.submitButton": "Link zum Zurücksetzen senden",
  "auth.forgotPassword.successMessage":
    "Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.",
  "auth.forgotPassword.backToLogin": "Zurück zur Anmeldung",
  "auth.forgotPassword.failedFallback":
    "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  "auth.resetPassword.title": "Neues Passwort festlegen",
  "auth.resetPassword.newPasswordLabel": "Neues Passwort",
  "auth.resetPassword.confirmPasswordLabel": "Passwort bestätigen",
  "auth.resetPassword.submitButton": "Passwort zurücksetzen",
  "auth.resetPassword.successMessage":
    "Ihr Passwort wurde zurückgesetzt. Sie können sich nun mit Ihrem neuen Passwort anmelden.",
  "auth.resetPassword.goToLogin": "Zur Anmeldung",
  "auth.resetPassword.invalidTokenMessage":
    "Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen.",
  "auth.resetPassword.requestNewLink": "Neuen Link anfordern",
  "auth.resetPassword.failedFallback":
    "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  "auth.resetPassword.missingTokenMessage": "Diesem Link fehlt ein Reset-Token.",

  // Markets
  "markets.title": "Märkte",
  "markets.subtitle": "Live-Preise und Handelspaare",
  "markets.tabs.all": "Alle Kryptowährungen",
  "markets.tabs.favorites": "Favoriten",
  "markets.tabs.popular": "Beliebt",
  "markets.tabs.gainers": "Top-Gewinner",
  "markets.tabs.losers": "Top-Verlierer",
  "markets.tabs.volume": "Top-Volumen",
  "markets.tabs.movers": "Größte Bewegungen",
  "markets.emptyFavorites": "Sie haben noch keine Kryptowährungen als Favoriten markiert",
  "markets.columns.rank": "№",
  "markets.columns.name": "Coin",
  "markets.columns.price": "Preis",
  "markets.columns.change24h": "24-Std.-Änderung",
  "markets.columns.volume24h": "24-Std.-Volumen",
  "markets.columns.chart": "Chart",
  "markets.favorites.add": "Zu Favoriten hinzufügen",
  "markets.favorites.remove": "Aus Favoriten entfernen",
  "markets.pagination.pageLabel": "Seite",
  "markets.pagination.of": "von",
  "markets.pagination.assets": "Assets",
  "markets.pagination.prev": "Zurück",
  "markets.pagination.next": "Weiter",

  // Transactional email (lib/email/templates.ts) — server-rendered using
  // the recipient's saved UserSettings.language, not the request locale.
  "email.passwordChanged.subject": "Sicherheitshinweis: Ihr Passwort wurde geändert",
  "email.passwordChanged.heading": "Ihr Passwort wurde geändert",
  "email.passwordChanged.body": "Das Passwort Ihres GTX-Kontos wurde am {date} geändert.",
  "email.passwordChanged.notYouNotice":
    "Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte umgehend den Support.",
  "email.emailChangeConfirm.subject": "Bestätigen Sie Ihre neue GTX-E-Mail-Adresse",
  "email.emailChangeConfirm.heading": "Bestätigen Sie Ihre neue E-Mail-Adresse",
  "email.emailChangeConfirm.body":
    "Wir haben eine Anfrage erhalten, die E-Mail-Adresse Ihres GTX-Kontos auf diese zu ändern. Klicken Sie auf den Link unten, um sie zu bestätigen.",
  "email.emailChangeConfirm.button": "Neue E-Mail-Adresse bestätigen",
  "email.emailChangeConfirm.expiryNotice":
    "Dieser Link läuft in 1 Stunde ab. Falls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.",
  "email.passwordResetRequest.subject": "Setzen Sie Ihr GTX-Passwort zurück",
  "email.passwordResetRequest.heading": "Passwort zurücksetzen",
  "email.passwordResetRequest.body":
    "Wir haben eine Anfrage erhalten, das Passwort Ihres GTX-Kontos zurückzusetzen. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen.",
  "email.passwordResetRequest.button": "Passwort zurücksetzen",
  "email.passwordResetRequest.expiryNotice": "Dieser Link läuft in 30 Minuten ab.",
  "email.passwordResetRequest.notYouNotice":
    "Falls Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren — Ihr Passwort wird nicht geändert.",
  "email.emailChanged.subject": "Die E-Mail-Adresse Ihres GTX-Kontos wurde geändert",
  "email.emailChanged.heading": "Die E-Mail-Adresse Ihres Kontos wurde geändert",
  "email.emailChanged.body":
    "Die E-Mail-Adresse Ihres GTX-Kontos wurde am {date} zu {newEmail} geändert.",
  "email.emailChanged.notYouNotice":
    "Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte umgehend den Support.",

  "email.balanceAdjusted.subject": "Ihr GTX-Guthaben wurde aktualisiert",
  "email.balanceAdjusted.headingCredit": "Guthaben gutgeschrieben",
  "email.balanceAdjusted.headingDebit": "Guthaben angepasst",
  "email.balanceAdjusted.bodyCredit":
    "Ihrem {asset}-Guthaben wurden {amount} {asset} gutgeschrieben.",
  "email.balanceAdjusted.bodyDebit":
    "Von Ihrem {asset}-Guthaben wurden {amount} {asset} abgebucht.",
  "email.balanceAdjusted.footer":
    "Bei Fragen zu dieser Änderung kontaktieren Sie bitte den Support.",
};
