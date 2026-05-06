import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Em producao, usar banco de dados MySQL
// Esta e uma implementacao simplificada para demonstracao
const USERS = [
  {
    id: '1',
    email: 'admin@fmp.edu.br',
    // Senha: admin123 (em producao, armazenar hash no banco)
    passwordHash: '$2a$10$8K1p/a0dR1xqM8K1p/a0dOuPwPwPwPwPwPwPwPwPwPwPwPwPwPwPw',
    name: 'Administrador',
    role: 'admin',
  },
  {
    id: '2',
    email: 'ti@fmp.edu.br',
    passwordHash: '$2a$10$8K1p/a0dR1xqM8K1p/a0dOuPwPwPwPwPwPwPwPwPwPwPwPwPwPwPw',
    name: 'TI FMP',
    role: 'viewer',
  },
]

const JWT_SECRET = process.env.JWT_SECRET || 'fmp-dashboard-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha sao obrigatorios' },
        { status: 400 }
      )
    }

    // Buscar usuario (em producao, buscar no MySQL)
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais invalidas' },
        { status: 401 }
      )
    }

    // Para demonstracao, aceitar qualquer senha com mais de 5 caracteres
    // Em producao, usar bcrypt.compare(password, user.passwordHash)
    const isValidPassword = password.length >= 6
    // const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenciais invalidas' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Definir cookie HTTP-only
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })

    return response

  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar se usuario esta autenticado
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
        role: string
        name: string
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
      })
    } catch {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Token invalido' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('[Auth] Check error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
