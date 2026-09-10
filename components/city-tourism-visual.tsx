import Image from "next/image";
import { PinIcon } from "./icons";
import { cityTourismPhotos, regionalTourismFallback } from "@/data/city-tourism";

export function CityTourismVisual({ citySlug, cityName }: { citySlug?: string; cityName: string }) {
  const cityPhoto = citySlug ? cityTourismPhotos[citySlug] : undefined;
  const photo = citySlug ? cityPhoto ?? regionalTourismFallback : undefined;
  const isRegionalFallback = Boolean(citySlug && !cityPhoto);

  return (
    <div className="hero__visual regional-visual city-tourism-visual" key={citySlug || "unselected"}>
      {photo ? (
        <>
          <figure className="regional-photo regional-photo--main">
            <Image
              src={photo.src}
              alt={isRegionalFallback ? photo.caption : `${photo.caption} — ${cityName}, SC`}
              fill
              sizes="(max-width: 680px) 100vw, 45vw"
              priority
              unoptimized={photo.src.startsWith("https://")}
            />
            <figcaption><PinIcon size={17} /><span>{photo.caption}<small>{isRegionalFallback ? "Belezas naturais do Alto Vale, SC" : `${cityName}, SC`}</small></span></figcaption>
            <div className="regional-signature"><Image src="/brand/symbol-green.png" alt="" width={36} height={35} /><span>Encontre perto.<br/><strong>Resolva no Vale.</strong></span></div>
          </figure>
          <details className="photo-credits">
            <summary>Crédito da foto</summary>
            <p><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>. {isRegionalFallback ? "Imagem regional usada enquanto o município não possui foto própria cadastrada." : "Foto redimensionada e recortada na exibição."}</p>
          </details>
        </>
      ) : (
        <div className="city-tourism-empty">
          <Image src="/brand/symbol-green.png" alt="" width={70} height={68} />
          <strong>{citySlug ? cityName : "Escolha sua cidade"}</strong>
          <span>{citySlug ? "Encontre imóveis e conheça a região." : "Veja os imóveis disponíveis perto de você."}</span>
        </div>
      )}
    </div>
  );
}
