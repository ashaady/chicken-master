interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
}

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: StatCardProps) {
  return (
    <div
      className={`${gradient} text-white p-6 rounded-xl shadow-lg`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-sm font-medium opacity-90">{title}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
}
