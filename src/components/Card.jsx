export default function Card({ title, icon, children, action, className='' }) {
  return <section className={`card ${className}`}><div className="cardHead"><h3 style={{display:'flex',alignItems:'center',gap:8}}>{icon}<span>{title}</span></h3>{action}</div>{children}</section>;
}
