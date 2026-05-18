type GamePhase = 'betting' | 'running' | 'crashed'

interface CrashGraphProps {
  phase: GamePhase
  multiplier: number
  crashPoint?: number
  seedHash?: string
}

export function CrashGraph({ phase, multiplier, crashPoint, seedHash }: CrashGraphProps) {
  return (
    <div className="relative flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col items-center justify-center overflow-hidden">
      {/* Seed hash badge */}
      {seedHash && phase === 'betting' && (
        <div className="absolute top-3 left-3 right-3 flex justify-center">
          <span className="text-xs text-gray-500 font-mono bg-gray-800 px-3 py-1 rounded-full truncate max-w-xs">
            {seedHash}
          </span>
        </div>
      )}

      {/* Neon grid lines */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {phase === 'betting' && (
        <div className="flex flex-col items-center gap-3 text-center z-10">
          <span className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
            Apostas abertas
          </span>
          <span className="text-gray-400 text-sm">A rodada começa em instantes...</span>
        </div>
      )}

      {phase === 'running' && (
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-8xl font-black text-green-400 tabular-nums drop-shadow-[0_0_30px_rgba(74,222,128,0.6)]">
            {multiplier.toFixed(2)}x
          </span>
          <span className="text-gray-500 text-xs uppercase tracking-widest">multiplicador</span>
        </div>
      )}

      {phase === 'crashed' && (
        <div className="flex flex-col items-center gap-3 z-10">
          <span className="text-6xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]">
            CRASHED
          </span>
          {crashPoint !== undefined && (
            <span className="text-3xl font-bold text-red-400">{crashPoint.toFixed(2)}x</span>
          )}
        </div>
      )}
    </div>
  )
}
