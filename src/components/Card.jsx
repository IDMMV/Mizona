export default function Card({ title, icon, children, action, className='' }) {
  return <section className={`card ${className}`}><div className="cardHead"><h3>{icon} {title}</h3>{action}</div>{children}</section>;
}
