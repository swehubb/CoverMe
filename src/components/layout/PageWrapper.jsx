import ModuleBadge from './ModuleBadge';

export default function PageWrapper({ title, description, module, children }) {
  return (
    <main className="page-wrapper">
      <div className="page-header">
        <div className="page-title-group">
          <div className="section-label">Cover Me</div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-description">{description}</p> : null}
        </div>
        {module ? <ModuleBadge module={module} /> : null}
      </div>
      {children}
    </main>
  );
}
