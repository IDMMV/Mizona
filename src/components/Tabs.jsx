export default function Tabs(props) {
  const tabs = props.tabs || props.items || [];
  const active = props.active ?? props.value;
  const setActive = props.setActive || props.onChange || (() => {});
  return <div className="tabs" role="tablist">{tabs.map(t => <button type="button" role="tab" aria-selected={active===t.id} key={t.id} className={active===t.id?'active':''} onClick={()=>setActive(t.id)}>{t.icon} {t.label}</button>)}</div>;
}
