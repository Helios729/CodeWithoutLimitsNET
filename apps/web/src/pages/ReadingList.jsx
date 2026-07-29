import readingListData from '../data/reading-list.json';

export default function ReadingList() {
  const { title, description, verified_on, reading_list, open_online_courses, footnote } =
    readingListData;

  return (
    <div className="shell section" style={{ maxWidth: 820 }}>
      <p className="overline">Reading list &amp; free courses</p>
      <h1>{title}</h1>
      <p style={{ maxWidth: 640 }}>{description}</p>

      <section style={{ marginTop: 'var(--space-7)' }}>
        <h2>{reading_list.title}</h2>
        <p className="muted">{reading_list.subtitle}</p>
        <div className="stack" style={{ marginTop: 'var(--space-5)' }}>
          {reading_list.items.map((item) => (
            <article key={item.url} className="card">
              <h3 style={{ marginBottom: 'var(--space-1)' }}>{item.title}</h3>
              {item.author && (
                <p className="small" style={{ margin: '0 0 var(--space-2)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                  {item.author}
                </p>
              )}
              {item.note && <p className="small" style={{ marginBottom: 'var(--space-3)' }}>{item.note}</p>}
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open resource
              </a>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 'var(--space-8)' }}>
        <h2>{open_online_courses.title}</h2>
        <p className="muted">{open_online_courses.subtitle}</p>
        {open_online_courses.groups.map((group) => (
          <div key={group.group} style={{ marginTop: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--type-h4)' }}>{group.group}</h3>
            <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
              {group.items.map((item) => (
                <article key={item.url} className="card" style={{ background: 'var(--color-background-secondary)' }}>
                  <h4 style={{ marginBottom: 'var(--space-1)' }}>{item.name}</h4>
                  {item.note && <p className="small" style={{ marginBottom: 'var(--space-3)' }}>{item.note}</p>}
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="small" style={{ wordBreak: 'break-all' }}>
                    {item.url}
                  </a>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {footnote && (
        <p className="small muted" style={{ marginTop: 'var(--space-7)', fontStyle: 'italic' }}>
          {footnote}
        </p>
      )}
      {verified_on && (
        <p className="small muted" style={{ textAlign: 'right' }}>
          Links verified on {verified_on}
        </p>
      )}
    </div>
  );
}