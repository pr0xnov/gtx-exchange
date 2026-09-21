/**
 * Master English dictionary — the source of truth for both the app's
 * text content AND its key set: `DictionaryKey`/`Dictionary` (see
 * ../dictionary-type.ts) are derived from this object, so every other
 * locale file is compiler-enforced to define exactly the same keys.
 * Deliberately a flat key -> string map, not a heavy i18n framework: the
 * app's UI text is fully enumerable and doesn't need plural rules,
 * interpolation libraries, or namespaced bundles loaded per-route. Extend
 * by adding a key here and to every other locale file in this directory
 * — TypeScript errors if any of them fall out of sync.
 *
 * Keys are grouped by the page/area that owns them (nav.*, trading.*,
 * markets.*, wallet.*, account.*, auth.*, …) so ownership is obvious and
 * two areas never fight over the same key.
 */
export const en = {
  // Shared across multiple pages
  "common.login": "Login",
  "common.register": "Registration",
  "common.dashboard": "Dashboard",
  "common.logout": "Log out",
  "common.loading": "Loading…",
  "common.error": "Something went wrong. Please try again.",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.back": "Back",
  "common.continue": "Continue",
  "common.submit": "Submit",
  "common.search": "Search",
  "common.noData": "No data available.",
  "common.viewAll": "View all",
  "common.optional": "Optional",

  // Navbar
  "nav.trading": "Trading",
  "nav.markets": "Markets",
  "nav.wallet": "Wallet",
  "nav.about": "About us",
  "nav.analytics": "Analytics",
  "nav.bonuses": "Bonuses",
  "nav.account": "Account",
  "nav.deposit": "Deposit",
  "nav.withdrawal": "Withdrawal",
  "nav.history": "History",
  "nav.verification": "Verification",
  "nav.settings": "Settings",
  "nav.support": "Support",
  "nav.accountMenu": "Account menu",
  "nav.siteMenu": "Menu",
  "nav.toggleMenu": "Toggle menu",
  "nav.language": "Language",
  "nav.logoutSuccess": "You have been logged out",
  "nav.logoutError": "Failed to log out. Please try again.",
  "nav.searchAria": "Search cryptocurrencies",
  "nav.searchPlaceholder": "Search cryptocurrencies",
  "nav.searchNoResults": "No cryptocurrencies found.",

  // Account
  "account.makeDeposit": "Make a deposit",
  "account.accountInfo": "Account info",
  "account.login": "Login",
  "account.email": "E-mail",
  "account.accountType": "Account type",
  "account.leverage": "Leverage",
  "account.recentTransactions": "Recent transactions",
  "account.viewAll": "View all",
  "account.noTransactions": "No transactions yet.",
  "account.transactionType.deposit": "Deposit",
  "account.transactionType.withdrawal": "Withdrawal",
  "account.transactionType.bonus": "Bonus",
  "account.transactionType.trade": "Trade",
  "account.transactionType.referralBonus": "Referral bonus",
  "account.transactionType.firstDepositBonus": "First-deposit bonus",
  "account.summary.weeklyProfitLoss": "Profit / Loss (7 days)",
  "account.twoFactorAuth": "Two-factor authentication",
  "account.twoFactorEnabled": "Enabled",
  "account.twoFactorDisabled": "Disabled",
  "account.referralCode": "Referral code",
  "account.referralCodeCopied": "Referral code copied",

  // Settings
  "settings.title": "Settings",
  "settings.profile": "Profile",
  "settings.firstName": "First name",
  "settings.lastName": "Last name",
  "settings.email": "E-mail",
  "settings.saveChanges": "Save changes",
  "settings.toastProfileUpdated": "Profile updated",
  "settings.passwordSecurity": "Password & Security",
  "settings.currentPassword": "Current password",
  "settings.newPassword": "New password",
  "settings.twoFactorAuth": "Two-factor authentication (2FA)",
  "settings.twoFactorAuthDesc": "Add an extra layer of security to your account",
  "settings.updatePassword": "Update password",
  "settings.toastPasswordUpdated": "Password updated",
  "settings.notifications": "Notifications",
  "settings.emailNotifications": "E-mail notifications",
  "settings.emailNotificationsDesc":
    "Receive updates about deposits, withdrawals and trades",
  "settings.pushNotifications": "Push notifications",
  "settings.pushNotificationsDesc": "Get notified in real time on this device",
  "settings.marketAlerts": "Market alerts",
  "settings.marketAlertsDesc": "Notify me about significant price movements",
  "settings.languageTheme": "Language & Theme",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",

  "settings.emailCurrentLabel": "Current email",
  "settings.emailChangeButton": "Change email",
  "settings.emailNewLabel": "New email",
  "settings.emailCurrentPasswordLabel": "Current password",
  "settings.emailSendConfirmation": "Send confirmation email",
  "settings.emailCancelChange": "Cancel",
  "settings.emailPendingNotice":
    "A confirmation link was sent to {email}. Click it to finish changing your email.",
  "settings.toastEmailChangeRequested": "Confirmation email sent",
  "settings.toastEmailChangeConfirmed": "Your email address has been updated",
  "settings.toastEmailChangeExpired": "That confirmation link has expired",
  "settings.toastEmailChangeInvalid": "That confirmation link is invalid",
  "settings.toastSaveFailed": "Failed to save changes",

  "settings.confirmNewPassword": "Confirm new password",
  "settings.toastPasswordChangeFailed": "Failed to change password",
  "settings.passwordMismatch": "Passwords do not match",

  "settings.twoFactorEnabledLabel": "2FA enabled",
  "settings.twoFactorDisabledLabel": "2FA disabled",
  "settings.twoFactorEnableButton": "Enable 2FA",
  "settings.twoFactorDisableButton": "Disable 2FA",
  "settings.twoFactorSetupTitle": "Set up two-factor authentication",
  "settings.twoFactorSetupInstructions":
    "Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy, or any compatible TOTP app.",
  "settings.twoFactorManualEntry": "Or enter this code manually:",
  "settings.twoFactorCodeLabel": "6-digit code",
  "settings.twoFactorConfirmButton": "Confirm & enable",
  "settings.twoFactorCancelButton": "Cancel",
  "settings.twoFactorDisableTitle": "Disable two-factor authentication",
  "settings.twoFactorDisableInstructions":
    "Enter a current code from your authenticator app to confirm.",
  "settings.toastTwoFactorEnabled": "2FA enabled successfully",
  "settings.toastTwoFactorDisabled": "2FA disabled successfully",
  "settings.toastInvalidCode": "Invalid verification code",
  "settings.toastTwoFactorSetupFailed": "Failed to start 2FA setup",

  // Deposit
  "deposit.pageTitle": "Deposit",
  "deposit.infoTitle": "Important information",
  "deposit.infoMinAmount": "Minimum deposit amount is 250 USDT.",
  "deposit.infoCorrectDetails": "Make sure that all payment details are correct.",
  "deposit.infoNetworkCorrect": "Make sure the network is correct.",
  "deposit.infoNoFee": "We do not charge a fee for deposits.",
  "deposit.selectPaymentMethod": "Select payment method",
  "deposit.selectNetwork": "Select network",
  "deposit.selectNetworkPlaceholder": "Select network",
  "deposit.selectNetworkError": "Please select a network",
  "deposit.depositAddressLabel": "Deposit address",
  "deposit.addressLabel": "Address",
  "deposit.copyButton": "Copy",
  "deposit.addressCopied": "Address copied",
  "deposit.amountLabel": "Amount",
  "deposit.proofModalTitle": "Payment confirmation",
  "deposit.proofModalText":
    "Attach a screenshot of your transfer so we can confirm your deposit.",
  "deposit.proofModalHint": "The screenshot should show the amount and transfer status.",
  "deposit.proofFileLabel": "Payment screenshot",
  "deposit.proofUploadButton": "Upload screenshot",
  "deposit.proofUploadedLabel": "Screenshot uploaded",
  "deposit.proofRemoveAria": "Remove screenshot",
  "deposit.proofRequiredError": "Attach a screenshot of your transfer.",
  "deposit.proofSubmitButton": "Submit for review",
  "deposit.detailsLabel": "Deposit details",
  "deposit.youWillGet": "You will get",
  "deposit.submitButton": "Make a deposit",
  "deposit.minAmountError": "Minimum deposit amount is 250 USDT",
  "deposit.pendingSubmittedTitle": "Payment is being processed.",
  "deposit.pendingSubmittedDescription": "Awaiting confirmation.",
  "deposit.failedFallback": "Deposit failed",
  "deposit.paymentMethodCard": "Visa / Mastercard",
  "deposit.paymentMethodBankTransfer": "Bank Transfer",
  "deposit.paymentMethodBitcoin": "Bitcoin",
  "deposit.paymentMethodTether": "Tether (USDT)",
  "deposit.paymentMethodDaysEstimate": "2-5 business days",
  "deposit.paymentMethodHoursEstimate": "Within 24 hours",

  // Withdrawal
  "withdrawal.pageTitle": "Withdrawal",
  "withdrawal.verificationRequiredTitle": "Verification required",
  "withdrawal.verificationRequiredDesc":
    "To withdraw funds, please complete account verification first.",
  "withdrawal.goToVerification": "Go to verification",
  "withdrawal.infoTitle": "Important information",
  "withdrawal.infoProcessingTime": "Withdrawals are processed within 1-3 business days.",
  "withdrawal.infoNetworkCorrect":
    "Make sure all payment details and the network are correct.",
  "withdrawal.infoClosePositions":
    "Make sure that all trading positions are closed before making a withdrawal.",
  "withdrawal.infoNoFee": "There is no fee for withdrawal.",
  "withdrawal.selectPaymentMethod": "Select payment method",
  "withdrawal.detailsLabel": "Withdrawal details",
  "withdrawal.availableLabel": "Available:",
  "withdrawal.youWillGet": "You will get",
  "withdrawal.submitButton": "Request withdrawal",
  "withdrawal.minAmountError": "Minimum withdrawal amount is 50 USDT",
  "withdrawal.selectNetworkError": "Select a network",
  "withdrawal.addressLabel": "Wallet address",
  "withdrawal.addressPlaceholder": "Enter wallet address",
  "withdrawal.addressRequiredError": "Enter wallet address",
  "withdrawal.serverInsufficientBalanceError": "Insufficient available balance",
  "withdrawal.requestPrefix": "Withdrawal request for",
  "withdrawal.requestSuffix": "submitted",
  "withdrawal.failedFallback": "Withdrawal failed",

  // History
  "history.pageTitle": "History",
  "history.filterAll": "All transactions",
  "history.filterDeposits": "Deposits",
  "history.filterWithdrawals": "Withdrawals",
  "history.filterBonuses": "Bonuses",
  "history.filterAdjustments": "Adjustments",
  "history.typeDeposit": "Deposit",
  "history.typeWithdrawal": "Withdrawal",
  "history.typeBonus": "Bonus",
  "history.typeTrade": "Trade",
  "history.typeAdjustment": "Balance Adjustment",
  "history.typeReferralBonus": "Referral bonus",
  "history.typeFirstDepositBonus": "First-deposit bonus",
  "history.columnId": "ID",
  "history.columnType": "Type",
  "history.columnAmount": "Amount",
  "history.columnStatus": "Status",
  "history.columnDate": "Date",
  "history.emptyState": "No transactions found.",
  "history.statusCompleted": "Completed",
  "history.statusPending": "Pending",
  "history.statusFailed": "Failed",

  // Verification
  "verification.pageTitle": "Account verification",
  "verification.pageDescription":
    "To comply with international regulations, please verify your account by uploading the documents below.",
  "verification.uploadDocumentsHeading": "Upload documents",
  "verification.infoTitle": "Required documents",
  "verification.infoIdentityDoc":
    "Identity document (passport, ID card or driver's license).",
  "verification.infoProofOfAddress":
    "Proof of address (utility bill, bank statement or similar).",
  "verification.infoValidDocs": "All documents must be valid and clearly visible.",
  "verification.infoPrivacyPolicy":
    "We process your data in accordance with our Privacy Policy.",
  "verification.identityDocumentLabel": "Identity document",
  "verification.proofOfAddressLabel": "Proof of address",
  // components/shared/document-list.tsx — shared by the user's own
  // /verification page and the Admin Panel's review screen; previously
  // hardcoded in English with no t() calls at all.
  "verification.documentList.empty": "No documents on file.",
  "verification.documentList.open": "Open",
  "verification.documentList.delete": "Delete",
  "verification.documentList.deleteTitle": "Delete document",
  "verification.documentList.deleteConfirm":
    "Are you sure you want to delete this document?",
  "verification.documentList.deleting": "Deleting…",
  // components/shared/document-viewer-modal.tsx — same sharing/hardcoded
  // situation as document-list.tsx above.
  "verification.documentViewer.zoomOut": "Zoom out",
  "verification.documentViewer.zoomIn": "Zoom in",
  "verification.documentViewer.resetZoom": "Reset zoom",
  "verification.documentViewer.cannotPreview": "can't be previewed here.",
  "verification.documentViewer.openInNewTab": "Open in a new tab",
  "verification.missingDocsError": "Please upload both required documents",
  "verification.submitSuccess": "Documents submitted for review",
  "verification.submitFailedFallback": "Submission failed",
  "verification.submitButton": "Submit documents",
  "verification.chooseFile": "Choose file",
  "verification.missingInfoError": "Please fill in all personal information fields",
  "verification.countryLabel": "Country",
  "verification.countryPlaceholder": "e.g. United States",
  "verification.dateOfBirthLabel": "Date of birth",
  "verification.addressLabel": "Address",
  "verification.addressPlaceholder": "Street, city, postal code",
  "verification.personalInfoHeading": "Personal information",
  "verification.documentsHeading": "Documents",
  "verification.fullNameLabel": "Full name",
  "verification.statusVerified": "Verified",
  "verification.statusPending": "Under review",
  "verification.statusRejected": "Rejected",
  "verification.statusUnverified": "Not verified",
  "verification.rejectionReasonLabel": "Reason for rejection",
  "verification.pendingMessage":
    "Your documents are under review. We'll notify you once a decision is made.",
  "verification.rejectedMessage":
    "Your verification was rejected. Please review the reason below, then correct and resubmit your details.",
  "account.verification": "Verification",

  // Wallet
  "wallet.page.title": "Wallet",
  "wallet.page.subtitle": "Manage your assets in one place",
  "wallet.summary.availableBalance": "Available Balance",
  "wallet.summary.lockedInOrders": "In Orders",
  "wallet.summary.assetsValue": "Assets Value",
  "wallet.summary.deposit": "Deposit",
  "wallet.summary.withdraw": "Withdraw",
  "wallet.summary.history": "History",
  "wallet.tabs.myAssets": "My Assets",
  "wallet.tabs.openOrders": "Open Orders",
  "wallet.tabs.history": "History",
  "wallet.assets.headers.asset": "Asset",
  "wallet.assets.headers.amount": "Amount",
  "wallet.assets.headers.priceCostBasis": "Price / Cost basis",
  "wallet.assets.headers.chart": "Chart",
  "wallet.assets.headers.unrealizedPnl": "Unrealized PnL",
  "wallet.assets.loading": "Loading assets…",
  "wallet.assets.empty": "You don't have any assets yet. Buy on Spot to get started.",
  "wallet.assets.costLabel": "Cost:",
  "wallet.assets.openOnTradingAria": "Open on Trading",
  "wallet.orders.headers.pair": "Pair",
  "wallet.orders.loading": "Loading orders…",
  "wallet.orders.empty": "No open orders.",
  "wallet.orders.statusOpen": "Open",
  "wallet.orders.cancelAria": "Cancel order",
  "wallet.orders.cancelSuccess": "Order cancelled",
  "wallet.orders.cancelError": "Failed to cancel order",
  "wallet.history.headers.cryptoPair": "Crypto / Pair",
  "wallet.history.headers.total": "Total",
  "wallet.history.headers.dateTime": "Date / Time",
  "wallet.history.loading": "Loading history…",
  "wallet.history.empty": "No trading history.",
  "wallet.history.statusFilled": "Filled",
  "wallet.table.type": "Type",
  "wallet.table.side": "Side",
  "wallet.table.price": "Price",
  "wallet.table.quantity": "Quantity",
  "wallet.table.status": "Status",
  "wallet.table.typeMarket": "Market",
  "wallet.table.typeLimit": "Limit",
  "wallet.table.sideBuy": "Buy",
  "wallet.table.sideSell": "Sell",

  // Trading
  "trading.page.loadingTerminal": "Loading trading terminal…",
  "trading.watchlist.addFavorite": "Add to favorites",
  "trading.watchlist.removeFavorite": "Remove from favorites",
  "trading.watchlist.selectPair": "Select pair",
  "trading.chart.loading": "Loading chart…",
  "trading.orderPanel.title": "Spot trade",
  "trading.orderPanel.buy": "Buy",
  "trading.orderPanel.sell": "Sell",
  "trading.orderPanel.market": "Market",
  "trading.orderPanel.limit": "Limit",
  "trading.orderPanel.priceLabel": "Price",
  "trading.orderPanel.amountLabel": "Amount",
  "trading.orderPanel.quantityLabel": "Quantity",
  "trading.orderPanel.available": "Available:",
  "trading.orderPanel.total": "Total",
  "trading.orderPanel.sliderBuyAria": "Buy amount as a percent of available",
  "trading.orderPanel.sliderSellAria": "Sell amount as a percent of available",
  "trading.orderPanel.errors.invalidAmount": "Enter a valid amount",
  "trading.orderPanel.errors.amountExceedsAvailable": "Amount exceeds available",
  "trading.orderPanel.errors.insufficientUsdt": "Insufficient USDT",
  "trading.orderPanel.errors.priceRequired": "Enter a price",
  "trading.orderPanel.errors.orderFailed": "Order failed",
  "trading.orderPanel.success.bought": "Bought",
  "trading.orderPanel.success.sold": "Sold",
  "trading.orderPanel.success.limitBuyPlaced": "Limit buy order placed",
  "trading.orderPanel.success.limitSellPlaced": "Limit sell order placed",
  "trading.orders.columnPair": "Pair",
  "trading.orders.columnType": "Type",
  "trading.orders.columnSide": "Side",
  "trading.orders.columnPrice": "Price",
  "trading.orders.columnQuantity": "Quantity",
  "trading.orders.columnStatus": "Status",
  "trading.orders.loading": "Loading orders…",
  "trading.orders.emptyOpen": "No open orders.",
  "trading.orders.emptyHistory": "No order history yet.",
  "trading.orders.statusOpen": "Open",
  "trading.orders.statusFilled": "Filled",
  "trading.orders.statusCancelled": "Cancelled",
  "trading.orders.filledSuffix": "filled",
  "trading.orders.cancelAria": "Cancel order",
  "trading.orders.cancelSuccess": "Order cancelled",
  "trading.orders.cancelError": "Failed to cancel order",
  "trading.orders.cancelConfirmTitle": "Cancel order?",
  "trading.orders.cancelConfirmBodyPrefix": "Are you sure you want to cancel the",
  "trading.orders.cancelConfirmBodySuffix": "order?",
  "trading.orders.cancelConfirmBack": "Back",
  "trading.orders.cancelConfirmConfirm": "Cancel order",
  "trading.orders.openTab": "Open orders",
  "trading.orders.historyTab": "Order history",

  // Marketing — Home
  "marketing.home.hero.badge": "+20% on your first deposit",
  "marketing.home.hero.titleLine1": "Your first deposit —",
  "marketing.home.hero.titlePrefix": "",
  "marketing.home.hero.titleHighlight": "20% bigger",
  "marketing.home.hero.subtitle":
    "Fund your account for the first time and get a bonus. Trade crypto and other assets on a reliable, easy-to-use platform.",
  "marketing.home.hero.primaryCta": "Get +20% bonus",
  "marketing.home.hero.viewMarkets": "View markets",

  "marketing.home.phone.balanceLabel": "Your balance",
  "marketing.home.phone.depositLabel": "First deposit",
  "marketing.home.phone.bonusLabel": "Bonus +20%",
  "marketing.home.phone.totalLabel": "Total",

  "marketing.home.stats.bonus.value": "+20%",
  "marketing.home.stats.bonus.label": "Bonus on your first deposit",
  "marketing.home.stats.assets.value": "100+",
  "marketing.home.stats.assets.label": "Assets available",
  "marketing.home.stats.uptime.value": "24/7",
  "marketing.home.stats.uptime.label": "Platform access, around the clock",
  "marketing.home.stats.referral.value": "up to 100 USDT",
  "marketing.home.stats.referral.label": "Per invited friend",
  "marketing.home.stats.referral.sublabel": "(referral program)",

  "marketing.home.referral.titleLine1": "Invite friends —",
  "marketing.home.referral.titleLine2Prefix": "get ",
  "marketing.home.referral.titleHighlight": "up to 100 USDT",
  "marketing.home.referral.description":
    "Your friend gets +20% on their first deposit, and you get 10% of their deposit amount (up to 100 USDT).",
  "marketing.home.referral.depositLabel": "deposits",
  "marketing.home.referral.receiveLabel": "you get",
  "marketing.home.referral.deposit1Value": "250 USDT",
  "marketing.home.referral.receive1Value": "25 USDT",
  "marketing.home.referral.deposit2Value": "1,000 USDT",
  "marketing.home.referral.receive2Value": "100 USDT",

  "marketing.home.benefits.security.title": "Fund security",
  "marketing.home.benefits.security.description": "Cold wallets and 2FA protection",
  "marketing.home.benefits.instant.title": "Instant operations",
  "marketing.home.benefits.instant.description": "Fast deposits and withdrawals",
  "marketing.home.benefits.fees.title": "Low fees",
  "marketing.home.benefits.fees.description": "Favorable conditions for traders",
  "marketing.home.benefits.support.title": "24/7 support",
  "marketing.home.benefits.support.description": "We're always here to help",

  // Marketing — About
  "marketing.about.hero.titleLine1": "We're building a space",
  "marketing.about.hero.titleLine2": "where crypto becomes",
  "marketing.about.hero.titleHighlight": "simpler.",
  "marketing.about.hero.subtitle":
    "GTX is a modern crypto trading platform built for people who value speed, a clear interface, and control over their digital assets.",
  "marketing.about.hero.primaryCta": "Start trading",

  "marketing.about.stats.assets.value": "100+",
  "marketing.about.stats.assets.label": "Crypto assets",
  "marketing.about.stats.uptime.value": "24/7",
  "marketing.about.stats.uptime.label": "Platform access",
  "marketing.about.stats.currency.value": "USDT",
  "marketing.about.stats.currency.label": "Primary currency",
  "marketing.about.stats.fee.value": "0%",
  "marketing.about.stats.fee.label": "Deposit and withdrawal fee",

  "marketing.about.mission.label": "OUR IDEA",
  "marketing.about.mission.headingLine1": "Trading crypto",
  "marketing.about.mission.headingLine2": "shouldn't be complicated.",
  "marketing.about.mission.paragraph1":
    "We build GTX around one simple idea: you should always understand what's happening with your assets, see the information you need, and have quick access to the tools that matter.",
  "marketing.about.mission.paragraph2":
    "From funding your account to buying, selling, and managing crypto — we aim to make every step clear and easy.",

  "marketing.about.why.title": "Why GTX?",
  "marketing.about.why.subtitle":
    "Everything you need to work with digital assets — in one place.",
  "marketing.about.why.speed.title": "Speed",
  "marketing.about.why.speed.description":
    "Quick access to markets, operations, and core tools without unnecessary steps.",
  "marketing.about.why.simplicity.title": "Simplicity",
  "marketing.about.why.simplicity.description":
    "A clear interface that's easy to navigate regardless of your experience.",
  "marketing.about.why.control.title": "Control",
  "marketing.about.why.control.description":
    "Balance, assets, orders, and operation history are always available in one account.",
  "marketing.about.why.available.title": "24/7",
  "marketing.about.why.available.description":
    "The crypto market never stops — GTX is available around the clock.",

  "marketing.about.platform.headingLine1": "Everything under control.",
  "marketing.about.platform.headingLine2": "In one space.",
  "marketing.about.platform.description":
    "Track your balance, manage assets, and move to trading without juggling dozens of different tools.",
  "marketing.about.platform.availableBalance": "Available balance",
  "marketing.about.platform.inOrders": "In orders",
  "marketing.about.platform.assetsValue": "Assets value",
  "marketing.about.platform.pnl": "Profit / Loss",

  "marketing.about.security.label": "SECURITY",
  "marketing.about.security.headingLine1": "Your assets.",
  "marketing.about.security.headingLine2": "Your control.",
  "marketing.about.security.description":
    "We pay close attention to protecting user accounts and operations.",
  "marketing.about.security.accountProtection.title": "Account protection",
  "marketing.about.security.accountProtection.description":
    "Extra layers of protection for access to your profile.",
  "marketing.about.security.twoFactor.title": "2FA",
  "marketing.about.security.twoFactor.description":
    "Two-factor authentication for extra account security.",
  "marketing.about.security.activityControl.title": "Activity control",
  "marketing.about.security.activityControl.description":
    "Your action and operation history is available right in your account.",

  "marketing.about.values.title": "What matters to us",
  "marketing.about.values.simplicity.title": "Simplicity",
  "marketing.about.values.simplicity.description":
    "Complex tools should still stay clear to the user.",
  "marketing.about.values.speed.title": "Speed",
  "marketing.about.values.speed.description":
    "Fewer unnecessary steps — more time for what actually matters.",
  "marketing.about.values.transparency.title": "Transparency",
  "marketing.about.values.transparency.description":
    "Users should always clearly see their assets, balance, and operations.",

  "marketing.about.finalCta.label": "READY TO START?",
  "marketing.about.finalCta.headingLine1": "Your next step",
  "marketing.about.finalCta.headingLine2": "starts with GTX.",
  "marketing.about.finalCta.description":
    "Create an account and get access to the crypto market in one convenient space.",
  "marketing.about.finalCta.primaryGuest": "Create account",

  // Privacy
  "privacy.seo.title": "Privacy Center | GTX",
  "privacy.seo.description":
    "Learn how GTX handles personal data and what rights you have over your information.",

  "privacy.hero.label": "PRIVACY CENTER",
  "privacy.hero.headingLine1": "Privacy",
  "privacy.hero.headingLine2": "at GTX",
  "privacy.hero.subtitle":
    "We built this page to clearly explain how GTX handles user data, the principles we apply, and the options you have over your own information.",
  "privacy.hero.tagline": "Your data. Your control.",
  "privacy.hero.lastUpdated": "Last updated: August 31, 2026",

  "privacy.principles.title": "GTX privacy principles",
  "privacy.principles.transparency.title": "Transparency",
  "privacy.principles.transparency.description":
    "We aim to clearly explain what data may be processed and what it's used for.",
  "privacy.principles.minimization.title": "Data minimization",
  "privacy.principles.minimization.description":
    "We aim to use only the data that's necessary for the relevant platform features to work.",
  "privacy.principles.accountability.title": "Accountability",
  "privacy.principles.accountability.description":
    "Access to information is limited to relevant roles and used only for defined purposes.",
  "privacy.principles.userRights.title": "User rights",
  "privacy.principles.userRights.description":
    "You can reach out about accessing, correcting, or taking other actions on your data under applicable law.",
  "privacy.principles.dataProtection.title": "Data protection",
  "privacy.principles.dataProtection.description":
    "We apply technical and organizational measures to protect accounts and information from unauthorized access.",

  "privacy.usage.title": "How GTX uses your data",

  "privacy.usage.personalData.title": "What is personal data?",
  "privacy.usage.personalData.paragraph1":
    "Personal data is information that can be directly or indirectly linked to a specific user.",
  "privacy.usage.personalData.paragraph2":
    "At GTX, this can include data you provide when creating an account, completing verification, using deposit and withdrawal features, and other information necessary for the relevant platform features to work.",
  "privacy.usage.personalData.examplesIntro": "For example, this can include:",
  "privacy.usage.personalData.example1": "Name and email address",
  "privacy.usage.personalData.example2": "Data provided during identity verification",
  "privacy.usage.personalData.example3":
    "Information about deposit and withdrawal operations",
  "privacy.usage.personalData.example4":
    "Technical session and device information (e.g. IP address)",

  "privacy.usage.howWeUse.title": "How does GTX use data?",
  "privacy.usage.howWeUse.intro": "We use user data to:",
  "privacy.usage.howWeUse.item1": "Create and maintain your account",
  "privacy.usage.howWeUse.item2": "Authenticate you",
  "privacy.usage.howWeUse.item3": "Verify your identity",
  "privacy.usage.howWeUse.item4": "Process deposits",
  "privacy.usage.howWeUse.item5": "Process withdrawals",
  "privacy.usage.howWeUse.item6": "Perform trading functions",
  "privacy.usage.howWeUse.item7": "Provide user support",
  "privacy.usage.howWeUse.item8": "Protect the platform",
  "privacy.usage.howWeUse.item9": "Prevent abuse",
  "privacy.usage.howWeUse.item10": "Provide the technical operation of the service",

  "privacy.usage.retention.title": "How long can data be kept?",
  "privacy.usage.retention.description":
    "Information may be kept for as long as necessary for the relevant feature to work, to maintain your account, to comply with legal requirements, to ensure security, or to resolve disputes.",

  "privacy.usage.thirdParties.title": "Does GTX share data with third parties?",
  "privacy.usage.thirdParties.description":
    "In some cases, GTX may use third-party technical services to support specific platform features, for example, delivering account and security emails. Personal data is shared only when necessary for the relevant feature or where required by applicable rules.",

  "privacy.usage.cookies.title": "How does GTX use cookies?",
  "privacy.usage.cookies.intro": "Technically necessary cookies may be used to:",
  "privacy.usage.cookies.item1": "Sign in to your account",
  "privacy.usage.cookies.item2": "Maintain your session",
  "privacy.usage.cookies.item3": "Keep platform features working securely",
  "privacy.usage.cookies.item4": "Remember your language preference",

  "privacy.rights.title": "Your rights over personal data",
  "privacy.rights.intro":
    "Depending on applicable law, you may have the following rights:",
  "privacy.rights.access.question": "Right of access",
  "privacy.rights.access.answer":
    "You can reach out to ask what personal data GTX processes about you.",
  "privacy.rights.rectification.question": "Right to rectification",
  "privacy.rights.rectification.answer":
    "You can ask us to correct inaccurate or incomplete information in your account.",
  "privacy.rights.erasure.question": "Right to erasure",
  "privacy.rights.erasure.answer":
    "You can ask us to delete your personal data where this is possible under applicable law and other requirements.",
  "privacy.rights.restriction.question": "Right to restrict processing",
  "privacy.rights.restriction.answer":
    "You can ask us to restrict further processing of your data in certain cases.",
  "privacy.rights.objection.question": "Right to object",
  "privacy.rights.objection.answer":
    "You can object to certain types of processing of your personal data where applicable law provides for it.",
  "privacy.rights.withdrawConsent.question": "Right to withdraw consent",
  "privacy.rights.withdrawConsent.answer":
    "Where processing is based on consent, you can withdraw that consent at any time.",
  "privacy.rights.portability.question": "Right to data portability",
  "privacy.rights.portability.answer":
    "In certain cases, you can ask us to provide your data in a structured format.",

  "privacy.faq.title": "Frequently asked questions",
  "privacy.faq.q1.question": "How do I get information about my data?",
  "privacy.faq.q1.answer":
    "You can reach out to GTX support with a request about your personal data.",
  "privacy.faq.q2.question": "How do I correct my account data?",
  "privacy.faq.q2.answer":
    "Most core details can be updated directly in your account. For anything else, contact support.",
  "privacy.faq.q3.question": "How do I ask for my data to be deleted?",
  "privacy.faq.q3.answer": "Contact GTX support with your request.",
  "privacy.faq.q4.question": "How do I change data submitted during verification?",
  "privacy.faq.q4.answer": "Contact GTX support to change your verification details.",
  "privacy.faq.q5.question": "Where can I learn more about cookies?",
  "privacy.faq.q5.answer":
    'See the "How GTX uses cookies" section on this page for details.',
  "privacy.faq.q6.question": "How do I ask a privacy-related question?",
  "privacy.faq.q6.answer": "Contact GTX support with any privacy-related questions.",

  "privacy.support.title": "Need help?",
  "privacy.support.description":
    "If you have questions about privacy or how your data is used, reach out to GTX support.",
  "privacy.support.primaryCta": "Contact support",
  "privacy.support.secondaryCta": "Go to account",

  // News (minimal — just the small "Market news" block on /analytics;
  // no listing page, no article detail, no filters)
  "news.time.justNow": "Just now",
  "news.time.minutesAgo": "min ago",
  "news.time.hoursAgo": "h ago",
  "news.time.yesterday": "Yesterday",

  // Analytics
  "analytics.seo.title": "Crypto Market Analytics | GTX",
  "analytics.seo.description":
    "Live crypto prices, 24h price moves, market activity, and crypto news on GTX.",
  "analytics.title": "Analytics",
  "analytics.subtitle": "Real-time crypto market data and dynamics",
  "analytics.marketOverview.title": "Market overview",
  "analytics.marketOverview.gainersCarousel": "Top gainers",
  "analytics.marketOverview.losersCarousel": "Top losers",
  "analytics.dynamics.title": "Market dynamics",
  "analytics.dynamics.searchPlaceholder": "Search coin...",
  "analytics.dynamics.period24h": "24h",
  "analytics.dynamics.error": "Couldn't load chart data",
  "analytics.activity.title": "Highest activity",
  "analytics.volume24hLabel": "24h volume",
  "analytics.table.title": "Market",
  "analytics.table.searchPlaceholder": "Search coin...",
  "analytics.table.filterAll": "All",
  "analytics.table.filterGainers": "Gainers",
  "analytics.table.filterLosers": "Losers",
  "analytics.table.columnCoin": "Coin",
  "analytics.table.columnPrice": "Price",
  "analytics.table.column24h": "24h",
  "analytics.table.columnVolume": "24h volume",
  "analytics.table.showMore": "Show more",
  "analytics.news.title": "Market news",

  // Marketing — Contacts / Support
  "marketing.contacts.hero.title": "Support",
  "marketing.contacts.hero.subtitle": "We're here if you need help",

  "marketing.contacts.cards.chat.title": "Live chat",
  "marketing.contacts.cards.chat.description": "Message us right on the site",
  "marketing.contacts.cards.chat.button": "Open chat",

  "marketing.contacts.cards.telegram.title": "Telegram",
  "marketing.contacts.cards.telegram.description": "Contact support on Telegram",
  "marketing.contacts.cards.telegram.button": "Message on Telegram",
  "marketing.contacts.cards.telegram.unavailable": "Not available yet",

  "marketing.contacts.faq.title": "Frequently asked questions",
  "marketing.contacts.faq.deposits.q": "How do deposits and withdrawals work?",
  "marketing.contacts.faq.deposits.a":
    "Submit a deposit or withdrawal request from your Wallet — an admin reviews and approves it, and the funds appear in your balance right after.",
  "marketing.contacts.faq.verification.q": "Why do I need to verify my account?",
  "marketing.contacts.faq.verification.a":
    "Verification confirms your identity so we can enable full account features. Submit your details and documents from the Verification page — most reviews are quick.",
  "marketing.contacts.faq.trading.q": "How does trading work on GTX?",
  "marketing.contacts.faq.trading.a":
    "Place market or limit orders in Spot trading at live prices. Open orders and order history are always visible on the Trading page.",
  "marketing.contacts.faq.bonuses.q": "How do bonuses and the referral program work?",
  "marketing.contacts.faq.bonuses.a":
    "Your first approved deposit earns a bonus automatically. Share your referral code and you'll earn a reward when the person you invited makes their first deposit.",
  "marketing.contacts.faq.security.q": "How is my account secured?",
  "marketing.contacts.faq.security.a":
    "Enable two-factor authentication from Settings for an extra layer of protection, and never share your password or 2FA codes with anyone.",

  "marketing.contacts.email.note": "Or email us at",

  // Support chat widget (/contacts)
  "supportChat.fab.ariaLabel": "Support chat",
  "supportChat.header.title": "GTX Support",
  "supportChat.guest.title": "Log in to chat",
  "supportChat.guest.body": "Support chat is available for signed-in accounts.",
  "supportChat.category.prompt": "What's this about?",
  "supportChat.category.deposit": "Deposit",
  "supportChat.category.withdrawal": "Withdrawal",
  "supportChat.category.trading": "Trading",
  "supportChat.category.verification": "Verification",
  "supportChat.category.bonuses": "Bonuses",
  "supportChat.category.security": "Security",
  "supportChat.category.other": "Other",
  "supportChat.messages.you": "You",
  "supportChat.messages.team": "GTX Support",
  "supportChat.messages.empty": "Send a message and we'll get back to you shortly.",
  "supportChat.messages.closedBanner":
    "This conversation is closed. Send a message if you still need help.",
  "supportChat.input.placeholder": "Type a message…",
  "supportChat.input.send": "Send",
  "supportChat.errors.createFailed": "Couldn't start the conversation. Please try again.",
  "supportChat.errors.sendFailed": "Message not sent. Please try again.",

  // /bonuses
  "marketing.bonuses.hero.heading": "Get more with GTX",
  "marketing.bonuses.hero.subtitle":
    "Claim your first-deposit bonus and invite friends to earn extra rewards.",
  "marketing.bonuses.firstDeposit.badge": "+20%",
  "marketing.bonuses.firstDeposit.title": "More value from your first deposit",
  "marketing.bonuses.firstDeposit.description":
    "Get +20% added to the amount of your first successful deposit.",
  "marketing.bonuses.firstDeposit.examplesLabel": "Examples",
  "marketing.bonuses.firstDeposit.example1From": "250 USDT",
  "marketing.bonuses.firstDeposit.example1To": "+50 USDT",
  "marketing.bonuses.firstDeposit.example2From": "500 USDT",
  "marketing.bonuses.firstDeposit.example2To": "+100 USDT",
  "marketing.bonuses.firstDeposit.example3From": "1000 USDT",
  "marketing.bonuses.firstDeposit.example3To": "+200 USDT",
  "marketing.bonuses.firstDeposit.rule1": "One-time bonus",
  "marketing.bonuses.firstDeposit.rule2": "Only your first confirmed deposit qualifies",
  "marketing.bonuses.firstDeposit.rule3": "Not credited on later deposits",
  "marketing.bonuses.referral.badge": "10%",
  "marketing.bonuses.referral.title": "Invite friends, earn rewards",
  "marketing.bonuses.referral.description":
    "Invite friends to GTX and earn 10% of the amount of their first successful deposit.",
  "marketing.bonuses.referral.maxNote": "Up to 100 USDT per invited user",
  "marketing.bonuses.referral.registrationNote":
    "Registration alone does not create a reward — the invited user must make their first successful deposit.",
  "marketing.bonuses.referral.rule2": "Credited after their first successful deposit",
  "marketing.bonuses.referral.examplesLabel": "Reward examples",
  "marketing.bonuses.referral.example1From": "250 USDT",
  "marketing.bonuses.referral.example1To": "25 USDT",
  "marketing.bonuses.referral.example2From": "500 USDT",
  "marketing.bonuses.referral.example2To": "50 USDT",
  "marketing.bonuses.referral.example3From": "1000 USDT",
  "marketing.bonuses.referral.example3To": "100 USDT",
  "marketing.bonuses.referral.example4From": "2000 USDT",
  "marketing.bonuses.referral.example4To": "100 USDT",
  "marketing.bonuses.referral.maxLabel": "max",
  "marketing.bonuses.personal.title": "Your referral code",
  "marketing.bonuses.personal.explanation":
    "Share this code with a friend. They must enter it during registration.",
  "marketing.bonuses.personal.copyButton": "Copy code",
  "marketing.bonuses.personal.copiedFeedback": "Copied",
  "marketing.bonuses.guestCta.title": "Log in to see your referral code",
  "marketing.bonuses.guestCta.description":
    "Create an account or log in to invite friends and track your bonuses.",
  "marketing.bonuses.guestCta.registerButton": "Create account",
  "marketing.bonuses.guestCta.loginButton": "Log in",
  "marketing.bonuses.stats.invited": "Friends invited",
  "marketing.bonuses.stats.activated": "Activated the bonus",
  "marketing.bonuses.stats.earned": "Referral bonuses earned",
  "marketing.bonuses.howItWorks.title": "How the referral program works",
  "marketing.bonuses.howItWorks.step1Title": "Share your code",
  "marketing.bonuses.howItWorks.step1Description": "Send your referral code to a friend.",
  "marketing.bonuses.howItWorks.step2Title": "Your friend registers",
  "marketing.bonuses.howItWorks.step2Description":
    "They enter your code during registration.",
  "marketing.bonuses.howItWorks.step3Title": "Your friend deposits",
  "marketing.bonuses.howItWorks.step3Description":
    "After their first successful deposit you receive 10% of it, up to 100 USDT.",
  "marketing.bonuses.faq.title": "Frequently asked questions",
  "marketing.bonuses.faq.q1": "When do I get the +20% bonus?",
  "marketing.bonuses.faq.a1": "After your first successful deposit is confirmed.",
  "marketing.bonuses.faq.q2": "Do I get +20% on my second deposit?",
  "marketing.bonuses.faq.a2":
    "No. The bonus is credited only once — on your first successful deposit.",
  "marketing.bonuses.faq.q3": "When is the referral bonus credited?",
  "marketing.bonuses.faq.a3":
    "After the user you invited makes their first successful deposit.",
  "marketing.bonuses.faq.q4": "Do I get a bonus just for a friend registering?",
  "marketing.bonuses.faq.a4":
    "No. Registration alone isn't enough. The invited user must make their first successful deposit.",
  "marketing.bonuses.faq.q5": "How much can I earn per friend?",
  "marketing.bonuses.faq.a5": "10% of their first successful deposit, up to 100 USDT.",
  "marketing.bonuses.faq.q6": "What if my friend's first deposit request was rejected?",
  "marketing.bonuses.faq.a6":
    "A rejected deposit does not activate the referral bonus. Only the first deposit that was successfully confirmed counts.",
  "marketing.bonuses.faq.q7":
    "Do I get 10% from every deposit my friend makes after that?",
  "marketing.bonuses.faq.a7":
    "No. The referral bonus is credited once — from the invited user's first successful deposit.",
  "marketing.bonuses.faq.q8":
    "Can the first-deposit bonus and the referral bonus trigger at the same time?",
  "marketing.bonuses.faq.a8":
    "Yes. The invited user can receive their own +20% bonus, while the user who invited them receives their referral bonus.",

  "marketing.footer.platform": "Platform",
  "marketing.footer.company": "Company",
  "marketing.footer.legal": "Legal",
  "marketing.footer.privacyPolicy": "Privacy Policy",
  "marketing.footer.termsOfService": "Terms of Service",
  "marketing.footer.description":
    "GTX is a paper-trading education platform. All balances are virtual and all trades are simulated — no real funds are ever at risk.",
  "marketing.footer.copyright":
    "GTX. Virtual trading simulator for educational purposes only.",
  "marketing.footer.rightsReserved": "All rights reserved",

  // Auth
  "auth.emailLabel": "E-mail",
  "auth.passwordLabel": "Password",
  "auth.login.title": "Welcome back",
  "auth.login.noAccountPrompt": "Don't have an account?",
  "auth.login.loginFailed": "Login failed",
  "auth.login.welcomeToast": "Welcome back!",
  "auth.login.twoFactorTitle": "Two-factor verification",
  "auth.login.twoFactorPrompt": "Enter the 6-digit code from your authenticator app.",
  "auth.login.codeLabel": "Verification code",
  "auth.login.verifyButton": "Verify",
  "auth.login.backToLogin": "Back to login",
  "auth.login.invalidCode": "Invalid verification code",
  "auth.register.title": "Create an account",
  "auth.register.haveAccountPrompt": "Already have an account?",
  "auth.register.firstNameLabel": "First name",
  "auth.register.lastNameLabel": "Last name",
  "auth.register.registrationFailed": "Registration failed",
  "auth.register.successToast": "Account created — welcome to GTX!",
  "auth.register.agreeToTermsPrefix": "I agree to the",
  "auth.register.privacyPolicy": "Privacy Policy",
  "auth.register.submitButton": "Sign up",
  "auth.register.referralCodeLabel": "Referral code",
  "auth.register.referralCodePlaceholder": "Enter referral code",
  "auth.register.invalidReferralCode": "Invalid referral code",
  "auth.login.forgotPasswordLink": "Forgot password?",
  "auth.forgotPassword.title": "Reset your password",
  "auth.forgotPassword.description":
    "Enter your email and we'll send you a link to reset your password.",
  "auth.forgotPassword.submitButton": "Send reset link",
  "auth.forgotPassword.successMessage":
    "If an account exists for that email, we've sent a password reset link.",
  "auth.forgotPassword.backToLogin": "Back to login",
  "auth.forgotPassword.failedFallback": "Something went wrong. Please try again.",
  "auth.resetPassword.title": "Set a new password",
  "auth.resetPassword.newPasswordLabel": "New password",
  "auth.resetPassword.confirmPasswordLabel": "Confirm password",
  "auth.resetPassword.submitButton": "Reset password",
  "auth.resetPassword.successMessage":
    "Your password has been reset. You can now log in with your new password.",
  "auth.resetPassword.goToLogin": "Go to login",
  "auth.resetPassword.invalidTokenMessage": "This reset link is invalid or has expired.",
  "auth.resetPassword.requestNewLink": "Request a new link",
  "auth.resetPassword.failedFallback": "Something went wrong. Please try again.",
  "auth.resetPassword.missingTokenMessage": "This link is missing a reset token.",

  // Markets
  "markets.title": "Markets",
  "markets.subtitle": "Live prices and trading pairs",
  "markets.tabs.all": "All Cryptocurrencies",
  "markets.tabs.favorites": "Favorites",
  "markets.tabs.popular": "Popular",
  "markets.tabs.gainers": "Top Gainers",
  "markets.tabs.losers": "Top Losers",
  // Short labels for the mobile pill/chip tab bar (see MarketsClient) —
  // the long desktop labels above ("Top Gainers", "All Cryptocurrencies")
  // don't fit as compact chips on a 320-440px screen.
  "markets.tabs.allShort": "All",
  "markets.tabs.popularShort": "Popular",
  "markets.tabs.gainersShort": "Gainers",
  "markets.tabs.losersShort": "Losers",
  "markets.tabs.volume": "Top Volume",
  "markets.tabs.movers": "Biggest Movers",
  "markets.emptyFavorites": "You don't have any favorite cryptocurrencies yet",
  "markets.columns.rank": "№",
  "markets.columns.name": "Coin",
  "markets.columns.price": "Price",
  "markets.columns.change24h": "24h Change",
  "markets.columns.volume24h": "24h Volume",
  "markets.columns.chart": "Chart",
  "markets.favorites.add": "Add to favorites",
  "markets.favorites.remove": "Remove from favorites",
  "markets.pagination.pageLabel": "Page",
  "markets.pagination.of": "of",
  "markets.pagination.assets": "assets",
  "markets.pagination.prev": "Prev",
  "markets.pagination.next": "Next",

  // Transactional email (lib/email/templates.ts) — server-rendered using
  // the recipient's saved UserSettings.language, not the request locale.
  "email.passwordChanged.subject": "Security alert: Your password was changed",
  "email.passwordChanged.heading": "Your password was changed",
  "email.passwordChanged.body": "Your GTX account password was changed on {date}.",
  "email.passwordChanged.notYouNotice":
    "If you didn't make this change, please contact support immediately.",
  "email.emailChangeConfirm.subject": "Confirm your new GTX email address",
  "email.emailChangeConfirm.heading": "Confirm your new email address",
  "email.emailChangeConfirm.body":
    "We received a request to change the email address on your GTX account to this one. Click the link below to confirm it.",
  "email.emailChangeConfirm.button": "Confirm new email",
  "email.emailChangeConfirm.expiryNotice":
    "This link expires in 1 hour. If you didn't request this change, you can safely ignore this email.",
  "email.passwordResetRequest.subject": "Reset your GTX password",
  "email.passwordResetRequest.heading": "Reset your password",
  "email.passwordResetRequest.body":
    "We received a request to reset the password on your GTX account. Click the button below to choose a new password.",
  "email.passwordResetRequest.button": "Reset password",
  "email.passwordResetRequest.expiryNotice": "This link expires in 30 minutes.",
  "email.passwordResetRequest.notYouNotice":
    "If you didn't request this, you can safely ignore this email — your password will not be changed.",
  "email.emailChanged.subject": "Your GTX account email was changed",
  "email.emailChanged.heading": "Your account email was changed",
  "email.emailChanged.body":
    "Your GTX account email was changed to {newEmail} on {date}.",
  "email.emailChanged.notYouNotice":
    "If you didn't make this change, please contact support immediately.",

  "email.balanceAdjusted.subject": "Your GTX balance was updated",
  "email.balanceAdjusted.headingCredit": "Balance credited",
  "email.balanceAdjusted.headingDebit": "Balance adjusted",
  "email.balanceAdjusted.bodyCredit":
    "Your {asset} balance has been credited by {amount} {asset}.",
  "email.balanceAdjusted.bodyDebit":
    "Your {asset} balance has been debited by {amount} {asset}.",
  "email.balanceAdjusted.footer":
    "If you have questions about this change, please contact support.",
} as const;
