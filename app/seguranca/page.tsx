import type { Metadata } from "next";
import Link from "next/link";
import { SupportPage } from "@/components/support-page";

export const metadata: Metadata = {
  title: "Segurança — Achei no Vale",
  description: "Orientações para negociar imóveis e contratar fretes com mais segurança no Achei no Vale.",
};

export default function SecurityPage() {
  return (
    <SupportPage
      eyebrow="Negocie com cuidado"
      title="Segurança"
      description="O Achei no Vale aproxima pessoas da região. Antes de fechar qualquer negócio, faça verificações simples e mantenha a conversa segura."
      current="seguranca"
    >
      <section>
        <h2>Antes de negociar</h2>
        <ul>
          <li>Desconfie de valores muito abaixo do mercado e de ofertas com urgência exagerada.</li>
          <li>Confirme o nome, o telefone e a identidade da pessoa com quem está conversando.</li>
          <li>Não compartilhe senhas, códigos de confirmação, documentos completos ou dados bancários desnecessários.</li>
          <li>Guarde as informações do anúncio e os principais detalhes combinados na conversa.</li>
        </ul>
      </section>

      <section>
        <h2>Ao procurar um imóvel</h2>
        <ul>
          <li>Visite o imóvel pessoalmente antes de pagar reserva, caução ou entrada.</li>
          <li>Confirme se quem anuncia é o proprietário ou possui autorização para negociar.</li>
          <li>Confira documentos, endereço, condições do imóvel e leia o contrato com atenção.</li>
          <li>Evite depósitos antecipados quando ainda não houver verificações suficientes.</li>
        </ul>
      </section>

      <section>
        <h2>Ao contratar um freteiro</h2>
        <ul>
          <li>Combine previamente o valor, a forma de pagamento, os horários e o que será transportado.</li>
          <li>Confirme o nome do profissional, o telefone e as informações do veículo.</li>
          <li>Avise se houver itens frágeis, pesados ou que exijam cuidados especiais.</li>
          <li>Para mudanças maiores, peça o combinado por escrito no WhatsApp.</li>
        </ul>
      </section>

      <section>
        <h2>Proteja sua conta</h2>
        <p>Use uma senha exclusiva, não compartilhe links de acesso e encerre a sessão em aparelhos públicos. O Achei no Vale nunca solicita sua senha ou código de autenticação pelo WhatsApp.</p>
      </section>

      <section>
        <h2>Encontrou algo suspeito?</h2>
        <p>Não prossiga com o pagamento. Use a opção de denúncia disponível no anúncio ou <Link href="/contato">fale conosco pelo WhatsApp</Link>, informando o título do anúncio e o motivo da suspeita.</p>
      </section>

      <section>
        <h2>Importante</h2>
        <p>O Achei no Vale divulga anúncios e facilita o contato entre usuários, mas não recebe pagamentos, não participa da negociação e não garante a identidade, a oferta ou o serviço anunciado.</p>
      </section>
    </SupportPage>
  );
}
