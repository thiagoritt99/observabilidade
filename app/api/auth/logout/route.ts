import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso',
  })

  // Remover cookie de autenticacao
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
