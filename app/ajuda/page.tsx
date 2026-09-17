import type { Metadata } from "next";
import Link from "next/link";
import { SupportPage } from "@/components/support-page";

export const metadata: Metadata = {
  title: "Central de ajuda — Achei no Vale",
  description: "Respostas rápidas para usar, publicar e gerenciar anúncios no Achei no Vale.",
};

export default function HelpPage() {
  return (
    <SupportPage
      eyebrow="Respostas rápidas"
      title="Central de ajuda"
      description="Encontre orientações para pesquisar, publicar e administrar seus anúncios de imóveis e serviços de frete."
      current="ajuda"
    >
      <section>
        <h2>Como escolher minha cidade?</h2>
        <p>Use o seletor de cidade no cabeçalho. A cidade escolhida permanece ativa ao navegar entre a página inicial, imóveis e freteiros.</p>
      </section>

      <section>
        <h2>Como publicar um imóvel?</h2>
        <p>Acesse <Link href="/publicar">Publicar anúncio</Link>, escolha “Imóvel” e preencha os campos obrigatórios marcados com asterisco. Inclua fotos claras, preço, bairro e uma descrição objetiva para melhorar a qualidade do anúncio.</p>
      </section>

      <section>
        <h2>Como cadastrar meus serviços de frete?</h2>
        <p>Acesse <Link href="/publicar/frete">Publicar anúncio de frete</Link>, informe as cidades atendidas, os tipos de serviço, o WhatsApp e adicione imagens do veículo ou do trabalho quando disponíveis.</p>
      </section>

      <section>
        <h2>Posso editar meu anúncio?</h2>
        <p>Sim. Entre na sua conta, abra “Meus anúncios” ou o seu perfil de freteiro e escolha a opção de editar. Depois de salvar, algumas alterações podem passar por uma nova análise.</p>
      </section>

      <section>
        <h2>Por que meu anúncio ainda não apareceu?</h2>
        <p>Novos anúncios podem ficar em análise para evitar golpes, conteúdo inadequado ou informações incompletas. Confira o status em “Meus anúncios” e ajuste os pontos indicados, se necessário.</p>
      </section>

      <section>
        <h2>Como falar com um anunciante?</h2>
        <p>Abra o anúncio e selecione o botão do WhatsApp. A conversa ocorre diretamente entre você e o anunciante; confirme todas as informações antes de negociar ou pagar.</p>
      </section>

      <section>
        <h2>Como denunciar um anúncio?</h2>
        <p>Abra o anúncio, use a opção “Denunciar” e explique o problema. Se precisar complementar as informações, <Link href="/contato">fale com o Achei no Vale</Link>.</p>
      </section>

      <section>
        <h2>Não encontrei minha resposta</h2>
        <p>Nosso contato abre diretamente no WhatsApp. Envie sua dúvida e, se for sobre um anúncio, informe o título para facilitar o atendimento.</p>
      </section>
    </SupportPage>
  );
}
