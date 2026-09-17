type QualityItem = {
  complete: boolean;
  label: string;
};

export function ListingQualityIndicator({
  items,
  title = "Qualidade do anúncio",
}: {
  items: QualityItem[];
  title?: string;
}) {
  const completed = items.filter(item => item.complete).length;
  const percentage = items.length ? Math.round((completed / items.length) * 100) : 0;
  const isComplete = completed === items.length;

  return (
    <section className="listing-quality" aria-label={title}>
      <div className="listing-quality__head">
        <div>
          <strong>{title}: {percentage}%</strong>
          <span>{completed}/{items.length} recomendações atendidas</span>
        </div>
        <b className={isComplete ? "is-complete" : undefined}>{isComplete ? "Excelente" : "Melhore seu anúncio"}</b>
      </div>

      <div
        className="listing-quality__track"
        role="progressbar"
        aria-label={`${percentage}% completo`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>

      <ul className="listing-quality__items">
        {items.map(item => (
          <li className={item.complete ? "is-complete" : undefined} key={item.label}>
            <span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>

      <p>{isComplete ? "Ótimo! Um anúncio completo transmite mais confiança e tende a receber mais contatos." : "Estas recomendações não impedem a publicação."}</p>
    </section>
  );
}
