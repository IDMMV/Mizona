import AnimatedTab from './AnimatedTab';

export default function Tabs(props) {
  const tabs = props.tabs || props.items || [];
  const active = props.active ?? props.value;
  const setActive = props.setActive || props.onChange || (() => {});

  return (
    <div className="tabs" role="tablist">
      {tabs.map(tab => (
        <AnimatedTab
          key={tab.id}
          isActive={active === tab.id}
          onClick={() => setActive(tab.id)}
        >
          {tab.icon} {tab.label}
        </AnimatedTab>
      ))}
    </div>
  );
}
