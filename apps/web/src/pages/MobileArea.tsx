import { mobileTasks } from '../pwa/tasks';

export function MobileArea({ isAr }: { isAr: boolean }) {
  return (
    <section className="phone-wrap">
      <div className="phone">
        <div className="phone-head"><b>{isAr ? 'تطبيق الموظف' : 'Employee App'}</b><span>09:41</span></div>
        <h2>{isAr ? 'مهام المستودع' : 'Warehouse Tasks'}</h2>
        {mobileTasks.map((task) => <button className="task" key={task.key}>{task.label}<span>›</span></button>)}
      </div>
    </section>
  );
}
