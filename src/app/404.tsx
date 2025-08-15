export default function NotFound() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>404 – Page not found</h1>
      <p style={{ color: '#666' }}>The page you’re looking for doesn’t exist.</p>
    </div>
  )
}
