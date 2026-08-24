import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Coins,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { checkNicknameAvailability } from "../../features/auth/api/authApi";
import { useAuth } from "../../features/auth/model/AuthContext";
import {
  prepareTokenChargeCheckout,
  verifyTokenChargePayment,
} from "../../features/payment/api/paymentApi";
import {
  formatPaymentErrorMessage,
  requestTokenChargePayment,
} from "../../features/payment/lib/portonePayment";
import {
  getMyTokenBalance,
  getMyTokenLedgers,
} from "../../features/token/api/tokenApi";
import { formatUserErrorMessage } from "../../shared/lib/userErrorMessage";

const CHARGE_OPTIONS = [2000, 5000, 10000];
const TOKEN_REFRESH_DELAY_MS = 1200;
const MIN_CHARGE_AMOUNT = 1000;
const MAX_CHARGE_AMOUNT = 1000000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseChargeAmount(value) {
  const onlyDigits = String(value ?? "").replace(/[^\d]/g, "");

  if (!onlyDigits) {
    return 0;
  }

  return Number(onlyDigits);
}

function formatChargeAmount(value) {
  const amount = parseChargeAmount(value);

  if (!amount) {
    return "";
  }

  const limitedAmount = Math.min(amount, MAX_CHARGE_AMOUNT);

  return limitedAmount.toLocaleString();
}

export default function MyPage() {
  const navigate = useNavigate();
  const { user, updateNickname, deleteAccount, logout } = useAuth();

  const [nickname, setNickname] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);

  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenLedgers, setTokenLedgers] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const [selectedChargeAmount, setSelectedChargeAmount] = useState("10,000");
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  useEffect(() => {
    setNickname(user?.nickname || "");
    setNicknameAvailable(null);
    setNicknameMessage("");
  }, [user]);

  useEffect(() => {
    refreshTokens();
  }, []);

  const trimmedNickname = nickname.trim();
  const currentNickname = user?.nickname || "";

  const nicknameChanged =
    trimmedNickname !== "" && trimmedNickname !== currentNickname;

  const canSaveNickname =
    nicknameChanged &&
    nicknameAvailable === true &&
    !checkingNickname &&
    !savingNickname;

  const chargeAmount = parseChargeAmount(selectedChargeAmount);

  const formattedBalance = useMemo(() => {
    return `${(tokenBalance?.balance ?? 0).toLocaleString()} T`;
  }, [tokenBalance]);

  const handleCheckNickname = async () => {
    if (!trimmedNickname) {
      setNicknameAvailable(false);
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }

    if (trimmedNickname === currentNickname) {
      setNicknameAvailable(false);
      setNicknameMessage("현재 사용 중인 닉네임입니다.");
      return;
    }

    try {
      setCheckingNickname(true);
      setNicknameMessage("");

      const result = await checkNicknameAvailability(trimmedNickname);

      setNicknameAvailable(result.available);
      setNicknameMessage(
        result.available
          ? "사용 가능한 닉네임입니다."
          : "이미 사용 중인 닉네임입니다."
      );
    } catch (error) {
      setNicknameAvailable(false);
      setNicknameMessage(formatUserErrorMessage(error, "닉네임 확인에 실패했습니다."));
    } finally {
      setCheckingNickname(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!canSaveNickname) {
      return;
    }

    try {
      setSavingNickname(true);

      const updatedUser = await updateNickname(trimmedNickname);

      setNickname(updatedUser.nickname);
      setNicknameAvailable(null);
      setNicknameMessage("닉네임이 변경되었습니다.");
    } catch (error) {
      setNicknameAvailable(false);
      setNicknameMessage(formatUserErrorMessage(error, "닉네임 변경에 실패했습니다."));
    } finally {
      setSavingNickname(false);
    }
  };

  const refreshTokens = async () => {
    try {
      setLoadingTokens(true);

      const [balance, ledgers] = await Promise.all([
        getMyTokenBalance(),
        getMyTokenLedgers(30),
        delay(TOKEN_REFRESH_DELAY_MS),
      ]);

      setTokenBalance(balance);
      setTokenLedgers(Array.isArray(ledgers) ? ledgers : []);
    } catch {
      setTokenBalance(null);
      setTokenLedgers([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleChargeInputChange = (event) => {
    const rawValue = event.target.value;
    const onlyDigits = rawValue.replace(/[^\d]/g, "");

    if (!onlyDigits) {
      setSelectedChargeAmount("");
      setPaymentMessage("");
      setPaymentSuccess(null);
      return;
    }

    const amount = Math.min(Number(onlyDigits), MAX_CHARGE_AMOUNT);

    setSelectedChargeAmount(amount.toLocaleString());
    setPaymentMessage("");
    setPaymentSuccess(null);
  };

  const handleChargeTokens = async () => {
    const requestAmount = parseChargeAmount(selectedChargeAmount);

    if (!Number.isInteger(requestAmount) || requestAmount < MIN_CHARGE_AMOUNT) {
      setPaymentSuccess(false);
      setPaymentMessage("최소 1,000원 이상 충전할 수 있습니다.");
      return;
    }

    if (requestAmount > MAX_CHARGE_AMOUNT) {
      setPaymentSuccess(false);
      setPaymentMessage("최대 1,000,000원까지 충전할 수 있습니다.");
      return;
    }

    try {
      setPaying(true);
      setPaymentSuccess(null);
      setPaymentMessage("결제 정보를 준비하는 중입니다.");

      const checkout = await prepareTokenChargeCheckout(requestAmount);

      setPaymentMessage("PortOne 결제창을 여는 중입니다.");

      const paymentResult = await requestTokenChargePayment(checkout);
      const paymentId = paymentResult.paymentId || checkout.paymentId;

      setPaymentMessage("결제 검증 중입니다.");

      const verified = await verifyTokenChargePayment(paymentId);

      await refreshTokens();

      setPaymentSuccess(true);
      setPaymentMessage(
        verified?.message ||
        `${verified?.chargedTokens?.toLocaleString?.() ??
        requestAmount.toLocaleString()
        }토큰 충전이 완료되었습니다.`
      );
    } catch (error) {
      setPaymentSuccess(false);
      setPaymentMessage(formatPaymentErrorMessage(error));
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (error) {
      setPaymentSuccess(false);
      setPaymentMessage(formatUserErrorMessage(error, "회원 탈퇴에 실패했습니다."));
      setDeleting(false);
      setOpenDeleteModal(false);
    }
  };

  return (
    <main className="mx-auto min-h-[80vh] max-w-5xl px-5 py-10">
      <header className="mb-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={16} />
          Home
        </button>

        <p className="text-sm font-semibold text-purple-300">My Page</p>
        <h1 className="mt-2 text-3xl font-black text-white">마이페이지</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          계정 정보와 토큰 잔액을 관리합니다.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
        <SectionTitle title="계정" description="Google 계정 기반 로그인 정보입니다." />

        <div className="divide-y divide-white/10">
          <InfoLine label="이메일" value={user?.email || "-"} />
          <InfoLine label="로그인 방식" value={user?.provider || "GOOGLE"} />

          <div className="grid gap-4 px-5 py-5 md:grid-cols-[180px_1fr] md:items-start">
            <div>
              <p className="text-base font-bold text-gray-300">닉네임</p>
            </div>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={nickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setNicknameAvailable(null);
                    setNicknameMessage(
                      "닉네임 중복 확인 후 저장할 수 있습니다."
                    );
                  }}
                  placeholder="닉네임을 입력하세요"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-purple-400/60"
                />

                <button
                  type="button"
                  onClick={handleCheckNickname}
                  disabled={checkingNickname || !trimmedNickname}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingNickname ? "확인 중..." : "중복 확인"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveNickname}
                  disabled={!canSaveNickname}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingNickname ? "저장 중..." : "저장"}
                </button>
              </div>

              {nicknameMessage && (
                <p
                  className={`mt-3 text-sm ${nicknameAvailable === true
                      ? "text-emerald-300"
                      : nicknameAvailable === false
                        ? "text-red-300"
                        : "text-gray-400"
                    }`}
                >
                  {nicknameMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        <SectionDivider />

        <SectionTitle
          title="토큰"
          description="분석 요청과 재분석 요청에 사용하는 선불 토큰입니다."
          right={
            <button
              type="button"
              onClick={refreshTokens}
              disabled={loadingTokens}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} />
              새로고침
            </button>
          }
        />

        <div className="px-5 pb-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <Coins size={17} />
                  보유 토큰
                </div>
                <p className="mt-2 text-4xl font-black text-white">
                  {loadingTokens ? "조회 중..." : formattedBalance}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  일반 분석 2,000T · 재분석 500T
                </p>
              </div>

              <div className="w-full md:w-[420px]">
                <div className="grid gap-2 sm:grid-cols-3">
                  {CHARGE_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedChargeAmount(amount.toLocaleString());
                        setPaymentMessage("");
                        setPaymentSuccess(null);
                      }}
                      className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${parseChargeAmount(selectedChargeAmount) === amount
                          ? "border-purple-300 bg-purple-400/20 text-white"
                          : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10"
                        }`}
                    >
                      {amount.toLocaleString()}원
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-400">
                    직접 충전 금액
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-purple-400/60">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedChargeAmount}
                      onChange={handleChargeInputChange}
                      className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-gray-500"
                      placeholder="충전 금액을 입력하세요"
                    />
                    <span className="ml-3 text-sm font-semibold text-gray-400">
                      원
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    최소 1,000원부터 최대 1,000,000원까지 충전할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">
                1원 = 1토큰으로 충전됩니다.
              </p>

              <button
                type="button"
                onClick={handleChargeTokens}
                disabled={paying || chargeAmount < MIN_CHARGE_AMOUNT}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <WalletCards size={18} />
                {paying
                  ? "결제 진행 중..."
                  : `${chargeAmount.toLocaleString()}토큰 충전`}
              </button>
            </div>

            {paymentMessage && (
              <p
                className={`mt-4 text-sm ${paymentSuccess === true
                    ? "text-emerald-300"
                    : paymentSuccess === false
                      ? "text-red-300"
                      : "text-gray-300"
                  }`}
              >
                {paymentMessage}
              </p>
            )}
          </div>
        </div>

        <SectionDivider />

        <SectionTitle
          title="토큰 내역"
          description="최근 충전과 사용 내역입니다."
        />

        <div className="px-5 pb-6">
          {tokenLedgers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-center text-sm text-gray-500">
              아직 토큰 내역이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {tokenLedgers.map((ledger) => (
                <TokenLedgerRow key={ledger.ledgerId} ledger={ledger} />
              ))}
            </div>
          )}
        </div>

        <SectionDivider />

        <SectionTitle title="계정 관리" description="로그아웃 또는 탈퇴할 수 있습니다." />

        <div className="flex flex-wrap gap-3 px-5 pb-6">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} />
            로그아웃
          </button>

          <button
            type="button"
            onClick={() => setOpenDeleteModal(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={17} />
            회원 탈퇴
          </button>
        </div>
      </div>

      {openDeleteModal && (
        <DeleteAccountModal
          deleting={deleting}
          onClose={() => {
            if (!deleting) {
              setOpenDeleteModal(false);
            }
          }}
          onConfirm={handleConfirmDeleteAccount}
        />
      )}
    </main>
  );
}

function SectionTitle({ title, description, right }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-white/10" />;
}

function InfoLine({ label, value }) {
  return (
    <div className="grid gap-2 px-5 py-5 md:grid-cols-[180px_1fr]">
      <p className="text-base font-bold text-gray-300">{label}</p>
      <p className="break-all text-base font-bold text-gray-50 md:text-lg">
        {value}
      </p>
    </div>
  );
}

function TokenLedgerRow({ ledger }) {
  const positive = ledger.amount > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">
          {formatLedgerType(ledger.type)}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">
          {ledger.reason || ledger.referenceId || "-"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-black ${positive ? "text-emerald-300" : "text-red-300"
            }`}
        >
          {positive ? "+" : ""}
          {ledger.amount.toLocaleString()} T
        </p>
        <p className="mt-1 text-xs text-gray-500">
          잔액 {ledger.balanceAfter.toLocaleString()} T
        </p>
      </div>
    </div>
  );g
}

function DeleteAccountModal({ deleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="회원 탈퇴 모달 닫기"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        disabled={deleting}
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-400/20 bg-slate-950 p-7 shadow-2xl shadow-red-950/30">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-red-500/15 text-red-200">
          <Trash2 size={27} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          정말 탈퇴하시겠습니까?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          탈퇴 후 30일 동안 같은 Google 계정으로 다시 가입할 수 없습니다.
          기존 토큰 사용 내역과 무료 지급 이력은 초기화되지 않습니다.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 shrink-0 text-amber-200"
              size={18}
            />
            <p className="text-sm leading-6 text-amber-100/90">
              현재 로그인 세션은 즉시 종료되며, 마이페이지와 분석 기능에
              접근할 수 없습니다.
            </p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatLedgerType(type) {
  switch (type) {
    case "SIGNUP_BONUS":
      return "무료 분석 토큰 지급";
    case "TOKEN_CHARGE":
      return "토큰 충전";
    case "ANALYSIS_USE":
      return "일반 분석";
    case "REANALYSIS_USE":
      return "재분석";
    default:
      return type || "토큰 내역";
  }
}
