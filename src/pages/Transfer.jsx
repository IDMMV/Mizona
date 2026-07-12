import { useState } from 'react';
import { Copy, FileArchive, FileText, Image, Link, ShieldCheck, Upload, X } from 'lucide-react';
import Card from '../components/Card';

export default function Transfer(){
 const [files,setFiles]=useState([{name:'Maqueta ciencias.pdf',size:'8.4 MB',expires:'7 días',type:'PDF'},{name:'Fotos grupo.zip',size:'42 MB',expires:'7 días',type:'ZIP'}]);
 const add=()=>setFiles([{name:'Nuevo_trabajo_escolar.docx',size:'2.1 MB',expires:'7 días',type:'Word'},...files]);
 return <div className="page transferExplainPage38">
  <section className="transferHero38">
    <div>
      <span className="eyebrow">MI ZONA TRANSFER</span>
      <h1>Envía archivos temporales sin saturar el chat</h1>
      <p>Sirve para compartir tareas, fotos, documentos, trabajos o archivos pesados por tiempo limitado. El archivo vence y se elimina automáticamente para cuidar el almacenamiento gratuito.</p>
      <div className="transferHeroActions38"><button onClick={add}><Upload size={18}/> Seleccionar archivo</button><button className="secondary"><Link size={18}/> ¿Cómo funciona?</button></div>
    </div>
    <div className="transferDemoCard38">
      <FileArchive size={42}/><b>Archivo temporal</b><span>Vence en 7 días</span><small>Ideal para tareas, comités, documentos, fotos y ZIP.</small>
    </div>
  </section>

  <div className="transferSteps38">
    <article><Upload/><b>1. Subes el archivo</b><span>PDF, Word, Excel, PowerPoint, imágenes o ZIP.</span></article>
    <article><Link/><b>2. Copias el enlace</b><span>Lo compartes por chat, WhatsApp o comunicado.</span></article>
    <article><ShieldCheck/><b>3. Se elimina solo</b><span>Luego del vencimiento se libera espacio.</span></article>
  </div>

  <div className="grid2">
    <Card title="Subir archivo temporal" icon="📤">
      <div className="drop transferDrop38"><Upload size={36}/><b>Arrastra tus archivos o selecciona desde el dispositivo</b><small>PDF, Word, Excel, PowerPoint, imágenes y ZIP. Máximo recomendado: 50 MB.</small></div>
      <button className="primary full" onClick={add}><Upload size={18}/> Seleccionar archivo</button>
    </Card>
    <Card title="¿Para qué sirve?" icon="💡">
      <div className="transferUseGrid38">
        <article><FileText/> Tareas y trabajos escolares</article>
        <article><Image/> Fotos de actividades</article>
        <article><FileArchive/> Archivos comprimidos</article>
        <article><X/> Evitar llenar el chat</article>
      </div>
    </Card>
  </div>

  <Card title="Archivos temporales" icon="📁">
    <div className="adminTable files transferFiles38">{files.map(f=><div key={f.name}><b>{f.name}</b><span>{f.type}</span><span>{f.size}</span><span>Vence: {f.expires}</span><button><Copy size={16}/> Copiar enlace</button></div>)}</div>
  </Card>
 </div>;
}
