import { ReactNode } from "react";
interface Props { icon: ReactNode; title: string; body?: string; action?: ReactNode; }
const EmptyState = ({ icon, title, body, action }: Props) => (
  <div className="glass rounded-2xl p-10 text-center">
    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    {body && <p className="text-sm text-muted-foreground mb-4">{body}</p>}
    {action}
  </div>
);
export default EmptyState;
