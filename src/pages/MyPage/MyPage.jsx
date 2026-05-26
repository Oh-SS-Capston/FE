import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { checkNicknameAvailability } from "../../features/auth/api/authApi";
import { useAuth } from "../../features/auth/model/AuthContext";

export default function MyPage() {
  const {
    user,
    membership,
    refreshMembership,
    updateNickname,
    deleteAccount,
    logout,
  } = useAuth();

  const [nickname, setNickname] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  useEffect(() => {
    setNickname(user?.nickname || "");
    setNicknameAvailable(null);
    setNicknameMessage("");
  }, [user]);

  const trimmedNickname = nickname.trim();
  const currentNickname = user?.nickname || "";

  const nicknameChanged = trimmedNickname !== "" && trimmedNickname !== currentNickname;

  const canSaveNickname =
    nicknameChanged &&
    nicknameAvailable === true &&
    !checkingNickname &&
    !savingNickname;

  const membershipLabel = useMemo(() => {
    if (!membership) {
      return "조회 필요";
    }

    if (membership.membershipActive) {
      return "활성화";
    }

    if (membership.freeAnalysisRemaining > 0) {
      return "무료 분석 가능";
    }

    return "멤버십 필요";
  }, [membership]);

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
      setNicknameMessage(error.message || "닉네임 확인에 실패했습니다.");
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
      setNicknameMessage(error.message || "닉네임 변경에 실패했습니다.");
    } finally {
      setSavingNickname(false);
    }
  };

  const handleRefreshMembership = async () => {
    await refreshMembership();
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (error) {
      alert(error.message || "회원 탈퇴에 실패했습니다.");
      setDeleting(false);
      setOpenDeleteModal(false);
    }
  };

  return (
    <main className="mx-auto min-h-[80vh] max-w-6xl px-5 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-purple-300">My Page</p>
        <h1 className="mt-2 text-3xl font-black text-white">마이페이지</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          계정 정보, 닉네임, 멤버십 상태를 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-purple-950/10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
              <UserRound size={26} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">내 정보</h2>
              <p className="text-sm text-gray-500">Google 계정 기반 로그인</p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow label="이메일" value={user?.email || "-"} />
            <InfoRow label="닉네임" value={user?.nickname || "-"} />
            <InfoRow label="로그인 방식" value={user?.provider || "GOOGLE"} />
          </div>

          <div className="mt-7 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 shrink-0 text-amber-200"
                size={19}
              />
              <p className="text-sm leading-6 text-amber-100/90">
                회원 탈퇴 후 30일 동안 같은 Google 계정으로 다시 가입할 수
                없습니다. 30일 이후 재가입해도 무료 분석권 사용량은 초기화되지
                않습니다.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
              로그아웃
            </button>

            <button
              type="button"
              onClick={() => setOpenDeleteModal(true)}
              disabled={deleting}
              className="flex items-center gap-2 rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={17} />
              회원 탈퇴
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-purple-950/10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-200">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">닉네임 변경</h2>
              <p className="text-sm text-gray-500">
                2~20자, 한글/영문/숫자/밑줄 사용 가능
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setNicknameAvailable(null);
                setNicknameMessage("닉네임 중복 확인 후 저장할 수 있습니다.");
              }}
              placeholder="닉네임을 입력하세요"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-purple-400/60"
            />

            <button
              type="button"
              onClick={handleCheckNickname}
              disabled={checkingNickname || !trimmedNickname}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingNickname ? "확인 중..." : "중복 확인"}
            </button>

            <button
              type="button"
              onClick={handleSaveNickname}
              disabled={!canSaveNickname}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingNickname ? "저장 중..." : "저장"}
            </button>
          </div>

          {nicknameMessage && (
            <p
              className={`mt-3 text-sm ${
                nicknameAvailable === true
                  ? "text-emerald-300"
                  : nicknameAvailable === false
                    ? "text-red-300"
                    : "text-gray-400"
              }`}
            >
              {nicknameMessage}
            </p>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                  <CreditCard size={26} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">멤버십</h2>
                  <p className="text-sm text-gray-500">
                    무료 분석권과 멤버십 상태
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshMembership}
                className="rounded-full border border-white/10 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="멤버십 새로고침"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MembershipCard label="상태" value={membershipLabel} />
              <MembershipCard
                label="무료 분석 잔여"
                value={
                  membership
                    ? `${membership.freeAnalysisRemaining ?? 0}회`
                    : "-"
                }
              />
              <MembershipCard
                label="무료 분석 사용"
                value={membership ? `${membership.freeAnalysisUsed ?? 0}회` : "-"}
              />
              <MembershipCard
                label="플랜"
                value={membership?.planName || "Basic Monthly"}
              />
              <MembershipCard
                label="가격"
                value={
                  membership
                    ? `${membership.amount?.toLocaleString?.() ?? 0} ${
                        membership.currency || "KRW"
                      }`
                    : "9,900 KRW"
                }
              />
              <MembershipCard
                label="만료일"
                value={
                  membership?.currentPeriodEnd
                    ? new Date(membership.currentPeriodEnd).toLocaleString()
                    : "-"
                }
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-200"
                  size={18}
                />
                <p className="text-sm leading-6 text-gray-300">
                  {membership?.message ||
                    "멤버십 정보를 불러오면 현재 분석 가능 여부를 확인할 수 있습니다."}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              결제 버튼과 PortOne 결제창 호출은 5차 작업에서 연결합니다.
            </p>
          </div>
        </section>
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
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-purple-500" />

        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-200">
          <Trash2 size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          정말 탈퇴하시겠습니까?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          탈퇴 후 30일 동안 같은 Google 계정으로 다시 가입할 수 없습니다.
          30일 이후 재가입해도 무료 분석권 사용량과 기존 분석 이력은
          초기화되지 않습니다.
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

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-gray-100">
        {value}
      </p>
    </div>
  );
}

function MembershipCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}