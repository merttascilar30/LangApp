import { useCallback, useLayoutEffect, useRef } from 'react'
import type { FocusEvent } from 'react'

const TUSLAR = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

type Props = { onInsert: (ch: string) => void; disabled?: boolean }

export function UmlautKeys({ onInsert, disabled = false }: Props) {
  return (
    <div className="umlaut-tuslari">
      {TUSLAR.map((ch) => (
        <button
          key={ch}
          type="button"
          className="umlaut-tusu"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(ch)}
        >
          {ch}
        </button>
      ))}
    </div>
  )
}

/**
 * Son odaklanan input'u izler; insert(ch) karakteri imleç konumuna ekleyip
 * apply(input, yeniDeger) ile üst bileşene bildirir, sonra imleci eklenen karakterin sonrasına koyar.
 * Hiçbir input odaklanmadıysa konteynerdeki ilk input'un sonuna ekler.
 */
export function useUmlautInsert(apply: (input: HTMLInputElement, value: string) => void) {
  const kapsayici = useRef<HTMLDivElement>(null)
  const son = useRef<HTMLInputElement | null>(null)
  const bekleyen = useRef<{ el: HTMLInputElement; konum: number } | null>(null)

  useLayoutEffect(() => {
    const b = bekleyen.current
    if (!b) return
    bekleyen.current = null
    b.el.focus()
    b.el.setSelectionRange(b.konum, b.konum)
  })

  const izle = useCallback((e: FocusEvent<HTMLElement>) => {
    if (e.target instanceof HTMLInputElement) son.current = e.target
  }, [])

  const insert = (ch: string) => {
    let el = son.current
    if (!el || !el.isConnected || el.disabled || el.readOnly) {
      el = kapsayici.current?.querySelector<HTMLInputElement>('input:not(:disabled):not([readonly])') ?? null
      if (!el) return
      son.current = null
      const v = el.value
      bekleyen.current = { el, konum: v.length + ch.length }
      apply(el, v + ch)
      return
    }
    const v = el.value
    const bas = el.selectionStart ?? v.length
    const son_ = el.selectionEnd ?? bas
    bekleyen.current = { el, konum: bas + ch.length }
    apply(el, v.slice(0, bas) + ch + v.slice(son_))
  }

  return { kapsayici, izle, insert }
}
