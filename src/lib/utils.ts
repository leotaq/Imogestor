export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR")
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}
