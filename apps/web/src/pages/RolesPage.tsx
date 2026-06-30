import { DataModule } from '../components/DataModule';
import { permissionExamples } from '../permissions';

export function RolesPage() {
  return (
    <>
      <section className="panel glass">
        <h2>Permission Keys</h2>
        <p className="muted">Use comma-separated permissions in the permissions field.</p>
        <div className="toolbar">{permissionExamples.map((item) => <span className="tab" key={item}>{item}</span>)}</div>
      </section>
      <DataModule title="Roles" endpoint="/roles" fields={["name", "permissions"]} />
    </>
  );
}
