import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, History, Star, LogIn, UserPlus, Search } from 'lucide-react';
import SignUpPage from './SignUpPage';
import Login from './Login';

// 별 위치 고정 (같은 레이아웃 유지)
const STAR_SEED = 42;
const mulberry32 = (a) => () => ((a += 0x6d2b79f5) | 0) >>> 0;
const seededRandom = (seed) => {
  const next = mulberry32(seed);
  return () => next() / 0xffffffff;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleAnalyze = () => {
    const trimmed = repoUrl.trim();
    if (!trimmed) return;
    const match = trimmed.match(/github\.com[/]([^/]+)[/]([^/?#]+)/) || trimmed.match(/^([^/]+)[/]([^/]+)$/);
    const repo = match ? `${match[1]}/${match[2]}` : trimmed;
    navigate('/analyze', { state: { repo } });
  };

  const starStyle = useMemo(() => {
    const rnd = seededRandom(STAR_SEED);
    const shadows = Array.from({ length: 120 }, (_, i) => {
      const x = rnd() * 100;
      const y = rnd() * 100;
      const size = rnd() > 0.92 ? 1.5 : 0.5;
      const opacity = 0.3 + rnd() * 0.7;
      return `${x}vw ${y}vh 0 ${size}px rgba(255,255,255,${opacity.toFixed(2)})`;
    }).join(', ');
    return { boxShadow: shadows };
  }, []);

  return (
    // 전체 배경: 어두운 우주 그라데이션, 화면 꽉 차게
    <div
      className="fixed inset-0 w-full h-full min-h-screen text-white selection:bg-purple-500/50 overflow-auto"
      style={{
        background: 'radial-gradient(ellipse at top, #0a0b1f 0%, #030306 50%, #000000 100%)',
      }}
    >
      {/* 레이어 0: 배경 그라데이션 흐름 (성운 톤) */}
      <div
        className="absolute inset-0 pointer-events-none -z-20 animate-gradient-flow"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(88,28,135,0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(6,78,59,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 50% 80%, rgba(30,58,138,0.1) 0%, transparent 55%)',
          backgroundPosition: '0% 50%',
        }}
        aria-hidden
      />

      {/* 우주 레이어 1: 별 (드리프트 애니메이션 적용) */}
      <div
        className="absolute inset-0 w-0 h-0 pointer-events-none -z-10 animate-star-drift"
        style={starStyle}
        aria-hidden
      />
      {/* 우주 레이어 2: 은하수 (그라데이션 + 성운 드리프트) */}
      <div className="absolute pointer-events-none -z-10 w-[140%] h-[50%] -left-[20%] top-[15%] opacity-40 animate-nebula-drift">
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(105deg, transparent 0%, rgba(180,160,255,0.08) 25%, rgba(255,255,255,0.12) 50%, rgba(200,220,255,0.08) 75%, transparent 100%)',
            filter: 'blur(80px)',
            transform: 'rotate(-12deg)',
          }}
          aria-hidden
        />
      </div>
      <div className="absolute pointer-events-none -z-10 w-[100%] h-[35%] left-[-10%] bottom-[10%] opacity-30 animate-nebula-float">
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(75deg, transparent 0%, rgba(120,100,200,0.1) 50%, transparent 100%)',
            filter: 'blur(100px)',
            transform: 'rotate(5deg)',
          }}
          aria-hidden
        />
      </div>

      {/* 성운 요소: 그라데이션 블롭 + 애니메이션 */}
      <div
        className="absolute pointer-events-none -z-10 w-[70%] h-[60%] top-[5%] right-[-15%] animate-nebula-pulse"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none -z-10 w-[50%] h-[50%] bottom-[0%] left-[-10%] animate-nebula-drift"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none -z-10 w-[40%] h-[50%] top-[40%] left-[20%] animate-nebula-float"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        aria-hidden
      />

      {/* 우주 레이어 3: 반짝이는 별 */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {[
          { left: '12%', top: '22%', d: 'delay-1' },
          { left: '88%', top: '18%', d: 'delay-2' },
          { left: '45%', top: '35%', d: 'delay-3' },
          { left: '72%', top: '55%', d: 'delay-4' },
          { left: '8%', top: '70%', d: 'delay-5' },
          { left: '92%', top: '78%', d: 'delay-6' },
          { left: '28%', top: '85%', d: 'delay-7' },
          { left: '55%', top: '12%', d: 'delay-8' },
          { left: '35%', top: '62%', d: 'delay-9' },
          { left: '78%', top: '42%', d: 'delay-10' },
        ].map((s, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full bg-white star-twinkle ${s.d}`}
            style={{ left: s.left, top: s.top }}
            aria-hidden
          />
        ))}
      </div>

      {/* 배경 Orb (기존 + 움직임) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-800/15 rounded-full blur-[150px] -z-10 animate-nebula-drift" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/15 rounded-full blur-[150px] -z-10 animate-nebula-float" aria-hidden />

      {/* 1. 상단바 (Navigation Bar) - 로고 중앙, 버튼 오른쪽 고정 */}
      <nav className="fixed top-0 w-full z-50 bg-[#000000]/50 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="h-20 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
          {/* 왼쪽: 빈 영역 (로고 중앙 정렬용) */}
          <div className="min-w-0" />
          {/* 로고: 항상 화면 정중앙 */}
          <div className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] justify-self-center">
            Oh! SS
          </div>
          {/* 오른쪽: Login, 회원가입 고정 간격 */}
          <div className="flex items-center justify-end gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-white/5 shrink-0"
            >
              <LogIn size={18} /> Login
            </button>
            <button
              type="button"
              onClick={() => setShowSignUp(true)}
              className="group relative px-5 py-2 text-sm font-bold rounded-full overflow-hidden shrink-0"
            >
              <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-r from-cyan-500 to-purple-600 group-hover:opacity-100 blur-[2px]"></span>
              <span className="absolute inset-0 w-full h-full border border-white/20 rounded-full group-hover:border-transparent transition duration-300"></span>
              <span className="relative flex items-center gap-2 text-white group-hover:text-white">
                <UserPlus size={18} /> Sign Up
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* 로그인 팝업 */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {/* 회원가입 팝업 */}
      {showSignUp && <SignUpPage onClose={() => setShowSignUp(false)} />}

      {/* 메인 바디 컨테이너 */}
      <main className="pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center relative z-10">
        
        {/* 2-1. 소개글 (Hero Section) */}
        <section className="text-center mb-20">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-8 tracking-tight leading-tight">
            Explore the <br className="md:hidden"/>
            {/* 텍스트 강조: 강력한 네온 글로우 효과 */}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
               Galaxy
            </span> of OSS (Open Source Software)
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
            GitHub 레포지토리를 분석하여 <span className="text-purple-300 font-semibold drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">시각적인 우주</span>로 펼쳐드립니다.
          </p>
        </section>

        {/* 2-2. 검색바 (Search Portal) - 네온 글로우 및 인터랙션 강화 */}
        <div className="w-full max-w-4xl mb-32 relative">
          {/* 뒷배경 글로우 효과 */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-500 animate-tilt"></div>
          
          <div className="relative flex items-center bg-[#000000]/60 backdrop-blur-xl rounded-full border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] focus-within:border-purple-500/50 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all duration-300">
            <div className="pl-8 text-gray-500">
              <Github size={28} />
            </div>
            <input 
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste GitHub repository URL here..."
              className="w-full bg-transparent py-6 px-6 text-xl text-white outline-none placeholder:text-gray-600 font-medium"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              className="mr-3 px-10 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_35px_rgba(124,58,237,0.6)] transition-all active:scale-95 flex items-center gap-2"
            >
              <Search size={20} className="stroke-[3px]" /> Analyze
            </button>
          </div>
        </div>

        {/* 2-3 & 2-4. 하단 섹션 (History & Recommendations) - 글래스모피즘 카드 */}
        <div className="w-full grid md:grid-cols-2 gap-16">
          
          {/* 사용자 검색 기록 */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <History size={24} className="text-cyan-300" />
              </div>
              <h3 className="text-2xl font-bold tracking-wide">Recent Explorations</h3>
            </div>
            <div className="space-y-4">
              {['facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss'].map((repo, index) => (
                <div key={repo} className="group p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <span className="text-lg text-gray-400 group-hover:text-white transition-colors font-medium">{repo}</span>
                  <span className="text-sm text-gray-600 font-mono">2 days ago</span>
                </div>
              ))}
            </div>
          </section>

          {/* 추천 레포지토리 */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <Star size={24} className="text-yellow-300" />
              </div>
              <h3 className="text-2xl font-bold tracking-wide">Featured Planets</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { name: 'openai/whisper', lang: 'Python', star: '45k', color: 'from-blue-400 to-cyan-300' },
                { name: 'spring-projects/spring-boot', lang: 'Java', star: '72k', color: 'from-green-400 to-emerald-300' },
                { name: 'microsoft/TypeScript', lang: 'TypeScript', star: '95k', color: 'from-blue-500 to-indigo-400' }
              ].map((item) => (
                // 카드: 호버 시 테두리 글로우 효과 적용
                <div key={item.name} className="group p-6 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md border border-white/10 rounded-3xl hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300 group-hover:from-purple-300 group-hover:to-cyan-300 transition-all">{item.name}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${item.color} text-[#050510] shadow-sm`}>{item.lang}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium relative z-10">
                    <Star size={14} className="text-yellow-500" fill="currentColor" /> {item.star} stars
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default LandingPage;