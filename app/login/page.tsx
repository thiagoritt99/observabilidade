"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push("/")
      } else {
        setError(data.error || "Credenciais invalidas")
      }
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="fixed inset-0 bg-[#191818]/85 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#401616]/30 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Logo e Titulo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 mb-6">
              <Image 
                src="/images/logo.png" 
                alt="FMP Logo" 
                width={120} 
                height={48}
                className="object-contain h-10 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground font-sans mb-2">
              Monitoramento <span className="text-[#d4b896]">FMP</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Acesse o painel de monitoramento de sistemas
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground font-sans">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@fmp.edu.br"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#2a2a2a] border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#d4b896]/50 focus:border-[#d4b896]/50 transition-all font-sans"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground font-sans">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-lg bg-[#2a2a2a] border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#d4b896]/50 focus:border-[#d4b896]/50 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
                {error}
              </div>
            )}

            {/* Botao de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-[#5a1a1a] hover:bg-[#6a2a2a] text-[#d4b896] font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#d4b896]/30 border-t-[#d4b896] rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Link para recuperar senha */}
          <div className="mt-6 text-center">
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-[#d4b896] transition-colors font-sans"
            >
              Esqueceu sua senha?
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 font-sans">
          FMP - Fundacao Escola Superior do Ministerio Publico
        </p>
      </div>
    </div>
  )
}
