import Link from "next/link";
import { Logo } from "./logo";
import { InstagramIcon } from "./icons";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { SavedCityLink } from "@/components/saved-city-link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><Logo light/><p>Encontre perto. Resolva no Vale.<br/>Feito no Alto Vale do Itajaí.</p><a className="footer-social" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={`Instagram do Achei no Vale: @${INSTAGRAM_HANDLE} (abre em nova aba)`}><InstagramIcon size={20}/><span>@{INSTAGRAM_HANDLE}</span></a></div>
        <div><strong>Explorar</strong><SavedCityLink href="/imoveis">Imóveis</SavedCityLink><SavedCityLink href="/freteiros">Freteiros</SavedCityLink><Link href="/publicar">Anunciar grátis</Link><Link href="/anuncie">Para imobiliárias</Link></div>
        <div><strong>Ajuda</strong><Link href="/seguranca">Segurança</Link><Link href="/ajuda">Central de ajuda</Link><Link href="/contato">Fale conosco</Link></div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 AcheiNoVale</span>
        <nav aria-label="Informações legais"><Link href="/termos">Termos de Uso</Link><Link href="/privacidade">Política de Privacidade</Link></nav>
        <span>Feito com carinho no Alto Vale do Itajaí.</span>
      </div>
    </footer>
  );
}
