import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('MiZona UI error', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="fatalError"><div className="logo">MZ</div><h1>MiZona no pudo cargar esta pantalla</h1><p>{this.state.error.message}</p><button onClick={() => location.reload()}>Volver a cargar</button></div>;
  }
}
