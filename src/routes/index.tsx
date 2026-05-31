import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, QrCode, Smartphone } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TapLink NFC — Seu perfil digital em um toque" },
      { name: "description", content: "Crie uma página personalizada para compartilhar por URL, QR Code e Tags NFC. Sem cadastro." },
      { property: "og:title", content: "TapLink NFC — Seu perfil digital em um toque" },
      { property: "og:description", content: "Crie uma página personalizada para compartilhar por URL, QR Code e Tags NFC." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl btn-primary grid place-items-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">TapLink<span className="gradient-text">NFC</span></span>
        </div>
        <Link to="/create" className="text-sm text-muted-foreground hover:text-foreground transition">Criar perfil</Link>
      </header>

      <main className="px-6 pt-12 pb-24 max-w-6xl mx-auto">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Sem cadastro · Pronto para NFC
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight">
            Seu perfil digital <br /><span className="gradient-text">em um toque</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Crie uma página personalizada para compartilhar por QR Code e NFC. Tudo em um link.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/create"
              className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold">
              Criar Meu Link <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mt-28 grid md:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: "Visual premium", desc: "Tema escuro, glassmorphism e animações suaves." },
            { icon: QrCode, title: "QR Code automático", desc: "Compartilhe seu link com um QR Code estiloso." },
            { icon: Smartphone, title: "Pronto para NFC", desc: "Grave sua URL em qualquer Tag NFC compatível." },
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
          <h2 className="text-3xl font-bold">Compartilhe seu mundo em segundos</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Inspirado em Linktree, Beacons e Bento.me — pensado para o toque NFC.
          </p>
          <Link to="/create"
            className="btn-primary inline-flex items-center gap-2 mt-8 px-7 py-4 rounded-2xl font-semibold">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground border-t border-border">
        TapLink NFC · feito para o toque
      </footer>
    </div>
  );
}
