export default function MasterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel Master</h1>
        <p className="text-muted-foreground">Administração da plataforma Socio Desk</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Tenants</h3>
          <p className="text-2xl font-bold mt-2">5</p>
          <p className="text-sm text-muted-foreground">Associações ativas</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Total Associados</h3>
          <p className="text-2xl font-bold mt-2">2.450</p>
          <p className="text-sm text-muted-foreground">Em todos os tenants</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Planos</h3>
          <p className="text-2xl font-bold mt-2">3</p>
          <p className="text-sm text-muted-foreground">Básico, Pro, Enterprise</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Receita Mensal</h3>
          <p className="text-2xl font-bold mt-2">R$ 12.500</p>
          <p className="text-sm text-muted-foreground">MRR estimado</p>
        </div>
      </div>
    </div>
  );
}
