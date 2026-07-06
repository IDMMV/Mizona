import { statusLabel } from '../data/modules';
export default function StatusPill({ status }) { return <span className={`pill ${status}`}>{statusLabel[status] || status}</span>; }
