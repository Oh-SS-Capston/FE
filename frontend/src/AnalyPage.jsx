import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Github, ArrowLeft, FolderOpen, Box, ChevronDown } from 'lucide-react';

const STAR_SEED = 42;
const mulberry32 = (a) => () => ((a += 0x6d2b79f5) | 0) >>> 0;
const seededRandom = (seed) => {
  const next = mulberry32(seed);
  return () => next() / 0xffffffff;
};

// 레포지토리 정보 카드
const RepoInfoSection = ({ repo, info, loading, error }) => {
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="flex gap-4 mt-2">
            <div className="h-6 bg-white/5 rounded w-24" />
            <div className="h-6 bg-white/5 rounded w-20" />
          </div>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
        <p className="text-red-400">{error}</p>
        <p className="text-gray-500 text-sm mt-2">레포지토리 URL을 확인하거나 나중에 다시 시도해 주세요.</p>
      </section>
    );
  }
  if (!info) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      <div
        className="h-1 opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)',
        }}
      />
      <div className="p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Github size={32} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent truncate">
              {info.full_name}
            </h2>
            {info.description && (
              <p className="text-gray-400 mt-2 line-clamp-2">{info.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="text-gray-500">
                <span className="text-cyan-400 font-medium">{info.stargazers_count?.toLocaleString() ?? 0}</span> stars
              </span>
              {info.language && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400">{info.language}</span>
              )}
              <a
                href={info.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                GitHub에서 보기 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 클래스 다이어그램 목업 시각화
const ClassDiagramSection = () => {
  const classes = [
    { id: 'base', name: 'BaseEntity', attrs: ['+ id: Long', '+ createdAt: Instant'], x: 160, y: 12, w: 140, h: 72 },
    { id: 'user', name: 'User', attrs: ['+ email: Email', '+ name: String'], x: 24, y: 108, w: 120, h: 68 },
    { id: 'project', name: 'Project', attrs: ['+ title: String', '+ status: Status'], x: 256, y: 108, w: 120, h: 68 },
    { id: 'repo', name: 'UserRepository', attrs: ['+ findById()', '+ save()'], x: 24, y: 200, w: 130, h: 64 },
    { id: 'issue', name: 'Issue', attrs: ['+ title: String', '+ assignee: User'], x: 256, y: 200, w: 120, h: 64 },
  ];
  const links = [
    { from: 'user', to: 'base', type: 'inherit' },
    { from: 'project', to: 'base', type: 'inherit' },
    { from: 'user', to: 'repo', type: 'use' },
    { from: 'project', to: 'issue', type: 'compose' },
  ];
  const getCenter = (c) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });
  const byId = Object.fromEntries(classes.map((c) => [c.id, c]));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      <div
        className="h-1 opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)',
        }}
      />
      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <Box size={22} className="text-cyan-400" />
          클래스 다이어그램
        </h3>
        <p className="text-gray-500 text-sm mb-4">목업 예시 (추후 백엔드 정적 분석 연동 시 실제 데이터로 대체)</p>
        <div className="min-h-[320px] rounded-xl border border-white/10 bg-[#050508]/80 overflow-hidden relative">
          <svg
            viewBox="0 0 400 280"
            className="w-full h-full min-h-[320px] block"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="rgba(34,211,238,0.8)" />
              </marker>
              <marker
                id="arrow-empty"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M0,2 L6,4 L0,6 Z" fill="none" stroke="rgba(168,85,247,0.9)" strokeWidth="1.2" />
              </marker>
            </defs>
            {/* 연결선 */}
            {links.map((link, i) => {
              const from = getCenter(byId[link.from]);
              const to = getCenter(byId[link.to]);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const stroke = link.type === 'inherit' ? 'rgba(168,85,247,0.9)' : 'rgba(34,211,238,0.7)';
              const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
              const label = link.type === 'inherit' ? 'extends' : link.type === 'compose' ? '1 *' : 'uses';
              return (
                <g key={i}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={stroke}
                    strokeWidth="1.5"
                    strokeDasharray={link.type === 'inherit' ? '4 3' : 'none'}
                    markerEnd={link.type === 'inherit' ? 'url(#arrow-empty)' : 'url(#arrow)'}
                  />
                  <text x={mid.x} y={mid.y - 6} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="inherit">
                    {label}
                  </text>
                </g>
              );
            })}
            {/* 클래스 박스 */}
            {classes.map((c) => (
              <g key={c.id}>
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx="6"
                  fill="rgba(10,10,26,0.9)"
                  stroke="rgba(34,211,238,0.4)"
                  strokeWidth="1.5"
                />
                <rect x={c.x} y={c.y} width={c.w} height="24" rx="6" fill="rgba(34,211,238,0.15)" />
                <line x1={c.x} y1={c.y + 24} x2={c.x + c.w} y2={c.y + 24} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x={c.x + c.w / 2} y={c.y + 16} textAnchor="middle" fill="rgb(34,211,238)" fontSize="11" fontWeight="bold">
                  {c.name}
                </text>
                {c.attrs.map((attr, i) => (
                  <text
                    key={i}
                    x={c.x + 8}
                    y={c.y + 40 + i * 14}
                    fill="rgba(255,255,255,0.75)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {attr}
                  </text>
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};

// 디렉토리 구조: 패키지 드롭다운 + 선택 시 클래스 목록 (목업 데이터)
const MOCK_PACKAGES = {
  'com.example.application': [
    'ApplicationRunner',
    'ApplicationConfig',
    'WebMvcConfig',
    'SecurityConfig',
    'SwaggerConfig',
    'GlobalExceptionHandler',
  ],
  'com.example.domain.user': [
    'User',
    'UserId',
    'UserRepository',
    'UserService',
    'UserProfile',
    'Email',
    'Password',
    'Role',
  ],
  'com.example.domain.project': [
    'Project',
    'ProjectId',
    'ProjectRepository',
    'ProjectService',
    'ProjectStatus',
    'Milestone',
    'Label',
  ],
  'com.example.api.controller': [
    'UserController',
    'AuthController',
    'ProjectController',
    'IssueController',
    'CommentController',
    'SearchController',
  ],
  'com.example.api.dto': [
    'UserRequest',
    'UserResponse',
    'LoginRequest',
    'TokenResponse',
    'ProjectCreateRequest',
    'ProjectDetailResponse',
    'ErrorResponse',
  ],
  'com.example.infrastructure.persistence': [
    'UserJpaRepository',
    'ProjectJpaRepository',
    'IssueJpaRepository',
    'CommentJpaRepository',
    'UserEntity',
    'ProjectEntity',
  ],
  'com.example.infrastructure.config': [
    'DatabaseConfig',
    'RedisConfig',
    'JwtConfig',
    'CorsConfig',
    'AsyncConfig',
  ],
  'com.example.common': [
    'BaseEntity',
    'Auditable',
    'Result',
    'PageResponse',
    'ApiResponse',
    'Constants',
  ],
};

const DirectoryStructureSection = () => {
  const [expandedPackages, setExpandedPackages] = useState(new Set());
  const packages = Object.keys(MOCK_PACKAGES);

  const togglePackage = (pkg) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      <div
        className="h-1 opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)',
        }}
      />
      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <FolderOpen size={22} className="text-cyan-400" />
          디렉토리 구조
        </h3>
        <p className="text-gray-500 text-sm mb-4">패키지를 클릭하면 해당 패키지에 포함된 클래스가 펼쳐집니다.</p>

        {/* 패키지 리스트 - 각 패키지가 드롭다운 */}
        <ul className="space-y-2">
          {packages.map((pkg) => {
            const isExpanded = expandedPackages.has(pkg);
            const classes = MOCK_PACKAGES[pkg];
            return (
              <li key={pkg} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePackage(pkg)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <ChevronDown
                      size={18}
                      className={`text-gray-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                    <FolderOpen size={18} className="text-cyan-400/80 shrink-0" />
                    {pkg}
                  </span>
                  <span className="text-xs text-gray-500">{classes.length}개 클래스</span>
                </button>
                {isExpanded && (
                  <ul className="border-t border-white/5 bg-black/20 divide-y divide-white/5">
                    {classes.map((cls) => (
                      <li
                        key={cls}
                        className="px-4 py-2.5 pl-12 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Box size={14} className="text-purple-400/70 shrink-0" />
                        {cls}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default function AnalyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const repo = location.state?.repo || null;

  const [repoInfo, setRepoInfo] = useState(null);
  const [loading, setLoading] = useState(!!repo);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      setError('올바른 레포지토리 형식이 아닙니다 (owner/name)');
      setLoading(false);
      return;
    }
    fetch(`https://api.github.com/repos/${owner}/${name}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? '레포지토리를 찾을 수 없습니다.' : '정보를 불러오지 못했습니다.');
        return res.json();
      })
      .then((data) => {
        setRepoInfo({
          full_name: data.full_name,
          description: data.description,
          stargazers_count: data.stargazers_count,
          language: data.language,
          html_url: data.html_url,
        });
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setRepoInfo(null);
      })
      .finally(() => setLoading(false));
  }, [repo]);

  if (!repo) {
    return (
      <div
        className="min-h-screen text-white flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at top, #0a0b1f 0%, #030306 50%, #000000 100%)',
        }}
      >
        <div className="text-center relative z-10">
          <p className="text-gray-400 mb-4">레포지토리 정보가 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            랜딩으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
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

      {/* 우주 레이어 1: 별 (드리프트) */}
      <div
        className="absolute inset-0 w-0 h-0 pointer-events-none -z-10 animate-star-drift"
        style={starStyle}
        aria-hidden
      />
      {/* 우주 레이어 2: 은하수 */}
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

      {/* 성운 블롭 */}
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

      {/* 반짝이는 별 */}
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

      {/* 배경 Orb */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-800/15 rounded-full blur-[150px] -z-10 animate-nebula-drift" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/15 rounded-full blur-[150px] -z-10 animate-nebula-float" aria-hidden />

      {/* 상단바 */}
      <nav className="sticky top-0 z-50 bg-[#000000]/50 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="h-20 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
          <div className="min-w-0" />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] justify-self-center hover:opacity-90 transition-opacity"
          >
            Oh! SS
          </button>
          <div className="flex items-center justify-end min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              <ArrowLeft size={18} /> Home
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-8">
        <RepoInfoSection repo={repo} info={repoInfo} loading={loading} error={error} />
        <ClassDiagramSection />
        <DirectoryStructureSection />
      </main>
    </div>
  );
}
