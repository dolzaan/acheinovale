import Link from "next/link";
import { PinIcon } from "./icons";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><Logo light/><p>Encontre perto. Resolva no Vale.<br/>Feito no Alto Vale.</p></div>
        <div><strong>Explorar</strong><Link href="/imoveis">Imóveis</Link><Link href="/freteiros">Freteiros</Link><Link href="/publicar">Publicar anúncio</Link></div>
        <div><strong>Ajuda</strong><Link href="/seguranca">Segurança</Link><Link href="/ajuda">Central de ajuda</Link><Link href="/contato">Fale conosco</Link></div>
        <div className="footer-local"><PinIcon/><span>Começando por</span><strong>Rio do Sul — SC</strong></div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 AcheiNoVale</span>
        <nav aria-label="Informações legais"><Link href="/termos">Termos de Uso</Link><Link href="/privacidade">Política de Privacidade</Link></nav>
        <span>Feito com carinho no Alto Vale de Santa Catarina.</span>
      </div>
    </footer>
  );
}
