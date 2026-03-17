"use client"

import { useState } from "react"
import { Imovel } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

interface ImovelFormProps {
  onSubmit: (dados: Omit<Imovel, "id" | "created_at">) => Promise<void>
  initialData?: Imovel
}

export default function ImovelForm({ onSubmit, initialData }: ImovelFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imobiliaria_id: initialData?.imobiliaria_id ?? "",
    codigo: initialData?.codigo ?? "",
    endereco: initialData?.endereco ?? "",
    cidade: initialData?.cidade ?? "",
    bairro: initialData?.bairro ?? "",
    numero: initialData?.numero ?? "",
    complemento: initialData?.complemento ?? "",
    proprietario: initialData?.proprietario ?? "",
    proprietario_telefone: initialData?.proprietario_telefone ?? "",
    proprietario_email: initialData?.proprietario_email ?? "",
  })

  const enderecoPreview = [
    form.endereco.trim(),
    form.numero.trim() ? `, ${form.numero.trim()}` : "",
    form.complemento.trim() ? ` - ${form.complemento.trim()}` : "",
    form.bairro.trim() ? `, ${form.bairro.trim()}` : "",
    form.cidade.trim() ? ` - ${form.cidade.trim()}` : "",
  ]
    .join("")
    .trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        cidade: form.cidade || null,
        bairro: form.bairro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        proprietario: form.proprietario || null,
        proprietario_telefone: form.proprietario_telefone || null,
        proprietario_email: form.proprietario_email || null,
      })
    } catch (err) {
      console.error("Erro ao salvar imovel:", err)
      alert("Erro ao salvar imovel. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Cadastro
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Dados do imovel
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Preencha a identificacao e o endereco para localizar o imovel com rapidez.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Input
                label="Codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex.: 2644"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Ex.: Taquara"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Ex.: Jardim do Prado"
                required
              />
            </div>

            <div className="md:col-span-6">
              <Input
                label="Endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, avenida ou logradouro"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Numero"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ex.: 2171"
                required
              />
            </div>

            <div className="md:col-span-4">
              <Input
                label="Complemento"
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                placeholder="Apartamento, bloco, sala, fundos..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
              Previa do endereco
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {enderecoPreview || "O endereco completo aparecera aqui conforme os campos forem preenchidos."}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Contato
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Proprietario
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esses dados ajudam na comunicacao sobre manutencoes, vistorias e atualizacoes do imovel.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Nome do proprietario"
              value={form.proprietario}
              onChange={(e) => setForm({ ...form, proprietario: e.target.value })}
              placeholder="Ex.: Joao da Silva"
              required
            />
          </div>

          <Input
            label="Telefone / WhatsApp"
            value={form.proprietario_telefone}
            onChange={(e) =>
              setForm({ ...form, proprietario_telefone: e.target.value })
            }
            placeholder="(51) 99999-9999"
          />

          <Input
            label="E-mail"
            type="email"
            value={form.proprietario_email}
            onChange={(e) =>
              setForm({ ...form, proprietario_email: e.target.value })
            }
            placeholder="email@exemplo.com"
          />
        </div>
      </section>

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? "Salvando..." : "Salvar imovel"}
        </Button>
      </div>
    </form>
  )
}
