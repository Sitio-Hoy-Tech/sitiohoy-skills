'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <h1>Algo salio mal</h1>
      <p>Hubo un error inesperado.</p>
      <button type="button" onClick={reset}>Intentar de nuevo</button>
    </main>
  )
}
