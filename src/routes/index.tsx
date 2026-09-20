import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, QrCode, Smartphone, BarChart3, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Authera Link Card — Sua presença digital em um toque" },
      { name: "description", content: "Crie sua presença digital com perfil personalizado, QR Code e NFC. Links, eventos e estatísticas em um só lugar." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl btn-primary grid place-items-center"><CreditCard className="w-5 h-5" /></div>
          <div>
            <span className="font-display font-bold text-lg">Authera <span className="gradient-text">Link Card</span></span>
            <div className="text-[10px] text-muted-foreground hidden sm:block">Sua presença digital em um toque</div>
          </div>
        </Link>
        {user ? (
          <Link to="/dashboard" className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold">Dashboard</Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link to="/signup" className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold">Criar conta</Link>
          </div>
        )}
      </header>

      <main className="px-6 pt-12 pb-24 max-w-6xl mx-auto">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Perfil digital · QR Code · NFC Ready
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight">
            Sua presença digital<br /><span className="gradient-text">em um toque</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Centralize redes sociais, contatos, eventos e links em um cartão digital premium. Compartilhe por URL, QR Code ou NFC.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? "/dashboard" : "/signup"} className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold">
              {user ? "Ir para o Dashboard" : "Criar meu Link Card"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mt-28 grid md:grid-cols-3 gap-4">
          {[
            { icon: CreditCard, title: "Cartão digital", desc: "Sua identidade, contatos e links reunidos em uma página premium." },
            { icon: BarChart3, title: "Estatísticas", desc: "Acompanhe visualizações e cliques do seu perfil." },
            { icon: Lock, title: "Endereço personalizado", desc: "Escolha seu link público com um nome fácil de compartilhar." },
            { icon: QrCode, title: "QR Code", desc: "Seu endereço ganha um QR Code pronto para compartilhar." },
            { icon: Smartphone, title: "Pronto para NFC", desc: "Grave seu link em cartões e Tags NFC compatíveis." },
            { icon: Lock, title: "Conta protegida", desc: "Seu perfil é editado somente por você, com autenticação segura." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-3xl p-6">
              <div className="w-11 h-11 rounded-xl btn-primary grid place-items-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-28 glass rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold">Pronto para criar sua presença digital?</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Cadastre-se. Personalize. Encoste. Conecte.
          </p>
          <Link to={user ? "/dashboard" : "/signup"} className="btn-primary inline-flex items-center gap-2 mt-8 px-7 py-4 rounded-2xl font-semibold">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground border-t border-border">
        Authera Link Card · Sua presença digital em um toque
      </footer>
    </div>
  );
}
