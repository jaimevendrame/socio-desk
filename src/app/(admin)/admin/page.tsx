export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Configurações e gerenciamento do tenant</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Configurações</h3>
          <p className="text-sm text-muted-foreground">Espaços, regras, notificações</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Equipe</h3>
          <p className="text-sm text-muted-foreground">Membros da equipe e permissões</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Relatórios</h3>
          <p className="text-sm text-muted-foreground">Ocupação, uso, exportação</p>
        </div>
      </div>
    </div>
  );
}
