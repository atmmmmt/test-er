import { mobileTasks } from '../pwa/tasks';

export function MobileOperationPage() {
  return (
    <section className="phone-wrap">
      <div className="phone">
        <div className="phone-head"><b>Mobile Operations</b><span>09:41</span></div>
        {mobileTasks.map((task) => <button className="task" key={task.key}>{task.label}<span>›</span></button>)}
      </div>
    </section>
  );
}
