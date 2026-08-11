-- Defense-in-depth: guarantee at the database level that a wallet balance
-- can never go negative, regardless of which code path writes to it.
--
-- The application-level fix is the atomic conditional UPDATE ... WHERE
-- balance >= amount pattern used in app/api/withdraw, app/api/orders and
-- server/ws/index.ts (see feature/ledger-atomicity), which is what
-- actually prevents concurrent requests from overdrawing the balance.
-- This constraint is the last line of defense against any other write
-- path (a future bug, a manual admin query, a script) doing a plain
-- decrement without that guard.
ALTER TABLE "Wallet"
  ADD CONSTRAINT "wallet_balance_nonnegative" CHECK ("balance" >= 0);
