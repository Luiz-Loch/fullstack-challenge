import { useRef } from 'react'
import type { GamePhase } from '../types/game'

interface CrashGraphProps {
  phase: GamePhase
  multiplier: number
  crashPoint?: number
  seedHash?: string
}

const W = 500
const H = 250

export function CrashGraph({ phase, multiplier, crashPoint, seedHash }: CrashGraphProps) {
  const histRef = useRef<number[]>([])

  if (phase === 'BETTING') {
    histRef.current = []
  } else if (histRef.current.at(-1) !== multiplier) {
    histRef.current.push(multiplier)
  }

  const hist = histRef.current
  const n = hist.length
  const isCrashed = phase === 'CRASHED'
  const color = isCrashed ? '#ef4444' : '#4ade80'
  const peak = hist.reduce((a, b) => Math.max(a, b), 2)

  const x = (i: number) => (n > 1 ? (i / (n - 1)) * W : 0)
  const y = (v: number) => H - Math.pow((v - 1) / (peak - 1), 1.5) * H

  const linePath = hist.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const areaPath = linePath ? `${linePath} L${x(n - 1).toFixed(1)} ${H} L0 ${H} Z` : ''
  const displayed = isCrashed ? (crashPoint ?? multiplier) : multiplier

  if (phase === 'BETTING') {
    return (
      <div className="relative flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-3">
        {seedHash && (
          <span className="text-xs font-mono text-gray-500 bg-gray-800 px-3 py-1 rounded-lg break-all text-center max-w-xs">
            {seedHash}
          </span>
        )}
        <p className="text-5xl font-black text-yellow-400" style={{ textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>
          Apostas abertas
        </p>
        <p className="text-sm text-gray-400">A rodada começa em instantes...</p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="absolute top-4 inset-x-0 flex flex-col items-center gap-1 z-10 pointer-events-none">
        {isCrashed && <span className="text-2xl font-black text-red-500">CRASHED</span>}
        <span className="text-6xl font-black tabular-nums" style={{ color, textShadow: `0 0 30px ${color}` }}>
          {displayed.toFixed(2)}x
        </span>
      </div>

      {n >= 2 && (
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <path d={areaPath} fill="url(#fill)" />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow)" />
          <circle cx={x(n - 1)} cy={y(hist[n - 1])} r="4" fill={color} filter="url(#glow)" />
        </svg>
      )}
    </div>
  )
}
