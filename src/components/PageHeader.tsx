interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
const PageHeader = ({ title, subtitle, action }: Props) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);
export default PageHeader;
