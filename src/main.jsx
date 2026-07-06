import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import Shell from './components/Shell';
import Panel from './pages/Panel';
import Community, { SchoolPage } from './pages/Community';
import Chat from './pages/Chat';
import Transfer from './pages/Transfer';
import Admin from './pages/Admin';
import Benefits from './pages/Benefits';
import Businesses from './pages/Businesses';
import { Placeholder, Settings, Blueprint } from './pages/Placeholders';

function App(){
 const [page,setPage]=useState('panel');
 const pages={
  panel:<Panel setPage={setPage}/>,
  community:<Community setPage={setPage}/>,
  school:<SchoolPage setPage={setPage}/>,
  chat:<Chat setPage={setPage}/>,
  transfer:<Transfer/>,
  benefits:<Benefits/>,
  businesses:<Businesses/>,
  marketplace:<Placeholder title="Marketplace" desc="Compra, venta y alquiler local con moderación."/>,
  business:<Placeholder title="MiZona Business" desc="POS, caja, cocina, inventario, clientes y reportes."/>,
  campus:<Placeholder title="CampusHugo" desc="Cursos, evaluaciones, certificados e IA educativa."/>,
  ride:<Placeholder title="MiZona Ride" desc="Pasajeros, conductores, delivery y envíos."/>,
  ai:<Placeholder title="IA MiZona" desc="Asistente para resolver necesidades en la zona."/>,
  admin:<Admin/>,
  settings:<Settings/>,
  blueprint:<Blueprint/>
 };
 return <Shell page={page} setPage={setPage}>{pages[page]||pages.panel}</Shell>;
}

createRoot(document.getElementById('root')).render(<App/>);
