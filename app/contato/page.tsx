import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Contato — Achei no Vale",
  description: "Fale com o Achei no Vale pelo WhatsApp.",
};

const WHATSAPP_URL = "https://wa.me/5547997785853?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20o%20Achei%20no%20Vale.";

export default function ContactPage() {
  redirect(WHATSAPP_URL);
}
