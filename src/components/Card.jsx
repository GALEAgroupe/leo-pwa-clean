export default function Card({ title, right, children }) {
  return (
    <section className="leo-card">
      {(title || right) ? (
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="h2">{title}</div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}

      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  );
}
