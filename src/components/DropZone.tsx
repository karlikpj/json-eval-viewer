import { useRef, useState } from 'react'
import styles from './DropZone.module.css'

interface Props {
  onFile: (f: File) => void
  loading: boolean
  error: string | null
}

export default function DropZone({ onFile, loading, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (f: File | undefined) => { if (f) onFile(f) }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>JSON Results Viewer</h1>
      <p className={styles.sub}>Drop an eval test-run JSON or conclusions summary JSON to browse it.</p>

      <div
        className={`${styles.box} ${dragging ? styles.drag : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]) }}
      >
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.dots}>
              <span /><span /><span />
            </div>
            <p>Parsing file…</p>
          </div>
        ) : (
          <>
            <div className={styles.icon}>📁</div>
            <p>Click to choose a file, or drag &amp; drop here</p>
            <button className={styles.btn} onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
              Choose JSON file
            </button>
          </>
        )}
      </div>

      {error && <p className={styles.error}>⚠️ {error}</p>}
      <input ref={inputRef} type="file" accept=".json" hidden
        onChange={e => pick(e.target.files?.[0])} />
    </div>
  )
}
