// Dados estruturados (JSON-LD) vão dentro de <script>. Títulos e descrições vêm dos anunciantes;
// sem escapar "<", um título com "</script>" fecharia a tag e viraria código na página.
// Também escapa os separadores de linha U+2028 e U+2029, que quebram JavaScript antigo.
const UNSAFE_CHARACTERS = new RegExp(`[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, "g");

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(
    UNSAFE_CHARACTERS,
    // Barra invertida + "u" + código hexadecimal: o mesmo caractere, escrito como escape JSON.
    character => String.fromCharCode(92) + "u" + character.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
