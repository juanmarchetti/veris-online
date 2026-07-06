import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'

export default async function MisCitasPage() {
  const { error, status } = await verificarUsuario(['paciente'])
  
  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4">Solo los pacientes pueden ver sus citas.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-primary">Mis Citas</h1>
    </main>
  );
}
