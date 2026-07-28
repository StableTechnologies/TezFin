import {
  ArrowSquareOut,
  CaretDown,
  CaretRight,
  CheckCircle,
  Copy,
  List,
  ShieldCheck,
  WarningCircle,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateTotals, scenarios } from "./fixtures";
import type {
  AssetId,
  MarketFixture,
  OperationStep,
  ScenarioId,
  TransactionAction,
  TransactionDraft,
} from "./types";

const scenarioOrder: ScenarioId[] = [
  "disconnected",
  "fresh",
  "supplying",
  "active",
  "near-liquidation",
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 1 ? 6 : value < 100 ? 4 : 2,
  }).format(value);
}

function riskBand(percent: number): "normal" | "attention" | "high" | "critical" {
  if (percent >= 95) return "critical";
  if (percent >= 85) return "high";
  if (percent >= 70) return "attention";
  return "normal";
}

function initialScenario(): ScenarioId {
  const value = new URLSearchParams(window.location.search).get("state") as ScenarioId | null;
  return value && scenarioOrder.includes(value) ? value : "near-liquidation";
}

function operationSteps(action: TransactionAction, market: MarketFixture): OperationStep[] {
  const fToken = `f${market.name}`;
  const accrue: OperationStep = {
    label: "Accrue interest",
    detail: "Refresh all 5 configured TezFin markets",
  };
  const liquidity: OperationStep = {
    label: "Refresh account liquidity",
    detail: "Comptroller · updateAccountLiquidityWithView",
  };

  if (action === "Supply" || action === "Repay") {
    const steps: OperationStep[] = [accrue];

    if (market.standard === "FA1.2") {
      steps.push(
        { label: "Reset allowance", detail: `${market.name} · approve 0` },
        { label: "Grant exact allowance", detail: `${market.name} → ${fToken}` },
      );
    }

    if (market.standard === "FA1.2 packed") {
      steps.push({
        label: "Permission path blocked",
        detail: "Packed FA1.2 approval requires contract verification",
      });
    }

    if (market.standard === "FA2") {
      steps.push({
        label: "Add temporary operator",
        detail: `${market.name} → ${fToken}`,
      });
    }

    steps.push({
      label: action === "Supply" ? "Supply asset" : "Repay debt",
      detail: `${fToken} · ${action === "Supply" ? "mint" : "repayBorrow"}`,
    });

    if (market.standard === "FA2") {
      steps.push({
        label: "Remove temporary operator",
        detail: `${market.name} → ${fToken}`,
      });
    }

    return steps;
  }

  if (action === "Withdraw") {
    return [
      liquidity,
      { label: "Withdraw supplied asset", detail: `${fToken} · redeem` },
    ];
  }

  if (action === "Borrow") {
    return [
      liquidity,
      { label: "Borrow asset", detail: `${fToken} · borrow` },
    ];
  }

  return [
    liquidity,
    {
      label: action,
      detail: `Comptroller · ${action === "Enable collateral" ? "enterMarkets" : "exitMarket"}`,
    },
  ];
}

function actionSide(action: TransactionAction): "supply" | "borrow" | "collateral" {
  if (action === "Supply" || action === "Withdraw") return "supply";
  if (action === "Borrow" || action === "Repay") return "borrow";
  return "collateral";
}

function AssetIdentity({ market, fToken = false }: { market: MarketFixture; fToken?: boolean }) {
  return (
    <div className="asset-identity">
      <img src={fToken ? market.fTokenIcon : market.icon} alt="" />
      <span>
        <strong>{market.name}</strong>
        <small>{fToken ? `f${market.name} · ${currency.format(market.price)}` : `${market.subtitle} · ${currency.format(market.price)}`}</small>
      </span>
    </div>
  );
}

function RiskMeter({ percent, compact = false }: { percent: number; compact?: boolean }) {
  const shown = Math.min(Math.max(percent, 0), 100);
  const band = riskBand(percent);

  return (
    <div className={`risk-meter risk-meter--${band} ${compact ? "risk-meter--compact" : ""}`}>
      <div className="risk-meter__track" aria-hidden="true">
        <span className="risk-meter__zone risk-meter__zone--safe" />
        <span className="risk-meter__zone risk-meter__zone--attention" />
        <span className="risk-meter__zone risk-meter__zone--high" />
        <span className="risk-meter__zone risk-meter__zone--critical" />
        <span className="risk-meter__mask" style={{ left: `${shown}%` }} />
        <span className="risk-meter__marker" style={{ left: `${shown}%` }} />
      </div>
    </div>
  );
}

function PositionPassbook({
  scenario,
  markets,
  onRepay,
  onAddCollateral,
}: {
  scenario: ScenarioId;
  markets: MarketFixture[];
  onRepay: () => void;
  onAddCollateral: () => void;
}) {
  const fixture = scenarios[scenario];
  const totals = calculateTotals(markets);
  const band = riskBand(totals.limitUsedPercent);
  const suppliedMarkets = markets.filter((market) => market.supplied > 0).length;
  const borrowedMarkets = markets.filter((market) => market.borrowed > 0).length;

  if (!fixture.connected) {
    return (
      <section className="passbook passbook--disconnected" aria-labelledby="position-title">
        <img className="passbook__ornament" src="/assets/guilloche-source.svg" alt="" />
        <div className="passbook__empty-copy">
          <p className="eyebrow">Your position</p>
          <h1 id="position-title">Your TezFin passbook</h1>
          <p>Connect a Tezos wallet to see supplied assets, open borrows, and liquidation headroom in one place.</p>
          <button className="primary-action" type="button" onClick={() => window.dispatchEvent(new CustomEvent("tezfin-preview-connect"))}>
            <Wallet size={18} weight="bold" /> Connect wallet
          </button>
          <span className="fixture-note"><ShieldCheck size={15} /> Offline preview — wallet access is disabled</span>
        </div>
      </section>
    );
  }

  return (
    <>
      {band === "critical" && (
        <section className="risk-alert" role="alert">
          <span className="risk-alert__icon"><WarningCircle size={22} weight="fill" /></span>
          <span className="risk-alert__copy">
            <strong>Your position is close to liquidation</strong>
            <small>Only {currency.format(totals.headroomUsd)} of borrowing headroom remains in this preview.</small>
          </span>
          <span className="risk-alert__actions">
            <button type="button" onClick={onRepay}>{borrowedMarkets > 1 ? "Choose debt to repay" : "Repay"}</button>
            <button type="button" onClick={onAddCollateral}>Add collateral</button>
          </span>
        </section>
      )}

      <section className="passbook" aria-labelledby="position-title">
        <img className="passbook__ornament" src="/assets/guilloche-source.svg" alt="" />
        <div className="passbook__grid">
          <div className="passbook-stat">
            <p className="passbook-label"><i className="dot dot--supply" /> Supplied</p>
            <p className="passbook-value">{currency.format(totals.suppliedUsd)}</p>
            <p className="passbook-sub">across {suppliedMarkets} market{suppliedMarkets === 1 ? "" : "s"}</p>
          </div>
          <div className="passbook-net">
            <p className="passbook-label">Estimated net rate</p>
            <h1 id="position-title">{totals.estimatedNetRate >= 0 ? "+" : "−"}{Math.abs(totals.estimatedNetRate).toFixed(2)}%</h1>
            <p className="passbook-sub">variable · fixture calculation</p>
          </div>
          <div className="passbook-stat passbook-stat--right">
            <p className="passbook-label"><i className="dot dot--borrow" /> Borrowed</p>
            <p className="passbook-value">{currency.format(totals.borrowedUsd)}</p>
            <p className="passbook-sub">{borrowedMarkets === 0 ? "no open lines" : `${borrowedMarkets} open line${borrowedMarkets === 1 ? "" : "s"}`}</p>
          </div>
        </div>

        <div className="passbook__risk">
          <div className="risk-head">
            <span>Borrow limit used <b>{totals.limitUsedPercent.toFixed(1)}%</b></span>
            <span className={band === "critical" ? "danger-text" : ""}>{totals.borrowLimitUsd > 0 ? `${currency.format(totals.headroomUsd)} headroom` : "Supply collateral to unlock borrowing"}</span>
          </div>
          <RiskMeter percent={totals.limitUsedPercent} />
          <div className="risk-foot">
            <span>Collateral {currency.format(totals.collateralUsd)}</span>
            <span>Borrow limit {currency.format(totals.borrowLimitUsd)}</span>
          </div>
        </div>
      </section>
    </>
  );
}

type BoardKind = "supplying" | "borrowing" | "supply-market" | "borrow-market";

function MarketBoard({
  kind,
  markets,
  connected,
  onOpen,
  onCollateral,
}: {
  kind: BoardKind;
  markets: MarketFixture[];
  connected: boolean;
  onOpen: (market: MarketFixture, action: TransactionAction) => void;
  onCollateral: (market: MarketFixture) => void;
}) {
  const isSupply = kind === "supplying" || kind === "supply-market";
  const isPosition = kind === "supplying" || kind === "borrowing";
  const title = {
    supplying: "Supplying",
    borrowing: "Borrowing",
    "supply-market": "Assets to Supply",
    "borrow-market": "Assets to Borrow",
  }[kind];
  const action: TransactionAction = {
    supplying: "Withdraw",
    borrowing: "Repay",
    "supply-market": "Supply",
    "borrow-market": "Borrow",
  }[kind] as TransactionAction;
  const boardMarkets = kind === "supplying"
    ? markets.filter((market) => market.supplied > 0)
    : kind === "borrowing"
      ? markets.filter((market) => market.borrowed > 0)
      : markets;
  const total = boardMarkets.reduce((sum, market) => {
    const amount = kind === "borrowing" ? market.borrowed : kind === "supplying" ? market.supplied : 0;
    return sum + amount * market.price;
  }, 0);

  return (
    <section className={`market-board market-board--${isSupply ? "supply" : "borrow"}`} aria-label={title}>
      <header className="market-board__header">
        <h2>{title}</h2>
        {isPosition && <span>{boardMarkets.length} asset{boardMarkets.length === 1 ? "" : "s"} <b>{currency.format(total)}</b></span>}
      </header>

      {boardMarkets.length === 0 ? (
        <div className="market-board__empty">
          {kind === "supplying"
            ? "Nothing supplied yet — choose an asset below to preview a deposit."
            : "No open lines — borrowing stays empty until collateral is supplied."}
        </div>
      ) : (
        <div className="market-board__rows">
          <div className={`market-row market-row--head market-row--${kind}`} aria-hidden="true">
            <span>Asset</span>
            <span>{isPosition ? "APY" : kind === "supply-market" ? "Wallet" : "Available"}</span>
            <span>{isPosition ? "Balance" : "APY"}</span>
            {kind === "supplying" && <span>Collateral</span>}
            <span />
          </div>
          {boardMarkets.map((market) => {
            const balance = kind === "supplying" ? market.supplied : market.borrowed;
            const disabled = !connected && !isPosition;

            return (
              <div className={`market-row market-row--${kind}`} key={market.id}>
                <AssetIdentity market={market} fToken={kind === "supplying"} />
                {isPosition ? (
                  <div className="rate-cell" data-label="APY">
                    {(isSupply ? market.supplyApy : market.borrowApy).toFixed(2)}%
                  </div>
                ) : (
                  <div className="amount-cell" data-label={kind === "supply-market" ? "Wallet" : "Available"}>
                    <strong>{kind === "supply-market" ? formatAmount(market.walletBalance) : compactCurrency.format(market.liquidityUsd)}</strong>
                    {kind === "supply-market" && <small>{currency.format(market.walletBalance * market.price)}</small>}
                  </div>
                )}
                {isPosition ? (
                  <div className="amount-cell" data-label="Balance">
                    <strong>{formatAmount(balance)} <em>{market.name}</em></strong>
                    <small>{currency.format(balance * market.price)}</small>
                  </div>
                ) : (
                  <div className="rate-cell" data-label="APY">
                    {(isSupply ? market.supplyApy : market.borrowApy).toFixed(2)}%
                  </div>
                )}
                {kind === "supplying" && (
                  <label className="collateral-control">
                    <span>Collateral</span>
                    <input
                      type="checkbox"
                      checked={market.collateral}
                      onChange={() => onCollateral(market)}
                      aria-label={`${market.name} collateral ${market.collateral ? "enabled" : "disabled"}`}
                    />
                    <i aria-hidden="true" />
                  </label>
                )}
                <button
                  className={`row-action ${!isPosition ? "row-action--fill" : ""}`}
                  type="button"
                  disabled={disabled}
                  title={disabled ? "Connect a wallet in the future production interface" : undefined}
                  onClick={() => onOpen(market, action)}
                >
                  {action}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DebtChooserDialog({
  markets,
  onClose,
  onSelect,
}: {
  markets: MarketFixture[];
  onClose: () => void;
  onSelect: (market: MarketFixture) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const totals = calculateTotals(markets);
  const borrowedMarkets = markets
    .filter((market) => market.borrowed > 0)
    .sort((left, right) => (right.borrowed * right.price) - (left.borrowed * left.price));

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="transaction-dialog debt-chooser" role="dialog" aria-modal="true" aria-labelledby="debt-chooser-title">
        <header className="transaction-dialog__header debt-chooser__header">
          <span className="debt-chooser__icon"><List size={21} weight="bold" /></span>
          <span>
            <h2 id="debt-chooser-title">Choose debt to repay</h2>
            <small>{borrowedMarkets.length} borrowed assets · {currency.format(totals.borrowedUsd)} total</small>
          </span>
          <button ref={closeButtonRef} className="icon-button" type="button" aria-label="Close debt chooser" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <div className="offline-callout"><ShieldCheck size={17} weight="fill" /> Select one debt for a token-specific operation review</div>
        <p className="debt-chooser__intro">Liquidation risk is account-wide. Choose the asset you actually hold and want to repay; TezFin will not select or batch debts automatically.</p>

        <div className="debt-choice-list">
          {borrowedMarkets.map((market) => {
            const borrowedUsd = market.borrowed * market.price;
            const maxRepay = Math.min(market.walletBalance, market.borrowed);
            const maxRepayUsd = maxRepay * market.price;
            const headroomAfterMax = totals.headroomUsd + maxRepayUsd;

            return (
              <button className="debt-choice" type="button" key={market.id} onClick={() => onSelect(market)}>
                <div className="debt-choice__asset">
                  <AssetIdentity market={market} />
                  <small>{market.borrowApy.toFixed(2)}% variable borrow APY</small>
                </div>
                <div className="debt-choice__metrics">
                  <span>
                    <small>Debt</small>
                    <b>{formatAmount(market.borrowed)} {market.name}</b>
                    <em>{currency.format(borrowedUsd)}</em>
                  </span>
                  <span>
                    <small>Wallet available</small>
                    <b>{formatAmount(market.walletBalance)} {market.name}</b>
                    <em>{currency.format(headroomAfterMax)} headroom after max</em>
                  </span>
                </div>
                <CaretRight className="debt-choice__caret" size={19} weight="bold" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TransactionDialog({
  draft,
  markets,
  onClose,
  onFixtureConfirm,
}: {
  draft: TransactionDraft;
  markets: MarketFixture[];
  onClose: () => void;
  onFixtureConfirm: (draft: TransactionDraft, amount: number) => void;
}) {
  const market = markets.find((candidate) => candidate.id === draft.marketId);
  const [amount, setAmount] = useState("");
  const [activeAction, setActiveAction] = useState<TransactionAction>(draft.action);
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmed) onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [confirmed, onClose]);

  if (!market) return null;

  const totals = calculateTotals(markets);
  const parsedAmount = Number.parseFloat(amount) || 0;
  const valueUsd = parsedAmount * market.price;
  const side = actionSide(activeAction);
  const requiresAmount = side !== "collateral";
  const maxAmount = activeAction === "Supply"
    ? market.walletBalance
    : activeAction === "Withdraw"
      ? market.supplied
      : activeAction === "Repay"
        ? Math.min(market.walletBalance, market.borrowed)
        : Math.max((totals.borrowLimitUsd * 0.8 - totals.borrowedUsd) / market.price, 0);
  let nextBorrowed = totals.borrowedUsd;
  let nextLimit = totals.borrowLimitUsd;

  if (activeAction === "Borrow") nextBorrowed += valueUsd;
  if (activeAction === "Repay") nextBorrowed = Math.max(nextBorrowed - valueUsd, 0);
  if (activeAction === "Supply" && market.collateral) nextLimit += valueUsd * market.collateralFactor;
  if (activeAction === "Withdraw" && market.collateral) nextLimit = Math.max(nextLimit - valueUsd * market.collateralFactor, 0);
  if (activeAction === "Enable collateral") nextLimit += market.supplied * market.price * market.collateralFactor;
  if (activeAction === "Disable collateral") nextLimit = Math.max(nextLimit - market.supplied * market.price * market.collateralFactor, 0);

  const nextUsed = nextLimit > 0 ? (nextBorrowed / nextLimit) * 100 : 0;
  const steps = operationSteps(activeAction, market);
  const invalidPackedPermission = market.standard === "FA1.2 packed" && (activeAction === "Supply" || activeAction === "Repay");
  const invalidAmount = requiresAmount && (parsedAmount <= 0 || parsedAmount > maxAmount || nextUsed > 100);
  const canReview = !invalidAmount && !invalidPackedPermission;

  const context = activeAction === "Supply"
    ? `Wallet ${formatAmount(market.walletBalance)}`
    : activeAction === "Withdraw"
      ? `Supplied ${formatAmount(market.supplied)}`
      : activeAction === "Borrow"
        ? `Liquidity ${compactCurrency.format(market.liquidityUsd)}`
        : activeAction === "Repay"
          ? `Borrowed ${formatAmount(market.borrowed)}`
          : `${market.collateral ? "Currently used" : "Not currently used"} as collateral`;
  const actionTabs: TransactionAction[] = side === "supply" ? ["Supply", "Withdraw"] : ["Borrow", "Repay"];

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="transaction-dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <header className="transaction-dialog__header">
          <img src={market.icon} alt="" />
          <span>
            <h2 id="transaction-title">{activeAction} {market.name}</h2>
            <small>{context}</small>
          </span>
          <button ref={closeButtonRef} className="icon-button" type="button" aria-label="Close transaction preview" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        {confirmed ? (
          <div className="fixture-success" role="status">
            <CheckCircle size={46} weight="fill" />
            <h3>Fixture confirmed</h3>
            <p>The local preview state changed. No wallet opened and no operation was created or submitted.</p>
            <button className="dialog-primary" type="button" onClick={onClose}>Return to dashboard</button>
          </div>
        ) : (
          <>
            {side !== "collateral" && (
              <div className="transaction-tabs" aria-label={`${side} actions`}>
                {actionTabs.map((action) => (
                  <button
                    key={action}
                    className={activeAction === action ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setActiveAction(action);
                      setAmount("");
                      setReviewing(false);
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            <div className="offline-callout"><ShieldCheck size={17} weight="fill" /> Offline fixture — wallet and RPC access are disabled</div>

            {requiresAmount && !reviewing && (
              <>
                <label className="amount-input">
                  <span className="sr-only">Amount in {market.name}</span>
                  <input
                    inputMode="decimal"
                    value={amount}
                    placeholder="0.00"
                    autoFocus
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  />
                  <b>{market.name}</b>
                  <button
                    type="button"
                    title={activeAction === "Borrow" ? "Uses the preview's 80% safety target" : undefined}
                    onClick={() => setAmount(String(maxAmount))}
                  >
                    {activeAction === "Borrow" ? "Safe max" : "Max"}
                  </button>
                </label>
                <p className="amount-usd">≈ {currency.format(valueUsd)}</p>
              </>
            )}

            <div className="transaction-lines">
              {side !== "collateral" && (
                <div><span>{side === "supply" ? "Supply APY" : "Borrow APY"}</span><b>{(side === "supply" ? market.supplyApy : market.borrowApy).toFixed(2)}% <small>variable</small></b></div>
              )}
              <div><span>Borrow limit after</span><b>{currency.format(nextLimit)}</b></div>
              <div><span>Headroom after</span><b>{currency.format(Math.max(nextLimit - nextBorrowed, 0))}</b></div>
              <div><span>Limit used after</span><b className={nextUsed >= 95 ? "danger-text" : ""}>{nextUsed.toFixed(1)}%</b></div>
            </div>
            <RiskMeter percent={nextUsed} compact />

            {(reviewing || side === "collateral") && (
              <div className="operation-review">
                <div className="operation-review__heading">
                  <span><List size={17} /> Operation preview</span>
                  <b>{steps.length} step{steps.length === 1 ? "" : "s"}</b>
                </div>
                <ol>
                  {steps.map((step, index) => (
                    <li key={`${step.label}-${index}`}>
                      <i>{index + 1}</i>
                      <span><strong>{step.label}</strong><small>{step.detail}</small></span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {invalidPackedPermission && (
              <p className="dialog-error" role="alert"><WarningCircle size={17} /> Packed FA1.2 permission handling is intentionally blocked until its contract path is verified.</p>
            )}
            {!invalidPackedPermission && requiresAmount && parsedAmount > maxAmount && (
              <p className="dialog-error" role="alert"><WarningCircle size={17} /> Amount exceeds the fixture maximum of {formatAmount(maxAmount)} {market.name}.</p>
            )}

            {!reviewing && side !== "collateral" ? (
              <button className="dialog-primary" type="button" disabled={!canReview} onClick={() => setReviewing(true)}>
                {parsedAmount > 0 ? `Review ${activeAction.toLowerCase()}` : "Enter an amount"}
              </button>
            ) : (
              <button
                className="dialog-primary"
                type="button"
                disabled={!canReview}
                onClick={() => {
                  onFixtureConfirm({ ...draft, action: activeAction }, parsedAmount);
                  setConfirmed(true);
                }}
              >
                Simulate fixture confirmation
              </button>
            )}

          </>
        )}
      </section>
    </div>
  );
}

export function App() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const [markets, setMarkets] = useState<MarketFixture[]>(() => scenarios[initialScenario()].markets.map((market) => ({ ...market })));
  const [draft, setDraft] = useState<TransactionDraft | null>(null);
  const [debtChooserOpen, setDebtChooserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const previewParams = new URLSearchParams(window.location.search);
  const cleanPreview = previewParams.get("clean") === "1";
  const forceMobilePreview = previewParams.get("mobile") === "1";
  const scenario = scenarios[scenarioId];

  useEffect(() => {
    setMarkets(scenarios[scenarioId].markets.map((market) => ({ ...market })));
    setDraft(null);
    setDebtChooserOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("state", scenarioId);
    window.history.replaceState({}, "", url);
  }, [scenarioId]);

  useEffect(() => {
    const previewConnect = () => setToast("Wallet access is disabled in this offline design preview.");
    window.addEventListener("tezfin-preview-connect", previewConnect);
    return () => window.removeEventListener("tezfin-preview-connect", previewConnect);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const borrowedMarkets = useMemo(
    () => markets.filter((market) => market.borrowed > 0),
    [markets],
  );
  const addCollateralMarket = useMemo(
    () => markets.find((market) => market.walletBalance > 0 && market.collateral) ?? markets.find((market) => market.walletBalance > 0) ?? markets[0],
    [markets],
  );

  const openTransaction = (market: MarketFixture, action: TransactionAction) => {
    setDebtChooserOpen(false);
    setDraft({ marketId: market.id, action });
  };

  const handleGlobalRepay = () => {
    if (borrowedMarkets.length === 1) {
      openTransaction(borrowedMarkets[0], "Repay");
      return;
    }
    if (borrowedMarkets.length > 1) {
      setDebtChooserOpen(true);
      return;
    }
    setToast("No borrowed assets are open in this preview state.");
  };

  const handleCollateral = (market: MarketFixture) => {
    openTransaction(market, market.collateral ? "Disable collateral" : "Enable collateral");
  };

  const applyFixtureTransaction = (currentDraft: TransactionDraft, amount: number) => {
    setMarkets((current) => current.map((market) => {
      if (market.id !== currentDraft.marketId) return market;
      if (currentDraft.action === "Supply") return { ...market, walletBalance: Math.max(market.walletBalance - amount, 0), supplied: market.supplied + amount };
      if (currentDraft.action === "Withdraw") return { ...market, walletBalance: market.walletBalance + amount, supplied: Math.max(market.supplied - amount, 0) };
      if (currentDraft.action === "Borrow") return { ...market, walletBalance: market.walletBalance + amount, borrowed: market.borrowed + amount };
      if (currentDraft.action === "Repay") return { ...market, walletBalance: Math.max(market.walletBalance - amount, 0), borrowed: Math.max(market.borrowed - amount, 0) };
      return { ...market, collateral: currentDraft.action === "Enable collateral" };
    }));
  };

  return (
    <div className={`app-shell ${forceMobilePreview ? "app-shell--mobile" : ""}`}>
      <a className="skip-link" href="#dashboard">
        Skip to content
      </a>
      <header className="topbar">
        <a className="brand" href="#dashboard" aria-label="TezFin dashboard">
          <img src="/assets/tezHeader.svg" alt="TezFin" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#markets" onClick={(event) => { event.preventDefault(); setToast("Markets remains a visual-only link in this preview."); }}>Markets</a>
          <a href="#docs" onClick={(event) => { event.preventDefault(); setToast("Docs remains a visual-only link in this preview."); }}>Docs</a>
        </nav>
        <div className="topbar__actions">
          <span className="network-chip"><i /> Offline preview</span>
          {scenario.connected ? (
            <div className="wallet-menu-wrap">
              <button className="wallet-chip" type="button" aria-expanded={walletMenuOpen} onClick={() => setWalletMenuOpen((open) => !open)}>
                {scenario.address} <CaretDown size={13} />
              </button>
              {walletMenuOpen && (
                <div className="wallet-menu" role="menu">
                  <strong>Fixture account</strong>
                  <span>tz1ZkH8f8M4VGna7EVohFP9j7sQ2rV</span>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText("tz1ZkH8f8M4VGna7EVohFP9j7sQ2rV"); setToast("Fixture address copied."); }}><Copy size={16} /> Copy address</button>
                  <button type="button" onClick={() => setToast("Explorer access is disabled for fixture data.")}><ArrowSquareOut size={16} /> View explorer</button>
                </div>
              )}
            </div>
          ) : (
            <button className="wallet-chip wallet-chip--connect" type="button" onClick={() => setToast("Wallet access is disabled in this offline design preview.")}>
              <Wallet size={16} /> Connect wallet
            </button>
          )}
          <button className="menu-button" type="button" aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X size={21} /> : <List size={21} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#markets" onClick={(event) => event.preventDefault()}>Markets</a>
          <a href="#docs" onClick={(event) => event.preventDefault()}>Docs</a>
        </nav>
      )}

      <main id="dashboard" className="dashboard-shell">
        <PositionPassbook
          scenario={scenarioId}
          markets={markets}
          onRepay={handleGlobalRepay}
          onAddCollateral={() => openTransaction(addCollateralMarket, "Supply")}
        />

        <div className="market-grid" id="markets">
          <MarketBoard kind="supplying" markets={markets} connected={scenario.connected} onOpen={openTransaction} onCollateral={handleCollateral} />
          <MarketBoard kind="borrowing" markets={markets} connected={scenario.connected} onOpen={openTransaction} onCollateral={handleCollateral} />
          <MarketBoard kind="supply-market" markets={markets} connected={scenario.connected} onOpen={openTransaction} onCollateral={handleCollateral} />
          <MarketBoard kind="borrow-market" markets={markets} connected={scenario.connected} onOpen={openTransaction} onCollateral={handleCollateral} />
        </div>

        <footer className="site-footer">
          <span>TezFin fixture preview · block {scenario.block}</span>
          <span>Design only · no wallet · no RPC · no transaction submission</span>
        </footer>
      </main>

      {!cleanPreview && (
        <aside className="preview-switcher" aria-label="Preview state">
          <span>Preview state</span>
          <div>
            {scenarioOrder.map((id) => (
              <button key={id} className={scenarioId === id ? "active" : ""} type="button" onClick={() => setScenarioId(id)}>
                {scenarios[id].label}
              </button>
            ))}
          </div>
        </aside>
      )}

      {draft && (
        <TransactionDialog draft={draft} markets={markets} onClose={() => setDraft(null)} onFixtureConfirm={applyFixtureTransaction} />
      )}

      {debtChooserOpen && (
        <DebtChooserDialog
          markets={markets}
          onClose={() => setDebtChooserOpen(false)}
          onSelect={(market) => openTransaction(market, "Repay")}
        />
      )}

      <div className={`toast ${toast ? "toast--show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
